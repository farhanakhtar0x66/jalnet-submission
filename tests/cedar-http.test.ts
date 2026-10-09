import { randomUUID } from "node:crypto";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encode } from "jpeg-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type ReportAction, reportActions } from "../services/core/ports.js";
import { createLocalServer } from "../services/local/server.js";
import { forbid, overflowPolicy, ownerPolicy } from "./cedar-fixtures.js";

const point = { lat: 28.6139, lon: 77.209 };
const observation = {
  category: "WATERLOGGING",
  severity: 2,
  stillActive: true,
  location: point,
  publicRoad: true,
};
const servers: Server[] = [];
const directories: string[] = [];
const close = (server: Server) =>
  new Promise<void>((resolve, reject) => {
    if (!server.listening) return resolve();
    server.close((error) => (error ? reject(error) : resolve()));
    server.closeAllConnections();
  });
afterEach(async () => {
  for (const server of servers.splice(0)) await close(server);
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
  vi.restoreAllMocks();
});

async function fixture(
  policies?: Readonly<Record<string, string>>,
  root?: string,
) {
  const directory =
    root ?? (await mkdtemp(join(tmpdir(), "jalnet-cedar-http-")));
  if (!root) directories.push(directory);
  const stateFile = join(directory, "state.json");
  const evidenceDirectory = join(directory, "evidence");
  const runtime = await createLocalServer({
    stateFile,
    evidenceDirectory,
    evidenceBaseUrl: "http://127.0.0.1",
    ...(policies ? { policies } : {}),
  });
  servers.push(runtime.server);
  await new Promise<void>((resolve, reject) => {
    runtime.server.once("error", reject);
    runtime.server.listen(0, "127.0.0.1", resolve);
  });
  const address = runtime.server.address();
  if (!address || typeof address === "string")
    throw new Error("No test listener");
  const base = `http://127.0.0.1:${address.port}`;
  async function call(
    path: string,
    body?: unknown,
    token = "LOCAL_DEMO_ALICE",
  ) {
    const response = await fetch(`${base}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  }
  async function draft(token = "LOCAL_DEMO_ALICE") {
    const response = await call(
      "/v1/reports",
      {
        action: "DRAFT",
        capturedAt: new Date().toISOString(),
        location: { ...point, source: "USER_PIN" },
      },
      token,
    );
    expect(response.status).toBe(200);
    return response.body.id as string;
  }
  async function upload(id: string, color = 100, token = "LOCAL_DEMO_ALICE") {
    const bytes = encode(
      { data: Buffer.alloc(8 * 8 * 4, color), width: 8, height: 8 },
      90,
    ).data;
    const grant = await call(
      "/v1/uploads/presign",
      {
        reportId: id,
        contentType: "image/jpeg",
        contentLength: bytes.length,
      },
      token,
    );
    expect(grant.status).toBe(200);
    const response = await fetch(`${base}${new URL(grant.body.url).pathname}`, {
      method: "PUT",
      body: new Uint8Array(bytes).buffer,
    });
    expect(response.status).toBe(204);
  }
  async function ready(id: string, token = "LOCAL_DEMO_ALICE") {
    expect(
      (
        await call(
          "/v1/reports",
          { action: "UPLOAD_COMPLETE", reportId: id },
          token,
        )
      ).status,
    ).toBe(200);
    const report = await call(`/v1/reports/${id}`, undefined, token);
    expect(report.status).toBe(200);
    expect(report.body.status).toBe("NEEDS_CONFIRMATION");
  }
  async function prepare(action: ReportAction) {
    const id = await draft();
    if (action === "CompleteUpload" || action === "ConfirmReport")
      await upload(id);
    if (action === "ConfirmReport") await ready(id);
    return id;
  }
  const operation = (
    action: ReportAction,
    id: string,
    token = "LOCAL_DEMO_ALICE",
  ) => {
    switch (action) {
      case "ReadReport":
        return call(`/v1/reports/${id}`, undefined, token);
      case "PresignReport":
        return call(
          "/v1/uploads/presign",
          { reportId: id, contentType: "image/jpeg", contentLength: 100 },
          token,
        );
      case "CompleteUpload":
        return call(
          "/v1/reports",
          { action: "UPLOAD_COMPLETE", reportId: id },
          token,
        );
      case "ConfirmReport":
        return call(`/v1/reports/${id}/confirm`, observation, token);
    }
  };
  async function snapshot() {
    const files = await readdir(evidenceDirectory).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return [];
        throw error;
      },
    );
    return { state: await readFile(stateFile, "utf8"), files: files.sort() };
  }
  function observeSideEffects() {
    const calls = [
      vi.spyOn(runtime.evidence, "presign"),
      vi.spyOn(runtime.evidence, "read"),
      vi.spyOn(runtime.repository, "commit"),
      vi.spyOn(runtime.repository, "putReport"),
      vi.spyOn(runtime.app, "analyze"),
      vi.spyOn(runtime.app.analysis, "assess"),
    ];
    return () => {
      for (const call of calls) expect(call).not.toHaveBeenCalled();
    };
  }
  return {
    ...runtime,
    directory,
    base,
    call,
    draft,
    upload,
    ready,
    prepare,
    operation,
    snapshot,
    observeSideEffects,
  };
}

describe("actual HTTP with mandatory real Cedar and local persisted ownership", () => {
  it.each(reportActions)(
    "explicit policy denies the owner’s otherwise permitted %s without effects",
    async (action) => {
      const f = await fixture({
        owner: ownerPolicy,
        "deny-owner": forbid(action),
      });
      const id = await f.prepare(action);
      expect((await f.repository.getReport(id))?.userId).toBe("local-alice");
      const before = await f.snapshot();
      const noEffects = f.observeSideEffects();
      const response = await f.operation(action, id);
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("FORBIDDEN");
      expect(await f.snapshot()).toEqual(before);
      noEffects();
      expect(await f.repository.viewport([77.2, 28.6, 77.22, 28.63])).toEqual(
        [],
      );
      expect(await f.repository.ledger("local-alice")).toEqual([]);
    },
  );
  it.each(reportActions)(
    "denies another authenticated principal’s %s without effects",
    async (action) => {
      const f = await fixture();
      const id = await f.prepare(action);
      const before = await f.snapshot();
      const noEffects = f.observeSideEffects();
      expect((await f.operation(action, id, "LOCAL_DEMO_BOB")).status).toBe(
        403,
      );
      expect(await f.snapshot()).toEqual(before);
      noEffects();
    },
  );
  it("redacts real policy evaluation diagnostics and blocks side effects even on engine allow", async () => {
    const f = await fixture({
      owner: ownerPolicy,
      "private-overflow": overflowPolicy,
    });
    const id = await f.draft();
    const before = await f.snapshot();
    const noEffects = f.observeSideEffects();
    const response = await f.operation("PresignReport", id);
    expect(response.status).toBe(503);
    expect(response.body.error).toMatchObject({
      code: "DEPENDENCY_UNAVAILABLE",
      message: "Dependency unavailable; retry shortly",
    });
    expect(JSON.stringify(response.body)).not.toMatch(
      /overflow|JalNet|permit|owner|922337/,
    );
    expect(await f.snapshot()).toEqual(before);
    noEffects();
  });
  it("cannot start the local server when policy initialization fails", async () => {
    await expect(
      fixture({ invalid: "private-invalid-policy" }),
    ).rejects.toThrow(/^Report authorization unavailable$/);
    expect(servers).toHaveLength(0);
  });
  it.each(["", "eyJhbGciOiJub25lIn0.eyJzdWIiOiJsb2NhbC1hbGljZSJ9."])(
    "preserves 401 for missing/forged authentication %#",
    async (token) => {
      const f = await fixture();
      const id = await f.draft();
      const decision = vi.spyOn(f.authorizer, "authorize");
      const before = await f.snapshot();
      const response = await f.operation("PresignReport", id, token);
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("AUTH_REQUIRED");
      expect(decision).not.toHaveBeenCalled();
      expect(await f.snapshot()).toEqual(before);
    },
  );
  it("preserves 404 for a missing persisted report", async () => {
    const f = await fixture();
    const decision = vi.spyOn(f.authorizer, "authorize");
    const response = await f.operation("ReadReport", randomUUID());
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("REPORT_NOT_FOUND");
    expect(decision).not.toHaveBeenCalled();
  });
  it("ignores query identity and rejects body identity/ownership overrides", async () => {
    const f = await fixture();
    const id = await f.draft();
    const before = await f.snapshot();
    expect(
      (
        await f.call(
          `/v1/reports/${id}?userId=local-alice&ownerId=local-bob`,
          undefined,
          "LOCAL_DEMO_BOB",
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await f.call(
          "/v1/uploads/presign",
          {
            reportId: id,
            contentType: "image/jpeg",
            contentLength: 100,
            userId: "local-alice",
            ownerId: "local-bob",
          },
          "LOCAL_DEMO_BOB",
        )
      ).status,
    ).toBe(400);
    expect(await f.snapshot()).toEqual(before);
  });
  it("keeps the owner comparison even if a trusted policy mistakenly permits everyone", async () => {
    const f = await fixture({
      "too-broad-test-only":
        "permit(principal is JalNet::User, action, resource is JalNet::Report);",
    });
    const id = await f.draft();
    await expect(
      f.authorizer.authorize({
        principalId: "local-bob",
        ownerId: "local-alice",
        reportId: id,
        action: "ReadReport",
      }),
    ).resolves.toBe("ALLOW");
    expect((await f.operation("ReadReport", id, "LOCAL_DEMO_BOB")).status).toBe(
      403,
    );
  });
  it("gates both accepted confirmation and completed-upload replay before returning private data", async () => {
    const f = await fixture();
    const id = await f.draft();
    await f.upload(id);
    await f.ready(id);
    expect((await f.operation("ConfirmReport", id)).status).toBe(200);
    await close(f.server);
    const denied = await fixture(
      {
        owner: ownerPolicy,
        "deny-confirm": forbid("ConfirmReport"),
        "deny-complete": forbid("CompleteUpload"),
      },
      f.directory,
    );
    const before = await denied.snapshot();
    const noEffects = denied.observeSideEffects();
    expect((await denied.operation("ConfirmReport", id)).status).toBe(403);
    expect((await denied.operation("CompleteUpload", id)).status).toBe(403);
    expect(await denied.snapshot()).toEqual(before);
    noEffects();
  });
  it("uses CompleteUpload authorization again on the repository conflict return path", async () => {
    const f = await fixture();
    const id = await f.draft();
    await f.upload(id);
    vi.spyOn(f.repository, "putReport").mockResolvedValue(false);
    const decisions = vi.spyOn(f.authorizer, "authorize");
    const before = await f.snapshot();
    expect((await f.operation("CompleteUpload", id)).status).toBe(200);
    expect(decisions.mock.calls.map(([request]) => request.action)).toEqual([
      "CompleteUpload",
      "CompleteUpload",
    ]);
    expect(await f.snapshot()).toEqual(before);
  });
  it("preserves the allowed HTTP report → fusion → route warning → idempotent ledger workflow", async () => {
    const f = await fixture();
    const route = await f.call("/v1/routes", {
      name: "LOCAL Cedar corridor",
      origin: { ...point, lon: 77.205 },
      destination: { ...point, lon: 77.215 },
      travelMode: "Car",
      activeAlerts: true,
    });
    expect(route.status).toBe(200);
    const alice = await f.draft();
    await f.upload(alice, 100);
    await f.ready(alice);
    const accepted = await f.operation("ConfirmReport", alice);
    expect(accepted.status).toBe(200);
    expect((await f.operation("ConfirmReport", alice)).body.replay).toBe(true);
    const bob = await f.draft("LOCAL_DEMO_BOB");
    await f.upload(bob, 180, "LOCAL_DEMO_BOB");
    await f.ready(bob, "LOCAL_DEMO_BOB");
    const merged = await f.operation("ConfirmReport", bob, "LOCAL_DEMO_BOB");
    expect(merged.status).toBe(200);
    expect(merged.body.eventId).toBe(accepted.body.eventId);
    const events = await f.call(
      "/v1/events?bbox=77.2,28.6,77.22,28.63&layers=LIVE",
    );
    expect(events.body).toHaveLength(1);
    expect(events.body[0].status).toBe("ACTIVE");
    expect(JSON.stringify(events.body)).not.toMatch(
      /supporterIds|mediaHashes|local-alice|local-bob/,
    );
    const risk = await f.call(`/v1/routes/${route.body.route.id}/risk`);
    expect(risk.status).toBe(200);
    expect(risk.body.risks[0].warning).toBe(true);
    expect((await f.call("/v1/me")).body.droplets).toBe(10);
    expect(
      (await f.call("/v1/me", undefined, "LOCAL_DEMO_BOB")).body.droplets,
    ).toBe(7);
  });
});

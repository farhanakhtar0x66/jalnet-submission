import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encode } from "jpeg-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createLocalServer } from "../services/local/server.js";

const servers: Server[] = [];
const directories: string[] = [];
afterEach(async () => {
  for (const server of servers.splice(0))
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections();
    });
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
  vi.restoreAllMocks();
});
async function fixture(blockEvidenceDirectory = false) {
  const directory = await mkdtemp(join(tmpdir(), "jalnet-local-upload-test-"));
  directories.push(directory);
  const evidenceDirectory = join(directory, "evidence");
  if (blockEvidenceDirectory)
    await writeFile(evidenceDirectory, "test blocker");
  const runtime = await createLocalServer({
    stateFile: join(directory, "state.json"),
    evidenceDirectory,
    evidenceBaseUrl: "http://127.0.0.1",
  });
  servers.push(runtime.server);
  await new Promise<void>((resolve, reject) => {
    runtime.server.once("error", reject);
    runtime.server.listen(0, "127.0.0.1", resolve);
  });
  const address = runtime.server.address();
  if (!address || typeof address === "string") throw new Error("No listener");
  const base = `http://127.0.0.1:${address.port}`;
  async function call(path: string, body: unknown) {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        authorization: "Bearer LOCAL_DEMO_ALICE",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    return { status: response.status, body: await response.json() };
  }
  const bytes = encode(
    { data: Buffer.alloc(8 * 8 * 4, 100), width: 8, height: 8 },
    90,
  ).data;
  const draft = await call("/v1/reports", {
    action: "DRAFT",
    capturedAt: new Date().toISOString(),
    location: { lat: 28.6139, lon: 77.209, source: "USER_PIN" },
  });
  expect(draft.status).toBe(200);
  const grant = await call("/v1/uploads/presign", {
    reportId: draft.body.id,
    contentType: "image/jpeg",
    contentLength: bytes.length,
  });
  expect(grant.status).toBe(200);
  const capability = new URL(grant.body.url);
  expect(capability.origin).toBe("http://127.0.0.1");
  async function put() {
    const response = await fetch(`${base}${capability.pathname}`, {
      method: "PUT",
      body: new Uint8Array(bytes).buffer,
      signal: AbortSignal.timeout(5000),
    });
    return {
      status: response.status,
      body: response.status === 204 ? null : await response.json(),
    };
  }
  return {
    ...runtime,
    directory,
    evidenceDirectory,
    bytes,
    id: draft.body.id as string,
    call,
    put,
  };
}

describe("real local HTTP upload capability recovery with mandatory Cedar", () => {
  it("redeems a grant exactly once even when two HTTP requests arrive together", async () => {
    const f = await fixture();
    const original = f.evidence.upload.bind(f.evidence);
    let arrived = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let bothArrived!: () => void;
    const ready = new Promise<void>((resolve) => {
      bothArrived = resolve;
    });
    vi.spyOn(f.evidence, "upload").mockImplementation(async (nonce, bytes) => {
      if (++arrived === 2) bothArrived();
      await gate;
      return original(nonce, bytes);
    });
    const requests = [f.put(), f.put()];
    await ready;
    release();
    const results = await Promise.all(requests);
    expect(results.map((result) => result.status).sort()).toEqual([204, 503]);
    expect(
      results.find((result) => result.status === 503)?.body.error,
    ).toMatchObject({
      code: "DEPENDENCY_UNAVAILABLE",
      message: "Dependency unavailable; retry shortly",
    });
    const report = await f.repository.getReport(f.id);
    const key = report?.media[0]?.s3Key;
    expect(key).toBeDefined();
    expect(await f.evidence.read(key ?? "")).toEqual(new Uint8Array(f.bytes));
    expect((await f.put()).status).toBe(503);
    expect(
      (
        await f.call("/v1/reports", {
          action: "UPLOAD_COMPLETE",
          reportId: f.id,
        })
      ).status,
    ).toBe(200);
    expect((await f.repository.getReport(f.id))?.status).toBe(
      "NEEDS_CONFIRMATION",
    );
    expect(await f.repository.ledger("local-alice")).toEqual([]);
  });

  it("keeps a valid capability retryable after a real filesystem failure, then consumes it once", async () => {
    const f = await fixture(true);
    const failed = await f.put();
    expect(failed.status).toBe(503);
    expect(failed.body.error.message).toBe(
      "Dependency unavailable; retry shortly",
    );
    expect(JSON.stringify(failed.body)).not.toContain(f.evidenceDirectory);
    expect(await readFile(f.evidenceDirectory, "utf8")).toBe("test blocker");
    await rm(f.evidenceDirectory);
    expect((await f.put()).status).toBe(204);
    expect((await f.put()).status).toBe(503);
    expect((await f.repository.getReport(f.id))?.status).toBe("UPLOADING");
    expect(await f.repository.ledger("local-alice")).toEqual([]);
  });

  it("rejects an expired capability with redacted HTTP failure and unchanged report state", async () => {
    const f = await fixture();
    const before = await f.repository.getReport(f.id);
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now + 300_001);
    const response = await f.put();
    expect(response.status).toBe(503);
    expect(response.body.error.message).toBe(
      "Dependency unavailable; retry shortly",
    );
    expect(await f.repository.getReport(f.id)).toEqual(before);
    expect(await f.repository.ledger("local-alice")).toEqual([]);
  });
});

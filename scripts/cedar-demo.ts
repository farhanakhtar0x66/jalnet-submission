import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encode } from "jpeg-js";
import { type ReportAction, reportActions } from "../services/core/ports.js";
import { createLocalServer } from "../services/local/server.js";

// Judge proof only: fixed synthetic inputs, ephemeral loopback listeners and an
// owned temporary directory. No real demo state, cloud calls or policy edits.
async function proof() {
  assert.equal(process.version, "v24.21.0");
  const cedar = await import("@cedar-policy/cedar-wasm/nodejs");
  assert.equal(cedar.getCedarSDKVersion(), "4.13.0");
  const directory = await mkdtemp(join(tmpdir(), "jalnet-cedar-judge-"));
  const stateFile = join(directory, "state.json");
  const evidenceDirectory = join(directory, "evidence");
  const servers: Server[] = [];
  const signal = AbortSignal.timeout(20_000);
  let effects = 0;
  const point = { lat: 28.6139, lon: 77.209 };
  const observation = {
    category: "WATERLOGGING",
    severity: 2,
    stillActive: true,
    location: point,
    publicRoad: true,
  };
  type Runtime = Awaited<ReturnType<typeof createLocalServer>>;
  function observe(runtime: Runtime) {
    const watch =
      <Args extends unknown[], Result>(operation: (...args: Args) => Result) =>
      (...args: Args) => {
        effects++;
        return operation(...args);
      };
    runtime.evidence.presign = watch(
      runtime.evidence.presign.bind(runtime.evidence),
    );
    runtime.evidence.read = watch(runtime.evidence.read.bind(runtime.evidence));
    runtime.repository.commit = watch(
      runtime.repository.commit.bind(runtime.repository),
    );
    runtime.repository.putReport = watch(
      runtime.repository.putReport.bind(runtime.repository),
    );
    runtime.app.analyze = watch(runtime.app.analyze.bind(runtime.app));
    runtime.app.analysis.assess = watch(
      runtime.app.analysis.assess.bind(runtime.app.analysis),
    );
  }
  async function open(policies?: Readonly<Record<string, string>>) {
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
    assert(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    async function call(path: string, body?: unknown, foreign = false) {
      const response = await fetch(`${base}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          authorization: `Bearer LOCAL_DEMO_${foreign ? "BOB" : "ALICE"}`,
          "content-type": "application/json",
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal,
      });
      return { status: response.status, body: await response.json() };
    }
    function operation(action: ReportAction, id: string, foreign = false) {
      switch (action) {
        case "ReadReport":
          return call(`/v1/reports/${id}`, undefined, foreign);
        case "PresignReport":
          return call(
            "/v1/uploads/presign",
            { reportId: id, contentType: "image/jpeg", contentLength: 100 },
            foreign,
          );
        case "CompleteUpload":
          return call(
            "/v1/reports",
            { action: "UPLOAD_COMPLETE", reportId: id },
            foreign,
          );
        case "ConfirmReport":
          return call(`/v1/reports/${id}/confirm`, observation, foreign);
      }
    }
    return { ...runtime, base, call, operation };
  }
  async function snapshot() {
    const files = await readdir(evidenceDirectory);
    const hashes = await Promise.all(
      files.sort().map(async (file) => [
        file,
        createHash("sha256")
          .update(await readFile(join(evidenceDirectory, file)))
          .digest("hex"),
      ]),
    );
    return JSON.stringify({ state: await readFile(stateFile, "utf8"), hashes });
  }
  async function close(server: Server) {
    if (!server.listening) return;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections();
    });
  }
  try {
    const owner = await open();
    const ids = {} as Record<ReportAction, string>;
    for (const [index, action] of reportActions.entries()) {
      const draft = await owner.call("/v1/reports", {
        action: "DRAFT",
        capturedAt: new Date().toISOString(),
        location: { ...point, source: "USER_PIN" },
      });
      assert.equal(draft.status, 200);
      ids[action] = draft.body.id;
      if (action === "CompleteUpload" || action === "ConfirmReport") {
        const bytes = encode(
          {
            data: Buffer.alloc(8 * 8 * 4, 80 + index * 30),
            width: 8,
            height: 8,
          },
          90,
        ).data;
        const grant = await owner.call("/v1/uploads/presign", {
          reportId: ids[action],
          contentType: "image/jpeg",
          contentLength: bytes.length,
        });
        assert.equal(grant.status, 200);
        const capability = new URL(grant.body.url);
        assert.equal(capability.origin, "http://127.0.0.1");
        const upload = await fetch(`${owner.base}${capability.pathname}`, {
          method: "PUT",
          body: new Uint8Array(bytes).buffer,
          signal,
        });
        assert.equal(upload.status, 204);
      }
      if (action === "ConfirmReport")
        assert.equal(
          (await owner.operation("CompleteUpload", ids[action])).status,
          200,
        );
    }
    for (const action of reportActions)
      assert.equal((await owner.operation(action, ids[action])).status, 200);
    assert.equal((await owner.app.profile("local-alice")).droplets, 2);
    process.stdout.write(
      "PASS owner: 4/4 private-report operations allowed through actual HTTP.\n",
    );
    const before = await snapshot();
    observe(owner);
    for (const action of reportActions)
      assert.equal(
        (await owner.operation(action, ids[action], true)).status,
        403,
      );
    assert.equal(await snapshot(), before);
    assert.equal(effects, 0);
    process.stdout.write(
      "PASS foreign identity: 4/4 operations denied with HTTP 403.\n",
    );
    await close(owner.server);
    const permit = await readFile(
      new URL("../policies/private-reports.cedar", import.meta.url),
      "utf8",
    );
    const forbid = `forbid (principal is JalNet::User, action in [${reportActions.map((action) => `JalNet::Action::"${action}"`).join(", ")}], resource is JalNet::Report);`;
    const denied = await open({
      owner: permit,
      "judge-test-only-forbid": forbid,
    });
    observe(denied);
    for (const action of reportActions)
      assert.equal((await denied.operation(action, ids[action])).status, 403);
    assert.equal(await snapshot(), before);
    assert.equal(effects, 0);
    process.stdout.write(
      "PASS test-only forbid: 4/4 owner operations denied, including accepted replay.\n",
    );
    process.stdout.write(
      "PASS denial effects: zero new grants, reads, mutations, analysis calls, incidents or awards.\n",
    );
    process.stdout.write(
      "Cedar 4.13.0 / Node 24.21.0: genuine LOCAL authorization; synthetic evidence; production policy unchanged; no AWS cloud verification.\n",
    );
  } finally {
    for (const server of servers) await close(server);
    await rm(directory, { recursive: true, force: true });
  }
}
await proof().catch(() => {
  // Never print repository snapshots, policy internals, capabilities or tokens.
  process.stderr.write(
    "FAIL Cedar judge proof. No private diagnostics printed; run the existing Cedar tests for local investigation.\n",
  );
  process.exitCode = 1;
});

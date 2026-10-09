import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { encode } from "jpeg-js";
import { describe, expect, it } from "vitest";
import { createLocalServer } from "../services/local/server.js";

describe("isolated demo server CLI with real Cedar initialization", () => {
  it("does not seed or change retained private state when resume hits an occupied port", async () => {
    const directory = await mkdtemp(join(tmpdir(), "jalnet-demo-server-test-"));
    const blocker = createServer();
    try {
      const marker = join(directory, ".jalnet-isolated-demo");
      await writeFile(marker, "JALNET_ISOLATED_DEMO_V1\n");
      const stateFile = join(directory, "state.json");
      const runtime = await createLocalServer({
        stateFile,
        evidenceDirectory: join(directory, "evidence"),
        evidenceBaseUrl: "http://127.0.0.1",
      });
      await runtime.app.saveRoute("local-alice", {
        name: "Retained non-fixture route",
        origin: { lat: 28.6, lon: 77.2 },
        destination: { lat: 28.61, lon: 77.21 },
        travelMode: "Car",
        activeAlerts: true,
      });
      const draft = await runtime.app.createReport("local-alice", {
        action: "DRAFT",
        capturedAt: new Date().toISOString(),
        location: { lat: 28.6139, lon: 77.209, source: "USER_PIN" },
      });
      const bytes = encode(
        { data: Buffer.alloc(8 * 8 * 4, 100), width: 8, height: 8 },
        90,
      ).data;
      const grant = await runtime.app.presign("local-alice", {
        reportId: draft.id,
        contentType: "image/jpeg",
        contentLength: bytes.length,
      });
      const nonce = new URL(grant.url).pathname.split("/").at(-1);
      if (!nonce) throw new Error("Missing local upload capability");
      await runtime.evidence.upload(nonce, bytes);
      const retained = await runtime.repository.getReport(draft.id);
      const key = retained?.media[0]?.s3Key;
      if (!key) throw new Error("Missing retained private evidence key");
      const stateBefore = await readFile(stateFile, "utf8");
      const evidenceBefore = await runtime.evidence.read(key);
      await new Promise<void>((resolve, reject) => {
        blocker.once("error", reject);
        blocker.listen(0, "127.0.0.1", resolve);
      });
      const address = blocker.address();
      if (!address || typeof address === "string")
        throw new Error("No occupied loopback port");
      const result = await promisify(execFile)(
        process.execPath,
        [
          "--import",
          "tsx",
          fileURLToPath(new URL("../scripts/serve-demo.ts", import.meta.url)),
          "--resume",
          directory,
          "--port",
          String(address.port),
        ],
        { timeout: 10_000, maxBuffer: 20_000 },
      ).catch(
        (error: { code: number; stdout: string; stderr: string }) => error,
      );
      expect(result).toMatchObject({ code: 1, stdout: "" });
      expect(result.stderr).toContain("EADDRINUSE");
      expect(await readFile(stateFile, "utf8")).toBe(stateBefore);
      expect(await runtime.evidence.read(key)).toEqual(evidenceBefore);
      expect(await readFile(marker, "utf8")).toBe("JALNET_ISOLATED_DEMO_V1\n");
      expect(await runtime.repository.routes("local-alice")).toHaveLength(1);
      expect(await runtime.repository.getReport(draft.id)).toEqual(retained);
      expect(await runtime.repository.ledger("local-alice")).toEqual([]);
    } finally {
      if (blocker.listening)
        await new Promise<void>((resolve, reject) => {
          blocker.close((error) => (error ? reject(error) : resolve()));
        });
      await rm(directory, { recursive: true, force: true });
    }
  });
});

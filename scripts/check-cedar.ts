import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { reportActions } from "../services/core/ports.js";
import { CedarReportAuthorizer } from "../services/providers/cedar-authorization.js";

assert.equal(process.version, "v24.21.0", "Use the pinned JalNet Node runtime");
const started = performance.now();
const authorizer = await CedarReportAuthorizer.create();
const initializationMs = performance.now() - started;
const cedar = await import("@cedar-policy/cedar-wasm/nodejs");
assert.equal(cedar.getCedarSDKVersion(), "4.13.0");
const timings: number[] = [];
for (let i = 0; i < 1000; i++) {
  const start = performance.now();
  const decision = await authorizer.authorize({
    principalId: i % 2 ? "local-bob" : "local-alice",
    ownerId: "local-alice",
    action:
      reportActions[Math.floor(i / 2) % reportActions.length] ?? "ReadReport",
    reportId: "51d42f5a-2460-4126-8cb4-0329a1c9d9d8",
  });
  timings.push(performance.now() - start);
  assert.equal(decision, i % 2 ? "DENY" : "ALLOW");
}
timings.sort((a, b) => a - b);
process.stdout.write(
  `${JSON.stringify(
    {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cedar: cedar.getCedarSDKVersion(),
      initializationMs,
      decisions: 1000,
      allow: 500,
      deny: 500,
      medianMs: timings[500],
      p95Ms: timings[950],
      mode: "LOCAL real-engine authorization; no AWS verification",
    },
    null,
    2,
  )}\n`,
);

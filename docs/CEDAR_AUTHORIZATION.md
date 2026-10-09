# Mandatory local private-report authorization

Implemented at the user's explicit approval on 2026-10-08. Runtime dependency: exact `@cedar-policy/cedar-wasm@4.13.0`, official Node entry point. This is real local authorization, distinct from the existing LOCAL/DEMO authentication, storage, analysis and route providers. Live AWS remains **BLOCKED_AWAITING_SSO**. Cedar has not been composed, packaged or executed in Lambda.

## Policy and schema

[jalnet.cedarschema](../policies/jalnet.cedarschema) defines only `JalNet::User`, `JalNet::Report { owner: User }`, four actions and empty context. [private-reports.cedar](../policies/private-reports.cedar) is the only production policy:

```cedar
permit (
  principal is JalNet::User,
  action in [
    JalNet::Action::"ReadReport",
    JalNet::Action::"PresignReport",
    JalNet::Action::"CompleteUpload",
    JalNet::Action::"ConfirmReport"
  ],
  resource is JalNet::Report
)
when { resource.owner == principal };
```

Everything without a matching permit is denied. No role, sharing, administration, new endpoint or product permission was added. Cedar authorizes; it does not authenticate. The engine strictly validates the schema/policies at initialization and validates every request against that schema.

## Boundary audit

| Path | Source of identity / resource | Required decision / effect ordering |
|---|---|---|
| `services/local/server.ts` | Exact existing named local bearer strings map to server-owned principal IDs. Missing or JWT-shaped strings yield no identity. Request body/query cannot set that identity. | `dispatch()` rejects missing authentication with 401 before report access. Local/demo identity is not Cognito. |
| GET `/v1/reports/:id` | `services/core/http.ts` passes authenticated `userId`; `Application.ownedReport()` fetches the report from Repository. | `ReadReport` before returning private data. Missing persisted report retains 404. |
| POST `/v1/uploads/presign` | Strict existing body accepts only report ID/type/size. Persisted report ID and `userId` supply Cedar resource and owner. | `PresignReport` on every retry before counters, report mutation or `evidence.presign()`. |
| POST `/v1/reports`, `UPLOAD_COMPLETE` | Strict existing discriminator references persisted report ID. | `CompleteUpload` before replay, evidence reads, state change and scheduling. Conflict return re-fetches and evaluates **CompleteUpload again**, not ReadReport. |
| POST `/v1/reports/:id/confirm` | Existing authenticated principal, repository owner and strict human observation. | `ConfirmReport` on every retry, including accepted replay, before private result/evidence read/fusion/report/event/ledger transaction. |
| POST `/v1/reports`, `DRAFT` | Authentication assigns owner and random report ID; client cannot set either. | Existing auth, capture checks and atomic draft quota remain. Creation has no existing persisted report to access; it is outside these four existing-resource actions. It provides no access to another report. |
| PUT `/local/evidence/:nonce` | Existing short-lived, one-use upload capability from LocalEvidence; no asserted principal from upload bytes. | Grant issuance requires Cedar. PUT redeems only that grant with size/expiry checks. Denied presign issues no capability. There is no new anonymous grant path or policy-revocation feature; do not print signed URLs. |
| `Application.analyze(id)` | Internal worker, no caller principal. In local HTTP composition, invoked only after authorized completion; in AWS, existing SQS worker. | Existing status/lease/private-evidence/hash checks. Not a user-access endpoint; no fabricated user or role added to worker requests. Denied completion invokes no worker. |
| Public event / saved route / profile APIs | Existing public filtering and authenticated owner scoping. | Scope unchanged. No report body/private evidence is exposed through these paths; allowed full-flow HTTP regression asserts public redaction and 10/7 ledger balances. |
| `services/aws/runtime.ts` / Lambda handlers | Existing trusted API Gateway/Cognito boundary. | Unchanged cloud composition retains existing ownership enforcement. It does not instantiate Cedar. Existing AWS providers, IAM, CDK and deployment guards remain. |

The only production direct `repository.getReport()` consumers are `ownedReport()` and internal `analyze()`. The live smoke's direct application calls use the unchanged AWS composition. No HTTP private-report read/grant/completion/confirmation reaches a direct repository read without `ownedReport()`.

## Mandatory and fail-closed behavior

`createLocalServer()` always creates the real Cedar authorizer before constructing the application/server. Initialization failure prevents listening; no permissive/legacy fallback or environment disable switch exists in this composition. Trusted policy overrides exist only as constructor inputs for isolated tests; HTTP cannot set them. Policies are copied on creation and are not reloaded through requests.

`ownedReport()` derives the resource ID/owner from the fetched report, evaluates the supplied typed action, then retains the original owner comparison as defense in depth. A valid policy deny returns canonical 403. Unknown action, invalid/missing identity or owner, invalid resource ID, engine failure, nonempty policy-error diagnostics or warnings fail closed with a redacted dependency error. Initialization errors discard raw parser/filesystem diagnostics. HTTP uses the existing generic 503; no policy contents, entity data, bearer value or internal diagnostic is exposed.

Important actual-engine test: a strictly valid test permit with `9223372036854775807 + 1 > 0` causes runtime overflow. Cedar returns **allow plus one policy error** because the independent owner permit succeeds. JalNet rejects that result; the HTTP upload-grant operation returns redacted 503 and creates no effects. Default-deny alone would not handle this case.

## Actual-engine proof

Reproduce with the pinned Node runtime:

```sh
pnpm cedar:check
pnpm exec vitest run tests/cedar-authorization.test.ts tests/cedar-http.test.ts --reporter=verbose
```

The dedicated suite comprises **40 tests: 22 engine/adapter and 18 HTTP tests**. It uses the real WASM engine, ephemeral loopback HTTP servers, isolated temporary repositories and generated 8×8 JPEGs. It does not contact AWS. Engine decisions are never mocked; spies observe side effects and the conflict test forces only a repository race response.

Owner allow and foreign deny are checked for all four actions. Test-only `forbid(principal is JalNet::User, action == JalNet::Action::"<action>", resource is JalNet::Report);` overrides the owner permit through actual HTTP for each action. Repository snapshots remain byte-identical; no upload grant, evidence read, report write, analysis callback, incident or ledger award occurs. Accepted confirmation and completed-upload replay are also denied under real forbid policies after restart, proving replay cannot bypass authorization. A deliberately broad test permit still cannot bypass the original owner check.

Other tests prove default deny, strict schema/policy rejection, unknown actions, invalid input, actual engine request failure, policy-error diagnostics/redaction, 401/403/404, forged JWT-shaped headers, body/query spoof rejection and the complete allowed report → fusion → route warning → replay/ledger flow. Tests do not establish real independent witness evidence.

## Separate acceptance gates

| Gate | Evidence / remaining condition |
|---|---|
| Local Cedar runtime and mandatory authorization | Dedicated actual-engine + HTTP suite passes. Initialization/decision measurements and complete repository gate belong in IMPLEMENTATION_REPORT.md. |
| Build It technical integration | Real AWS-origin open-source runtime is in the existing local workflow, with policy source and Apache notices. Judge proof should show the allowed app workflow, owner allow/foreign deny and explicit owner forbid tests; sanitized test names/results suffice, never bearer/signed URLs/private evidence. This is technical integration evidence, not overall hackathon eligibility. |
| Build It submission / eligibility / final recording | Official kickoff/original-work timing, participation/student/submission requirements and final judge video remain pending. Existing instruction not to record the final demo remains. See AWS_OPEN_SOURCE_FEASIBILITY.md and DEMO_READINESS.md. |
| Optional future Cedar-in-Lambda gate | Not implemented or verified. Separately preserve/copy Node loader, `cedar_wasm_bg.wasm` and policy/schema assets in the actual deployment artifact, load that isolated artifact, then measure/invoke in Lambda after SSO. Synth does not prove any of this. |
| Existing live AWS P0 gate | BLOCKED_AWAITING_SSO; unchanged Cognito/API/Lambda/DynamoDB/S3/SQS/Nova/Location service, native Maps and physical-phone acceptance requirements. Cedar alone passes none of these gates; P0 is incomplete. |

Origin/licensing references and preserved upstream notices: [third-party/cedar](../third-party/cedar/README.md). The MIT project license is unchanged. No framework rewrite, new infrastructure dependency or mobile UI change was needed.

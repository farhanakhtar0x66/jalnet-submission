# JalNet AWS open-source feasibility assessment

Historical pre-approval assessment retained for the accepted plan. The user subsequently approved the narrow Cedar integration; actual implementation and acceptance evidence are in [CEDAR_AUTHORIZATION.md](CEDAR_AUTHORIZATION.md) and [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md). The planning-only statements below describe the assessment at that time.

Assessment date: 2026-10-08, Asia/Kolkata. Audited baseline: `3fb2b0a796b827d8d9c9e666b17dbb83e60a4659`. **Planning only: no dependency installation, application change, infrastructure change, provider implementation, deployment or final recording.** Live AWS remains **BLOCKED_AWAITING_SSO**, intended profile `jalnet`, region `ap-south-1`.

Recommendation: preserve the existing local application and add **Cedar authorization for private reports** as a small, mandatory server-side integration after the plan is approved. Retain the already executed **Amazon Corretto Android build** as supporting AWS open-source evidence. Keep the cloud composition, strict live configuration and cutover runbook. No database replacement, Java backend rewrite or infrastructure emulator is needed.

## Official rules and eligibility boundary

The [official Environmental Hacks overview](https://www.wemakedevs.org/aws/env) explicitly permits either an AWS open-source tool or deployment on AWS. Its Build It column identifies a local path needing no AWS account and names Cedar, Corretto, Strands, SAM CLI, Finch and OpenSearch. Build It and Ship It are approaches available within the environmental tracks, not separate problem tracks. This supports investigating a local Heat and Water submission; it does not certify JalNet's eligibility.

The [official rules](https://www.wemakedevs.org/aws/env/rules) also require visible AWS use in the video, event-period original work, appropriate third-party credit/licensing, public repository, short write-up and a YouTube video under three minutes. Participation/student verification and submission requirements still apply. The [schedule](https://www.wemakedevs.org/aws/env/schedule) gives October 8–11 but says exact kickoff/deadline hours are still being finalized. Do not infer them from a calendar date or START message.

History evidence: the first planning commit is October 8 at 02:57:03 IST; the first implementation commit is `2182286` at 03:55:28 IST. Commit timestamps do not prove when implementation began. Obtain the actual organizer-approved opening time before asserting event-period compliance. If that work predates the opening, adding Cedar cannot by itself fix the eligibility problem. Preserve the real history; request organizer clarification through the team rather than rewriting timestamps or concealing prior work. No organizer message was sent by this audit.

The earlier P0 acceptance target explicitly requires live AWS. A Build It acceptance checklist could be agreed separately without SSO; it must not silently redefine that cloud target or promote AWS-dependent rows. The existing no-final-recording instruction remains in force during this assessment.

## Repository audit

| Area | Current implementation and evidence | Consequence for a local open-source path |
|---|---|---|
| Mobile | `apps/mobile/src/Home.tsx`, `ReportFlow.tsx`, `SignIn.tsx`, `api.ts`, `cache.ts`, `drafts.ts`; Expo native Android, MapLibre, private capture, manual confirmation, routes, ledger, account-scoped persistence | Keep current screens, contracts and actions. Cedar belongs on the Node server; no Hermes/WASM dependency is proposed. |
| Shared domain | `services/core/application.ts`; contracts/domain/geo packages | Fusion, logical expiry, route intersection, conditional awards, ownership and duplicate protections are usable independently of AWS. |
| Boundaries | `services/core/ports.ts`: Repository, EvidenceProvider, AnalysisProvider, RouteProvider | Four existing interfaces already support two compositions. Authorization has no dedicated interface yet; this is the small proposed addition. |
| Local composition | `scripts/dev-server.ts`; `services/providers/local.ts`, `local-repository.ts` | Loopback HTTP, atomic file persistence, real local private JPEG transfers, named fixture identities, manual/no-model analysis and straight-line route corridors. Analysis currently runs inline through the callback; there is no local SQS. |
| Cloud composition | `services/aws/runtime.ts`, separate handlers/worker, `services/providers/aws.ts`, `dynamo-repository.ts` | Real AWS SDK implementations exist but remain IMPLEMENTED_UNVERIFIED. Cloud handlers must keep their trusted Gateway identity and AWS-only provider construction. |
| Infrastructure | `infrastructure/cdk/stack.ts`, `app.ts`; guarded deployment/smoke scripts and cutover documents | Synthesized Cognito/API/Lambda/DynamoDB/S3/SQS/Bedrock/Location path stays available. Local open-source use does not verify its service behavior. |
| Existing AWS open source | CDK synthesis; Corretto 17 native Gradle build in IMPLEMENTATION_REPORT.md | Already substantive development tooling; demonstrate its actual role, not just package names. Corretto is explicitly listed by organizers. |
| Tests | `pnpm test` rerun in this audit: **10 suites / 71 tests passed** | Preserve the entire baseline and add narrowly scoped policy/integration coverage later. No new tests or test-count increase in this assessment. |

Documentation drift found: ARCHITECTURE.md and DECISIONS.md still describe cache scoping by token hash. Current `cache.ts` hashes the authenticated account scope; the latest implementation report is accurate. Correct that wording during an authorized documentation update. Do not design the integration from the older description.

Local means no AWS account, not completely offline: the current MapLibre demo basemap uses external public map assets. Straight-line corridors are not road routing, named demo identities are not Cognito authentication, manual classification is not Nova inference, and file commits are not DynamoDB transactions. Preserve these disclosures.

## Candidate comparison

| Technology | Verified origin/license | Meaningful JalNet use | Compatibility/cost assessment | Decision |
|---|---|---|---|---|
| **Cedar** | AWS-open-sourced authorization engine, Apache-2.0; official `cedar-policy/cedar` project | Required access decision before private report reads/upload grants/completion/confirmation | Official Node WASM entry point; no AWS account, model service, VM or new database. Smallest functional addition. | **Primary recommendation.** |
| **Amazon Corretto** | Amazon OpenJDK distribution, GPLv2 with Classpath Exception | Runs Gradle/JVM compilation for the actual Android development APK | Corretto 17 already installed and used successfully. This is build-time use; Android runs ART, backend remains Node. | **Retain and show supporting proof.** Lowest-change existing option. |
| **Strands Agents SDK + local model** | AWS-origin SDK, Apache-2.0; official Python Ollama adapter supports image bytes | Real local image-to-assessment draft behind AnalysisProvider | Requires local vision weights, model-license review, memory/latency measurement and extra runtime/provider plumbing. SDK is not a model. Ollama/model origin is separate from Strands. | Feasible optional alternative if real local AI becomes the team's priority; not needed for the recommended path. |
| **AWS SAM CLI** | `aws/aws-sam-cli`, Apache-2.0 | Local Lambda/API request harness, useful for handler cutover readiness | Container runtime and explicit local composition needed. Current cloud handlers construct real AWS clients; SAM alone does not supply the service dependencies or Cognito validation. | Useful later; unnecessary migration for the working localhost API. |
| **Finch** | AWS-launched container client, Apache-2.0 | Reproducible container build/run for the local API | Supports Apple Silicon macOS; introduces a VM/container lifecycle. Existing Node server does not require it. | Secondary packaging option only if reproducibility demands containers. |
| **AWS CDK** | Official `aws/aws-cdk`, Apache-2.0 | Existing, executed synthesis/security assertions for the future AWS stack | Already compatible with current TypeScript/Node. A template is infrastructure design evidence, not a running cloud backend. | Retain as additional tool evidence; prefer Cedar for visible runtime behavior. |
| **OpenSearch** | AWS-initiated open-source project, Apache-2.0 | Potential incident search/geospatial secondary index | Adds a search server, privacy indexing boundaries and synchronization; current H3 lookup already works. It should not become the ledger/transaction authority. | Reject for this P0 plan: extra state and scope without a current requirement. |

Primary provenance references: [Cedar AWS announcement](https://aws.amazon.com/about-aws/whats-new/2023/05/cedar-open-source-language-access-control/), [Cedar source/license](https://github.com/cedar-policy/cedar/blob/main/LICENSE), [Corretto FAQ](https://aws.amazon.com/corretto/faqs/), [Strands AWS announcement](https://aws.amazon.com/blogs/opensource/introducing-strands-agents-an-open-source-ai-agents-sdk/), [current Strands package](https://github.com/strands-agents/harness-sdk/blob/main/strands-ts/package.json), [SAM license](https://github.com/aws/aws-sam-cli/blob/develop/LICENSE), [SAM local API documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-start-api.html), [Finch AWS announcement](https://aws.amazon.com/blogs/opensource/introducing-finch-an-open-source-client-for-container-development/), [Finch platform prerequisites](https://github.com/runfinch/finch), [CDK license](https://github.com/aws/aws-cdk/blob/main/LICENSE), [OpenSearch origin/license](https://aws.amazon.com/what-is/opensearch/).

## Cedar origin, package and compatibility verification

The official AWS announcement identifies Cedar as AWS-open-sourced, usable in disconnected applications. Upstream source is Apache-2.0. The [official WASM package documentation](https://github.com/cedar-policy/cedar/blob/main/cedar-wasm/README.md) provides `@cedar-policy/cedar-wasm/nodejs` for Node and distinguishes it from browser/bundler loading.

Read-only npm metadata query executed:

```sh
pnpm view @cedar-policy/cedar-wasm version license engines exports dist.integrity repository --json
```

Observed: published version **4.13.0**, license **Apache-2.0**, repository `cedar-policy/cedar`, integrity metadata present, Node subpath supporting both import/require. No Node engine constraint was returned; absence of a constraint is not proof of runtime compatibility. The repository also publishes [Cedar CLI 4.13.0 with Apple Silicon binaries](https://github.com/cedar-policy/cedar/releases/tag/cedar-policy-cli-v4.13.0); CLI release availability is separate from npm package proof.

Local probes found Node **24.21.0**, darwin/arm64, WebAssembly instantiate support, and Corretto Java **17.0.20.1** / distribution **17.0.20.12.1**. Docker, Finch, SAM and Ollama were not found on current PATH; that does not prove they are absent elsewhere. No tools/models were installed.

Compatibility conclusion: **documented fit and feasible**, with actual pinned-package loading, policy evaluation, TypeScript/module resolution and production bundling still untested. Use the server Node entry point rather than the default browser-oriented WASM import. The current CDK bundles dependencies with esbuild and `externalModules: []`; a future Lambda integration must explicitly preserve/copy the WASM and loader assets. Do not assume synth or bundling automatically includes them.

Keep JalNet's MIT license and upstream licenses separate. Retain Apache license/copyright/NOTICE material required by the distributed dependency; do not label Cedar as MIT. Preserve Corretto's distribution license if redistributing the JDK. Using the existing JDK to build the app does not make the Node application a Corretto runtime.

## Proposed integration and migration sequence

This is an additive authorization integration. No existing data migration is required.

1. **Confirm the acceptance target.** Resolve actual kickoff/deadline and team registration/student requirements. Agree a Build It gate for local Cedar plus current JalNet behavior. Keep the live P0 AWS gate and BLOCKED_AWAITING_SSO separately visible.
2. **Prove the dependency in isolation after approval.** Pin published Cedar 4.13.0 and lock integrity, load the Node entry point, validate a minimal schema/policy, evaluate owner/non-owner requests and measure initialization/decision cost. Verify no network or credential provider is called during evaluation. If this package fails locally, record the error before choosing a different loader/version.
3. **Add one authorization boundary.** Add a ReportAuthorizer interface in `services/core/ports.ts` and a Cedar implementation in proposed `services/providers/cedar-authorization.ts`. Add proposed `policies/jalnet.cedarschema` and `policies/private-reports.cedar`. Model User, Report, owner and narrowly allowed actions. No roles, sharing, admin privileges or new product permission features.
4. **Make it a required check in the real local flow.** `Application.ownedReport` is already used by reads, presign, completion and confirmation. Invoke the configured authorizer there before returning the report or issuing any grant. Current owner checks remain an additional invariant. Local composition explicitly selects Cedar; failure to initialize or evaluate must not silently select the old implementation. Existing construction can retain legacy behavior for the unchanged AWS composition and baseline tests until Cedar's cloud package is separately accepted.
5. **Preserve identity and response semantics.** Principal comes from the trusted server identity path, never a submitted owner/JWT payload. Report owner comes from Repository, never user input. Existing missing-auth 401, missing-report 404 and non-owner 403 semantics stay. Initialization/evaluation failures return redacted dependency failure and grant no access or write. Unknown actions/types, missing owner and invalid schema do not authorize.
6. **Preserve the rest of the pipeline.** Keep all report fields/statuses, JPEG limits/EXIF checks, freshness, queue lease, human confirmation, event public/private filtering, fusion, reward guards, cache scope, route warnings and UI actions. Policy evaluation must occur before side effects and not alter confirmation replay or quota accounting. Retain explicit LOCAL/DEMO identity/manual analysis/corridor labels.
7. **Prove regressions and runtime integration.** Keep all 71 baseline tests. Add policy schema/owner/foreign/unknown/missing-data/error tests plus actual HTTP allow/deny assertions with Cedar loaded. Include a test-only explicit forbid for the owner: the otherwise authorized HTTP request must fail, proving Cedar is mandatory rather than merely duplicating a logged owner comparison. Verify denied grants/completions create no file/report/event/reward effects; accepted replay remains idempotent. A unit mock of the engine is insufficient integration evidence.
8. **Verify future Lambda packaging separately.** Preserve `services/aws/runtime.ts`, AWS providers, CDK resources, IAM and smoke guards during the first local increment. For shared cloud Cedar later, add only reviewed asset packaging/composition changes, test loading the built artifact and then invoke it live after SSO. Cognito still authenticates; Cedar authorizes. Amazon Verified Permissions is not required and would be a separate architecture decision.

Cedar-specific hazard: [upstream authorization semantics](https://docs.cedarpolicy.com/auth/authorization.html) skip an erroneous policy; another permit can still produce Allow. JalNet's adapter must inspect diagnostics and refuse access on evaluation errors even if the overall decision is Allow. Startup schema validation and explicit action scoping are mandatory; "default deny" alone is not adequate error handling.

After implementation, execute format, lint, root/mobile types, synth, all tests, Android bundle and clean local smoke. Add a dedicated Cedar HTTP smoke proving actual policy decisions, not a printed AWS badge. Proposed new files/commands are not present or executable yet. Record the actual resulting count and evidence at that time; this assessment does not invent a future count.

## Optional Strands alternative

If selected instead, implement a Strands-backed AnalysisProvider that returns the existing strict MediaAssessment and never publishes. Use an explicitly local, license-reviewed image-capable model; text-only models cannot inspect the JPEG. Do not leave the SDK on its default Bedrock provider. Preserve bounded timeout/retry/output limits and private manual fallback. No shell/browser/network tools or autonomous event/reward writes are needed.

Current-source compatibility detail: the former `strands-agents/sdk-typescript` repository is archived and points to `strands-agents/harness-sdk`. The current TypeScript package requires Node >=22 and has a Zod ^4.1.12 peer, matching JalNet's Node24/Zod4 baseline. This does not prove a turnkey TypeScript Ollama image path. The verified [Python Ollama adapter](https://github.com/strands-agents/harness-sdk/blob/main/strands-py/src/strands/models/ollama.py) converts image bytes. That route needs a small loopback Python service; an OpenAI-compatible TypeScript/local-model path would need separate API/image compatibility proof.

A successful Strands run with a local vision model is genuine local inference, not Nova/Bedrock verification. Existing provenance permits only LOCAL_DEMO/AWS_UNVERIFIED, so explicit local-model metadata/copy would need review to distinguish manual fixtures from real local inference. Model weights, redistribution license, hardware memory and warmed latency remain unverified. No model name or weight download is selected in this assessment.

## Judge demonstration plan — not recorded

| Time | Proposed evidence |
|---|---|
| 0:00–0:20 | Real problem: current water observations and private evidence, chosen Heat and Water track, visibly local mode. |
| 0:20–1:20 | Native capture/private local upload, manual review and explicit confirmation, public incident, labeled local corridor warning and ledger. Disclose prepared corroboration/demo identities and simulator camera data when used. |
| 1:20–2:05 | Actual Cedar runtime proof: owner's private-report request allowed; second local demo principal's request denied; no resulting grant, mutation or award. Show sanitized decision/policy identifier plus passing actual-engine HTTP test with an explicit test-only forbid, proving the policy is a required gate. |
| 2:05–2:35 | Small architecture frame: mobile → local Node API → Cedar → existing domain and file/JPEG/manual/corridor providers. Show pinned official package, policy source and dependency/license attribution. |
| 2:35–2:55 | Corretto build proof as supporting evidence: actual JDK/Gradle log and native app result. Separate future AWS cloud architecture labeled IMPLEMENTED_UNVERIFIED / SSO blocked. Leave timing margin under three minutes. |

Never display bearer tokens, signed URLs, private photos/locations, environment files or cloud account identifiers. The policy decision must actually gate the HTTP operation; imports, mock responses, a README mention or an architecture diagram alone are insufficient proof of that proposed behavior. The local app still uses manual analysis and a corridor test rather than Nova and Amazon road routing. Cedar proves local authorization, not Cognito, S3, DynamoDB, SQS, Bedrock or Amazon Location.

## Decision and outstanding proof

Proceed with **Cedar for private-report authorization plus existing Corretto build evidence** if the team authorizes implementation. It matches a current privacy requirement, has verified AWS origin/open-source licensing, and fits the actual server without replacing a working subsystem. Current local capabilities remain useful while live credentials are blocked.

Pending: organizer kickoff/deadline/participation confirmation; dependency runtime/bundle and policy integration proof; new acceptance evidence and demo gate agreement. Live AWS deployment, model, native Maps/key enforcement and physical device acceptance remain blocked/unverified as previously documented. No hackathon-compliance or P0-completion claim is made.

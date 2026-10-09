# JalNet local implementation report

Latest increment 2026-10-09: the owner authorized the complete mobile presentation/theme redesign on **ui/jalnet-redesign**, starting from verified feature commit **2dbbc4f** while Aryan is unavailable. The final current-source gate after all mobile fixes is **PASS: all eight local checks**, including **181 tests / 16 suites**, preserving every one of the 165 baseline tests and adding 16 theme tests. Rebuilt arm64 debug APK/owned API37 emulator install and scoped native inspection are complete. Unretaken native cases and redesigned Redmi acceptance remain pending; the owner's phone battery died. See the [UI redesign report](UI_REDESIGN_REPORT.md), [36-capture after-design pack](ui/redesign/README.md) and dated UI section below. Historical milestone counts/results are retained as history, not current-run evidence. Build It submission and live AWS remain separate; **P0 is not complete**.

Current strategy2026-10-08: Build It is the primary submission path; SSO only blocks future live AWS acceptance. The owner's new instruction authorizes My Water, a small explainable Water Stress prototype and disclosed vision previews. The historical P1/P2 deferral below describes earlier milestones; see [current feature matrix](FEATURE_STATUS.md) and [Aryan handoff](ARYAN_UI_HANDOFF.md) for the narrowed exception. Final recording/submission remains owner-controlled; no eligibility or P0-completion claim.

Date: 2026-10-08, Asia/Kolkata. This is an implemented and tested **local milestone**, not P0 completion. The user authorized START, public GitHub publication/team access, local development while AWS SSO is unavailable, and emulator testing before physical-phone testing.

**Live AWS: BLOCKED_AWAITING_SSO.** Intended profile: `jalnet`; region: `ap-south-1`. No AWS credential probe, deployment, resource access, model call or live integration was performed. AWS modules remain IMPLEMENTED_UNVERIFIED. No fake/static credentials, placeholder AWS keys or LocalStack were introduced.

## Implemented modules

| Area | Files | Behavior / limits |
|---|---|---|
| Shared contracts | `packages/contracts/src/index.ts`, `events.ts` | Strict §8.3 assessment, reports/events/routes/ledger/upload/viewport/error schemas; reject invented exact-depth fields, extra keys, invalid categories/confidence/coordinates and unsupported upload content. |
| Domain / geometry | `packages/domain/src/{reports,incidents,rewards}.ts`, `packages/geo/src/{index,coverage}.ts` | Conceptual report transitions, conservative prompt/fusion, lower-median severity, independent confidence, logical expiry, H3 candidates, every-segment corridor intersection, immutable reversal entries. |
| Application / HTTP | `services/core/{ports,application,http}.ts` | Ownership, JPEG byte/decoder/hash validation, manual fallback, human-confirmed publication, transactional reports/incidents/ledger/guards, independent votes, routes, quota/cache and canonical redacted errors. |
| Local providers | `services/providers/{local,local-repository}.ts` | Ignored private file persistence, atomic local commits, short localhost upload grants, deliberately uncertain/manual analysis, straight-line demo route. |
| AWS providers | `services/providers/{aws,dynamo-repository}.ts` | Real SDK S3, configurable Nova Converse, Routes V2 Simple LineString, DynamoDB indexed/conditional/transactional adapters. SDK unit tests are mocked; actual behavior is unverified. |
| AWS services | `services/aws/{runtime,reports,events,routes,profile,worker,health}.ts` | Separate Lambda entry points, Cognito JWT subject, report-ID queue messages, transactional 90-second analysis lease, bounded model attempts/manual failure path, SQS partial-batch failure and honest non-probing health. No cloud-to-demo fallback. |
| Infrastructure | `infrastructure/cdk/{app,stack}.ts` | Single CDK TypeScript stack, scoped service IAM, private evidence, four canonical tables, Cognito, HTTP API, SQS/DLQ and six Node24 Lambdas. Synthesized only. |
| Native app | `apps/mobile/App.tsx`, `src/{Home,ReportFlow,SignIn,api,cache,drafts,location,ui,Button}.tsx/.ts` | Map-first native MapLibre, working local layers/routes/profile/camera, private draft/retry/confirmation, PKCE/SecureStore cloud sign-in boundary, Query API state and Zustand UI state, SQLite offline cache. |
| Local tools / CI | `scripts/{dev-server,seed-demo,reset-demo,local-safety,smoke-local,smoke-aws}.ts`, `.github/workflows/checks.yml` | Explicit LOCAL/DEMO mode, stopped-server reset protection, fixture HTTP smoke, guarded live smoke, read-only validation workflow without deployment credentials. |

The original supplied implementation plan is preserved byte-for-byte. Generated native projects, APKs, bundles, SDK/JDK caches, photos, runtime state and populated environment files are ignored by Git.

## Executed verification

Commands were run from the repository root with project-local Node24/pnpm10 on PATH, unless indicated. Local evidence does not establish live AWS success.

| Command / check | Executed result | What it establishes |
|---|---|---|
| `CI=true pnpm install --frozen-lockfile` | PASS | Lockfile/manifests reproduce locally. |
| `pnpm format:check`, `pnpm lint` | PASS at final local gate | Current source formatting/lint. |
| `pnpm typecheck` | PASS at final local gate | Shared/backend/infrastructure and mobile TypeScript. |
| `pnpm synth` | PASS at final local gate | Actual CloudFormation/assets generated without account access; scoped ARN/security assertions inspect this artifact. No deployment proof. |
| `pnpm test` | PASS: nine suites, 44 tests | Contract, domain, spatial, trust/concurrency, rewards, canonical errors, synthesized security, mocked SDK and mocked bounded-location behavior. |
| `pnpm mobile:bundle` | PASS at final local gate | Android Hermes export; not physical-device or AWS proof. |
| `./gradlew :app:assembleDebug --no-daemon` in `apps/mobile/android` | BUILD SUCCESSFUL, 13m2s, 338 tasks | Native development APK built with Corretto17, Android36, BuildTools35.0.0, NDK27.1.12297006. |
| `adb install -r …/app-debug.apk` and development-client deep link | Success; actual native screen rendered | Installed/running emulator build, MapLibre native map, saved-route polyline and local API warning. |
| `pnpm demo:reset`, `pnpm demo:seed` with server stopped | PASS | Only ignored LOCAL/DEMO data reset; deterministic Delhi route restored, no invented observations. |
| `pnpm demo:reset` while server listening | Expected exit1/refusal; data retained | Prevents deleting/overwriting active in-memory demo state. |
| `pnpm smoke:local` on clean seeded localhost server | PASS | Generated JPEG → private localhost upload → manual confirmation → fusion → route warning → immutable awards → replay; explicit fixture identities. |
| `pnpm smoke:aws` without `--live` | Expected exit2, BLOCKED_AWAITING_SSO | Guard exits before any AWS call. This is not a smoke-test pass. |
| Source comparison / Git whitespace / credential-pattern review | PASS | Plan unchanged; authored diff clean; no key material or runtime/private artifacts in publication set. |
| GitHub CI | PASS, checks job 42 seconds, commit `6bddc1c` | [Actual validation run](https://github.com/farhanakhtar0x66/jalnet/actions/runs/37702139384): frozen install, format, lint, types, synth, 44 tests and Android bundle all succeeded on Ubuntu. No AWS credentials/deployment. |

Native build command used these local paths:

```sh
ANDROID_HOME=/Users/farhanakhtar/Projects/JalNet/.tools/android-sdk \
JAVA_HOME=/Users/farhanakhtar/Projects/JalNet/.tools/jdk/amazon-corretto-17.jdk/Contents/Home \
GRADLE_USER_HOME=/Users/farhanakhtar/Projects/JalNet/.tools/gradle \
PATH=/Users/farhanakhtar/Projects/JalNet/.tools/node_modules/.bin:$PATH \
./gradlew :app:assembleDebug --no-daemon
```

SDK platform/command-line/JDK downloads had checksum validation. Some SDK directories are symlinked to the existing user SDK; Gradle installed the selected BuildTools/NDK there. These tools are machine setup, not committed application dependencies.

## Native emulator walkthrough

Pixel7 AVD, existing API37.1 arm64 phone image, debug development build. API37.1 is preview emulator software, so target-phone compatibility and performance remain unverified.

- Native map loaded MapLibre's official demo style with attribution; the visible mode banner said LOCAL/DEMO and AWS blocked awaiting SSO. This does not verify Amazon map assets.
- Camera primer/permission, native capture, resized private preview and direct `expo/fetch` File upload executed. Captured file was **14,020 bytes, 1,280×1,102**, with no EXIF marker. It was a simulated black/timestamp camera frame, not a photograph of a real water issue.
- API reached NEEDS_CONFIRMATION with explicit LOCAL/DEMO/no-model-ran text. Model relevance/confidence was never treated as truth.
- Force-stop/relaunch restored the private image and server report without reuploading. A stale query-key bug discovered during upload was fixed by explicitly reading/caching the exact report ID.
- Still-active was explicitly enabled and public-road consent left off. Private confirmation succeeded, returned to the map, added no public incident and awarded no additional droplets.
- Foreground primer and native GPS path returned deliberately simulated Delhi coordinates with approximately 5 m accuracy. A bounded foreground watch now removes itself after a fix/error/15-second timeout. Simulated GPS does not verify physical location or spoof resistance.
- Native profile displayed the actual local ledger balance (10 droplets) and entry history, with people-helped estimates explicitly unavailable. The map renders an approximate category-policy affected area, never a measured water extent.
- With the API stopped, force-stop/relaunch read persisted SQLite reports/routes and showed a cache timestamp/current conditions unknown. Current route warnings were suppressed. Android native fetch's Error-vs-TypeError difference was found and fixed with an explicit transport error type; authorization/schema/config failures never fall back to cache.

Screenshots, UI trees, emulator photos and local private state remain ignored. The walkthrough covers one emulator size; screen-reader, large-text, denied/approximate permissions, interrupted real S3 uploads and actual hazard images need the full device matrix.

## AWS resources: planned/synthesized, never used live

- Four encrypted retained/PITR DynamoDB tables: reports, events with H3 GSI, user-private saved routes, and immutable ledger with user GSI/primary-key guards. Canonical incidents do not have destructive TTL.
- One retained encrypted private S3 bucket with Block Public Access/TLS and 14-day raw evidence lifecycle; five-minute presigned upload grants.
- Cognito email user pool, secretless OAuth authorization-code client/PKCE, hosted domain; JWT authorizer on private routes.
- HTTP API with stage rate5/burst10; separate report/event/route/profile/analysis/health functions, bounded concurrency and one-week logs.
- SQS media queue and DLQ. Nova model ID/profile and InvokeModel ARNs are actual deployment inputs with no fabricated defaults. Backend Routes permission uses the documented empty-account provider ARN.
- No Amazon Location restricted map key, deployed resource names, model access, identity session, live budget or processing geography has been established.

## Decisions and remaining limitations

[DECISIONS.md](DECISIONS.md) records exact source conflicts/policies. The planned AWS architecture is retained. Documented prototype differences include simple typed DynamoDB keys instead of the illustrative prefixed key layout; upload-completion discriminator on the existing report endpoint; logical SUBMITTED transition within an atomic final confirmation; no public original-photo preview; no numeric Jal Pulse with sparse inputs; local continuation explicitly authorized by the user.

P0 remains incomplete. Important remaining work includes:

- SSO-dependent Phase0 actual Cognito/API/Dynamo/S3/SQS/Nova/Location Maps/Routes smoke and end-to-end integration, IAM denial/quotas/retention/residency/cost verification.
- Live SQS delivery/lease/model-cost proof, S3 signed-URL replay/version behavior, full contradictory-observation trust policy, transactionally strict concurrent saved-route cap, broader route-impact/usefulness awards and review-authorized reversals.
- H3 GSI consistency can conservatively leave concurrent incidents separate; the ledger user GSI can lag balances. Warm route caches do not persist across cold starts. Long routes can exceed the bounded urban candidate budget.
- Token refresh/revocation, user erasure, operational metrics/alarms, central copy keys, the full accessibility/physical performance matrix remain incomplete. Scoped freshness/provenance styling and basic accessible states are now implemented locally.
- Cloud seed/reset must be scoped against actual deployment before implementation; five live rehearsals, architecture freeze, deadline verification and submission video/write-up remain pending. The user selected MIT licensing during cutover cleanup.

At the original local milestone P1/P2 stayed deferred. The later Build It strategy authorizes only My Water, local sample Water Stress and clearly disclosed TankerOS/HeatSafe previews. Official alerts, video, push, alternative routes, background learning, real suppliers/payments/hardware/municipal/predictive systems remain deferred.

## Local demo / next integration boundary

Use Node24.21/pnpm10.34.6. Stop the local server before reset/seed:

```sh
pnpm install --frozen-lockfile
pnpm demo:reset
pnpm demo:seed
pnpm local:server
# Another terminal:
pnpm mobile:start
# First native build with SDK/JDK configured:
pnpm mobile:android
# Clean seeded API, generated fixtures explicitly disclosed:
pnpm smoke:local
```

Local mobile uses emulator host `10.0.2.2:8787`. Capture near the saved corridor, manually classify, explicitly confirm still-active/public-road consent, then inspect the incident/warning/provisional ledger. Different generated-fixture identities can exercise corroboration through the HTTP smoke; this is never real independent witness evidence.

No credentials are requested. When the existing local SSO profile becomes available, use profile `jalnet` in `ap-south-1`, configure actual resources/model/profile ARNs privately, deploy and execute Phase0 tests. Cloud Lambda already selects AWS providers; mobile must explicitly select `aws` and use actual Cognito/API/map configuration. Run the guarded live provider smoke with an actual captured JPEG, then separately prove deployed JWT API/queue/native Amazon assets and the full live loop. Record each actual response and retain IMPLEMENTED_UNVERIFIED/BLOCKED until its acceptance evidence exists.

Public repository: [farhanakhtar0x66/jalnet](https://github.com/farhanakhtar0x66/jalnet). Aryanxp1 write permission verified; shubhrgunjan write invitation pending. OpenAI Codex assistance is disclosed in README; the Expo starter license is retained and the user selected the MIT project license.

The earlier implementation commits were pushed to public main; remote SHA matched the local published SHA. CI verified that earlier milestone on 6bddc1c; the following P0 cutover changes include implementation and tests, with their own gate evidence.

## P0 AWS-cutover readiness changes

No live AWS access or final demo recording occurred; P1/P2 remain frozen. Added AWS_CUTOVER_CHECKLIST.md (full boundary trace + IAM/config/payload/failure/tests/commands), AWS_DEPLOYMENT_RUNBOOK.md (first STS command, private target/role hard stop, scoped bootstrap policy, synth/diff/deploy/outputs/mobile/key/service sequence), and DEMO_READINESS.md (local reset/seed, dedicated-account expectations, three-minute shot list, live/simulated split, architecture frame and honest fallbacks).

Server config now requires all live resource/model/Cognito values and rejects an absent region/model or inconsistent queue URL/ARN. Mobile AWS mode requires actual HTTPS deployed API, region/pool/client/domain and restricted key/resource/signing values; a copied local URL is rejected and invalid config renders a blocked screen. CDK has no empty model parameter default, constrains invocation ARN shape, emits operational outputs and dev tags. Review found CloudFormation's alphanumeric output IDs differ from underscored runtime names; normalization and a synthesized-artifact compatibility test fix that cutover bug.

Live commands require `--live --profile jalnet` and a mode-600 private config with real expected account/SSO role/model/profile ARNs. Live smoke CLI and SDK identity checks must both match before writes; deployment binds the CLI-approved account/region and explicit CDK profile. Credential/endpoint overrides are rejected. Model/profile account/allowlist relationships are validated without fabricating values. Read-only dependency checks precede bounded provider or full HTTP workflow stages; capture directory/JPEG/hash/freshness/EXIF/file size are checked before upload. No cloud deletion, fixture seeding, queue purge, automatic status upgrade or final recording path exists. Native Android Maps restriction protocol/rendering is explicitly B-08, not guessed or weakened. Broad default managed Lambda logging permissions were replaced with each function's own precreated log-group write grant and asserted in the synthesized IAM test.

Fixed missing authorizer context returning 503 instead of 401; raw JWT-shaped headers cannot supply identity. Added bounded Nova backoff, S3 content-length checks and upload/queue timeouts. Stale/future captures are rejected at draft/upload/confirmation boundaries, while accepted-report replay remains idempotent. A completion that committed before scheduling failure can be retried against the same report, with bounded mobile polling and worker lease protection. Already submitted drafts have an explicit local cleanup action.

Private draft/cache scope is obtained from the authenticated `/v1/me` response during PKCE; no locally decoded JWT chooses ownership. Token, expiry and account scope are stored as one SecureStore session value. Draft/cache requests bind that scope, and in-flight account changes cannot clear another account's draft. Legacy unscoped drafts remain privately retained and unassigned, not silently migrated into a live identity. Actual Cognito/account-switch acceptance remains blocked; this design is not a cryptographic AWS proof.

P0 UI cleanup includes recent/aging/source/expiry labels, dimmed aging markers, status-correct verification copy, client-side expiry filtering, stale route-check warning suppression/refresh, loading/empty/error states, explicit AI-draft uncertainty, accessible selected/category/severity states and minimum touch targets. The capture path now requires an explicitly chosen map pin or foreground fix. MIT added at the user's request; attribution obligations retained.

Review additionally found that two different access tokens might belong to one account. The live workflow now compares two authenticated `/v1/me` subjects before any application write. The shared Maps metadata guard rejects malformed/expired expiry and additional unapproved Android/web/Apple callers. Read-only dependency staging now includes one IAM-authenticated Maps style descriptor, retained privately and bounded to 2 MB; this is a future service probe, not native key acceptance or executed AWS evidence.

## Current cutover local gate — 2026-10-08

The commands below actually executed after the final guard fixes, using the pinned workspace Node/pnpm on PATH. No `--live` command, credential probe, deployment or AWS SDK/service invocation occurred.

| Command | Actual result / scope |
|---|---|
| `pnpm format:check` | PASS, 64 files; no formatting changes required. |
| `pnpm lint` | PASS, 64 files; no lint fixes required. |
| `pnpm typecheck` | PASS, root and mobile TypeScript. |
| `pnpm synth` | PASS, credential-free CloudFormation/assets; resource-scoped logging/IAM and output compatibility checked locally. |
| `pnpm test` | PASS: **10 suites, 71 tests; 27 added** to the 44-test local milestone. Includes malformed key expiry/caller restrictions and same-subject live-account guards. SDK mocks and local failure injection are not AWS evidence. |
| `pnpm mobile:bundle` | PASS: Android Hermes export, 916 modules, 2.8 MB bundle. No new native APK build was needed or run for these JavaScript-only mobile changes. |
| `pnpm demo:reset`, `pnpm demo:seed`, `pnpm local:server`, `pnpm smoke:local` | PASS after stopping the known JalNet server and reseeding. Actual localhost fixture upload → manual confirmation → fusion → warning → ledger 10/7 → replay. One initial reset was denied by the sandbox's localhost check; the smoke refused the retained old data. Retried reset/seed with localhost permission, then clean smoke passed. No cloud data changed. |
| `pnpm smoke:aws` without flags | Expected exit 2: `BLOCKED_AWAITING_SSO`, explicit `--live` required; no AWS calls. Not counted as a live smoke pass. |
| Source-plan comparison and `git diff --check` | PASS; original plan unchanged byte for byte, authored diff has no whitespace errors. |

The updated emulator flow also rendered the account-scoped local camera capture/private upload and manual-confirmation screen, explicit LOCAL/DEMO/no-model copy, fresh/source/expiry incident card, and suppression/refresh of an outdated route check. The capture remained private in NEEDS_CONFIRMATION during this walkthrough. The earlier restart/offline/GPS evidence above belongs to the original milestone; those tests are not claimed as a new live or physical-device run. No final demo was recorded. P0 remains incomplete, with AWS-dependent work IMPLEMENTED_UNVERIFIED/BLOCKED_AWAITING_SSO.

## Approved narrow Cedar integration — 2026-10-08

The isolated compatibility test ran **before application behavior changed**, in `/private/tmp/jalnet-cedar-compat` with its own exact dependency manifest. Official `@cedar-policy/cedar-wasm@4.13.0` using `@cedar-policy/cedar-wasm/nodejs` loaded in Node 24.21.0, darwin/arm64; actual schema/policy validation passed, owner returned allow and foreign principal deny with empty error diagnostics. Cold import 25.12 ms; first validation 81.69 ms. No AWS account/network service or credential provider was needed by policy evaluation. Root dependency installation followed this result; the lock pins version 4.13.0 and the previously inspected integrity.

The typed ReportAuthorizer is additive; all existing repository/evidence/analysis/route interfaces and cloud composition remain. Local server creation always initializes the real Cedar engine and validated repository-owned schema/policy before constructing the application/server. A failure prevents listening, with no fallback/disable switch. `ownedReport()` requires the corresponding action before access or side effects, obtains owner/resource from persisted Repository data and retains the existing owner comparison. Local authentication mapping is unchanged and cannot be supplied through request body/query. Cedar does not authenticate or decode JWTs.

Production policy: permit the User principal for ReadReport, PresignReport, CompleteUpload and ConfirmReport on Report when `resource.owner == principal`. All other decisions deny. Full policy, schema, path audit and test-only policies are in [CEDAR_AUTHORIZATION.md](CEDAR_AUTHORIZATION.md). Creation assigns an authenticated owner to a new draft; PUT redeems the grant issued after authorization; internal analysis remains a worker operation. Existing-resource HTTP access has no direct repository bypass. Completion's conflict return and all replay paths retain the corresponding action.

Forty added tests use the actual engine: **22 adapter/engine tests and 18 actual HTTP tests**. No engine is mocked. All four owner operations are allowed by the production policy and foreign operations denied. A real explicit forbid overrides the owner permit through HTTP for each action, returning 403 with byte-identical state, zero upload-grant/evidence-read/report-write/worker calls, no incident and no droplet award. Accepted replay is also gated after restart; a broad test permit still cannot bypass the original ownership check. Unknown/invalid input, invalid schema/policy, actual engine request failure, missing/forged auth and canonical 401/403/404 are covered.

A strictly validated test overflow permit causes **real Cedar allow plus one policy error**. JalNet rejects nonempty error diagnostics despite allow. Actual HTTP returns generic 503 without policy/overflow/owner data and with zero effects. Initialization/parser/engine exceptions and warnings also fail closed; no sensitive diagnostic is returned.

| Executed command | Actual result / scope |
|---|---|
| Isolated pinned install + `node probe.mjs` | PASS before application changes; actual engine schema validation / owner allow / foreign deny; no AWS calls. |
| `CI=true pnpm install --frozen-lockfile` | PASS after dependency addition. An offline attempt lacked cached tarballs and rebuilt node_modules; a test launched alongside it could not find Vitest. Dependencies were restored before the complete passing sequential rerun. No regression pass was inferred from that interrupted run. |
| `pnpm exec vitest run tests/cedar-authorization.test.ts tests/cedar-http.test.ts` | PASS: 40 tests across 2 dedicated suites. An initial new workflow test used the wrong existing route response field; corrected to `route.id` before final passes. |
| `pnpm format:check`, `pnpm lint` | PASS; source formatting/lint, also rechecked after final documentation. |
| `pnpm typecheck` | PASS, root and mobile TypeScript. |
| `pnpm synth` | PASS, existing AWS CloudFormation and all six function assets synthesize. No deploy; no Cedar loader/WASM integrated into Lambda. |
| `pnpm test` | PASS: **12 suites / 111 tests**. All 71 baseline tests preserved plus 40 new actual-engine tests. |
| `pnpm mobile:bundle` | PASS: Android Hermes export, 916 modules, 2.8 MB; mobile source unchanged. No new native APK/physical-phone test claimed. |
| `pnpm demo:reset`, `pnpm demo:seed`, `pnpm local:server`, `pnpm smoke:local` | PASS after confirming no localhost server was listening. Reset only ignored LOCAL/DEMO data; Cedar-required server completed original JPEG → manual confirmation → fusion → route warning → ledger 10/7 → replay smoke. |
| `pnpm cedar:check` | PASS: 1,000 real adapter decisions over all four actions, 500 allow/500 deny; runtime/version asserted and measured without AWS. |
| Git/source/upstream-notice review | Authored diff whitespace clean; supplied plan unchanged; all three copied upstream notice/license Git blob hashes match. No AWS/mobile/infrastructure file or deployment guard was rewritten. |

Dedicated adapter measurement from a fresh Node process after other checks: **138.398 ms initialization** (WASM load, policy/schema file reads and strict validation); **1.042 ms median / 2.016 ms p95** over 1,000 serial decisions. Includes input checking, schema-validated real-engine evaluation and diagnostics checking. No performance guarantee, memory benchmark or Lambda extrapolation is made. Initial parallel-run measurement was 137.334 ms / 1.331 ms median / 2.804 ms p95; the isolated final measurement above is the reported one.

Build It technical runtime proof now exists locally, with AWS origin and Apache-2.0 attribution retained separately from project MIT. Overall eligibility/submission evidence, organizer kickoff/original-work timing and final recording remain pending. Live AWS remains **BLOCKED_AWAITING_SSO**, profile `jalnet`, region `ap-south-1`; expected account/role, actual resources/model/Maps key, native Maps restrictions and physical phone remain pending. First eventual command: `aws sts get-caller-identity --profile jalnet`, with private account/role comparison and immediate stop on mismatch. Optional Cedar Lambda packaging requires explicit loader/WASM/policy assets, isolated artifact loading and actual deployed runtime proof; none has run. **No live AWS integration or P0 completion is claimed.**

Exact change inventory for this increment (including the accepted pre-approval assessment):

- Manifests: `package.json`, `pnpm-lock.yaml`.
- Policies: `policies/jalnet.cedarschema`, `policies/private-reports.cedar`.
- Runtime: `services/core/ports.ts`, `services/core/application.ts`, `services/providers/cedar-authorization.ts`, `services/local/server.ts`, `scripts/dev-server.ts`, `scripts/check-cedar.ts`.
- Tests: `tests/cedar-fixtures.ts`, `tests/cedar-authorization.test.ts`, `tests/cedar-http.test.ts`.
- Documentation: `README.md`, `docs/ARCHITECTURE.md`, `docs/AWS_OPEN_SOURCE_FEASIBILITY.md`, `docs/BLOCKERS.md`, `docs/CEDAR_AUTHORIZATION.md`, `docs/DECISIONS.md`, `docs/IMPLEMENTATION_REPORT.md`, `docs/IMPLEMENTATION_STATUS.md`.
- Upstream credits: `third-party/cedar/README.md`, `third-party/cedar/LICENSE`, `third-party/cedar/NOTICE`, `third-party/cedar/THIRD_PARTY_LICENSES.txt`.

## Frozen Cedar: physical local Build It preparation — 2026-10-08

A read-only audit preceded code changes: current status/report/blockers/demo/runbook, native camera/location/draft/API/config and saved-route screens, local transport/reset/seed/smoke, Cedar boundary/policies/tests and AWS deployment guards were inspected. No authorization security defect was found. Authorization remains frozen at **9422fc2**; no engine, interface, policy, owned-report path, authentication, test fixture, AWS provider, IAM/CDK/Cognito or cutover guard was changed. No framework/dependency/P1/P2 work was added.

The emulator-only upload host was a concrete phone blocker. An explicit `--android-usb` development-server option now issues loopback upload grants through adb reverse while retaining loopback-only listening and default 10.0.2.2 emulator transport. Add paired local/USB Metro shell presets, overriding only provider mode/API without rewriting an actual private cloud `.env`; the local demo can be intentionally restarted after a failed deployment. Smoke accepts only those two local origins. Both compositions still require real Cedar initialization.

The owner connected/unlocked/authorized a **Redmi Note 9 Pro Max**. Executed device queries reported Android16/API36, ARM64 + 32-bit ARM, 1080×2400. The existing debug APK's inspected minSdk24/targetSdk36 and four ABIs are artifact evidence; compatibility on older/other phones was not tested. `adb -d install -r` succeeded, both API/Metro ports were reversed, and the `jalnet://expo-development-client/` link launched the native build. No phone data was cleared or app uninstalled; no new native build was needed/run.

The owner aimed the real camera at a harmless staged test object and operated capture/upload/manual confirmation. The actual locally uploaded JPEG decoded to **960×1280, 57,357 bytes, no EXIF marker**; report media SHA-256 was persisted/validated. NEEDS_CONFIRMATION with LOCAL_DEMO provenance was observed before submission. The owner confirmed the disclosed synthetic-pin Waterlogging test: persisted report ACCEPTED, event UNVERIFIED, one REPORT_SUBMITTED ledger entry +2. Phone map displayed the seeded corridor warning; profile displayed two provisional droplets and the ledger. This does not establish a real water hazard, field GPS accuracy, second citizen, S3/Nova or Amazon route result. Private images/state/screenshots remain ignored locally and are not committed.

Physical walkthrough exposed two further usability gaps. Countries-only demo tiles provided no streets at reporting zoom; change only the LOCAL/DEMO style to public OpenFreeMap Liberty, documented for the existing MapLibre Native client. Actual phone street rendering passed; source attribution/recorded credits and external-tile privacy are documented. The AWS Monochrome/key branch remains unchanged. A stale route check lacked a refresh action inside its sheet; add Refresh route reports via existing query invalidation and give the route placeholder an explicit readable color. The phone refresh check produced a fresh result, with no report/route mutation. An empty intersection result continues to say it does not establish safety. No warning freshness/provider/domain rule was relaxed.

| Executed command/check | Actual result |
|---|---|
| `pnpm format:check`, `pnpm lint` | PASS after final Home formatting; 70 source/config files. The new refresh expression initially needed formatter line breaks, corrected before the final passes. |
| `pnpm typecheck` | PASS, root and mobile, after focused UI fixes. |
| `pnpm synth` | PASS, existing six AWS Lambda assets/templates; no credentials/deploy/service calls. |
| `pnpm test` | PASS after focused UI fixes: **12 suites / 111 tests**, unchanged count; 71 baseline +40 Cedar retained, zero added. |
| `pnpm mobile:bundle` | PASS after focused UI fixes: Android Hermes export, 916 modules, 2.8 MB. Export is not a standalone APK or physical acceptance matrix. |
| `pnpm demo:reset`, `pnpm demo:seed`, `pnpm local:server:usb`, `pnpm smoke:local` | PASS for clean USB-origin fixtures before physical capture. Complete real local HTTP upload/manual confirmation/fusion/warning/10–7 ledger/replay. No AWS or native-camera inference from fixtures. |
| `pnpm demo:reset`, `pnpm demo:seed`, `pnpm local:server`, `pnpm smoke:local` | PASS for preserved emulator-origin fixture flow. Then fresh USB seed/server prepared for the physical capture. Reset affected only synthetic ignored local fixtures before the owner's capture; subsequent real camera evidence/state was preserved. |
| `pnpm mobile:start:usb` | PASS, explicit local provider/API, loopback Metro8081; real phone loaded Android development bundle (1,034 dev modules). No AWS environment file overwritten. |
| `pnpm exec vitest run tests/cedar-authorization.test.ts tests/cedar-http.test.ts --reporter verbose` | PASS, unchanged **40 real-engine tests**. Actual HTTP owner/foreign/forbid proof across all four actions and zero-effects assertions retained. Sanitized test output rehearsed; no token/private URL printed. |
| `pnpm cedar:check` | PASS, pinned 4.13.0 / Node24.21.0, 1,000 real decisions, 500 allow/500 deny. This run measured initialization 32.597 ms, median 0.289 ms / p95 0.456 ms; runs varied with process/load, no guarantee or Lambda extrapolation. |
| `pnpm smoke:aws` (no flags) | Expected nonzero exit2, BLOCKED_AWAITING_SSO / explicit `--live` required, no AWS calls. This is a guard proof, not a live smoke pass. |
| APK inspection, scoped adb install/reverse/launch and foreground-guarded UI inspection | Physical local evidence as described above; permissions/capture operated by owner. Guarded checks skipped when another app/system window was foreground; no UI action was taken there. |

The separate [Build It handoff](BUILD_IT_DEVICE_DEMO.md) contains exact USB/emulator/reset/seed setup, expected demo data, actual versus simulated boundaries, frozen Cedar proof, planned **2:45** script/shot list, short submission write-up, architecture frame, failure fallback and owner participation. Existing live AWS demo instructions remain separately blocked. The development client needs Metro/USB and public map internet; no offline standalone submission app is claimed. Timings are planned, not a completed measured video.

Remaining owner/device work: camera denial/settings/retry and varied capture sizes, actual/approximate/denied foreground location with chosen-pin fallback, restart/private draft/offline recovery, attribution/recorded credits, responsiveness/accessibility, five clean timed physical rehearsals, final narration/recording and team submission/eligibility review. No final demo was recorded. AWS remains **BLOCKED_AWAITING_SSO** with unknown approved account/role/resources/model/key and native restricted Maps acceptance. Optional Cedar Lambda packaging/runtime remains unverified. First eventual command: `aws sts get-caller-identity --profile jalnet`; compare account/role privately and stop on mismatch. **P0 is not complete.**

Exact changed files in this focused increment:

- Runtime/development: `package.json`, `scripts/dev-server.ts`, `scripts/smoke-local.ts`, `apps/mobile/src/Home.tsx`.
- Documentation: `README.md`, `docs/BUILD_IT_DEVICE_DEMO.md`, `docs/DEMO_READINESS.md`, `docs/AWS_DEPLOYMENT_RUNBOOK.md`, `docs/PRIVACY.md`, `docs/DECISIONS.md`, `docs/BLOCKERS.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/IMPLEMENTATION_REPORT.md`.


## Build It feature completion and Aryan handoff — 2026-10-08

The owner's new strategy explicitly authorizes these narrow additions after the accepted core milestone, while freezing Cedar at **9422fc2**. A read-only source/spec/status/device-demo audit and the prioritized [feature matrix](FEATURE_STATUS.md) preceded application edits. The [UI handoff](ARYAN_UI_HANDOFF.md) established additive contracts before implementation. Engineering branch: `codex/build-it-features`; first reviewed increment **cffdd2a**. No history/timestamp rewrite, new framework, database, dependency, authentication system or AWS credential/deployment work occurred.

My Water is executable: validated capacity/percentage/daily-use inputs calculate volume and approximate depletion, update immediately on valid edits, simulate one hypothetical day, and persist versioned account-scoped state in a new table inside the existing `jalnet-cache.db`. Inputs/forecasts show USER-ENTERED, DEMO FIXTURE or SIMULATED provenance. Zero consumption, empty tank, partial/invalid input, failed/corrupt storage, ordered saves, retry and explicit tank-only reset are handled. It has no meter, real-time refill/consumption feed or guaranteed forecast. Reset gives 1,500 L / 60% / 300 L per day → 900 L / 72 hours; one simulated day → 600 L / 48 hours.

Water Stress is an executable **DEMO INDICATOR** for a fictional Delhi area. Six editable pressures use plan §21.2 weights .25/.15/.15/.20/.15/.10. It exposes each contribution, renormalizes available weights and suppresses a headline below 60% weighted coverage. The sample produces 59.5 points rounded to 60/HIGH; omitting supply and groundwater gives 55% coverage and no headline. Weights/bands are prototype choices, not calibrated official standards or scientific confidence. Edits are ephemeral; no external feed, personal-tank coupling, heatmap, safety or incident/reward change exists. TankerOS is a static DEMO supplier/price/volume preview, **not working reservation/discovery against enrolled suppliers**; it has no booking/payment/contact action. HeatSafe and future intelligence are PLANNED cards only. Aryan owns the final visual redesign.

### Actual checks and counts

| Executed command | Actual result / scope |
|---|---|
| `pnpm format:check`, `pnpm lint` | PASS, 84 source/config files after final code formatting. |
| `pnpm typecheck` | PASS, root and mobile. The final plain-decimal formatter initially failed strict unchecked-index typing; corrected before this pass. |
| `pnpm synth` | PASS, six existing Lambda assets/template; no deployment or AWS calls. |
| `pnpm test` | **PASS: 15 suites / 165 tests.** All 111 existing tests retained, including 40 unchanged real Cedar tests; **54 added** (27 tank/input/simulation, 11 persistence/recovery, 16 Stress/demo-contract). One sandboxed rerun denied localhost listeners; its 17 HTTP failures were environmental, and the complete rerun with localhost access passed. |
| `pnpm mobile:bundle` | PASS, Android Hermes export, 927 modules / 2.8 MB. No new native APK build or standalone/offline acceptance claim. |
| `pnpm smoke:local --isolated` | PASS, actual real-Cedar HTTP JPEG upload → manual confirmation → fusion → route warning → Alice 10/Bob 7 ledger → replay, on a bounded temporary server/state. Active phone `.local-data`/API/drafts were not reset. Not native-camera or AWS proof. |
| `pnpm cedar:check` | PASS, frozen Cedar 4.13.0 / Node 24.21.0, 1,000 actual decisions (500 allow / 500 deny). This run: 37.330 ms initialization, 0.309 ms median / 1.035 ms p95; local process measurements, no Lambda extrapolation. |
| Frozen-source and authored-diff review | No changes since 9422fc2 to services, policies, infrastructure, Cedar test files, dependency lock, cutover/smoke/configure-mobile guards or original shared API contracts. Home changes are an additive entry/sheet and truthful local banner; cache change only exports its existing database promise. Original source plan/history retained. |

The first My Water increment separately passed its complete gate at 148 tests / 14 suites; the Stress increment increased it to 164, and a native numeric-input regression test brought the final count to **165**. No Cedar test was modified or replaced. The isolated smoke mode preserves the original default clean-seed smoke and creates/cleans only its own temporary loopback fixture.

### Native emulator evidence and limits

The existing Pixel7/API37.1 preview emulator and installed development client ran on an isolated temporary API8837/Metro8082, separate from the owner's USB API8787/Metro8081. Actual input 75% gave 1,125 L / 90 hours; simulation gave 825 L / 55% / 66 hours / day 1; idle force-stop/reopen restored these values from native SQLite. The tank-only reset confirmation restored 900 L / 60% / 72 hours / day 0 and saved it. Stress actually rendered 60/HIGH/100% and 55%-coverage/no-headline after two factors were cleared. Vision displayed the required DEMO/PLANNED copy. These are emulator results, **not Redmi physical acceptance**.

Native inspection found overlong binary percentage tails in editable simulated inputs. Derived simulation percentages now round to six decimals (at the allowed maximum capacity this quantizes volume by at most 0.01 L), and plain-decimal formatting avoids high-precision Android locale artifacts/scientific notation. Final actual UI retest after reset/edit produced clean 55% and 35% inputs, with 825 L / 66 hours and 525 L / 42 hours. Regression coverage includes tiny valid decimals and repeated simulation. New feature database initialization is lazy/awaited so failures reach the screen recovery path, rather than an eager feature promise rejection.

A camera reopen on the separate emulator found a retained private draft referencing its older API, producing Report not found on the isolated screenshot server. The draft was **preserved**, and the panel was closed. No fresh native-camera pass is claimed for this increment. The earlier accepted Redmi capture remains historical evidence; current original-flow HTTP tests/smoke pass. New-feature Redmi review and a fresh full physical rehearsal are owner tasks.

Seven visually inspected synthetic screenshots are in [docs/ui](ui/README.md): home, tank fixture, entered level, final simulated level, Stress full/limited inputs and vision. No private phone scene, real coordinates/account/customer/supplier data or authentication secret was committed. Longer forms/actions require scrolling; keyboard/system-inset/large-font/TalkBack and final visual review remain for Aryan/owner.

### Acceptance boundaries and handoff

The [device demo](BUILD_IT_DEVICE_DEMO.md), [five rehearsals](FIVE_REHEARSALS.md) and [submission assets](BUILD_IT_SUBMISSION_ASSETS.md) now include exact tank/Stress fixture restoration, honest feature disclosures and a planned **2:50** shot list. Five timed physical runs, final video and submission have **not** occurred; recording/submission still require owner approval. The owner reported reviewing phone permissions, which is recorded as owner report rather than invented detailed case results.

Official [Build It overview](https://www.wemakedevs.org/aws/env) supports local AWS open-source use and explicitly lists Cedar without an AWS account. SSO is outside the primary-submission critical path. Overall eligibility, kickoff/original-work timing, registration/student/participation and submission requirements remain separate team/organizer review. Preserve genuine Git history and attribution.

Existing AWS architecture stays intact and **BLOCKED_AWAITING_SSO** (`jalnet`, `ap-south-1`), with unknown approved account/role/resources/model/key and native Maps enforcement. Optional Cedar Lambda packaging/runtime is still unverified. No live AWS integration or original cloud P0 completion is claimed.

Delivered source/test files across the two feature increments:

- `packages/contracts/package.json`, `packages/contracts/src/water.ts`; `packages/domain/src/water.ts`, `packages/domain/src/water-stress.ts`.
- `apps/mobile/src/Home.tsx`, `apps/mobile/src/cache.ts`; `apps/mobile/src/features/{MyWater,WaterStress,VisionPreview,WaterHub}.tsx`, `{persistence,storage,useLocalFeature,demo-data}.ts`.
- `scripts/smoke-local.ts`; `tests/water.test.ts`, `tests/water-persistence.test.ts`, `tests/water-stress.test.ts`.
- `README.md`, `TODO.md`; feature/status/report/decision/blocker/privacy docs, Aryan handoff, device/submission/physical/rehearsal docs and seven public synthetic UI references.

After the reviewed engineering commit, Aryan may change presentation in `Home.tsx`, `ReportFlow.tsx`, `Button.tsx`, `App.tsx` and `features/{MyWater,WaterStress,VisionPreview,WaterHub}.tsx`, preserving state/action/contract semantics and coordinating Home navigation. Storage/models/contracts/auth/API/Cedar/AWS/tests are engineering boundaries. Exact component/state inventory and visual acceptance criteria are in the handoff.

## Complete mobile UI redesign — 2026-10-09

The owner explicitly superseded the Aryan visual assignment because Aryan is temporarily unavailable and requested implementation before final physical acceptance. The dedicated branch **ui/jalnet-redesign** begins at **2dbbc4f** on the accepted feature branch, retaining My Water, Stress, previews and all existing core functions. It does not begin from older main, discard private drafts, weaken authorization or add product permissions.

Implemented presentation covers the map-first home/navigation, layers/event detail, camera/private draft/manual confirmation, saved routes, profile/sign-in, configuration error, My Water, Water Stress and TankerOS/HeatSafe previews. Shared semantic palettes, reusable cards/fields/status/error/loading components and `lucide-react-native@1.53.0` with `react-native-svg@15.15.4` make the screens coherent. Full ISC/Feather MIT notices and imported OpenFreeMap/Dark Matter notices are retained in `third-party`. Exact source/component inventory and licenses are in [UI_REDESIGN_REPORT.md](UI_REDESIGN_REPORT.md).

Appearance supports exactly **System (default), Light and Dark**. System follows the Android/React Native color scheme; explicit choices override it immediately. A device-wide `jalnet.appearance.v1` key is stored through the existing Expo SQLite key-value capability in `jalnet-cache.db`, with ordered writes, redacted failures and retry. Child rendering waits for hydration behind the native splash. Theme changes update context without mode-based component keys; native restart/no-flash/input-retention evidence is recorded only when actually observed. Android system chrome is styled where supported.

Native dark-map review identified low-contrast upstream labels. The LOCAL-only bundled OpenFreeMap Dark descriptor uses centralized label/background/halo colors while retaining tile/vector/sprite/glyph URLs, roads/layout/filter/geometry and the existing MapLibre renderer. Source attribution is supplemented with Dark Matter source/design credits and JalNet's color adaptation. Light uses Positron. The Amazon Location URL, restricted-key/configuration boundary, providers and deployment guards remain unchanged. This local descriptor is not an offline basemap or AWS map proof.

Read-only comparison against **2dbbc4f** found no changes to water/Stress domain formulas, contracts, `useLocalFeature`, feature persistence/storage or sample supplier fixtures. Existing validated values drive the tank gauge/litres/hours/days; validation, last-valid saved retention, local persistence/retry, simulation, day count and confirmed tank-only reset remain. Stress still excludes missing factors, renormalizes weights, suppresses the headline below 60% coverage, treats zero as present and resets ephemeral edits on reopen. TankerOS has no booking/contact/payment action; HeatSafe remains PLANNED. Cedar stays frozen at **9422fc2**, including all 40 actual-engine tests.

Native retesting found a mobile coordinate-boundary defect after cold draft recovery: stored `draft.location` also contains source/accuracy metadata, and passing that object directly into the UI pin/confirmation request violated the existing strict coordinate schema. `ReportFlow.tsx` now restores the pin with explicit `{ lat, lon }` and keeps accuracy separate; confirmation likewise sends explicit latitude/longitude only. The preserved draft then completed actual native-to-local-HTTP confirmation successfully. No API/schema, storage, backend or Cedar change was made. The actual native HTTP retest and full eight-command regression gate verify this bounded integration fix; no new test was added.

Final layout polish stacks each WaterHub tab's icon/label on small or enlarged-text layouts, places Home controls horizontally above the measured warning height and lets shared button/header text grow and wrap. Actual native inspection passed at 840×1800 pixels, density 420 and font scale 1.3: Dark Home controls cleared the warning, Light Water tabs remained fully visible and numeric Gboard focus/error/footer actions were reachable. Full TalkBack and the physical-device matrix remain pending.

### Completed scoped emulator inspection

The owned API37 emulator supplied actual runtime observations; synthetic screenshots in the [36-capture pack](ui/redesign/README.md) span multiple iterations. Earlier captures are not substituted for final-source retests. The [UI report](UI_REDESIGN_REPORT.md) records exact screenshots and remaining cases.

| Native observation | Actual result / scope |
| --- | --- |
| Appearance | Exactly System/Light/Dark choices, explicit Light/Dark overrides, System following OS Dark→Light, System cold restart and explicit Light/Dark cold restarts PASS. No phone/OEM or complete no-flash claim follows from these observations. |
| Maps, warnings and contribution profile | Both maps/warning/event details rendered. Panned viewport, chosen pin and route retained across appearance changes. Profile in both modes showed 4 droplets and +2/+2 ledger entries from disclosed local reports. |
| Attribution | Both new 48 dp controls opened native popups PASS; only OpenFreeMap/OpenMapTiles/OpenStreetMap data-source credits were visibly confirmed. Dark Matter source/design and JalNet adaptation notices are linked in repository/recorded credits, not claimed as visible in the popup. |
| Water and preview basics | Basic water/supplier views and Stress default 60/HIGH/100% inspected in both modes. HeatSafe PLANNED inspected in Light and Dark; no implemented heat data/scoring/routing implied. |
| My Water reset, simulation and final restart | Reset 900 L/60%/~72h and one simulation 600 L/40%/~48h observed. Final Light cold restart restored 600 L/40%/~48h/day 1 with capacity 1,500 L labeled USER ENTERED. Earlier 75%/1,125 L/~90h APK-update/restart retention remains prior evidence. |
| Invalid My Water edit | Capacity 0 suppressed calculation/disabled simulation; invalid text survived theme change. A valid intermediate capacity 1 had already saved during per-character editing. Invalid 0 was not saved, but the earlier 600 L tank did not stay unchanged throughout that edit sequence. |
| Private draft and keyboard | Preserved JPEG restored and confirmed through native local HTTP in Dark, followed by actual warning/ledger PASS. Dark note focus visible above Gboard; consent controls 52×48 dp. Numeric focus/error/footer reached in the scoped compact/font-1.3 check. |
| Explicitly pending | Redesigned Stress limited/missing/invalid and empty-tank/zero-use states not retaken. Full TalkBack, redesigned Redmi, target performance, offline and full permission/recovery matrix PENDING. Five timed physical rehearsals/final recording PENDING. |

### Executed final current-source gate after all mobile fixes

| Actual command or check | Final current-source result |
| --- | --- |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | PASS, including mobile types |
| `pnpm synth` | PASS; no deployment/live account access |
| `pnpm test` | **PASS: 181 tests / 16 suites** — 165 baseline retained, 16 new theme tests |
| `pnpm mobile:bundle` | PASS, Android JavaScript export; native rendering is separate evidence |
| `pnpm cedar:check` | PASS, 1,000 real decisions: 500 allow/500 deny; latest local run initialized in 33.116 ms, median 0.294 ms, p95 0.439 ms |
| `pnpm smoke:local --isolated` | PASS, existing Cedar-enabled upload/manual confirmation/incident/route-warning/ledger/replay flow in isolated local fixture state |
| Native debug APK build and install on API37 emulator | PASS; actual rebuilt binary, not JavaScript export alone |

The final eight-command gate was rerun after all mobile source modifications, including the coordinate, compact-layout and shared text-flex fixes, and passed; the test log starts at 13:22:15. Results are recorded in the ignored `.tools/ui-redesign/final-*.log` files, including `final-smoke-local.log` for the explicitly isolated smoke. The earlier integrated gate also passed 181 tests / 16 suites and measured Cedar initialization 64.003 ms, median 0.817 ms and p95 1.095 ms. The preceding native-polish gate measured 63.953 ms initialization, 0.629 ms median and 0.879 ms p95; the coordinate-fix rerun measured 32.693 ms initialization, 0.319 ms median and 0.454 ms p95; the compact-layout rerun measured 34.782 ms initialization, 0.325 ms median and 0.602 ms p95. These earlier measurements remain historical evidence. The first integrated full test attempt hit sandbox EPERM for localhost listeners, then an authorized rerun passed the same suite. The 16 added tests cover exact appearance options/resolution, device-wide ordered persistence through a storage port, recovery/redaction/other-data preservation, chrome resolution and semantic palette contrast. They do not substitute for native SQLite restart or full accessibility testing. Local Cedar measurements are not Android/Lambda benchmarks.

**Final current-source validation is PASS for all eight local checks** after all mobile fixes. Scoped emulator inspection is complete, with the explicitly pending cases separated in the [UI report](UI_REDESIGN_REPORT.md) and [after-design screenshot pack](ui/redesign/README.md). No unspecified native, physical, cloud or accessibility case is assumed passed.

The owner previously confirmed 900 L/60%/~72 h after reset and 600 L/40%/~48 h after simulation on the previous UI. The requested close/reopen persistence observation was interrupted; it remains unverified. The phone then died, so redesigned Redmi camera/location/offline/accessibility/attribution/theme checks wait for charging and owner participation. Five timed rehearsals, final recording/submission approval and eligibility review remain separate. Live AWS remains **BLOCKED_AWAITING_SSO**, intended `jalnet`/`ap-south-1`; no cloud integration, optional Cedar Lambda packaging or P0 completion is claimed.

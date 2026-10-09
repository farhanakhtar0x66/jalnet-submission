# JalNet TODO

This checklist tracks work order. The [implementation status matrix](docs/IMPLEMENTATION_STATUS.md) is the detailed verification record, and the [implementation plan](JalNet_Implementation_Plan.md) remains the product specification. Checked implementation items describe authored code, not live acceptance. AWS-dependent proof remains BLOCKED_AWAITING_SSO.

## Planning and repository preparation

- [x] Read the complete specification, including §§97–100.
- [x] Audit the initial workspace and generic tooling.
- [x] Record P0 requirements, dependencies, decisions and blockers.
- [x] Create a planning README and phased backlog.
- [x] Preserve the supplied implementation plan in the repository.
- [x] Publish the planning commit to the owner's private GitHub `jalnet` repository and verify its contents.
- [x] Make the repository public following the owner's subsequent explicit authorization.
- [x] Send write-access collaborator invitations to `Aryanxp1` and `shubhrgunjan` and verify their permissions.
- [ ] shubhrgunjan accepts the remaining invitation (Aryanxp1 write access is active).

## Authorization and readiness

- [x] Receive explicit START authorizing application implementation.
- [ ] Confirm organizer check-in/eligibility and exact submission deadline.
- [ ] AWS BLOCKED_AWAITING_SSO: intended profile jalnet / ap-south-1; live account, deployment permissions and cost checks pending.
- [x] User approved emulator testing now; physical Android demo phone remains deferred.
- [x] Configure JDK17 and Android36; native Gradle build/install and emulator runtime passed.
- [x] Pin Node24/pnpm10/Expo57/RN0.86/MapLibre11; typecheck, JS bundle and native MapLibre emulator runtime pass.
- [x] User selected MIT; project license added and existing Expo/dependency/map attribution requirements retained.

## P0 cutover readiness — scope frozen

- [x] Trace every live boundary/config/resource/IAM/payload/error/test/command in AWS_CUTOVER_CHECKLIST.md.
- [x] Require actual model/resource/Cognito/mobile values; remove empty-model deployment and implicit AWS-region fallback.
- [x] Guard live deployment/smoke with explicit live flag, jalnet SSO profile and private expected account/role; refuse wrong targets.
- [x] Design bounded read-only dependency/provider/HTTP workflow stages, controlled capture/hash checks and private receipts; no cloud deletion.
- [x] Add local failure injections and CloudFormation-output compatibility coverage; no live AWS inference.
- [x] Prepare guarded deployment runbook and reset/seed/three-minute shot list/data/fallback/architecture frame; no final recording.
- [x] Complete scoped freshness/provenance/loading/error/copy/accessibility/recovery cleanup and account-scoped private storage.
- [ ] Execute real AWS gates after SSO; confirm native Android key restriction protocol and rendering enforcement.
- [ ] Complete physical phone acceptance and final live demo gate. P1/P2 remain frozen.

## Phase 0 — Prove risky integrations

- [x] Create only the minimum application workspace/contracts needed for the proof. (Local implementation; acceptance tracked in matrix.)
- [ ] Install and start an Expo development build on the target phone.
- [ ] Render real Amazon Location maps through MapLibre, including all assets and attribution.
- [ ] Test foreground location and chosen-area fallback after permission denial.
- [ ] Prove Cognito-protected API Gateway/Lambda access and owner isolation.
- [ ] Complete a real DynamoDB write/read.
- [ ] Upload a real phone image privately to S3 and validate the actual object.
- [ ] Invoke an available configurable Nova model/profile with an image and validate its output.
- [ ] Calculate one real Amazon Location route through the backend.
- [ ] Record each command/response/device result; keep failures visible at their boundary.

## Phase 1 — Application foundation

- [x] Initialize the application package workspace and shared strict Zod contracts. (Local implementation; acceptance tracked in matrix.)
- [x] Establish pure domain/geo functions and provider/repository interfaces. (Local implementation; acceptance tracked in matrix.)
- [x] Create CDK TypeScript core infrastructure with least-privilege roles. (Local implementation; acceptance tracked in matrix.)
- [x] Build map-first navigation, center capture action and working layer controls. (Local implementation; acceptance tracked in matrix.)
- [x] Separate TanStack Query server state from Zustand UI state. (Local implementation; acceptance tracked in matrix.)
- [x] Establish configuration examples, canonical errors and redacted observability. (Local implementation; acceptance tracked in matrix.)

## Phase 2 — Events

- [x] Persist reports/events with distinct time, confidence, impact and severity semantics.
- [x] Implement bounded H3 viewport lookup with exact filtering and result caps.
- [x] Render clustered backend incidents with readable detail/provenance.
- [x] Create disclosed deterministic demo seeds and scoped reset behavior. (Local implementation; acceptance tracked in matrix.)

## Phase 3 — Reporting

- [x] Build real JPEG capture, compression, accuracy disclosure and editable incident pin.
- [x] Persist local drafts and implement owned short-lived upload requests.
- [x] Resolve upload-complete request semantics before implementing the analysis trigger. (Local implementation; acceptance tracked in matrix.)
- [x] Validate uploaded media and run async Nova assessment with strict schema checks.
- [x] Limit retry to one and preserve manual classification when analysis fails.
- [x] Require editable human confirmation before publication; guard every state transition.

## Phase 4 — Fusion and trust

- [x] Implement configurable neighboring-cell candidates and conservative fusion.
- [x] Define numeric severity/unknown mapping and robust aggregation.
- [x] Separate model confidence from system evidence and verification.
- [x] Support basic independent confirmation without self-verification.
- [ ] Preserve contradictory observations, monitoring, resolution and expired history.
- [x] Make submission idempotent and refresh events, route risks and profile caches.

## Phase 5 — Saved routes and warnings

- [x] Build manual origin/destination selection and backend route preview.
- [x] Persist private route geometry, corridor, name and alert preference.
- [x] Implement H3 corridor candidates plus exact event-to-segment intersection.
- [x] Show local saved-route geometry and actual warning with uncertainty. Approximate category-policy area authored; AWS proof pending.
- [x] Delete route geometry and cancel route warnings when the user removes it.
- [x] Keep Alternative unavailable until a functioning P1 flow exists.

## Phase 6 — Droplets

- [x] Define relevant/provisional versus verified/usefulness eligibility and caps.
- [x] Implement immutable ledger entries with an atomic idempotency guard. (Local implementation; acceptance tracked in matrix.)
- [x] Test local replay/concurrency, copied-media farming, self-confirmation and immutable reversal primitive. Review-authorized reversal workflow pending.
- [x] Implement ledger-derived profile and contribution history; no invented impact metrics. Route-impact reward/count remains incomplete.

## Phase 7 — Reliability and P0 acceptance

- [x] Exercise native local draft recovery and dated offline cache; broader failure/device matrix pending.
- [ ] Measure target-device launch/map/camera performance and viewport API/payload budgets.
- [ ] Check accessibility, English copy keys, uncertainty and provenance.
- [x] Run formatter, lint, typecheck, unit/contract/integration tests, CDK synth and relevant builds.
- [x] Configure and execute GitHub CI without deployment credentials: frozen install/format/lint/types/synth/44 tests/Android bundle passed.
- [ ] Complete the physical-device permission/network/AI/duplicate/layers/route test matrix.
- [ ] Reset and execute the real critical path five consecutive times.
- [ ] Compare every P0 requirement with actual evidence before declaring completion.
- [ ] Freeze architecture only after §100 criteria pass.

## Submission

- [x] Update README with executed development/deployment/test/demo commands and real limitations.
- [x] Add architecture, privacy, sources and demo-script documentation.
- [x] Review tracked files and recordings for secrets/private data.
- [x] Disclose seeded/simulated behavior and all AI coding tools used.
- [ ] Record a video under three minutes that shows the core loop and AWS.
- [ ] Test public repository and YouTube access in a signed-out browser.
- [x] Obtain explicit authorization and change the repository from private to public.
- [ ] Submit the write-up before the verified official deadline and retain the receipt.

## Only after P0 acceptance

The later Build It strategy authorizes a narrow exception on `codex/build-it-features`: local My Water arithmetic/simulation/persistence, sample Water Stress calculation and static TankerOS/HeatSafe previews. Cedar/core/cloud remain preserved. See the current FEATURE_STATUS.md and ARYAN_UI_HANDOFF.md; this does not complete the broader stretch items below.

- [ ] Evaluate Water Stress with provenance, coverage and missing-weight normalization tests.
- [ ] Evaluate clearly labeled simulated My Water with forecast/baseline/anomaly tests.
- [ ] Evaluate labeled demo tanker quotes/reservations without payments.
- [ ] Consider official alerts, video, push and route alternatives if stable.
- [ ] Keep background learning, HeatSafe, advanced DrainScan, dispatch optimization, hardware, municipal integrations and predictive models outside the core critical path.

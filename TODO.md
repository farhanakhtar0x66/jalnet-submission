# JalNet roadmap

Updated 2026-10-10. This is a current backlog, not a replacement for [historical engineering evidence](docs/FINAL_ENGINEERING_REPORT.md), [migration provenance](MIGRATION.md) or the [original specification](JalNet_Implementation_Plan.md). Prior verified baseline: **212 tests / 23 suites**. The standalone preview and local Node application have separate acceptance gates.

Each open item states priority/status, dependencies where applicable and its completion criterion.

## P0 — Standalone release blockers

- [ ] **P0 · IN PROGRESS:** Build a bundled, signed ARM64 preview under `org.jalnet.preview` with explicit version/versionCode. Depends on preview composition and durable private signing custody. Done when inspected release metadata/certificate/ABI/Hermes match the declared artifact, with debuggability off and no Metro launcher.
- [ ] **P0 · IN PROGRESS:** Enforce preview capabilities without localhost/API calls. Done when enabled map/calculator/theme actions work and camera/location/report/routes/warning/ledger controls clearly state unavailable, without fabricated success or phone-Cedar claims.
- [ ] **P0 · PENDING:** Test the exact signed APK with no Metro or port forwarding. Depends on the release artifact. Done when install/icon launch/cold restart, appearance, tank persistence, Stress, navigation and documented online/offline map behavior pass on ARM64.
- [ ] **P0 · PENDING:** Run all existing gates plus meaningful preview tests and same-source CI. Done when the 212-test baseline remains passing, actual new totals are recorded and the tested source matches the artifact.
- [ ] **P0 · PENDING:** Publish a verified GitHub prerelease with APK/checksum/notes after the gates pass. Depends on approved source/publication requirements. Done when the downloaded asset matches the inspected local SHA-256 and the README links the real release.

## P1 — Bugs and reliability

- [ ] **P1 · PENDING PHYSICAL:** Test the preview on Redmi and friends' compatible devices. Depends on verified distributable APK. Done when actual model/OS/install/theme/map/calculator/persistence results and failures are recorded; emulator evidence is not substituted.
- [ ] **P1 · PENDING PHYSICAL:** Complete local-development camera deny/recover, foreground location, interrupted upload, keyboard, enlarged text and TalkBack cases. Done when each remaining [physical case](docs/PHYSICAL_ACCEPTANCE.md) has actual evidence and failures are fixed/retested.
- [ ] **P1 · CONFIRMED LIMIT:** Prevent an older distinct upload grant overwriting a completed newer JPEG. Current SHA-256 check blocks publication/awards but requires retake. Done when an actual HTTP regression proves version isolation and denied effects, preserving ownership/Cedar boundaries.
- [ ] **P1 · CONFIRMED LIMIT:** Handle concurrent first-report fusion without duplicate nearby incidents. Done when overlapping real-repository confirmations satisfy the intended fusion invariant without granting false corroboration bonuses.
- [ ] **P1 · PENDING:** Measure startup/map/calculator responsiveness on target hardware and test rotation/font/keyboard edge layouts. Done when budgets and actual measurements are documented, with no untested performance claims.
- [ ] **P1 · PENDING:** Evaluate native persistence-failure recovery. Existing actual-hook tests use simulated storage ports. Done when a controlled native failure preserves prior tank/draft data and retries recover.

## P2 — Product improvements

- [ ] **P2 · PLANNED:** Improve citizen review/freshness/source explanations from real tester feedback. Done when confirmed usability defects have focused fixes and acceptance evidence.
- [ ] **P2 · PLANNED:** Design an authenticated HTTPS connected trial with private evidence isolation, bounded quotas and retention. Depends on explicit deployment/security approval. Done when separate tester identities and mandatory server Cedar replace fixed demo tokens; never expose the present local server.
- [ ] **P2 · PLANNED:** Verify real road-route geometry and warning usability. Depends on the appropriate live routing provider. Done when actual roads and uncertainty are tested; straight-line fixtures remain disclosed meanwhile.
- [ ] **P2 · PLANNED:** Define incident resolution/history and useful contribution criteria. Done when contradictory/expired observations and award rules have reviewed domain behavior and tests.
- [ ] **P2 · PLANNED:** Evaluate real data provenance and calibrated Stress methodology. Depends on suitable data agreements/validation. Done when sources, coverage and limitations are inspectable; fictional demo inputs remain separate.

## P3 — Future features

- [ ] **P3 · PLANNED:** Design TankerOS operational supplier/reservation workflows only after core reliability. Done when real supplier permissions and functional order states exist; no preview card counts as delivery.
- [ ] **P3 · PLANNED:** Research HeatSafe and heat-aware journeys with defensible inputs. Done when real measurements/methodology and safe wording are validated.
- [ ] **P3 · PLANNED:** Evaluate consented sensors, official feeds, notifications, video and background learning. Depends on privacy/security/product review. Done only with functioning, tested integrations; these are not current capabilities.

## AWS cloud deployment — separate acceptance gate

All live items remain **BLOCKED_AWAITING_SSO**, intended profile `jalnet` and region `ap-south-1`. Implemented provider/CDK code is preserved.

- [ ] **AWS P0 · BLOCKED:** Verify the approved account/role privately with `aws sts get-caller-identity --profile jalnet`; stop on mismatch. Done when target identity and deployment permissions match the guarded runbook.
- [ ] **AWS P0 · BLOCKED:** Deploy guarded CDK and capture real outputs. Depends on approved identity, model/resource parameters and diff review. Done when outputs/IAM/resources pass [cutover checks](docs/AWS_CUTOVER_CHECKLIST.md).
- [ ] **AWS P0 · BLOCKED:** Verify Cognito/API/Lambda/DynamoDB owner isolation and persistence through actual calls.
- [ ] **AWS P0 · BLOCKED:** Verify private S3 upload, SQS analysis and Bedrock/Nova model access with controlled evidence and redacted receipts.
- [ ] **AWS P0 · BLOCKED:** Verify restricted Amazon Location maps/routes and native rendering. Done when actual resource/key restrictions and road routing pass.
- [ ] **AWS P2 · UNVERIFIED OPTIONAL:** Evaluate Cedar Lambda WASM packaging only if explicitly undertaken. Done only after the deployed bundle/assets and real decisions are verified; local Cedar does not satisfy this.

For the three service-verification items, completion requires independent live dependency proof followed by the full bounded live workflow; local mocks/synth do not pass them. Follow [AWS_DEPLOYMENT_RUNBOOK.md](docs/AWS_DEPLOYMENT_RUNBOOK.md).

## Completed — genuinely executed local work

- [x] **LOCAL P0 · COMPLETE:** Implement private JPEG drafts/manual confirmation and the report→UNVERIFIED incident→corridor warning→provisional ledger pipeline; actual local HTTP/emulator and earlier scoped Redmi evidence retained.
- [x] **LOCAL P0 · COMPLETE:** Make real Cedar owner/foreign/test-only-forbid decisions mandatory for private-report operations, with fail-closed/redacted errors and zero denied effects.
- [x] **LOCAL P0 · COMPLETE:** Implement My Water validated arithmetic, simulation, scoped persistence and tank-only reset; calculations are assumptions, not sensors.
- [x] **LOCAL P0 · COMPLETE:** Implement six-factor fictional Stress calculations, renormalization and the minimum-coverage gate.
- [x] **LOCAL P0 · COMPLETE:** Deliver System/Light/Dark, attributed maps and correctly labeled TankerOS/HeatSafe previews; scoped emulator evidence retained.
- [x] **LOCAL P0 · COMPLETE:** Preserve full-ref backup, migration provenance, licenses, meaningful history and the future AWS architecture.
- [x] **LOCAL P0 · COMPLETE:** Execute 212 regressions across 23 suites at the prior engineering milestone and prepare safe disposable/resumable demo tools.

Five timed physical rehearsals, final hackathon video and form receipt remain separate pending owner tasks in [OWNER_FINAL_ACTIONS.md](docs/OWNER_FINAL_ACTIONS.md). Organizer eligibility approval is already recorded; it is not a new unresolved task. No P0 completion is asserted.

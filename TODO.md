# JalNet roadmap

Updated 2026-10-10. This is a current backlog, not a replacement for [historical engineering evidence](docs/FINAL_ENGINEERING_REPORT.md), [migration provenance](MIGRATION.md) or the [original specification](JalNet_Implementation_Plan.md). Current verified source: **952bfde, 229 tests / 25 suites**, preserving the **212-test / 23-suite** prior baseline. The standalone preview and local Node application have separate acceptance gates.

Each open item states priority/status, dependencies where applicable and its completion criterion.

## P0 — Standalone release blockers

- [x] **P0 · BUILD/INSPECTION PASS:** Build and privately sign the separate ARM64 `org.jalnet.preview` APK. Source 952bfde produced version 0.1.0-preview.1/code 2, 44,981,242 bytes, SDK 24/36, bundled Hermes and verified v2/v3 signatures; debuggability/backup/cleartext are off. Bounded native acceptance and public distribution are separate. [Exact artifact record](docs/ANDROID_RELEASE.md).
- [x] **P0 · BOUNDED NATIVE PASS:** Execute exact-APK capability acceptance: 28 bounded emulator cases cover maps/credits, capabilities, appearance, tank, Stress and fictional/planned cards, without a Node API or phone-Cedar claim. [Actual cases and untested limits](docs/ANDROID_PREVIEW_ACCEPTANCE.md); no blanket every-action or physical-device certification.
- [x] **P0 · BOUNDED NATIVE PASS:** Install/icon-launch/cold-restart the signed ARM64 artifact without Metro/API or ADB forwarding; test saved tank/appearance, System OS-following, 150% text and offline device tools. All 28 observed cases PASS; cached offline map tiles do not establish uncached-map support.
- [x] **P0 · REGRESSION/CI PASS:** Source 952bfde retains all 212 baseline tests and adds 17 preview composition/storage/configuration/notice tests: **229 tests / 25 suites**. [Same-source CI](https://github.com/farhanakhtar0x66/jalnet-submission/actions/runs/38032876398) and [PR CI](https://github.com/farhanakhtar0x66/jalnet-submission/actions/runs/38032902452) completed SUCCESS. Native artifact acceptance and publication are separate gates.
- [x] **P0 · PREVIEW PUBLICATION PASS:** Publish [v0.1.0-preview.1](https://github.com/farhanakhtar0x66/jalnet-submission/releases/tag/v0.1.0-preview.1) with exactly two APK/checksum assets. Anonymous downloaded APK and checksum were actually verified at 2026-10-10T07:40:20Z; the 44,981,242-byte APK is byte-for-byte identical to the tested artifact. Tag resolves 952bfde. This closes only the scoped preview release checklist, not physical/hackathon/cloud P0.

## P1 — Bugs and reliability

- [ ] **P1 · PENDING PHYSICAL:** Test the preview on Redmi and friends' compatible devices. The verified prerelease is available. Done when actual model/OS/install/theme/map/calculator/persistence results and failures are recorded; emulator evidence is not substituted.
- [ ] **P1 · PENDING PHYSICAL:** Complete local-development camera deny/recover, foreground location, interrupted upload, keyboard, enlarged text and TalkBack cases. Done when each remaining [physical case](docs/PHYSICAL_ACCEPTANCE.md) has actual evidence and failures are fixed/retested.
- [ ] **P1 · CONFIRMED LIMIT:** Prevent an older distinct upload grant overwriting a completed newer JPEG. Current SHA-256 check blocks publication/awards but requires retake. Done when an actual HTTP regression proves version isolation and denied effects, preserving ownership/Cedar boundaries.
- [ ] **P1 · CONFIRMED LIMIT:** Handle concurrent first-report fusion without duplicate nearby incidents. Done when overlapping real-repository confirmations satisfy the intended fusion invariant without granting false corroboration bonuses.
- [ ] **P1 · PENDING:** Measure startup/map/calculator responsiveness on target hardware and test rotation/font/keyboard edge layouts. Done when budgets and actual measurements are documented, with no untested performance claims.
- [ ] **P1 · PENDING:** Induce an uncached-map failure and exercise Retry. Depends on controlled networking/new viewport without deleting wanted data. Done when actual failure/disclosure/retry behavior is recorded; cached offline tiles are insufficient.
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

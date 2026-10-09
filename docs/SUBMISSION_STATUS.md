# JalNet submission acceptance

Updated 2026-10-09, Asia/Kolkata. Submission: [jalnet-submission](https://github.com/farhanakhtar0x66/jalnet-submission). Original [source repository](https://github.com/farhanakhtar0x66/jalnet), feature/UI branches and unmerged PR #1 remain preserved. Import commits restore existing work; they are not claims of fresh feature development.

The owner reported the organizer’s explicit confirmation: **“Yes, you’re eligible!”** Eligibility approval is therefore received, using owner-provided evidence. The message has not been independently audited here. This confirmation does not establish a completed device test, recorded video, submitted form, live AWS integration or P0 completion.

## Current evidence

| Gate | Actual status |
|---|---|
| Source protection | PASS: private full-ref mirror, complete-history bundle verification and independent restore; 17 combined refs matched; original refs unchanged |
| Complete baseline | PASS: all 188 exported source blobs/modes matched the approved `8ea3ca7` UI tree before subsequent changes |
| Imported regression | PASS at `5c8d8e7`: **181 tests / 16 suites**, all eight original local commands; [imported-baseline CI](https://github.com/farhanakhtar0x66/jalnet-submission/actions/runs/37940198802) also PASS |
| Final post-import engineering | **PASS at `7be3368`, 2026-10-09 19:38 IST: all eight requested commands; 193 tests / 18 suites** (181 preserved + 7 seed + 5 actual-hook tests). [Same-revision CI](https://github.com/farhanakhtar0x66/jalnet-submission/actions/runs/37942059301) completed SUCCESS |
| Final post-import emulator | Scoped Light/Dark map, route/warning/credits and water checks PASS; Light and Dark cold restarts restored their appearance/tank state. Existing approved arm64 debug APK loaded new-checkout JavaScript; no new native build. Unretaken cases remain pending; see exact matrix below |
| Latest Redmi acceptance | PENDING: charged phone/owner participation; older core-camera success is historical only |
| Rehearsals and video | R1–R5 all NOT RUN / NOT MEASURED; final video NOT RECORDED, no video URL |
| Final form/publication | Deadline/form/judge-access review and actual submission PENDING |
| Live AWS / Cedar Lambda | **BLOCKED_AWAITING_SSO**; cloud dependencies and optional Lambda WASM packaging unverified |

The verified private backup is in the original checkout’s ignored `.tools/backups/submission-20261009-191202/` (mode0700). Bundle `jalnet-all-refs.bundle`: 13,259,905 bytes; SHA-256 `adfb633e44f38fa1cf3f890dd464b127e93148f68e29a67a0b4407a01293c2f3`. Mirror/restored `fsck`, bundle verification and exact ref restoration passed. No backup, original Git refs, credential, draft or runtime state is published. [Full migration record](../MIGRATION.md).

## Reviewable import milestones

| Commit | Migrated existing work |
|---|---|
| `8d60cdf` | Tooling, workspace/dependencies and shared contracts |
| `2dc74d9` | Water/report domain, geometry and tests |
| `e0aa967` | Cedar policies/schema, authorizer and actual-engine tests |
| `0e9aea0` | Mandatory-Cedar local backend, evidence, persistence and HTTP workflow |
| `28ceef5` | Existing AWS providers, CDK/Lambda architecture and guarded cutover |
| `3a3ea6b` | Complete Android app, water features, redesign and persistent appearance |
| `5c8d8e7` | Documentation, inspected screenshots, demo guidance and CI |

The imported gate actually ran `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm synth`, `pnpm test`, `pnpm mobile:bundle`, `pnpm cedar:check` and `pnpm smoke:local --isolated`. The added `mobile`, `cedar` and `smoke` aliases delegate to `mobile:bundle`, `cedar:check` and `smoke:local`. The final `7be3368` gate actually ran **`pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm synth`, `pnpm test`, `pnpm mobile`, `pnpm cedar`, `pnpm smoke --isolated`**, all PASS at 19:38 IST. Synthesis and mocked adapter tests are not live AWS verification.

## Genuine post-import engineering

| Commit | Reviewed improvement |
|---|---|
| `a850847` | Required deterministic seed fixture is ensured even when other routes exist; idempotence/cap/failure coverage adds 7 tests |
| `f959a0c` | Tank reset failure retains the previous local water value with retry/revision protection; adds 5 tests executing the actual hook with a **SIMULATED React lifecycle and storage port**, not native-device proof |
| `e707eb3` | Deliberate pin required for route origin/save; same-point destination blocked; labels and disabled/handler guards explain the next action |
| `7be3368` | Exact requested command aliases and CI checks for real Cedar plus isolated local smoke |

All 181 imported tests remain; the 12 added tests produce **193 tests / 18 suites**. Byte comparison found 33 protected Cedar/backend/AWS-security files unchanged. Real Cedar 4.13.0 on Node 24.21.0/darwin-arm64 performed 1,000 decisions: 500 allow / 500 deny; initialization 32.242209 ms, median 0.292542 ms, p95 0.437583 ms. These are local-host measurements.

## Scoped final emulator evidence

The existing approved arm64 development APK used the **new checkout’s Metro8083 and isolated mandatory-Cedar API8847** with synthetic data only. No native rebuild, phone operation, private draft reset or cloud request is claimed. [14 inspected unedited synthetic screenshots](ui/submission/README.md).

| Native check | Actual result |
|---|---|
| Dark route inputs | PASS: untouched origin/save disabled; same-point save disabled; distinct destination plus name enabled; actual HTTP 200 save persisted the route |
| Light map/routes/warnings | PASS: streets and route panel rendered; aged warning led to visible refresh; hazard appeared for matching route; absence for another route made no safety guarantee |
| Attribution in Light and Dark | PASS: native popup showed OpenFreeMap/OpenMapTiles/OpenStreetMap data-source credits; supplemental Dark design/license credits remain in repository/recording assets. Native popup follows Android OS appearance; a readable white popup in Dark was observed |
| Light My Water / Stress | PASS: tank-only reset 900 L/60%/~72h, then one simulation 600 L/40%/~48h; Stress DEMO 60/HIGH/100% coverage |
| Dark My Water/Stress/map | PASS: 600 L/40%/~48h; Stress DEMO 60/HIGH/100% coverage; warning refresh/map/credits readable |
| Dark cold restart | PASS: restored Dark and saved 600 L/40%/~48h |
| Light cold restart | PASS: Light map and saved 600 L/40%/~48h restored; level SIMULATED, capacity 1,500 L DEMO FIXTURE. Routes reopened with untouched origin/save disabled and Destination needed |
| Emulator crash buffer | Read completed successfully with no entries after this inspection; this is not a general stability certification |
| Explicitly unretaken | Camera/full permissions, offline recovery, screen reader and remaining physical/native matrix; prior source evidence is not a fresh pass |

This revision is **engineering validated**, not the final physical-acceptance freeze.

## Owner’s next physical action

**Charge the Redmi, connect it by USB, unlock it, enable USB debugging and approve this computer. Then report that it is ready.** Stop there: tests proceed one at a time, recording the actual result before the next action. Do not uninstall, clear storage, discard wanted drafts or reset the phone.

- [ ] Confirm the actual device/OS and existing draft state. Install a compatible signed development APK in place with `install -r` only after compatibility is checked; preserve the USB-local API8787/Metro8081 setup. This client requires Metro/USB and map internet, not a standalone release/offline APK.
- [ ] Test camera denial/settings/retry and a safe staged capture → private upload → manual confirmation → one UNVERIFIED incident → fresh route warning → one provisional +2 ledger. Do not publish private imagery or real coordinates.
- [ ] Test denied/approximate/precise foreground location with chosen-pin fallback; record observed accuracy/failure privately. No background-location test is implied.
- [ ] Test saved draft/reopen, controlled API-offline failure/cache and restored retry; preserve state and restore the same local server.
- [ ] Check Light/Dark/System, tank edit/invalid/simulation/reopen persistence, Stress disclosure/coverage, sheets/keyboard, enlarged text, screen reader and attribution. Record real results against the exact tested revision in [physical acceptance](PHYSICAL_ACCEPTANCE.md).

## Rehearsal and final take

Use the existing [five-run checklist](FIVE_REHEARSALS.md) and [planned 2:50 shot list](BUILD_IT_DEVICE_DEMO.md). Each run needs disposable demo data, a safe staged scene, synthetic pin, preserved wanted drafts and actual timing. A server reset never resets phone SQLite. Do not reset server references while a wanted draft depends on them; isolated smoke is a separate regression check, not the interactive take’s state.

- [ ] R1, R2, R3, R4 and R5: record five complete successful runs, their exact revisions and measured durations; currently all five are pending.
- [ ] Show the actual report/warning/+2 result and My Water arithmetic, not a previous fixture substituted for the current capture. Say LOCAL/DEMO; manual/no-model assessment and straight-line routing remain disclosed.
- [ ] Show real Cedar owner allow / foreign deny / test-only forbid HTTP proof and zero denied effects. Production policy remains frozen; Cedar is authorization, not authentication.
- [ ] Preserve feature labels: report/local authorization WORKING; My Water and Stress CALCULATED DEMO; TankerOS PREVIEW/DEMO with no booking/payment/contact; HeatSafe PLANNED; AWS IMPLEMENTED_UNVERIFIED / BLOCKED_AWAITING_SSO.
- [ ] Record a final video strictly under 3:00 only after acceptance/rehearsals. Review the entire exported video for duration, privacy, readable proof, audible disclosures, transparent prepared results/cuts and retained map/Cedar/MIT/Codex credits.
- [ ] Verify the public source/video links signed out, actual form fields and deadline; owner/team publishes and submits the reviewed assets. No placeholder video URL or assumed submission. [Prepared text/credits](BUILD_IT_SUBMISSION_ASSETS.md).

## Separate future Ship It gate

SSO is not required for this local Build It submission. Live AWS stays **BLOCKED_AWAITING_SSO**, intended profile `jalnet`, region `ap-south-1`. First eventual command: `aws sts get-caller-identity --profile jalnet`; compare account/role privately and stop immediately on mismatch before following the [guarded runbook](AWS_DEPLOYMENT_RUNBOOK.md). Keep the working local demo available if cloud deployment fails. No cloud integration or P0 completion is declared.

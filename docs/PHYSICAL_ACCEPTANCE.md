# Redmi final acceptance record

Started 2026-10-08, Asia/Kolkata; updated 2026-10-09. The owner accepted the physical-phone milestone at **087a225** and froze Cedar authorization at **9422fc2**. The subsequent Build It strategy authorized the narrow feature increment through **2dbbc4f**. This pass covers physical acceptance of those delivered features and the existing core, demonstration/submission preparation and minimal fixes for observed defects. Live AWS remains **BLOCKED_AWAITING_SSO**; no local result verifies a cloud boundary or completes P0.

## Evidence rules and preservation

Guide the owner through **one action/test at a time**, then stop for their interaction. Record PASS/FAIL only from an observed device result or an explicit owner report; identify which. Setup performed is not proof of the behavior under test. An expectation below is not a result. Retain failed attempts and their fixes/retests rather than overwriting them with a success.

Each result needs test ID, tested commit/worktree changes, Asia/Kolkata date/time, owner/agent observation, exact sanitized behavior and evidence reference if available. Record no device serial, precise real coordinates, private scene, credential, signed URL or unrelated app content publicly. Any phone capture must be confined to JalNet with the owner's cooperation; keep sensitive evidence in ignored local storage, not Git. Do not invent evidence paths for captures not yet made.

Keep API8787, Metro8081 and adb reverse intact. Do not reset `.local-data`, clear app storage, uninstall, discard wanted drafts or change AWS configuration for these tests. Check for an existing draft before camera tests. If a wanted draft occupies the capture flow, preserve it and defer tests requiring a fresh capture until the owner has finished it. Permission changes must happen when capture/upload is idle. Before controlled API-offline tests, identify the known JalNet server, preserve its state and restore that same USB-local composition afterward; keep Metro/USB/internet running.

The previous [physical milestone](BUILD_IT_DEVICE_DEMO.md#physical-acceptance-record) remains historical evidence: one real staged JPEG/private local upload/confirmation/unverified incident/warning/+2 ledger and route refresh. It is not a repeat of the remaining tests below. The feature increment passed 165 tests across 15 suites, preserving all 111 core tests including 40 Cedar tests; that automated result is separate from physical acceptance.

## Current preflight evidence

Recorded 2026-10-08, 13:47 IST. These are agent-observed connection/repository checks, not physical permission/offline/accessibility passes.

| Check | Actual observation | Status |
|---|---|---|
| Repository | `git status --short --branch`: clean main tracking origin/main before documentation preparation | PASS, read-only preflight |
| Phone | adb inventory: one authorized Redmi Note 9 Pro Max in state device; serial withheld | PASS, connection only |
| Existing USB-local processes | Listeners observed on computer loopback API8787 and Metro8081; processes left running | PASS, listeners only; forwarding/app requests not re-proven |
| Existing private draft | No saved-draft panel visible in the recovered Camera sheet at14:00:30 IST; storage was not inspected or cleared | UI observation only; no claim that all draft storage is empty |

Documentation-only preparation checks executed on 2026-10-08 at13:47 IST: `pnpm format:check`, `pnpm lint` and `git diff --check` passed; new relative documentation file links resolved. `pnpm test` passed **12 suites / 111 tests**, unchanged count. A diff against087a225 confirmed application, dependencies, tests, Cedar and AWS source files remain unchanged. These automated checks do not promote any physical row below.

## Ordered physical tests

This is an execution queue, not an instruction to perform all steps at once. Give the owner only the next action and record its result before proceeding.

| ID | Test | Expected acceptance behavior | Actual result |
|---|---|---|---|
| C-00 | Open Camera and identify saved draft/preview/permission state | Wanted drafts remain untouched; establish an idle starting state | PASS, agent-observed live preview, no saved-draft panel or permission dialog; see recovery log |
| C-01 | Owner denies camera permission while idle, then opens Camera | Clear permission guidance; no unintended capture/upload/publication; Close returns to usable map | PENDING |
| C-02 | Denied camera settings/allow recovery | Existing settings/request action works; owner grants permission; camera preview becomes usable | PENDING |
| C-03 | Varied safe staged captures | Light/detailed scene and portrait capture resize within limits; readable preview; inspect actual uploaded JPEG size/dimensions/EXIF/hash locally | PENDING |
| C-04 | Capture busy/close behavior | Busy state prevents overlapping operations; completed private draft can be retained without publishing | PENDING |
| L-01 | Owner denies foreground location | Honest denial/fallback; map chosen-pin reporting remains usable; no GPS claim | PENDING |
| L-02 | Owner allows approximate foreground location | Actual outcome/accuracy or bounded failure disclosed; no precise private coordinates in public record | PENDING |
| L-03 | Owner allows precise foreground location | Actual fix or bounded timeout/error observed; appropriate accuracy shown; no background permission/tracking | PENDING |
| O-01 | Save private draft, close idle app, reopen | Same private image/draft survives; no upload/event/award caused by restart | PENDING |
| O-02 | Controlled API-offline upload from saved test draft | Clear failure/busy recovery; same private draft retained; no false upload/publication success | PENDING |
| O-03 | Restore API and retry same draft | Upload/manual review resumes; no duplicate unintended report/incident/reward | PENDING |
| O-04 | Warm cache, controlled API outage, refresh reports/routes | Dated offline cache/current-conditions uncertainty; stale/offline warning suppression; restored refresh returns current result | PENDING |
| A-01 | Normal text/touch/insets across map, report, routes, profile | Controls readable/reachable; no system-bar obstruction or trapped sheet; disabled actions explained | PENDING |
| A-02 | Owner increases text size, then restores original setting | Important content remains readable/reachable by scrolling; no hidden consent/close controls | PENDING |
| A-03 | Owner-assisted screen-reader pass, if available | Useful button labels, selected category/severity and disabled state; focus can reach consent, submit and close | PENDING |
| T-01 | Open native map attribution control | Actual map-source credits visible and reviewable; no AWS-source claim in LOCAL mode | PENDING |
| T-02 | Review proposed recorded credits | OpenFreeMap/OpenMapTiles/OpenStreetMap, project MIT, Cedar Apache-2.0 and Codex assistance acknowledged accurately | PENDING |

## Append-only execution log

No remaining physical test was marked passed by the initial preparation. Append each observation here, including failures, owner reports, deferred reasons and actual retest evidence. When a minimal code fix is needed, reference the defect, preserve frozen authorization unless a real security defect exists, and run relevant regression checks before retesting. Never substitute a successful unit/emulator test for a physical result.

### 2026-10-08: development launcher recovery and C-00

Tested feature revision087a225, Cedar9422fc2, with documentation-only worktree changes. The owner reported being unable to open JalNet and supplied an image showing the Expo development launcher rather than the application. Agent inspection found API8787 and Metro8081 still running, one authorized phone, and an empty `adb reverse --list`. This was a failed launch attempt, not a camera-permission result.

At13:53:56 IST, the two USB forwards were restored with `adb -d reverse tcp:8787 tcp:8787` and `adb -d reverse tcp:8081 tcp:8081`; the existing development client was opened using `jalnet://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081`. No reinstall, storage reset, permission change, capture or upload was performed. Command success alone was not counted as an application pass.

**C-00 PASS, agent observation at14:00:30 IST**, reviewed at14:09 IST: the foreground-guarded capture in ignored local file `.tools/device-demo/launcher-recovery.png` shows the actual JalNet report sheet and a live camera preview. No permission dialog, permission primer or saved-draft panel is visible. Capture JPEG and Close / keep draft controls are visible; no busy operation is shown. The red guidance requires a deliberately chosen observation pin or foreground location before capture. It is not a camera-permission error. This proves camera access at that moment, not denial/recovery, location, upload or empty persistent draft storage. The private scene remains outside Git.

The owner's later message “got no permission” does not by itself distinguish an absent prompt from a denial. The observed live preview establishes access for C-00; **C-01 and C-02 remain PENDING** until their specific physical actions and outcomes are observed. Application and authorization code remain frozen.

Next required owner interaction: **C-01 setup only**. While capture/upload is idle, open Android Settings → Apps → JalNet → Permissions → Camera and choose Don't allow. Do not clear storage or uninstall. Stop for the owner to confirm this setting before reopening Camera and observing denial behavior.

### 2026-10-08: owner strategy update

The owner subsequently reported checking physical-phone permissions and reviewing the application, accepted the demonstrated Android core and redirected work to Build It feature engineering/UI handoff. This is owner-reported review, without per-case observations for the pending rows above. It does not invent a denial/GPS/offline/accessibility/attribution result. The C-01 interaction queue is suspended under the new instruction; the owner now owns further testing/recording. Agent work must preserve the current USB-local state and drafts. New feature tests are separate from the historical camera-to-warning milestone and require their own phone acceptance.

### 2026-10-09: MW-01 owner-confirmed tank fixture

The preceding instruction asked the owner to open My Water, choose Reset My Water demo fixture → Reset tank only, and confirm **900 L remaining, 60% SIMULATED level and approximately 72 hours**. The owner replied “confirmed now continue”. **MW-01 PASS, explicit owner report** for those requested values and reset interaction. No screenshot or independent agent phone observation was supplied; exact device-test time and loaded phone bundle hash were not reported. Repository revision at logging is **2dbbc4f**, on `codex/build-it-features`, with documentation-only changes afterward. This result does not prove restart persistence, simulation, invalid inputs, other phone cases or cloud behavior.

No phone/API/Metro operation, storage reset, draft discard or code change was performed while recording this result. No timed rehearsal is counted.

### 2026-10-09: MW-02 owner-confirmed one-day arithmetic

After the instruction to tap Simulate one day of consumption once, the owner reported “yeah 600l 40% and 48 hours left”. The numerical outcome is **PASS, explicit owner report**: 600 L remaining, 40% level and approximately 48 hours. The SIMULATED label and day count were not reported and remain unconfirmed; neither is inferred from the arithmetic. No screenshot/independent phone observation or exact test time was supplied. Repository revision remains **2dbbc4f**, with documentation-only worktree changes. Persistence after reopening has not yet been tested. No phone/server/storage operation or code change was performed by the agent for this record.

## New-feature physical acceptance queue

Give only the next interaction, then wait for its actual result. Expectations are not passes.

| ID | Test | Expected acceptance behavior | Actual result |
|---|---|---|---|
| MW-01 | Tank-only fixture reset | 900 L remaining, 60% SIMULATED level, approximately 72 hours | PASS, owner report on 2026-10-09; see log above |
| MW-02 | One simulated day from the reset fixture | 600 L remaining, 40% SIMULATED level, approximately 48 hours, simulated day 1 | Numerical outcome PASS, owner report on 2026-10-09; label/day count not yet reported |
| MW-03 | Close/reopen after the save indicator finishes | Same 600 L / 40% / 48 hours / day 1 restored, without another simulation | PENDING |
| MW-04 | Valid input edits and invalid/zero/empty cases | Immediate correct arithmetic; invalid edits suppress forecast and do not replace saved valid values; zero-use/empty copy is accurate | PENDING |
| WS-01 | Stress full and missing-input samples | DEMO INDICATOR 60/HIGH/100%; missing supply+groundwater gives 55% coverage and no headline | PENDING |
| V-01 | Vision disclosure and usable navigation | TankerOS fictional DEMO/no booking action; HeatSafe PLANNED; return to map works | PENDING |

Next owner action: **MW-03 only**. Wait for Saved on this device, choose Close / return to map, then reopen My Water. Report whether 600 L / 40% / approximately 48 hours remain, and the actual level-source label and simulated-day count. Do not simulate or reset again during this check. This tests panel reopening, not a process/device restart.


### 2026-10-09: phone unavailable; redesign acceptance is separate

The owner reported that the phone battery died and explicitly assigned the complete UI/theme redesign before resuming device tests. The MW-03 interaction queue is suspended. No phone launch, installation, reset, draft discard or storage clear was performed during the redesign. The prior MW-01/MW-02 owner results describe the previous bundle at 2dbbc4f; they do not prove the redesigned screens.

When the owner has charged the phone, resume one case at a time after installing the reviewed replacement development APK **in place** (`adb -d install -r`, never uninstall/clear), retaining private drafts and the USB8787/8081 setup. Recheck camera, location, offline/cache, accessibility, attribution and the new System/Light/Dark setting. New native SVG/safe-area/theme modules require the rebuilt APK; the earlier APK is not sufficient. Emulator-only evidence is recorded in [UI_REDESIGN_REPORT.md](UI_REDESIGN_REPORT.md). Five physical rehearsals and final recording remain pending.

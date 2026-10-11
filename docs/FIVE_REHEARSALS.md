# Five repeatable LOCAL/DEMO rehearsals

Prepared 2026-10-08; updated 2026-10-09, Asia/Kolkata. Use the current [2:43 final script](FINAL_DEMO_SCRIPT.md) and the [ordered owner handoff](OWNER_FINAL_ACTIONS.md). Target **2:40–2:45**, strictly under 3:00. This replaces the older planned 2:50 budget; no rehearsal duration has been measured. All five physical attempts remain **NOT RUN**. Earlier camera acceptance, emulator captures, automated smoke and replaying a video do not count as timed phone rehearsals.

Build It uses the working LOCAL/DEMO application and real mandatory Cedar authorization. Live AWS remains separately **BLOCKED_AWAITING_SSO** and is not a dependency of these local rehearsals. No local rehearsal verifies AWS cloud services or completes P0. The owner has reported organizer eligibility approval; this checklist does not reopen that decision.

## Historical evidence retained

The owner accepted one staged physical camera → local private JPEG upload → manual confirmation → UNVERIFIED incident → route warning → +2 ledger flow. Historical Redmi/Liberty presentation and owner MW-01/MW-02 arithmetic evidence remain separate from latest redesigned-screen acceptance. The phone battery died before MW-03 close/reopen; that physical persistence result is still pending. See the [original device record](BUILD_IT_DEVICE_DEMO.md) and [physical acceptance log](PHYSICAL_ACCEPTANCE.md).

The UI redesign assigned to Codex on `ui/jalnet-redesign` from `2dbbc4f` subsequently passed eight local checks with **181 tests / 16 suites** (165 baseline + 16 theme tests). Its replacement arm64 development APK was built/installed/launched on the owned API37 emulator. Scoped Light/Dark screenshots, tank/Dark preference cold-restart retention and the Dark focused-note keyboard retest remain in the [redesign report](UI_REDESIGN_REPORT.md) and [after-design screenshot pack](ui/redesign/README.md). Those emulator passes do not pass physical permission, screen-reader or rehearsal cases.

Post-import engineering `7be3368` passed all eight requested commands at 19:38 IST with **193 tests / 18 suites** and same-revision CI SUCCESS; it used the compatible APK with submission-checkout JavaScript. The current sprint reproduced the 193/18 baseline at `57a4da6` before changes. A new arm64 development APK was actually built in the submission checkout in 1m27s/368 tasks and installed on the emulator with `-r`, preserving app data; it still requires Metro. Final current-revision gates, CI and scoped native checks must be read from [submission status](SUBMISSION_STATUS.md), rather than inferred from this history. The reviewed source `c2a8148` passed all eight commands with **212 tests /23 suites** and same-source CI SUCCESS. Final delivery-head checks are linked from the engineering report/PR; these local checks do not pass physical rehearsals.

## Before every new take

- [ ] Complete the blocking [physical acceptance cases](PHYSICAL_ACCEPTANCE.md) one at a time. Record actual PASS/FAIL and evidence; a known failure needs an honest fallback or a reviewed fix/retest.
- [ ] Charge/unlock the Redmi, approve USB debugging and use the exact serial-specific install/forwarding/launch commands in [owner steps 1–6](OWNER_FINAL_ACTIONS.md). Install the reviewed compatible APK **in place with `-r`**. Never uninstall, clear app storage or downgrade. Preserve wanted drafts, tank values, appearance and the USB API8787/Metro8081 setup.
- [ ] Record the actual source revision, APK/build identity, phone-reported Android version, tester and local time. Metro must serve the reviewed **JalNet-Submission** checkout. An Expo development launcher is not proof that JalNet opened.
- [ ] Check for a wanted private draft and its server dependency. **Stop before switching servers if any wanted pending draft depends on the current server.** Finish/preserve that draft on its existing server first; do not discard it to make a clean shot.
- [ ] Identify API8787 and Metro8081 listeners. Stop only your known JalNet API with Ctrl-C. Leave Metro and unrelated processes alone. A port conflict is a stop, not permission to kill another listener.
- [ ] For a genuinely fresh disposable take, start `pnpm demo:serve --android-usb` in the submission checkout. For an emulator-only rehearsal use `pnpm demo:serve` instead. Each fresh invocation seeds one corridor in its own private temporary directory; it does not delete earlier state/evidence, replace the original `.local-data` or clear phone data.
- [ ] Retain the server's printed **private directory and exact `--resume` command** locally. Never show that path in the video/public evidence. Resume this same directory after an API interruption; starting a fresh server cannot recover a draft that refers to the earlier server.
- [ ] When idle with no wanted unresolved server-backed draft, use the data-preserving cold-relaunch in [owner step 6](OWNER_FINAL_ACTIONS.md#6-verify-the-latest-redesign-is-running) for each new take. Refresh the actual phone. Open Routes → **Refresh route reports**, then Profile. Require **one seeded LOCAL/DEMO corridor, no current incident and 0 droplets** from the fresh server. Client cache may still show old values; stop and inspect a mismatch rather than assuming the new server cleared the app.
- [ ] My Water → **Reset My Water demo fixture → Reset tank only**: verify 1,500 L capacity, 60% SIMULATED level, 300 L/day DEMO use, **900 L/~72h**, simulated day 0 and a settled save indication. This affects tank data only; server seeding does not reset device SQLite. Restore Stress DEMO inputs and verify **60/HIGH/100% coverage**. Vision cards remain DEMO/PLANNED.
- [ ] Check camera scene, cable, battery/storage, API/Metro and public map internet. Stage a harmless scene with no faces, addresses or private text. Choose the synthetic pin intersecting the seeded straight-line corridor and disclose it; do not use real coordinates in public evidence or claim a real road hazard.
- [ ] Check native attribution is reachable/readable. Include OpenFreeMap/OpenMapTiles/OpenStreetMap and additional Dark style/design notices from the [final script](FINAL_DEMO_SCRIPT.md). A readable white native attribution popup in Dark mode follows Android OS appearance and is not an app-theme failure by itself.
- [ ] Prepare the actual `pnpm cedar:demo` output and production owner policy at the tested revision/time. Require 4/4 owner allow, 4/4 foreign deny, 4/4 **TEST-ONLY** owner forbid and zero denied effects. No tokens, signed URLs, private paths or live-AWS claim. Do not run fixture smoke against the interactive take after preparing it.

### Preserve and resume the same take

With Metro/USB still running, stop only the known isolated API using Ctrl-C. Keep its printed directory/evidence. Restart using its exact printed command. If the retained directory was entered privately into `JALNET_DEMO_DIR`, the standard physical-phone command is:

```sh
pnpm demo:serve --android-usb --port 8787 --resume "$JALNET_DEMO_DIR"
```

Only a directory created by `demo:serve` with the expected marker can be resumed. Verify refreshed Routes/Profile against that retained take; it is expected to retain its existing reports/awards rather than return to zero. Reconnect both USB forwards after a cable/reboot interruption. To return to the original `.local-data` setup, stop the isolated API and use `pnpm local:server:usb` only after resolving every pending draft that depends on the isolated server. **No deletion, `demo:reset`, uninstall or `pm clear` belongs in this checklist.**

## Same timed citizen sequence every time

Run the paired edge-case check below outside the recording timer, record it separately, then restore standard tank/Stress fixtures and a fresh verified disposable server for the timed take. Finish any disposable test draft on its own server before switching. Stop if a wanted draft remains pending. A failed paired check stays failed; it is not hidden by a later successful core take.

Start the elapsed-time timer at the first narration and follow the [2:43 shot list](FINAL_DEMO_SCRIPT.md):

1. **0:00–0:15:** show LOCAL/DEMO, street map and native phone; identify the local Android prototype.
2. **0:15–0:35:** choose the synthetic pin, capture the safe staged scene, inspect the private draft and upload to the local API.
3. **0:35–0:55:** show manual/no-model disclosure; select Waterlogging/severity 2, staged note and explicit still-active/public-road demo inputs; confirm once.
4. **0:55–1:15:** show this same capture's one UNVERIFIED incident, fresh warning on the seeded straight-line corridor and exactly one provisional +2 ledger entry. An earlier fixture event is not this capture's outcome.
5. **1:15–1:40:** show My Water's 900 L/~72h fixture → Simulate one day → 600 L/40%/~48h, including entered/SIMULATED/DEMO labels. This is calculated local logic over assumptions, not sensors.
6. **1:40–1:55:** show Stress 60/HIGH/100%, factors/weights and DEMO INDICATOR. The paired missing/threshold tests need not be squeezed into this short shot; any optional insert must retain truthful labels and timing.
7. **1:55–2:20:** show real prepared Cedar owner/foreign/forbid/zero-effects proof; identify the forbid as **TEST ONLY** and authentication as separate. Keep this readable proof/explanation between 20 and 30 seconds.
8. **2:20–2:38:** show the working local flow and future architecture. Caption AWS cloud **IMPLEMENTED_UNVERIFIED / BLOCKED_AWAITING_SSO**; any TankerOS/HeatSafe cards remain preview/planned.
9. **2:38–2:43:** show repository, credits, assistance and LOCAL/DEMO end frame; stop the timer. Target **2:40–2:45**. Use honest cuts for waiting/taps; retain citizen outcome, uncertainty and Cedar proof. The final export must stay strictly under 3:00.
10. Log measured time, actual outcomes, proof references, pauses/cuts and failures. Confirmation clears only its own submitted draft; preserve wanted evidence. Investigate a failure before retrying. Record each retry as an appended attempt, never overwrite a failed attempt with PASS.

Do not reconfirm reports just to manufacture an idempotency shot. Real-engine HTTP tests and bounded isolated smoke provide that separate proof. One staged report/+2 is not independent community corroboration or measured environmental impact.

## Five paired physical checks

Each row is a **planned check, NOT RUN**. Perform the check one physical interaction at a time using the [owner handoff](OWNER_FINAL_ACTIONS.md); its expected result is not evidence. Keep these checks outside the timed narration and record their separate duration/outcome. Each timed run still covers the full citizen sequence above.

| Run | Distinct paired check before the timed take | Expected result to observe, then restore |
|---|---|---|
| R1 | Light/Dark baseline, large text/keyboard and native attribution (owner steps 11 and 15) | Controls, consent, close/back, field errors and attribution remain reachable; no material clipping. Record physical font-size/keyboard/attribution results, not emulator assumptions. Restore normal recording settings and the chosen theme. |
| R2 | Stress missing-data behavior (step 13): restore all six samples, then clear supply and groundwater | Coverage 55%, **No headline score**, missing factors excluded rather than treated as zero. Restore DEMO inputs to 60/HIGH/100% before the timed shot. |
| R3 | Stress minimum-coverage boundary (step 13): restore samples; clear rainfall, tanker demand and leak-loss, leaving supply 80, heat-driven demand 60, groundwater 70 | Coverage exactly 60% with calculated 72/HIGH; then clear heat-driven demand to get 45% and **No headline score**. These are expected demo calculations, not environmental measurements. Restore all six samples before timing. |
| R4 | Private-draft cold restart, My Water persistence and controlled API-offline recovery (steps 9, 12 and 14) | Wait for saves, reopen idle app and observe retained draft/tank values. Stop only the known API; upload/route refresh must show a bounded failure or stale disclosure without false success or lost draft. Resume **the same retained directory**, retry and observe recovery/no duplicate award. Finish the disposable test draft on that server before a fresh timed take; preserve its evidence. |
| R5 | Camera deny/recover, foreground location deny/approximate/precise and TalkBack (steps 7, 8 and 15) | Denied camera gives usable guidance/close, grant restores preview; location denial preserves chosen-pin reporting, grants show an actual fix/accuracy or bounded failure and never request background access. Record real screen-reader labels/focus/actions. Keep real coordinates private; restore synthetic pin/recording settings. |

If permissions are already granted, no prompt is not a denial test. Change permissions only when capture/upload is idle. USB API forwarding may still work when Wi-Fi/cellular is off; test public map asset loss separately and report actual cached/missing behavior without an offline-map guarantee. Never force-restart a wanted upload to test recovery.

## Run record — all five physical attempts pending

Enter local Asia/Kolkata dates/times and measured durations only after observation. A successful timed attempt needs all required shots/disclosures and its own report → incident → warning → +2 outcome. A paired acceptance failure remains an unresolved case even if the timed core passes. Sanitized evidence can cite a private retained clip/log without publishing its disk path or scene.

| Run | Commit / build / date / tester | Fresh-server + actual cache preflight | Same-report core outcome | Tank / Stress / disclosures | Cedar / AWS frame / credits | Actual timed duration | Actual timed outcome | Sanitized proof reference | Failure / retry reference |
|---|---|---|---|---|---|---|---|---|---|
| R1 | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT MEASURED | NOT RUN | NONE RECORDED | NONE RECORDED |
| R2 | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT MEASURED | NOT RUN | NONE RECORDED | NONE RECORDED |
| R3 | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT MEASURED | NOT RUN | NONE RECORDED | NONE RECORDED |
| R4 | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT MEASURED | NOT RUN | NONE RECORDED | NONE RECORDED |
| R5 | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT MEASURED | NOT RUN | NONE RECORDED | NONE RECORDED |

| Run | Paired physical check | Actual separate check duration | Actual PASS/FAIL and observed behavior | Sanitized proof reference | Failure / retest reference |
|---|---|---|---|---|---|
| R1 | NOT RUN | NOT MEASURED | NOT RUN | NONE RECORDED | NONE RECORDED |
| R2 | NOT RUN | NOT MEASURED | NOT RUN | NONE RECORDED | NONE RECORDED |
| R3 | NOT RUN | NOT MEASURED | NOT RUN | NONE RECORDED | NONE RECORDED |
| R4 | NOT RUN | NOT MEASURED | NOT RUN | NONE RECORDED | NONE RECORDED |
| R5 | NOT RUN | NOT MEASURED | NOT RUN | NONE RECORDED | NONE RECORDED |

Append every attempt/retry below with actual observations. No final physical rehearsal has been measured or passed during document preparation.

## Current owner and submission gate — 2026-10-09

Five successful measured physical rehearsals and the latest redesigned Redmi acceptance remain pending. The final physical video is **NOT RECORDED**, its duration **NOT MEASURED**, and no publication/form receipt is established by this checklist. Use the [final script](FINAL_DEMO_SCRIPT.md), [submission assets](BUILD_IT_SUBMISSION_ASSETS.md) and [final package](FINAL_SUBMISSION_PACKAGE.md) only after actual recording/review.

**Exact next owner action:** charge/unlock the Redmi, connect a USB data cable, enable/approve USB debugging, then check its actual `device` authorization using owner steps 1–2. Stop for the phone interaction before continuing. Preserve private drafts and the functioning USB-local setup. Live AWS has its separate SSO/account-verification gate; local Build It evidence does not complete AWS P0.

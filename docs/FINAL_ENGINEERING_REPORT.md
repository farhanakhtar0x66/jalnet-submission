# Final engineering evidence

Prepared 2026-10-09, Asia/Kolkata. This report separates executed local engineering from the owner’s unperformed physical acceptance and publication. JalNet P0 and submission are not declared complete. Live AWS remains **BLOCKED_AWAITING_SSO**; no cloud deployment, credential configuration or Cedar-in-Lambda verification was attempted.

## Source protection and reviewed changes

The sprint started from clean submission `main` **57a4da6**, matching GitHub. Work is on **codex/submission-finalization**; main is not merged. Original repository `ui/jalnet-redesign` remains clean at **8ea3ca7** with its feature branch, PR #1 and all snapshot refs intact in the verified backup. Seven stable source refs still match; two ephemeral Codex turn-diff refs were replaced by app bookkeeping after backup, without changing any common source ref. The full-ref mirror/bundle/independent restore from [migration](../MIGRATION.md) remains preserved privately; its bundle SHA-256 was rechecked.

| Genuine change | Reproduction and correction | Regression evidence |
|---|---|---|
| `feed46e`: one-use local evidence grant | Two requests could validate the same nonce before filesystem awaits. Claim now occurs synchronously; a failed write can restore only that still-valid grant. | 3 new actual HTTP tests with real Cedar/local filesystem: concurrent redemption, write failure/retry, expired grant |
| `a3907fe`: tank reset guard | A queued edit could supersede a pending reset and leave loading stuck. Such callbacks now wait until reset completes. | 2 new actual-hook tests with explicitly simulated React lifecycle/storage ports, success and failure recovery |
| `a3907fe`: Home operation gate | Same-render queued taps could overlap an operation and release busy state early. A synchronous gate blocks duplicates and guards Back. | 3 new deferred-operation tests for overlap, success and failure release |
| `a3907fe`: geometry boundary | Shape-valid malformed polyline could crash native map rendering. Mobile validates finite bounded geometry before fresh cache writes, cached reuse and risk display; it redacts errors and suppresses current warnings after invalid route data. | 8 geometry tests +2 actual-cache tests with simulated native storage/transport |
| `c2a8148`: demo tools | Isolated real-engine proof and disposable/resumable seeded API avoid resetting wanted `.local-data`. Review caught seeding resumed data before a failed port bind; resume now performs no implicit seed. | 1 actual child-CLI test with real Cedar: occupied-port refusal leaves retained route/draft/state/JPEG/marker/ledger unchanged |

**19 new regression tests** preserve all193 starting tests, including all181 imported tests. No authorization policy/schema/provider, server authentication, shared contract, geometry implementation, AWS SDK provider, Lambda handler, CDK/IAM/deployment guard or dependency lockfile was changed. [Production owner policy](../policies/private-reports.cedar) and mandatory local composition remain frozen.

## Executed automated gate

Before edits: **193 tests /18 suites**, all eight commands PASS, starting `57a4da6`, 20:21 IST. After reviewed changes: **212 tests /23 suites**, all eight commands PASS, 21:18 IST, exact source contents committed as `c2a8148`.

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm synth
pnpm test
pnpm mobile
pnpm cedar
pnpm smoke --isolated
pnpm cedar:demo
```

The isolated HTTP smoke passed JPEG upload → manual confirmation → incident fusion → route warning → provisional/independent ledger → replay. It does not prove a native camera or live AWS boundary. `mobile` is an Android JavaScript export; native compilation evidence is separate below. Mocked AWS adapter tests and CDK synth are not deployed-service verification. Reviewed-source CI completed **SUCCESS** on exact `c2a81483b1952fcc9a32e2fac1417ba89ec76dbb`; every required command passed. [Source CI run](https://github.com/farhanakhtar0x66/jalnet-submission/actions/runs/37954567115). Final delivery head/CI is identified in the final handoff/PR.

The sanitized judge command actually passed **4/4 owner operations**, **4/4 foreign HTTP403 denials**, **4/4 test-only owner-forbid HTTP403 denials**, and **zero new grants, evidence reads, mutations, analysis calls, incidents or awards**. Actual engine, actual HTTP, synthetic JPEGs and owned temporary state; production policy unchanged. The forbid exists only in memory for that isolated proof.

Local benchmark: Node24.21.0/darwin-arm64, Cedar4.13.0, **1,000 decisions =500 allow +500 deny**; initialization **36.252667ms**, median **0.304250ms**, p95 **0.537792ms** in the 21:18 gate. Host measurements are not AWS Lambda performance.

## Actual Android build

Executed from the submission checkout with pinned Node24.21.0/pnpm10.34.6, Corretto JDK17 and installed Android SDK:

```sh
pnpm --filter @jalnet/mobile exec expo prebuild --platform android --no-install
# From apps/mobile/android, with JDK17/Android SDK configured:
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --max-workers=4 --console=plain
adb -e install -r apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

**BUILD SUCCESSFUL:1m27s,368 tasks executed.** Configuration reported compile/target SDK36, build-tools36.0.0, minSDK24, NDK27.1.12297006. APK **89,150,106 bytes**, SHA-256 **66d651cc12043ec7f56b7802cd4b845dedcad8af6d9c15f47fa9b817b66d6424**. Signing certificate matched the earlier installed development build. Actual emulator `install -r` returned Success and preserved data; no uninstall/storage clear was used.

This is an **arm64 development APK**, requiring Metro for current JavaScript. It is not a standalone release. Final application code was served from this branch over Metro8084/API8857, isolated from phone8787/8081 and old private state. Physical installation on the latest Redmi remains NOT RUN.

## Actual emulator core flow

Owned emulator5554, sdk_gphone16k_arm64/arm64-v8a, Android17, SDK37/full37.1, 1080×2400, density420; no physical phone connected. Detailed current screen/edge results are in the [33-image inspected capture pack](ui/final-acceptance/README.md). Native core was exercised against fresh isolated mandatory-Cedar API with **one corridor/no incidents/zero droplets**:

1. Visible synthetic corridor pin selected in the running map; generated emulator camera scene captured, resized and saved as a private JPEG (1280×1108,14,254bytes; inspected JPEG contains no Exif marker and its persisted SHA-256 matches). It is not a real water scene or physical camera test.
2. Idle app cold-restarted; the same private image/draft and its synthetic pin recovered. System/Light/Dark selection and draft retention were observed.
3. Only emulator API forwarding was removed. Upload displayed **“Network unavailable. Saved private drafts remain on this device; retry when connected.”** No false upload/publication success occurred.
4. Same forwarding/API restored; same draft uploaded and reached the explicit **LOCAL/DEMO manual review / no image model** state.
5. Waterlogging/severity2, disclosed staged note and the two deliberate demo consent inputs were submitted once through the app.
6. Native receipt, map warning and contribution history displayed. Persisted data independently showed **1 ACCEPTED report,1 UNVERIFIED incident,1 route,1 ledger entry amount+2**. No second identity or corroboration was manufactured.

Review-note typing and Android Back retained the input/sheet when tested through the focused native keyboard path. Rapid ADB `input text` containing multiple r/R characters caused a development-client reload; the installed React Native source confirms its double-R hardware-key reload recognizer. The draft remained recoverable. This is an automation/development-client limitation; physical soft-keyboard acceptance remains required.

Initial launch encountered Metro500 because a newly created file was absent from its running file map. The exact crash diagnostic was retained privately. Restarting only the owned Metro with `--clear` resolved it; no emulator wipe, app-data clear or crash-report submission occurred. Subsequent bundle/native flow succeeded.

## Data-preserving rehearsal tools

`pnpm demo:serve --android-usb` creates private temporary state and seeds only the corridor. It retains evidence on exit and prints the exact same-take `--resume` command. Default API8787/Metro8081 remain compatible with the standard phone setup. Do not switch servers while a wanted private draft depends on the previous server; cached UI must be refreshed and actual zero-state checked.

Manual CLI checks passed: fresh API one route/no events/zero droplets; explicit resume retained those values; occupied port, unmarked resume directory and invalid port all refused. The automated regression additionally proves occupied-port resume preserves a retained private draft/JPEG and unrelated route. Existing `.local-data` is untouched. [Owner sequence](OWNER_FINAL_ACTIONS.md), [five pending physical rehearsals](FIVE_REHEARSALS.md).

## Reproduced limits and unfinished acceptance

- Distinct old/new grants may reuse an evidence key. A delayed old PUT after completion was actually reproduced; confirmation rejected with409 after SHA-256 mismatch, with zero events/awards. Same-nonce concurrency is fixed; cross-grant versioning is not claimed. Retake stale/mismatched evidence.
- Simultaneous first reports with delayed candidate reads created two UNVERIFIED incidents and provisional2/2 awards. No corroboration bonus occurred; global spatial serialization is not implemented. Sequential fusion is covered.
- Public basemap assets require internet; straight-line corridors cannot provide road navigation. Tank/Stress are calculated assumptions/demo inputs. TankerOS is preview, HeatSafe planned.
- Latest Redmi install/camera deny/recover/varied capture/location/offline/large-text/TalkBack/attribution and full calculator/theme checks remain owner-dependent. Earlier phone results remain historical evidence only.
- Five timed physical rehearsals remain NOT RUN. Final physical video NOT RECORDED, video URL NOT AVAILABLE, form NOT SENT. Internal emulator preview never replaces physical evidence.
- AWS cloud and Cedar Lambda packaging remain unverified; no AWS work was attempted in this sprint. P0 remains incomplete.


## Final native calculator and presentation matrix

Executed 21:19–21:53 IST on the retained isolated take; genuine selected captures are published separately from the private runtime. My Water reset Keep retained600L/40%/~48h/day1; explicit tank-only reset produced900L/60%/~72h, and one simulation produced600L/40%/~48h. Native edits2000L/25%/200Lday computed500L/~60h with USER ENTERED source labels. Zero use displayed no depletion estimate; zero level displayed0L/Tank is empty. Capacityabc/0/1000001,level101 and use0.001 each displayed a field-specific validation error with no forecast. Dark→Light retained invalid text/error; rapid numeric2345/25%/200 restored after idle force-stop/relaunch as586.3L/~70.4h, Saved on this device. Back dismissed the keyboard without closing the tank sheet. Simulated storage-failure regression is separate from native persistence proof.

Stress weights25/15/15/20/15/10% and default60/HIGH/100% were inspected. Missing supply renormalized remaining weights at75% coverage; missing supply+groundwater gave55%/Limited data/no headline. Missing supply+heat gave exactly60% coverage and51/HIGH, with renormalized contributions. Supply101/abc suppressed the headline with explicit errors. Restore DEMO inputs returned60/HIGH/100%. These are fictional calculations, not an environmental feed. TankerOS cards were noninteractive DEMO supplier/price/volume previews; HeatSafe remained PLANNED.

150% font rendering/scroll inspected Map,MyWater,Stress,Vision,Routes,Profile and Layer labels in the running emulator; normal scale was restored/read back1.0. Route-name edit persisted Dark→Light with origin/save correctly disabled before pin selection. Panned viewport/synthetic pin remained through Light↔Dark. Missing live configuration was inspected in both themes using a separate config-less Metro; LOCAL8084 was then restored. No fabricated values or live Cognito sign-in test was used. A fresh emulator camera draft survived Light/Dark,150% Activity restart and tank-only reset; the existing corridor and one+2 ledger entry remained. The draft is intentionally unuploaded and retained. Physical camera/GPS/TalkBack cases remain pending.

A small copy defect observed in actual Home captures (`1 current citizen reports`) was corrected to singular/plural text only. No policy, geometry, UI design or feature behavior changed; final delivery checks cover this edit. Earlier captures remain genuine, including their historical wording.

## Internal preview artifact

Produced and inspected a **163.000-second (2:43),1920×1080,H.264/30fps** internal storyboard using13 frames:10 genuine inspected runtime captures, actual prepared Cedar proof, a clearly future architecture frame and credits. It has **no narration/audio**, identifies **INTERNAL EMULATOR STORYBOARD PREVIEW / STILL CAPTURES** on every frame, and states that final physical-phone video is NOT RECORDED. It is retained in the owner's ignored local tooling directory, not uploaded or submitted. The exact duration is a generated storyboard timeline, **not a successful measured phone rehearsal**. It previews framing and disclosure, not finished video pacing.

The prepared policy/proof frame contains the real unchanged owner permit and actual sanitized `pnpm cedar:demo` results at sourcec2a8148. No fake application screenshot, fabricated outcome, personal scene or cloud verification was generated. Final phone footage/narration, five measured rehearsals, owner PR review/approved merge and publication/form receipt remain required.

Both-theme incident detail showed the single-report/unverified status, source/freshness/expiry and category-policy60m radius explicitly distinguished from measured extent. Native attribution popup was opened/read in both appearances; the three standard data-source credits were visible. Header icon controls had explicit accessibility labels and126px bounds (~48dp at420dpi); actual TalkBack is still pending. Cloud PKCE sign-in, native storage-failure injection and comprehensive rotation/performance acceptance remain unexecuted. The missing-config list duplicated API_URL cosmetically but failed closed; no cloud value was fabricated. Final scoped screenshots confirmed the singular Home copy and restored normal font scale.


## Final local freeze checks

All eight requested commands were executed again after the Home copy correction and final handoff documents: **PASS,212 tests/23 suites**, test start **2026-10-09 21:57:41 IST**. The reviewed worktree was based on c2a8148 plus the one-line singular/plural fix and documents; final committed source is identified by the PR/head and its same-SHA CI, rather than relabelling the older run. Final local Cedar benchmark: initialization **32.773875 ms**, median **0.294958 ms**, p95 **0.384208 ms**, 1,000 decisions /500 allow /500 deny. These remain local-host measurements.

The exact System→Light→Dark→System sequence was additionally inspected after the main native audit. System displayed Following device:light. After an idle force-stop/relaunch through Metro8084, the same System preference was inspected again and the same unuploaded synthetic JPEG/pin recovered. Home remained functional with the singular report copy and retained route warning. Phone data/server state was not reset. The emulator is left at Home with System appearance and font1.0; its synthetic private draft is intentionally retained.

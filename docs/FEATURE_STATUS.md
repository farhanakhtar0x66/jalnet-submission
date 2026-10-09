# Build It feature audit and execution plan

Initial audit: 2026-10-08, Asia/Kolkata, starting at 087a225 with existing acceptance-document drafts retained. The owner's Build It strategy authorized the narrow secondary features below, superseding the earlier feature freeze for that scope. Cedar stays frozen at 9422fc2. The historical engineering branch was `codex/build-it-features`, with visuals initially assigned to Aryan. On 2026-10-09 the owner reassigned the complete UI/theme redesign to Codex on `ui/jalnet-redesign`, starting from `2dbbc4f`; testing/product choices/recording/submission remain with the owner. The phone battery died before the requested MW-03 close/reopen check, so new-screen physical acceptance remains pending.

The [official overview](https://www.wemakedevs.org/aws/env) was reread on 2026-10-08: it supports local AWS open-source use, explicitly lists Cedar, and needs no AWS account for Build It. The [rules](https://www.wemakedevs.org/aws/env/rules) still impose opening-time/original-work, team, participation and submission requirements. This supports the chosen technical path, not a claim of overall eligibility. Preserve all Git dates/history; organizer clarification remains pending. AWS SSO is not a primary-submission dependency; cloud acceptance stays BLOCKED_AWAITING_SSO.

## Historical feature-increment execution plan

1. Publish a practical [UI handoff](ARYAN_UI_HANDOFF.md) and stable additive local data interfaces before feature implementation. Do not redesign the core screens or change existing HTTP contracts.
2. My Water: validated capacity/level/daily-consumption inputs, executable remaining-volume/depletion arithmetic, explicit one-day simulation, account-scoped persistence in the existing SQLite database and explicit fixture reset. Add calculation and persistence/recovery tests; run the full local gate.
3. If step2 is stable, Water Stress: six transparent weighted sample pressures, missing-input renormalization/coverage gate and inspectable contributions. No external-feed, map raster, environmental measurement or route-safety claim. Add calculation tests; repeat the gate.
4. TankerOS sample discovery as a noninteractive DEMO preview; HeatSafe as a PLANNED roadmap card. No booking/payment/contact/backend or dead buttons.
5. Update actual status/evidence, handoff, three-minute shot list and submission disclosures. Review coherent commits before push. Final video/submit still needs owner approval.

The later explicit UI assignment supersedes the earlier presentation restriction in step 1. The implemented redesign preserves the feature/domain contracts, private report flow, frozen Cedar and AWS boundaries; its actual evidence and remaining checks are recorded in [UI_REDESIGN_REPORT.md](UI_REDESIGN_REPORT.md).

## Starting feature matrix

WORKING means executable behavior with evidence in the stated environment, not production acceptance. DEMO_SIMULATION means a functioning disclosed substitute/sample; PARTIALLY_WORKING identifies the missing portion. PLANNED and BLOCKED do not claim implementation.

| Feature | Starting classification | Actual evidence / limitation | Authorized next action |
|---|---|---|---|
| Street map and attribution control | WORKING | Historical native MapLibre/OpenFreeMap Liberty streets on Redmi; internet required, physical attribution popup acceptance pending | Preserve; visuals initially assigned to Aryan, later reassigned to Codex |
| Real Android camera/private draft/local upload | WORKING | One real staged Redmi JPEG/manual local confirmation; prior emulator restart evidence | Preserve; owner reports permission review, detailed cases not agent-verified |
| Manual classification/consented public incident | WORKING | Local HTTP and phone evidence; no local image model | Preserve human confirmation |
| Incident fusion/freshness | WORKING | Actual local domain/HTTP tests; two fixture identities, not independent citizens | Preserve |
| Saved-route warning | DEMO_SIMULATION | Actual intersection calculation over stored straight-line demo corridors; not road navigation | Preserve route warning and disclosure |
| Droplets/replay guards | WORKING | Local atomic ledger/replay tests and actual+2 staged phone contribution | Preserve; no fabricated impact metrics |
| Offline draft/cache recovery | PARTIALLY_WORKING | Actual emulator recovery/cache evidence; development client requires Metro, phone outage matrix incomplete | Preserve; owner tests physical cases |
| Cedar private-report authorization | WORKING | Real mandatory Node24/WASM decisions and40 engine/HTTP tests, frozen9422fc2 | No changes |
| AWS cloud services/Cognito/Nova/Location | BLOCKED | SDK/CDK/guards present, live access BLOCKED_AWAITING_SSO; Cedar not in Lambda | Retain future path; no cloud work this increment |
| My Water | PLANNED | No screen, tank model, persistence or calculator at audit | Highest-value working increment |
| Water Stress | PLANNED | No area-input calculator/detail UI at audit | Narrow explainable sample prototype after My Water |
| TankerOS | PLANNED | No supplier/reservation implementation at audit | DEMO preview with no booking action |
| HeatSafe/future intelligence | PLANNED | No heat exposure data/scoring/safer-route implementation | Static PLANNED preview |
| Push/video/background learning/IoT/payments/official feeds/prediction | PLANNED | No delivered feature; preserved plan is a roadmap | Outside this authorization |

## Completion evidence

First increment executed2026-10-08 at17:41 IST: My Water now has executable calculation/simulation, the minimal mobile screen and validated account-scoped persistence. `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm synth`, `pnpm test` (**14 suites /148 tests**), `pnpm mobile:bundle` and `pnpm smoke:local --isolated` passed. New37 tests cover26 tank/input cases and11 storage-port cases; all111 baseline tests are retained. Native SQLite/UI and new-feature physical acceptance are not inferred from these tests. Water Stress/vision remain planned at this increment. Original cloud P0 is not complete.

## Delivered feature matrix

| Feature | Final classification | Actual behavior / acceptance limit |
|---|---|---|
| My Water manual inputs/calculation | WORKING locally | Validated capacity/level/daily use, actual volume/hours arithmetic, per-field provenance, zero/empty handling, immediate valid edits and private account-scoped SQLite state. Emulator edited75% →1,125L/90h and saved. New-screen Redmi acceptance pending. |
| My Water one-day simulation/reset | DEMO_SIMULATION, executable | Actual daily depletion, no wall-clock/sensor input; six-decimal derived percentage avoids floating tails. Account's fixture only reset; no reports/ledger effect. Emulator75% →55%,825L/66h and restart restored state. |
| Water Stress | DEMO_SIMULATION, executable calculator | Six fictional editable area pressures, §21.2 weights, available-weight renormalization and60% coverage gate. Emulator full inputs60/HIGH/100%; omitted supply+groundwater55% coverage/no headline. No live/official measurements or map heat layer. |
| TankerOS preview | DEMO_SIMULATION, static preview only | Two fictional supplier/volume/sample-price cards; visible DEMO. This is not working discovery against enrolled suppliers, booking, reservation or order-status simulation. |
| TankerOS actual reservations/payments/contact | PLANNED | No operation/API/button, nothing booked/paid/contacted. |
| HeatSafe/future intelligence | PLANNED | Visible roadmap card only; no heat data/scoring/routing/prediction functionality. |
| Existing Android report/incident/route warning/ledger/Cedar | WORKING in previously evidenced local scope | All111 original tests retained, including40 frozen Cedar tests. Real local HTTP smoke still executes full report→warning→ledger/fusion/replay. Prior Redmi camera evidence remains historical; no new physical-camera result is inferred. |
| Future AWS cloud deployment/Cedar Lambda | BLOCKED | Architecture/guards intact, BLOCKED_AWAITING_SSO / packaging unverified. Not a primary Build It dependency. |

The [seven before-design UI references](ui/README.md) and [implementation report](IMPLEMENTATION_REPORT.md) retain the feature-increment screenshot/controller evidence. They depict the earlier presentation, including Liberty on the map. Calculator tests cannot make demo data genuine environmental measurements. No P0-completion or eligibility claim.

Historical feature-increment local gate: **15 suites / 165 tests**, preserving 111 core tests plus 54 additions (27 tank, 11 persistence, 16 Stress/demo contract). Format/lint/types/synth/Android export and `pnpm smoke:local --isolated` passed after the native input-format fix. Actual earlier emulator reset and 55%/35% simulation retests passed; native SQLite restart and Stress missing-data evidence remain separate from Redmi acceptance. Seven inspected synthetic before-design references were delivered. See [actual report](IMPLEMENTATION_REPORT.md). No final recording/submission or cloud verification occurred.

## Current UI/theme increment

The final current-source gate after native polish **passed all eight local checks**: format/lint/types/synth, **181 tests across 16 suites**, Android export, real Cedar check and isolated local smoke. All 165 baseline tests are preserved, with 16 theme tests added. The replacement arm64 debug APK actually built, installed with `-r` and launched on the owned API37 emulator. The charged Redmi still needs the compatible replacement installed in place; wanted tank/draft/cache/appearance state must be preserved. See the [after-design screenshot pack](ui/redesign/README.md).

| Current presentation / native observation | Actual evidence and acceptance limit |
|---|---|
| System/Light/Dark Appearance | Exactly three choices, immediate Light/Dark overrides, System following OS Dark→Light, System cold restart and explicit Light/Dark cold restarts: native PASS. Existing SQLite preference/ordered persistence retained. Redesigned Redmi acceptance remains pending. |
| LOCAL basemap and credits | Positron Light; bundled adapted OpenFreeMap Dark with [source/design notices](../third-party/openfreemap-styles/README.md). Both native maps rendered; panned viewport/chosen pin/route retained across appearance changes. New 48 dp credit popups PASS in both modes; only the three standard data-source credits were visibly confirmed. Dark Matter/JalNet notices remain linked separately. External map assets need internet. |
| Inspected synthetic native screens | Home/warning/event details, basic water/supplier screens and Stress default 60/HIGH/100% in both modes. Profile both modes: 4 droplets, +2/+2 ledger entries. HeatSafe PLANNED Light/Dark. [Exact matrix](UI_REDESIGN_REPORT.md) and 36-capture pack distinguish iterations and pending cases; no blanket native pass. |
| My Water arithmetic and retention | Native reset 900 L/60%/~72h; one simulation 600 L/40%/~48h. Final Light cold restart restored 600 L/40%/~48h/day 1 with 1,500 L USER ENTERED capacity. Earlier 75%/1,125 L/~90h APK-update/cold-restart result remains historical. Owner MW-01/MW-02 describe earlier phone UI; MW-02 source/day unreported and physical MW-03 interrupted. |
| My Water invalid edit | Capacity 0 suppressed result/disabled simulation; invalid text retained across theme change. A valid intermediate capacity 1 had already saved during per-character edits, so this does not prove the preceding 600 L tank stayed unchanged throughout the edit sequence. Invalid 0 itself was not saved. |
| Keyboard, consent and compact enlarged text | Dark focused note visible above Gboard; consent 52×48 dp. At 840×1800 pixels/density 420/font scale 1.3: Dark Home warning clearance, Light Water tab visibility, focused numeric/error visibility and reachable footer actions PASS. Complete accessibility/physical acceptance remains pending. |
| Recovered private draft confirmation | Mobile-only lat/lon normalization fixed source/accuracy metadata rejection. Preserved JPEG restored/confirmed through native local HTTP in Dark, followed by warning/ledger: PASS. All eight final checks PASS at 181/16; API/schema/storage/backend/Cedar unchanged. |
| Host/OS interruptions | Host QEMU `EXC_BAD_ACCESS` after about three hours; no conclusive root cause/JalNet app crash established by supplied log. Same AVD recovered headlessly without data clear; OS WebView update killed JalNet, Android crash buffer empty, relaunch succeeded. Scoped emulator inspection complete. |
| Remaining native/physical cases | Stress limited/missing/invalid, empty tank/zero-use not retaken for redesigned UI. Full TalkBack, Redmi, target performance, offline and full permission/recovery matrix PENDING; five physical rehearsals/final video PENDING. |

The UI assignment does not authorize new cloud/feature functionality. Cedar remains frozen at `9422fc2`; AWS remains **BLOCKED_AWAITING_SSO** with intended profile `jalnet` / region `ap-south-1`. All five timed physical rehearsals and final recording/submission remain pending; no P0 completion or eligibility claim.

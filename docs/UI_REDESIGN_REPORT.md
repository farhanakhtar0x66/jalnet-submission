# JalNet mobile UI redesign report

Prepared 2026-10-09 (Asia/Kolkata) on `ui/jalnet-redesign`, beginning from the reviewed feature branch at `2dbbc4f`. The redesigned arm64 development APK was built, updated in place and inspected on the owned API37 emulator. This report separates actual local/native evidence from outstanding physical and cloud acceptance. The local Build It gate and live AWS gate remain separate. This redesign does not establish overall hackathon eligibility or JalNet P0 completion.

## Implemented screen inventory

| Screen or shared layer | Exact implementation files | Implemented presentation and preserved behavior |
| --- | --- | --- |
| App root and configuration block | `apps/mobile/App.tsx`; `apps/mobile/app.json` | Safe-area provider, theme hydration behind the splash screen, themed configuration error and app-wide Appearance dialog. Invalid live configuration still blocks; it never silently falls back to local mode. |
| Theme and Appearance | `apps/mobile/src/theme/tokens.ts`, `preference.ts`, `storage.ts`, `ThemeProvider.tsx`, `AppearanceDialog.tsx`, `index.ts` (all in the same `theme` directory) | Semantic light/dark colors, typography/spacing/radii, typed System/Light/Dark selection, immediate session updates, ordered device persistence, recovery messaging and supported system-bar styling. |
| LOCAL map presentation | `apps/mobile/src/theme/mapStyle.ts`; `apps/mobile/src/theme/openfreemap-dark.json` | Stable Dark descriptor and bounded background/text paint adaptation; Positron Light. Existing Amazon Location URL/key behavior is preserved. |
| Development-build presentation | `apps/mobile/plugins/withDevMenuPresentation.cjs` | Idempotent Android manifest metadata disables the obstructing development-menu floating button and launch tutorial; developer shortcuts remain. Native update inspected. |
| Shared UI and icons | `apps/mobile/src/design.tsx`; `apps/mobile/src/Button.tsx`; `apps/mobile/src/Icon.tsx` | Cards, text, input fields, provenance/status pills, headers, loading/error states, keyboard-aware scrolling, icon buttons and themed action variants. Icons use a consistent stroke and icon-only actions have accessible labels. |
| Map/home and navigation | `apps/mobile/src/Home.tsx` | Compact JalNet header and LOCAL/DEMO indicator; prominent native street map; location/layers controls; central private-report camera action; routes, My Water, profile and Appearance access. Citizen report clusters, selected pin, route geometry, event freshness/provenance, affected-area semantics and native attribution remain. Current route warnings require actual fresh supporting data; unknown/no-reports states do not imply safety. |
| Layers and event detail | `apps/mobile/src/Home.tsx` | Named layer choices and selected state; readable report summary, verification/freshness, observation count, dates and approximate affected radius; existing independent-observation actions and foreground-location requirements remain. |
| Camera/private report | `apps/mobile/src/ReportFlow.tsx` | Camera primer, capture/preview, private-draft status, upload/manual-review progress, category/severity controls, grouped consent fields, retry/error states and successful return-to-map state. Local mode does not claim image-model analysis. Closing keeps drafts; existing deliberate discard/finish behavior remains. Busy-state dismissal guards prevent interrupting an active operation. |
| Saved routes | `apps/mobile/src/Home.tsx` | Route-name input, origin/destination guidance, route cards, refresh/delete controls and explicit reported-hazard/checking/unknown/no-intersection wording. LOCAL/DEMO routes remain straight-line fixtures, not navigation directions or calculated alternative routes. |
| Profile and sign-in | `apps/mobile/src/Home.tsx`; `apps/mobile/src/SignIn.tsx` | Actual droplet balance and immutable ledger, provisional-reward explanation, loading/error/empty states, Appearance entry and themed Cognito sign-in presentation. No invented litres-saved or people-helped metric. |
| My Water | `apps/mobile/src/features/MyWater.tsx` | Actual computed litres, validated percentage tank gauge, approximate hours/days, explicit provenance, three unit-labeled inputs, local loading/saving/saved/error states, simulation/day count and confirmed tank-only reset. Narrow/enlarged-text layouts stack the hero gauge. |
| Water Stress | `apps/mobile/src/features/WaterStress.tsx` | Calculated DEMO INDICATOR score/band, weighted coverage bar, editable fictional pressures, pressure visuals, base/effective weights and contribution points. Missing/invalid/limited-data states and reachable method/limitations remain. |
| TankerOS and HeatSafe | `apps/mobile/src/features/VisionPreview.tsx` | Fictional DEMO supplier/volume/price cards without booking/contact/payment actions; HeatSafe remains visibly PLANNED without heat data, exposure score or implemented heat-aware routing. |
| Water navigation | `apps/mobile/src/features/WaterHub.tsx` | Accessible My Water/Stress/Vision segmented tabs, shared Appearance/Close header, scrollable content and working return-to-map action. |

Dependency pins are recorded in `apps/mobile/package.json` and `pnpm-lock.yaml`; the 16 new checks are in `tests/theme.test.ts`. Complete imported notices are in `third-party/lucide/LICENSE` and `third-party/openfreemap-styles/`. README, implementation status/report/decisions, blockers, feature/UI handoff, physical acceptance, rehearsal and submission guides were updated to distinguish current native evidence from remaining owner/cloud tasks. The screenshot pack lists every newly committed evidence image.

The seven inspected original emulator references remain in [the before-design reference pack](ui/README.md). The [after-design pack](ui/redesign/README.md) contains inspected, unaltered screenshots from the running native Android app, using only synthetic fixtures. Captures document several inspection iterations; the pack explains the scope of each image.

## Exact appearance behavior

- **System is the default.** `resolveTheme()` follows React Native `useColorScheme()`. Unavailable/unspecified system appearance resolves deterministically to light.
- **Light and Dark are explicit overrides.** Choosing either changes the session presentation immediately, regardless of the current device appearance. Returning to System resumes following the device.
- **Persistence touches one device-wide key:** `jalnet.appearance.v1`, through `SQLiteStorage("jalnet-cache.db")` from the already-used `expo-sqlite/kv-store`. No draft, cache or tank reset is performed.
- **Hydration is gated:** `ThemeProvider` renders children only after preference loading completes. `App.tsx` keeps the native splash until that point. Native cold launches restored the chosen app-content mode. The Android launch splash and Expo development-client bundle loader follow OS appearance rather than the persisted app override; release-build startup/no-flash acceptance remains pending.
- **Failures are visible and redacted.** An unavailable/malformed preference loads System with recovery messaging without deleting the stored value. A failed write retains the chosen session appearance and exposes a retry action. Rapid choices are serialized; the last successful choice remains persisted.
- **Theme updates preserve component identity.** Appearance is not used as a component key. Theme changes do not intentionally reset the selected water tab, form input, selected pin, routes, camera state or private drafts.
- **Android chrome is applied where supported.** Status and navigation foreground changed with Light/Dark in the inspected emulator. Expo SystemUI updates the root background. Native Android dialogs can follow the OS rather than an explicit app override; the tank-reset dialog was readable but Light under a Dark override. Redmi/OEM behavior remains pending.
- **Local map styles follow the resolved mode:** OpenFreeMap `positron` for light and a bundled, color-adapted OpenFreeMap Dark descriptor for dark. The existing native map/camera remains mounted with an initial view state instead of being keyed by theme. A panned viewport, chosen pin, markers and route line retained their positions during an actual Dark → Light switch. Both street styles and warning overlays rendered natively.
- **The Amazon Location branch is preserved.** Its regional URL, restricted map key and live configuration validation are unchanged; this report does not claim a cloud map was exercised.

| Semantic token | Light | Dark |
| --- | --- | --- |
| Background | `#F5F8FA` | `#101922` |
| Surface | `#FFFFFF` | `#1B2A35` |
| Main text | `#102A36` | `#EDF5F8` |
| Secondary text | `#526977` | `#ADC0CD` |
| Primary | `#087580` | `#65D3E2` |
| Border | `#DCE6EB` | `#435963` |

The light primary is slightly darker than the design reference to support readable contrast. Automated palette tests cover normal semantic text on standard surfaces and paired accent/status colors at a minimum 4.5:1 contrast ratio. This is limited palette evidence, not a claim of complete WCAG or TalkBack acceptance. Route uncertainty is never encoded as a green safety verdict.

## Compatibility and licensing

Pinned mobile versions are Expo `57.0.27`, React Native `0.86.3` and React `19.2.3`. The icon library is **`lucide-react-native@1.53.0`**, using **`react-native-svg@15.15.4`**. Its installed peer declarations admit React 19, React Native and SVG 15. Mobile TypeScript, Android JavaScript export, arm64 APK build/install and actual SVG icon rendering in both appearances passed on the owned emulator. This does not establish Redmi compatibility.

Lucide provides typed standalone SVG components, configurable stroke/color/size and selective imports, fitting the requested restrained line-icon system without a UI framework. The installed library is ISC-licensed; Feather-derived icons retain MIT notices. The full upstream notice is included at `third-party/lucide/LICENSE`. JalNet's MIT project license and existing Cedar notices are retained. [Lucide React Native documentation](https://lucide.dev/guide/react-native), [Lucide license](https://lucide.dev/license).

The existing Expo SQLite dependency is pinned to `57.0.4`. Installed source confirms the `SQLiteStorage` constructor accepts an explicit database name. Expo documents its SQLite-backed key-value store as available without a separate persistence dependency; choosing the existing database avoids introducing another store or clearing user state. Actual native cold restarts restored explicit Light/Dark and System preferences, alongside saved tank state. [Expo SQLite documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/#key-value-storage).

Expo's SVG documentation describes native support; OpenFreeMap documents using its styles with MapLibre Native. The new 48dp credits control actually opened the native attribution popup in both appearances; OpenFreeMap, OpenMapTiles and OpenStreetMap credits were visible. The full Dark Matter source/design and JalNet color-adaptation notices are preserved in [the distributed style notices](../third-party/openfreemap-styles/README.md); extra descriptor attribution is not claimed to appear in the native popup. Native dialog colors do not establish complete accessibility contrast acceptance. [Expo SVG documentation](https://docs.expo.dev/versions/latest/sdk/svg/), [OpenFreeMap mobile style guidance](https://openfreemap.org/quick_start/).

The stable 47-layer Dark descriptor retains upstream tile/sprite/glyph endpoints, geometry, filters and label layout. `mapStyle.ts` changes only background and text paint/halo colors after native inspection found low-contrast upstream labels. Complete MIT/BSD/CC source/design notices are included. External basemap assets still require internet; the descriptor is not an offline map.

## Preserved engineering boundaries

The Cedar authorization implementation remains frozen at `9422fc2`. No policies, principal/ownership sourcing, report authorization, provider/repository interface, Cognito/JWT boundary, S3/SQS/DynamoDB integration, Lambda handler, IAM/CDK resource or AWS deployment guard was rewritten for presentation.

Water calculations/contracts, `useLocalFeature`, feature persistence/storage and `demo-data.ts` are unchanged from `2dbbc4f`. The UI continues to call `parseTankForm`, `calculateTank`, `editTank`, `simulateTankDay`, `tankForm`, `parseStressForm` and `calculateStress` without introducing display-only hardcoded results.

My Water retains schema validation, immediate valid-input calculation, ordered account-scoped SQLite writes, saved-state hydration, failed-save retry, last-valid retention during invalid editing and confirmed tank-only reset. The fixture produces 900 L/60%/~72 hours; one simulated day produces 600 L/40%/~48 hours. Zero consumption and an empty tank retain their distinct existing calculator states. Simulation is deliberate, not wall-clock consumption or a meter feed.

Stress retains six nullable fictional pressures, fixed original weights and renormalized available contributions. Below 60% original weighted coverage, no headline score is published. Zero is present input; missing is excluded. Invalid edits suppress the result. Edits remain ephemeral and reset when the Stress view reopens. The indicator is disconnected from incident severity, route warnings, droplets and personal tank inputs.

Private capture, upload/retry, confirmation, incident fusion, route intersection, stale-data warning suppression, ledger idempotency and existing demo/live separation remain required regression boundaries. No feature was deleted to simplify the UI. No final recording or submission was performed.

## Water-screen action inventory

| View | Actual controls |
| --- | --- |
| WaterHub | My Water, Stress and Vision tabs; Appearance; header Close; footer Close/return to map |
| My Water | Capacity, level and consumption inputs; conditional retry-load; simulate one day; conditional retry-save; reset fixture |
| Reset dialog | Keep; Reset tank only |
| Stress | Six pressure inputs, including clearing to mark missing; restore DEMO inputs |
| TankerOS/HeatSafe | No booking, contact, payment or feature action; shared navigation/Appearance/Close remains |

Simulation remains disabled while loading, for invalid form data or at the existing 36,500-day limit. Reset still requires explicit confirmation and affects only the tank. Invalid fields do not overwrite the last saved tank. Save failures are not labeled as saved.

## Automated evidence actually obtained

The final current-source gate below ran after the last source fixes, at approximately 13:22 on 2026-10-09. Native and physical acceptance remain separate.

| Command | Actual result |
| --- | --- |
| `pnpm format:check` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS, including mobile TypeScript |
| `pnpm synth` | PASS; synthesis only, no AWS deployment |
| `pnpm test` | PASS: **181 tests across 16 suites** |
| `pnpm mobile:bundle` | PASS: Android JavaScript export |
| `pnpm cedar:check` | PASS: real Cedar engine, 1,000 decisions, **500 allow / 500 deny** |
| `pnpm smoke:local --isolated` | PASS: existing report/upload/manual confirmation/incident/route/ledger/idempotency workflow in isolated local state |

All **165 baseline tests** are preserved, including the existing 40 Cedar tests. The **16 added theme tests** cover accepted options, System/override resolution, chrome content styles, fresh-store hydration, persistence through a new storage-port instance, corruption/read/write redaction, unrelated-data preservation, invalid writes, ordered rapid choices and semantic palette contrast. Storage-port tests are not native SQLite persistence proof.

The first full test attempt encountered sandbox `EPERM` when local HTTP listeners were disallowed. The same tests were rerun with authorized local-listener access and passed. This was recorded as an execution-environment limitation, not hidden or counted as a passing first attempt.

The final local Cedar measurement on Node 24.21.0/macOS arm64 was **33.116 ms initialization**, **0.294 ms median decision**, **0.439 ms p95 decision**, with 500 allow and 500 deny decisions. These are one machine's local runtime measurements, not Android or AWS Lambda performance claims. No Lambda WASM packaging or live AWS integration was marked verified.

## Native visual and runtime evidence

See [the inspected after-design screenshot matrix](ui/redesign/README.md) for exact files. The owned `JalNet_UI_API37` arm64 AVD used 1080×2400 pixels at density 420 (approximately 411dp wide), with a smaller 840×1800 / density 420 / font-scale 1.3 case (approximately 320dp wide). The development APK connected to isolated loopback API/Metro ports 8837/8082; only `adb -e` was used. Synthetic Delhi pins/routes and Android emulator camera patterns/timestamps were used, never a user's precise location or real scene. No phone storage was touched.

| Native check | Actual evidence and limit |
| --- | --- |
| APK build/install/launch and native icons | PASS: arm64 debug build (5m18s, 368 tasks), presentation-plugin rebuild (34s), `install -r`, development-client launch and native SVG rendering. Release/standalone build and redesigned Redmi remain pending. |
| Home street map / warnings / event details | PASS in Light and Dark: native street assets, actual synthetic incident markers, straight-line fixture route, warning and UNVERIFIED event details. Dates/radius/provenance stay explicit. |
| Map style switch | PASS: panned viewport, chosen pin, report markers and route line retained through Dark → Light. Native map identity was preserved. This is scoped local evidence, not AWS Maps or every cluster/zoom case. |
| Attribution | PASS: new 48dp control opened readable native popup in both modes; three standard data-source credits visible. Complete style notices are distributed separately. |
| Private report workflow | PASS: emulator JPEG capture, saved private preview, upload, disclosed manual review, explicit consent, restored-draft confirmation, success/return-to-map, incident warning and +2 ledger. Profile showed 4 total from two +2 entries (one seeded, one native). Real camera and permission/recovery cases remain phone tasks. |
| Routes/profile/Appearance | PASS: route refresh, actual reported-hazard state, origin-needed disabled save control, contribution history and exact three-option Appearance dialog inspected. Route deletion/full native route state matrix not retaken. |
| My Water calculations / reset / simulation | PASS: reset → 900 L / 60% / ~72h / day 0; simulate once → 600 L / 40% / ~48h / day 1. Valid capacity 1600 produced 640 L / ~51.2h; restored 1500 produced 600 L / ~48h. Empty/zero-use remain covered by preserved tests, not newly claimed native cases. |
| My Water invalid editing / persistence | PASS: capacity 0 suppressed result and disabled simulation, remained invalid through a theme switch; native cold restart loaded the last valid input. Per-character deletion had valid intermediate values, so the invalid-edit restart restored 1 L capacity, not the initial fixture. The final valid 1500/40/300 state cold-restarted in Light as 600 L / ~48h. |
| Stress | PASS: default fictional DEMO INDICATOR 60 / HIGH / 100% coverage inspected in both modes. Limited/missing/invalid/restored case arithmetic remains covered by existing tests; this redesign did not retake that full native matrix. |
| TankerOS/HeatSafe | PASS: fictional supplier/volume/price preview in both modes; HeatSafe PLANNED with no live heat metric inspected in both modes. Complete physical matrix remains pending. |
| Appearance/system/persistence | PASS: immediate explicit Light/Dark, System OS Dark → Light, System cold restart and explicit Light/Dark cold restarts. Tank state survived in-place APK update and restart. Native launch splash/development loader and OS dialogs have the platform limitation described above. |
| Input/draft retention across themes | PASS: private preview/manual selection and valid/invalid water inputs retained during actual theme changes. No appearance-driven data reset. |
| Keyboard / scrolling / touch targets | PASS for inspected cases: report note and compact numeric input visible above full Gboard; footer controls reachable by scrolling; Android Back dismisses keyboard/sheet. Consent switches measured 52×48dp and icon controls 48dp in native XML. Complete TalkBack/focus/permission/offline acceptance remains pending. |
| Compact / enlarged text | PASS for inspected 320dp/font-1.3 Home Dark and Water Light/Dark cases after clean app launch. Horizontal map controls cleared the measured warning, tabs retained full labels and keyboard/error/footer content remained reachable. Font-scale layout was checked after relaunch, not certified for every hot font-setting transition. |
| Android chrome | PASS: readable Light/Dark status/navigation foreground in the owned emulator. Redmi/OEM behavior pending. |

The owner-supplied crash log records a null-address `EXC_BAD_ACCESS` in host `qemu-system-aarch64` after about three hours (Emulator 37.1.11). It does not establish a root cause or a JalNet app crash. The same AVD was recovered headlessly with metrics/crash reporting disabled and its storage preserved. Android later killed JalNet for a WebView package update; the app crash buffer was empty and relaunch succeeded. Native checks continued successfully after both interruptions. No crash report was submitted.

### Defects found and corrected through inspection

- Native cold draft recovery carried stored source/accuracy metadata into a strict coordinate request. `ReportFlow.tsx` now selects `{lat, lon}` at restoration and confirmation while retaining accuracy separately. The preserved JPEG subsequently confirmed through the actual local HTTP API; the API/schema and authorization were not weakened.
- Keyboard-open modal forms did not reliably resize. The shared keyboard-aware scroll container uses its measured offset; the note and numeric fields were retested above Gboard.
- Compact navigation labels broke into partial words and map controls overlapped the warning. Water tabs stack icon/label at narrow/enlarged sizes; compact Home controls use a horizontal row and measured warning clearance. Both were retested natively.
- Some row labels lost trailing words during native input updates. Shared row/button text now takes available width; full labels and recalculated values were inspected after edits.
- Native consent switches and built-in map credits were too small. Switches are 52×48dp; the new labeled 48dp credit action invokes the existing native attribution popup.
- Upstream Dark labels were low contrast, and the development-menu floating Tools button covered app controls. The bounded color adapter and Expo Android manifest presentation defaults were rebuilt and inspected; developer shortcuts remain available.

No new service, permission, calculator, policy or product feature was added. Public evidence excludes real phone imagery, private identifiers, credentials and notifications. The screenshot pack records actual runtime output rather than decorative mockups.

## Physical Redmi and submission gate

The owner reported the phone unavailable because its battery died. No physical interaction was requested while it was unavailable. Prior owner-reported tank reset (900 L/60%/~72 hours) and one-day simulation (600 L/40%/~48 hours) remain accepted evidence for the previous UI. The requested close/reopen persistence observation was not completed and must not be inferred. Earlier accepted camera/report/incident/warning/+2 evidence likewise does not establish redesigned-screen visual acceptance.

After charging and installing/updating the compatible dev build without clearing storage, the owner must check real-camera permission/capture, location denial/grant/pin behavior, offline recovery, attribution, keyboard/enlarged text, accessibility, Appearance transitions and saved tank/draft preservation. The functioning USB-local setup and private drafts must remain intact. Five measured rehearsals, final recording approval and submission remain separate owner tasks.

Build It relies on the existing genuine mandatory local Cedar integration, not the UI/icon library. Live AWS remains **BLOCKED_AWAITING_SSO** with intended profile `jalnet` and region `ap-south-1`; account/role verification and live smoke tests remain required before cloud deployment. This UI work does not remove that gate, verify AWS or declare P0 complete.

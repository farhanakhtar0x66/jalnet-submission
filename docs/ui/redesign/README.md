# JalNet after-design native screenshot evidence

Captured and visually inspected on 2026-10-09 (Asia/Kolkata), on `ui/jalnet-redesign` from feature baseline `2dbbc4f`. These 36 PNGs are unaltered screenshots of the running Android application, not generated mockups. The [seven before-design references](../README.md) remain separate.

The owned `JalNet_UI_API37` arm64 emulator used a rebuilt development APK, native MapLibre and SVG icons, isolated LOCAL/DEMO API/Metro ports 8837/8082, synthetic Delhi pins, a straight-line route fixture and emulator-generated camera imagery. No AWS request, real hazard, real phone scene, real precise location or account token is shown. Public basemap assets still require internet.

Default captures are 1080×2400 pixels / density 420, approximately 411dp wide. `compact-*` captures are 840×1800 / density 420, approximately 320dp wide, with font scale 1.3 after a clean app launch. Default dimensions/font scale were restored after inspection. The user's physical phone and USB-local data were untouched.

| Inspected native view | Light | Dark | Actual scope |
| --- | --- | --- | --- |
| Home and route warning | [Light](home-light.png) | [Dark](home-dark.png) | Native streets, two synthetic current reports, route line, warning and final measured control placement. |
| Same panned viewport / chosen pin | [Light](viewport-light.png) | [Dark](viewport-dark.png) | Dark → Light retained map camera, chosen pin, route and marker positions. Aged route check stays uncertain. |
| Appearance | [Light](appearance-light.png) | [Dark](appearance-dark.png) | Exact System/Light/Dark choices and selected state. |
| System follows device | [OS Light](system-light.png) | [OS Dark](system-dark.png) | Actual OS appearance change with System selected. Cold-restart persistence was separately exercised. |
| Event details | [Light](event-light.png) | [Dark](event-dark.png) | UNVERIFIED report, severity, freshness, expiry and category-policy radius. No measured-depth/safety claim. |
| Native attribution popup | [Light](credits-light.png) | [Dark](credits-dark.png) | New 48dp credits action; OpenFreeMap/OpenMapTiles/OpenStreetMap visible. Native popup does not display all additional style credits. |
| Saved routes | [Light](routes-light.png) | [Dark](routes-dark.png) | Refresh, origin-needed disabled save, actual reported-hazard state. Two matching reports explain the two warning messages. No alternate routing. |
| Contribution profile | [Light](profile-light.png) | [Dark](profile-dark.png) | Actual balance 4 from two +2 entries: seeded report plus native confirmation. Provisional reward disclosure. |
| Native camera | [Synthetic live preview](camera-synthetic-light.png) | [Saved synthetic JPEG](private-draft-dark.png) | Emulator color blocks / Android-generated timestamp. These are not real water photos or phone-camera evidence. |
| Manual reporting | — | [Review](report-review-dark.png), [consent](report-consent-dark.png), [success](report-success-dark.png) | No image model ran. Actual private upload/manual confirmation accepted after restored-location boundary correction. |
| My Water | [Light](my-water-light.png) | [Dark](my-water-dark.png) | Actual 600 L / 40% / ~48h after one simulated day; consumption DEMO, level SIMULATED. Capacity 1500 restored through user input. |
| Tank inputs / cold restart | [Restarted Light](water-restored-light.png) | [Inputs](water-inputs-dark.png) | Saved 1500/40/300 → 600 L persisted; full row labels. Reset fixture 900/60/~72 and one-day simulation were also actually executed. |
| Water Stress | [Light](stress-light.png) | [Dark](stress-dark.png) | Fictional calculated 60/HIGH with 100% weighted coverage. Limited/missing/invalid arithmetic is test-covered; full native matrix not retaken here. |
| TankerOS | [Light](vision-light.png) | [Dark](vision-dark.png) | DEMO suppliers/prices/volumes without booking/contact/payment actions. |
| HeatSafe | [Light PLANNED](heatsafe-planned-light.png) | [Dark PLANNED](heatsafe-planned-dark.png) | No heat metric, exposure score or heat-aware routing. |
| Compact Home | — | [Dark](compact-home-dark.png) | Horizontal controls clear the warning; larger font and 48dp icon targets. |
| Compact Water | [Light](compact-water-light.png) | [Invalid form](compact-invalid-dark.png) | Full tab labels; invalid capacity 0 suppresses results and remains invalid through theme change. |
| Compact keyboard/footer | [Gboard input](compact-keyboard-light.png) | [Scrollable footer](compact-footer-dark.png) | Input/error visible above full numeric keyboard; disabled simulation, reset and footer reachable. |

Captures span the inspection iterations, not a single identical fixture or moment: seeded report counts and timestamps changed, route freshness aged, and some earlier sheet images precede the final shared row-text expansion. Home and final tank/compact captures include the corresponding layout corrections. The successful current-source eight-command gate ran after all source fixes: **181 tests / 16 suites**, preserving all 165 baseline tests.

Invalid numeric editing is not a transaction: valid intermediate values can save immediately. Deleting capacity digits one at a time ended at invalid 0; cold restart restored the last valid intermediate capacity 1, not the original 1500. Final valid 1500/40/300 was subsequently saved and restored. Appearance changes did not clear the input, tank, pin or draft.

Dark style is a bounded color adaptation of OpenFreeMap Dark; data/geometry/layout endpoints remain unchanged. Preserve the visible basemap credits, [full style/design notices](../../../third-party/openfreemap-styles/README.md) and Lucide ISC/Feather MIT notices. Dark recording descriptions must link the Dark Matter/design credit and acknowledge JalNet's color adaptation; the native popup's three visible data-source links are not the complete style license notice.

The app-content theme restored on cold launch. Android splash/development loader and some native dialogs can follow OS appearance rather than the explicit app override. This development APK needs Metro and is not a tested standalone/offline release. Actual Redmi camera/location/denial/offline recovery, OEM chrome, complete TalkBack/focus/accessibility, performance, five timed rehearsals and final recording remain pending. Live AWS stays **BLOCKED_AWAITING_SSO**; no cloud verification, overall hackathon eligibility or P0 completion is inferred.

See [UI_REDESIGN_REPORT.md](../../UI_REDESIGN_REPORT.md) for implementation, fixes, exact gates and acceptance limits.

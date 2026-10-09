# Submission native evidence

Actual unedited runtime captures on 2026-10-09, 19:32–19:49 Asia/Kolkata. Tested submission code at `7be3368`; the only subsequent changes are documentation/evidence. Existing approved arm64 debug development APK, API37.1 emulator, 1080×2400/density420/font1.0. This increment used the **new submission checkout** through Metro8083 and an isolated mandatory-Cedar loopback API8847. No new native APK build is claimed; dependencies/native modules were unchanged. Original USB-local8787/8081 settings, phone data, private drafts and source repository were preserved.

Every report/pin/route here is synthetic LOCAL/DEMO over public Delhi basemap assets. The image was generated as a tiny fixture JPEG through the actual local HTTP upload/confirmation workflow; it is not native camera or real environmental evidence. One local unverified report awarded provisional +2 in this disposable server. Geometry is straight-line, not road directions. No AWS access ran.

## Executed observations

- Both theme maps rendered streets and route lines; aged warning became current after explicit refresh. Warning opened the saved-route panel; its reported-hazard and no-intersection text stayed conservative.
- Dark: pre-pin origin/save controls disabled; choosing an origin kept same-point save disabled. A different map pin plus retained name enabled save. Actual API readback returned200 with the new MANUAL/active-alert route alongside the existing corridor. Light cold restart also showed origin/save disabled before a deliberate pin. These behaviors were confirmed through native UI hierarchy and actual interactions, not inferred only from opacity in PNGs.
- Tank-only reset confirmation executed on the emulator:900L/60%/~72h, capacity1500/DEMO FIXTURE, use300L/day/DEMO, simulated-day count0. One explicit simulation produced600L/40%/~48h/day1. Light and Dark preferences and tank values survived separate force-stop/relaunch cold restarts without uninstall/storage clearing. Screenshots show the visible result, while this interaction log supplies reset/restart context.
- Stress summary in both modes showed60/HIGH,100% weighted sample coverage and fictional-input/no-safety/scientific-confidence disclosures. Limited/missing/invalid inputs were not retaken in this increment.
- Both native attribution popups visibly showed only OpenFreeMap, ©OpenMapTiles and OpenStreetMap. The popup follows the OS theme and remains white while the app is Dark. Complete Dark Matter/source/design/JalNet adaptation credits remain in [third-party notices](../../../third-party/openfreemap-styles/README.md) and the recording checklist; they are not claimed visible in the popup.
- Emulator crash buffer read completed with no entries after these checks. This is not a full performance/stability certification. A separate visual review inspected all14 public captures: no material clipping/active-text contrast issue or private content found.

Latest Redmi installation/camera/location/offline/keyboard/attribution/accessibility and full TalkBack remain pending. No permission matrix, native SQLite failure injection, standalone release/offline APK, five timed rehearsal or final recording is inferred. [Current submission gates](../../SUBMISSION_STATUS.md) retain the precise limits.

## Captures

- [Dark route controls before a deliberate pin](submission-routes-unselected.png)
- [Dark same-point destination guidance](submission-routes-same-point.png)
- [Dark distinct endpoints and retained name](submission-routes-distinct.png)
- [Light route controls after cold restart](submission-light-routes-unselected.png)
- [Light native map with synthetic report and route warning](submission-light-map.png)
- [Dark native map after warning refresh](submission-dark-map-fresh.png)
- [Native Light attribution popup](submission-light-credits.png)
- [Native attribution popup while app is Dark](submission-dark-credits.png)
- [Reported hazard and second route with no intersecting reports](submission-light-route-risk.png)
- [Light tank after tank-only reset](submission-light-water-reset.png)
- [Dark tank after simulated day and cold restart](submission-dark-cold-water.png)
- [Light tank after cold restart](submission-light-cold-water.png)
- [Light fictional Stress summary](submission-light-stress.png)
- [Dark fictional Stress summary](submission-dark-stress.png)

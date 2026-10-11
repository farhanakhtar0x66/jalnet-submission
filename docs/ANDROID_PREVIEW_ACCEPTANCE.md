# JalNet Preview native acceptance — exact signed artifact

Source: `952bfde5ae8dfb047f2f95f2d3763f85dd470aca`
APK SHA256: `5cc463b5b25803c3b3e23352d3dee5313dcf5ae4a987267364704f2367cba9da`
Package: `org.jalnet.preview` · ARM64 · Android17/API37.1 ·1080×2400/420dpi

Observed interval: 2026-10-10T07:00:27.522013+00:00 to 2026-10-10T07:30:46.191018+00:00 (12:30–13:00 IST,10Oct2026)

28 actual bounded native cases PASS; no release blocker discovered. Automated229tests/25suites are the root CI gate, not executed by this native audit.

## Observed cases

- **launcher-and-independent-runtime — PASS**: Tapped the observed JalNet Preview launcher icon, not a Monkey launch. Signed APK opened directly to standalone map without a dev-server connection or Metro screen. ADB reverses were empty; owned API/Metro processes remained suspended.
- **public-map-online — PASS**: Actual public New Delhi basemap loaded; no citizen incidents or route warnings appeared. Map is labeled PUBLIC BASEMAP · INTERNET REQUIRED.
- **attribution — PASS**: Opened actual native attribution popup: OpenFreeMap, ©OpenMapTiles, OpenStreetMap. Android Back closed popup.
- **pan-theme-retention — PASS**: Panned real map inside observed viewport. Changed Dark to Light; the panned geographic area remained visible in both screenshots.
- **about-and-capability-disclosures — PASS**: About shows standalone/nonproduction, device-local tank and appearance, fictional Stress/previews, reporting/routes/awards unavailable, no configured report server/photo collection, server-side Cedar separate and absent in APK, live AWS unverified, public map internet/privacy limitation. Both Light and Dark rendered.
- **appearance-in-sheet — PASS**: Appearance opened from water header, changed Light/Dark, and closed without losing water sheet. Actual default tank rendered in both.
- **tank-default — PASS**: Fresh demo fixture rendered capacity1500, simulated60% level,300L/day:900L and ~72hours (~3days).
- **tank-one-day — PASS**: Tapped Simulate one day of consumption. Actual result600L/40%/~48hours with simulation labels.
- **tank-inputs-save — PASS**: Edited synthetic capacity2345/level25/consumption200; Saved on this device and USER ENTERED labels;586.3L/~70.4hours.
- **tank-and-theme-cold-persistence — PASS**: Force-stopped only org.jalnet.preview after saved status, launched observed icon again; Dark appearance and2345/25/200 restored586.3L/~70.4hours.
- **tank-invalid-capacity — PASS**: Capacity abc showed Enter capacity from1to1,000,000litres; actual simulation node enabled=false in native XML.
- **tank-out-of-range-level — PASS**: Level101 showed Enter water level from0to100%; actual simulation node enabled=false in native XML.
- **tank-zero-consumption — PASS**: Valid capacity2345/level25/consumption0 showed586.3L and No depletion estimate with zero-consumption explanation.
- **tank-reset-cancel — PASS**: Reset confirmation explained tank-only effect. KEEP retained2345/25/0 and inputs were still visible.
- **tank-reset-confirm — PASS**: RESET TANK ONLY restored1500 capacity/60%/300 per day:900L/~72hours and DEMO FIXTURE labels. No reporting server exists in this preview; no report or route data was modified.
- **stress-default-and-reset — PASS**: Actual default60/100 HIGH DEMO/100% coverage. Restore Water Stress DEMO inputs restored same result, captured in Light after prior modified inputs.
- **stress-invalid — PASS**: Supply pressure101 showed field error and No headline score with Correct invalid inputs message; removed numeric result.
- **stress-missing55 — PASS**: Supply and groundwater cleared:55% weighted coverage, No headline score, limited-data explanation; missing fields labeled excluded, not zero.
- **stress-exact60-renormalized — PASS**: Supply and tanker missing, groundwater70:exact60% coverage gives53/HIGH. Native factors displayed15%→25.0%,20%→33.3%,10%→16.7% effective weights and10.0/23.3/5.0 contributions. All six base weights observed:25,15,15,20,15,10%.
- **vision-unavailable-actions — PASS**: Actual fictional SupplierA5000L/₹900 andB10000L/₹1600. Labels state no booking action; no booking/payment buttons exist. HeatSafe marked PLANNED and explicitly no measurements/exposure/routing/live safety. Light/Dark inspected.
- **font150-and-back — PASS**: At actual font_scale1.5, Map, water, Stress and Vision labels/readable wrapping/control targets inspected. Icons retained native labels. Android Back closed water sheet. Changing Android font setting recreated activity; reopened sheet retained saved tank. Restored font_scale1.0. This is visual/native-tree inspection, not TalkBack validation.
- **system-follows-os — PASS**: Selected System then cmd uimode night yes:actual Dark map. cmd uimode night no:actual Light map. Restored original OS night=no and final dialog Following device:light.
- **offline-coldstart — PASS**: Airplane1,wifi0,data0; ping failed Network is unreachable. Force-stop/observed icon launch worked, cached basemap tiles visible and internet-required disclosure remained. This does not verify new map areas/tiles offline.
- **offline-device-tools — PASS**: Offline persisted900L/60%/~72h restored; one-day simulation yielded600L/40%/~48h. Stress default calculated60; editing supply0 recalculated40/MODERATE/100% without network.
- **keyboard-and-theme-input-preservation — PASS**: Offline Stress field edited to0 using actual keyboard; Android Back dismissed keyboard; changed Light→Dark in Appearance and real40/MODERATE result/input retained.
- **actual-startup-splash — PASS**: Private diagnostic captured observed launcher tap. Real extracted frame007 shows actual JalNet splash mark, frame009 transition, frame011 map. Recording command limit6s; ffprobe actual duration1.367611s. This is not the final demo recording.
- **crash-observation — PASS**: No visible crash during this30-minute audit. Final current-process logcat has no FATAL/ANR/JS-error lines. Package exit-info contains only three intentional USER REQUESTED/FORCE STOP exits, no crash/ANR entries. Limited observed-session evidence, not performance certification.
- **final-restoration — PASS**: Restoredwifi1/mobiledata1/airplane0/font1.0/OSnightno. Final map online and System appearance shown; reverses still empty during acceptance. Never resumed the preserved processes or used/cleared/uninstalled org.jalnet.mobile; private existing local setup preserved.

## Limitations

- Android17 ARM64 emulator only; physical Redmi install/runtime/battery/performance unverified.
- No actual TalkBack screen-reader test; visual text scaling and native accessibility labels inspected only.
- Map cache visible offline; uncached tile failure/Retry map button was not induced; public map remains internet-dependent.
- Blank tank field, repeated rapid simulation taps, low-memory/background-kill and SQLite failure not physically injected in this APK audit; automated/source gates are separate.
- Camera/GPS/report/upload/route/ledger intentionally absent from this preview; separate local/server proof and live AWS remain separate gates.
- No final demo video recorded; private startup diagnostic only.
- Live AWS SSO remains blocked; no cloud calls/deployments or Cedar-in-Lambda claims.

## Preserved development setup and public evidence

After the isolated audit, the original eight Metro/API processes and seven forwarding mappings were restored without recreating demo state. A separate metadata comparison confirmed org.jalnet.mobile identity, version, installation timestamps and storage path unchanged. No development app data was cleared or migrated.

[Inspected public screenshot pack](ui/android-preview-v0.1.0/README.md) · [Artifact and release record](ANDROID_RELEASE.md) · [Friend testing](ANDROID_TESTING.md). Nine images were visually inspected and copied byte-for-byte; private raw logs and the short startup diagnostic are not published. This evidence documentation is later than immutable artifact source952bfde; it does not rebuild or alter the APK.

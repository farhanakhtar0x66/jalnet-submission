# JalNet final demo script

Prepared 2026-10-09, Asia/Kolkata. **Planned target 2:43**, acceptable final target 2:40–2:45; actual recorded duration NOT MEASURED. Final physical-phone video is **NOT RECORDED**. This supersedes the older planned 2:50 script, without rewriting its historical evidence. The working citizen journey and real Cedar integration are the essential shots.

## Before recording

Complete [owner steps 1–16](OWNER_FINAL_ACTIONS.md), actual [physical acceptance](PHYSICAL_ACCEPTANCE.md) and five measured [rehearsals](FIVE_REHEARSALS.md). Freeze the tested revision/build only after those results. The compatible development APK requires Metro/USB; public map assets need internet. Preserve wanted private drafts and their server evidence. A fresh demo uses only disposable state; never clear/uninstall phone storage to reset a take.

Prepare the seeded LOCAL/DEMO corridor, no prior incident and zero droplets; verify those actual values in the app rather than assuming a reset cleared client cache. Restore My Water’s feature-only fixture and the six Stress sample inputs. Do not run fixture smoke after preparing the interactive take: its reports/awards are separate test data.

Film only a safe staged prop/scene, with no people, addresses or private text. Use the synthetic demonstration pin intersecting the seeded corridor; do not show actual phone location coordinates. Keep JalNet foreground, personal notifications hidden, the cable stable and battery/storage sufficient.

## Exact 2:43 shot list and narration

These are proposed timing budgets, not successful measured footage. Transparent cuts may remove waiting/taps; the shown confirmation, incident, warning and ledger must belong to the same staged report/take.

| Time | Interaction and required visible outcome | Narration |
|---|---|---|
|0:00–0:15|Street map/home with LOCAL/DEMO pill; brief title|“A waterlogged street is an observation, not yet useful information. JalNet connects a reviewed water report to warnings for saved routes. This is our local Android Build It prototype.”|
|0:15–0:35|Choose synthetic pin → Camera → Capture JPEG → private preview → Upload privately|“The scene is staged and the pin synthetic. Capture creates a private draft; only the resized JPEG is uploaded to our local API.”|
|0:35–0:55|Show manual/no-model assessment; select Waterlogging/severity 2; staged note; enable both explicit demo consent inputs; Confirm|“No image model runs here. I review the category and severity, then explicitly confirm this local demo observation. Cedar is already protecting the private-report operations.”|
|0:55–1:15|Return to map → incident detail UNVERIFIED → Routes fresh matching warning → Profile +2 and ledger|“One citizen report remains unverified. The actual intersection check warns on this saved demo corridor. This ledger records one eligible provisional +2 contribution; it is not a measured environmental impact.”|
|1:15–1:40|My Water fixture inputs/source labels 900 L/~72h → Simulate one day → 600 L/40%/~48h|“My Water calculates from these assumptions: 1,500 litres, 60% full and 300 litres per day. That gives 900 litres and about 72 hours. Simulating one day gives 600 litres and 48 hours. These are entered or demo inputs, not sensor readings.”|
|1:40–1:55|Stress DEMO INDICATOR 60/HIGH/100% with factors/weights; briefly show missing-data coverage only if practiced|“Stress is an explainable demo calculation over six fictional pressures. The weights and coverage are visible; insufficient coverage suppresses the score. It is not an official environmental measurement.”|
|1:55–2:20|Production owner permit and actual sanitized HTTP owner/foreign/forbid/zero-effects results|“AWS-origin Cedar executes real authorization in our local API. The policy allows the persisted report owner. Real HTTP tests deny another identity and a test-only forbid denies even the owner. Denied operations create no upload grant, report mutation, incident or droplets. Cedar failures close access; authentication remains separate.”|
|2:20–2:38|Return to running map; small local/future architecture frame; preview labels may appear only if already filmed honestly|“The working core is capture, review, incident, warning and contribution history. Routes and environmental inputs here are demo data. TankerOS is a preview and HeatSafe planned. Future AWS cloud services remain unverified; Cedar’s local integration is real.”|
|2:38–2:43|Repository URL, credits and LOCAL/DEMO end frame|“Source, licenses and AI assistance are disclosed.”|

The Cedar narration is 48 words, budgeted 25 seconds at roughly 115 words/minute; rehearse actual delivery. Keep the clip between 20 and 30 seconds. Avoid a dense scrolling terminal as the only evidence: enlarge the relevant names/results and the owner condition.

## Reproducible Cedar shot

Run with the pinned runtime before filming:

```sh
pnpm cedar:demo
pnpm cedar
pnpm exec vitest run tests/cedar-authorization.test.ts tests/cedar-http.test.ts --reporter=verbose
```

Use the actual [production policy](../policies/private-reports.cedar) and the real-engine test output. The existing suites contain 40 tests, including HTTP foreign denial and test-only forbids across ReadReport/PresignReport/CompleteUpload/ConfirmReport. The setup uses isolated repositories/generated JPEGs and the real Cedar engine.

On screen label: **“REAL CEDAR / LOCAL HTTP TESTS — prepared at [actual revision/time]”**. Identify owner-forbid policy as **TEST ONLY**. Show the zero-effects assertions/results; do not add a production policy, manufacture a test result or expose headers/signed URLs. [Boundary evidence](CEDAR_AUTHORIZATION.md).

## Captions and credits

Keep **LOCAL/DEMO** readable during the app footage. At capture: **“STAGED SCENE · SYNTHETIC PIN”**. At review: **“MANUAL REVIEW · NO LOCAL IMAGE MODEL”**. At route warning: **“STRAIGHT-LINE DEMO CORRIDOR · NO SAFETY GUARANTEE”**. At tank/Stress: **“CALCULATED DEMO INPUTS · NO SENSORS/OFFICIAL FEED”**. At architecture: **“FUTURE AWS CLOUD: IMPLEMENTED_UNVERIFIED / BLOCKED_AWAITING_SSO”**.

End frame and video description: **OpenFreeMap · © OpenMapTiles · Data from OpenStreetMap**; Dark style credits **MapTiler/OpenMapTiles contributors; CartoDB; Stamen and Paul Norman; JalNet color adaptation**. Include project MIT, Cedar Apache-2.0/upstream notices, Expo starter MIT, Lucide ISC/Feather MIT and **OpenAI Codex development assistance** with the [complete source/design notices](../third-party/openfreemap-styles/README.md) and [submission acknowledgements](FINAL_SUBMISSION_PACKAGE.md#acknowledgements-and-credits). Keep the native map attribution reachable; only three standard data-source credits were visibly confirmed there.

## Framing and readable recording

Use a 1080p landscape recording with the portrait phone filling a clear central area; place captions/terminal proof beside it rather than covering controls or attribution. Keep camera steady, avoid screen glare and lock framing/focus before the take. 30 fps is sufficient for this UI; choose legible interface/terminal text and verify the exported video at ordinary viewing size. Native dialogs follow Android OS appearance, so a readable white attribution popup in a Dark app is expected.

Preflight the microphone, narration volume and cable. Record enough resolution to read UNVERIFIED, the fresh warning and ledger amount without zooming a tiny terminal. Do not add background music that masks the explanation. These settings are recording guidance, not proof that a video export exists.

## Prepared versus live outcomes

| May be prepared beforehand | Must belong to the demonstrated take |
|---|---|
|Title/end frame, policy display, sanitized reproducible test output with revision/time, credits and explicitly future architecture frame|Chosen synthetic pin, staged capture/private draft/upload, manual confirmation and the resulting incident/warning/+2 ledger|
|Disposable demo preflight/seed; tank/Stress sample inputs; recording layout|Actual tank 900→600 calculation/simulation and Stress computed values; truthful labels and current warning freshness|
|Existing inspected screenshots for an internal preview labelled EMULATOR PREVIEW|Physical-phone final footage only after acceptance; do not substitute screenshots/emulator video while implying Redmi proof|

An internal emulator storyboard preview, if listed in the [final engineering evidence](FINAL_ENGINEERING_REPORT.md), is made from genuine inspected runtime captures and prepared proof. Its captions identify still images, the emulator and prepared material. It does not pass the physical recording gate.

## Failure fallback

- **Map/assets fail:** stop that take, retain state, restore the known connection and retry. For explanation only, use labelled earlier emulator imagery; it is not a current capture or offline-map proof.
- **Upload/API fails:** keep the private draft, restore the same local server and use retry; never show a previous incident as this capture’s outcome.
- **Warning is aged:** open Routes → Refresh route reports and wait for a fresh result. If it still fails, retain the failure and retry after diagnosis; do not force a warning.
- **Camera/phone unavailable:** prepare only an explicitly EMULATOR PREVIEW; final physical recording remains blocked. No fake camera footage.
- **Cedar tests fail:** stop filming the proof and investigate; never change the production policy or use old results as a new pass.
- **Timing exceeds 2:45:** simplify waiting/taps or optional preview/missing-Stress shots with honest cuts; keep the citizen outcome, core uncertainty and 20–30-second Cedar proof. Final exported length must remain below 3:00.

## Final recording/publication gate

Five successful timed physical rehearsals, current phone acceptance and actual duration review are still pending. Watch the complete export, check captions/credits/privacy and confirm the shown report’s outcome. Upload to YouTube public or unlisted only through the owner’s approved final action; verify signed-out access, then use the real URL in the [submission package](FINAL_SUBMISSION_PACKAGE.md). Neither publication nor form submission is performed here. Official rules require YouTube and strictly under 3:00. [Official submission rules](https://www.wemakedevs.org/aws/env/rules), checked 2026-10-09 IST.

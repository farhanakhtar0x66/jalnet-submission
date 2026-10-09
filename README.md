# JalNet

A map-first water intelligence prototype: capture an observation, upload evidence privately, review a conservative assessment, confirm the report, update a fused incident and warn when it intersects a saved route. Droplets reward accepted contributions and independently supported usefulness.

The primary hackathon path is **Build It**, using real mandatory Cedar authorization locally. AWS SSO is not a dependency for this local submission. **Future live AWS access remains BLOCKED_AWAITING_SSO**, profile `jalnet`, region `ap-south-1`; its architecture and guarded deployment path are preserved. LOCAL/DEMO providers never establish DynamoDB, S3, Nova, Cognito or Amazon Location verification. Overall eligibility and P0 completion are not claimed.

[Specification](JalNet_Implementation_Plan.md) · [Status](docs/IMPLEMENTATION_STATUS.md) · [Decisions](docs/DECISIONS.md) · [Blockers](docs/BLOCKERS.md) · [Architecture](docs/ARCHITECTURE.md) · [Privacy](docs/PRIVACY.md) · [Local implementation report](docs/IMPLEMENTATION_REPORT.md) · [Backlog](TODO.md) · [Cutover audit](docs/AWS_CUTOVER_CHECKLIST.md) · [Deployment runbook](docs/AWS_DEPLOYMENT_RUNBOOK.md) · [Demo readiness](docs/DEMO_READINESS.md) · [Physical-phone Build It handoff](docs/BUILD_IT_DEVICE_DEMO.md) · [Cedar authorization](docs/CEDAR_AUTHORIZATION.md)

The localhost workflow now requires AWS-origin open-source **Cedar 4.13.0** for private-report reads, upload grants, completion and confirmation. Real policies permit the authenticated owner; the original ownership check remains. Failure closes access, with no silent fallback. Authentication is unchanged; Cedar is not running in Lambda. [Policies and actual-engine HTTP proof](docs/CEDAR_AUTHORIZATION.md) establish local technical integration, not live AWS, hackathon eligibility or P0 completion.

**My Water** calculates remaining litres and depletion from entered capacity, level and daily consumption, persists validated state locally and advances one hypothetical day on request. Reset restores 1,500 L / 60% / 300 L per day (900 L / 72h). Per-field labels distinguish USER-ENTERED, DEMO FIXTURE and SIMULATED values; no meter/IoT connection or guaranteed supply forecast. **Water Stress** is a calculated DEMO INDICATOR with six fictional editable pressures, transparent weights/contributions and missing-data coverage; it is not an official/current environmental measurement. **TankerOS** has fictional display-only supplier cards, with no booking/payment/contact; **HeatSafe** is PLANNED. [Actual feature matrix](docs/FEATURE_STATUS.md) · [UI redesign evidence](docs/UI_REDESIGN_REPORT.md) · [original UI handoff](docs/ARYAN_UI_HANDOFF.md).

## Appearance

The owner reassigned the complete UI/theme redesign to Codex on `ui/jalnet-redesign`, starting from `2dbbc4f`. System is the default; Light and Dark override it immediately and use the existing on-device SQLite database. Open Appearance from the home settings icon, Profile or any sheet header. Theme changes preserve component identity and do not clear forms, selected pins or private report drafts. Lucide provides the shared line icons; its ISC and Feather-derived MIT notices are preserved in [third-party/lucide/LICENSE](third-party/lucide/LICENSE).

The rebuilt arm64 debug development APK built, installed in place and launched on the owned API37 emulator. Dark preference and the saved tank survived the update and cold restart. This is emulator evidence; new-screen physical Redmi acceptance remains pending because the phone battery died. The compatible new APK must be installed with `install -r` to retain device data. See the [redesign report and native acceptance matrix](docs/UI_REDESIGN_REPORT.md) and [after-design screenshot pack](docs/ui/redesign/README.md).

## Development

Pinned Node **24.21.0**, pnpm **10.34.6**, Expo **57.0.27**, React Native **0.86.3**, React **19.2.3**, MapLibre **11.5.0**. Use an Expo development build; Expo Go cannot run MapLibre. Android builds need JDK 17, Android 36 and the build-tools/NDK selected by Expo (the executed build used build-tools 35.0.0 and NDK 27.1.12297006). The local portable tools/cache are ignored under `.tools`; they are not required repository dependencies.

```sh
pnpm install --frozen-lockfile
pnpm demo:seed
pnpm local:server
# In another terminal:
pnpm mobile:start:local
```

The local API binds `127.0.0.1:8787`; Android emulator requests use `http://10.0.2.2:8787`. The explicit local launch preset overrides provider mode/API in the launching shell and preserves any ignored cloud `.env`. The mobile mode is visibly labelled LOCAL/DEMO. Light uses OpenFreeMap's public Positron street style. Dark uses a bundled OpenFreeMap Dark descriptor with JalNet's color adapter and retained source/design credits; external tiles, sprites and glyphs still need internet. [Style provenance and notices](third-party/openfreemap-styles/README.md) include OpenFreeMap, OpenMapTiles, OpenStreetMap and Dark Matter credits. Historical Redmi/feature screenshots used Liberty; they describe the earlier presentation. The previous countries-only demo style could not support street-level pin placement. Local analysis returns uncertainty and manual classification; local routes are straight-line test corridors, not road navigation. Demo identity strings are confined to the localhost server and are not AWS credentials.

For a USB-connected physical phone, authorize USB debugging and forward both ports with the prepared workspace adb (or your configured adb):

```sh
.tools/android-sdk/platform-tools/adb -d reverse tcp:8787 tcp:8787
.tools/android-sdk/platform-tools/adb -d reverse tcp:8081 tcp:8081
pnpm local:server:usb
# In another terminal:
pnpm mobile:start:usb
```

Use this pair instead of the emulator pair: upload grants also need the USB-loopback address. The [device handoff](docs/BUILD_IT_DEVICE_DEMO.md) gives installation, launch, reset, acceptance and a planned 2:50 judge script. The development APK requires Metro and USB. The earlier APK passed installation, real staged camera capture/private upload, incident/route warning/+2 ledger and route refresh on the Redmi Note 9 Pro Max reporting Android16/API36. The owner subsequently reported checking phone permissions/reviewing the app; detailed acceptance cases and timed rehearsals are not inferred from that report. Prior My Water reset values (900 L/60%/~72h) and one-day arithmetic (600 L/40%/~48h) were owner-confirmed on the earlier UI; simulation label/day count and close/reopen persistence were not reported. New screens and all five timed physical rehearsals still need owner acceptance. Do not erase wanted phone drafts to rehearse.

For a first native Android build with the SDK/JDK configured:

```sh
pnpm mobile:android
```

Expo generates ignored `apps/mobile/android`. A cold native build downloads substantial Gradle/NDK artifacts. The earlier native debug APK built, installed and ran in the emulator; camera capture/upload, draft recovery, simulated foreground GPS and offline cache were exercised there. That APK subsequently completed one real staged-camera local flow on the physical Redmi. The redesigned arm64 debug APK also built, installed and launched on the owned API37 emulator, with inspected synthetic screens in both themes and bounded persistence/keyboard checks. The remaining redesign matrix is pending; these results do not establish all native cases or Redmi acceptance. See the [implementation report](docs/IMPLEMENTATION_REPORT.md) and [redesign evidence](docs/UI_REDESIGN_REPORT.md) for exact scope.

To exercise the local loop: seed the corridor, tap a nearby map pin, capture a JPEG, upload privately, manually choose category/severity, confirm still-active and public-road consent, then submit. View the incident, route warning and provisional points. A second distinct local identity can contribute different evidence through the API tests; copied evidence and self-corroboration are rejected. Do not describe this as real independent witness evidence.

Stop the server before resetting:

```sh
pnpm demo:reset
pnpm demo:seed
pnpm local:server
```

Seed/reset refuse to run while the localhost server is listening. Reset deletes only `.local-data`; no AWS deletion path exists. With a clean seeded server, run `pnpm smoke:local` to execute the explicitly fixture-based HTTP loop.

## Local checks

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm synth
pnpm test
pnpm mobile:bundle
pnpm cedar:check
# With a separate clean seeded local server:
pnpm smoke:local
# Or without touching the existing phone server/drafts:
pnpm smoke:local --isolated
```

Infrastructure tests inspect the actual `cdk.out/JalNetDev.template.json`, so synth precedes tests. The final current-source gate after native polish **passed all eight checks**: format, lint, types, synth, **181 tests across 16 suites**, Android export, real Cedar check and isolated local smoke. All 165 baseline tests are preserved (111 core, including 40 actual-engine Cedar tests, plus 54 feature tests), with 16 theme tests added. Exact scope is in the [redesign report](docs/UI_REDESIGN_REPORT.md); historical feature results remain in the [implementation report](docs/IMPLEMENTATION_REPORT.md). Earlier [GitHub CI](https://github.com/farhanakhtar0x66/jalnet/actions/runs/37702139384) passed the original milestone checks (44 tests) without AWS credentials or deployment permissions. SDK-mocked tests verify adapter behavior only. No live integration is inferred from a passed test or synthesized template.

## AWS readiness, after SSO

The intended architecture is preserved: Cognito-protected API Gateway, separate TypeScript Lambda services, DynamoDB/H3, encrypted private S3, SQS/DLQ, configurable Bedrock Nova and backend Amazon Location Routes. CDK TypeScript is the only infrastructure framework.

Do not paste or create credentials. After the existing local SSO profile is available, configure real deployment values privately. Deployment needs actual allowed model/profile ARNs (`BedrockInvokeArns`) and an image-capable Nova model/profile ID (`BedrockModelId`); there is no fabricated ARN/model default. Verify processing geography, IAM and model access before private-image use. Bootstrap/deploy have **not** run.

```sh
# First command after real SSO becomes available; compare account/role privately:
aws sts get-caller-identity --profile jalnet
# Later, follow the guarded runbook with a real mode-600 private config:
pnpm smoke:aws --live --profile jalnet --config "$JALNET_CUTOVER_CONFIG" --stage dependencies
```

Without `--live`, smoke reports BLOCKED_AWAITING_SSO and exits nonzero without accessing AWS. An explicit jalnet profile and privately approved account/role are required; wrong targets stop. Read-only dependency probes precede bounded provider/workflow stages. The runbook specifies controlled captures/tokens, actual model access, native Maps restriction gates and limits. Scripts do not mark AWS VERIFIED or claim P0 success. Ordinary `pnpm deploy` is also guarded; unknown resources/models never receive fabricated deployment defaults.

For the cloud mobile build, use the guarded environment helper in the runbook to write actual API/region/Cognito pool/client/domain and restricted expiring maps-only key/resource/signing values. Missing/invalid cloud configuration shows a blocked screen; localhost API URLs are rejected in AWS mode. Cloud Lambda requires trusted Gateway access-token claims and never accepts demo tokens or falls back to local storage. Tokens use SecureStore; no AWS secret key belongs in Expo configuration. `.env.example` documents configuration names; populated `.env` files and `.cutover/` are ignored. Expo reads mobile environment configuration from `apps/mobile/.env` or the launching shell, not automatically from the repository-root example. Keep server-only values out of public mobile configuration.

## Scope, safety and acknowledgements

The latest Build It scope includes local My Water arithmetic/simulation, fictional-input Water Stress and noninteractive TankerOS/HeatSafe previews. IoT, real supplier reservations/payments, video, push, alternative routes, heat scoring and background learning remain deferred. AI cannot establish exact depth, flow, contamination, ownership or guaranteed road safety. Public incident cards exclude contributor IDs/private evidence; private-property reports do not appear publicly. The prototype raw-evidence lifecycle is 14 days, awaiting deployment verification.

Target: WeMakeDevs × AWS Environmental Hacks, Heat and Water track, October 8–11, 2026. Verify exact submission hours from the [official schedule](https://www.wemakedevs.org/aws/env/schedule) and [rules](https://www.wemakedevs.org/aws/env/rules).

The owner supplied the specification. OpenAI Codex assisted with planning, repository setup, application/backend/infrastructure code and tests. The user selected the [MIT project license](LICENSE); Expo's generated starter license is retained in [apps/mobile/LICENSE](apps/mobile/LICENSE). Cedar is Apache-2.0; unmodified upstream [license/notice material](third-party/cedar/README.md) is retained separately. Dependency and map-source attribution remains required. Aryanxp1 has write access; shubhrgunjan’s write invitation remains pending acceptance.

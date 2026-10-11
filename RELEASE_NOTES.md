# JalNet Android prerelease notes

## v0.1.0-preview.1 — published standalone prerelease

**[Public prerelease](https://github.com/farhanakhtar0x66/jalnet-submission/releases/tag/v0.1.0-preview.1) verified; artifact tag/source: `952bfde5ae8dfb047f2f95f2d3763f85dd470aca`.** [Signed ARM64 APK](https://github.com/farhanakhtar0x66/jalnet-submission/releases/download/v0.1.0-preview.1/JalNet-v0.1.0-preview.1-arm64-v8a.apk) · [SHA-256 checksum](https://github.com/farhanakhtar0x66/jalnet-submission/releases/download/v0.1.0-preview.1/JalNet-v0.1.0-preview.1-arm64-v8a.apk.sha256). Exactly two assets are published; the release is a prerelease, not a draft. Anonymous APK download at 2026-10-10T07:40:20Z matched the tested artifact byte-for-byte and the published checksum. 28 bounded ARM64 emulator cases PASS.

Published artifact: `JalNet-v0.1.0-preview.1-arm64-v8a.apk`, **44,981,242 bytes**, `org.jalnet.preview`, versionCode 2, ARM64-only, minimum/target API 24/36.

SHA-256: `5cc463b5b25803c3b3e23352d3dee5313dcf5ae4a987267364704f2367cba9da`.
Public certificate SHA-256: `3ca17ef66bd87b38e6900f9bc84d65df4c43cb4e669d8e0dea46c25a68b52428`. Verified APK v2/v3 signatures, 18 ARM64 native libraries, 14 bundled public license/notice assets and a 3,701,696-byte Hermes bundle; debuggability, backup and cleartext are disabled. [Full artifact record](docs/ANDROID_RELEASE.md).

### Standalone capabilities

- Public street map and attribution, requiring internet for assets.
- Light/Dark/System with persisted appearance.
- My Water validated inputs, local persistence/reset and explicit one-day simulation.
- Six-factor fictional Water Stress DEMO INDICATOR, missing-data coverage and reset.
- Clearly labeled TankerOS display-only DEMO and HeatSafe PLANNED cards.

### Deliberate limits

Camera, GPS, private upload/confirmation, saved routes/warnings, ledger and sign-in are unavailable in this preview. The working local reporting workflow needs its separate Node/Cedar backend. Cedar is not running on this phone. No fixed-identity API is publicly exposed; no AWS service is claimed verified.

Water estimates are arithmetic over entered/demo assumptions, not sensors or supply predictions. Stress is fictional and uncalibrated. Maps are not guaranteed offline. No booking/payment/supplier contact or heat-aware routing exists.

The preview installs beside `org.jalnet.mobile` and has separate storage, without migrating/overwriting existing private drafts. Compatible future preview updates need the retained signing certificate; uninstalling preview loses preview-local data.

### Verification and installation

Source 952bfde passes **229 tests / 25 suites**, preserving all 212 prior tests and adding 17 preview regressions. [Same-source CI](https://github.com/farhanakhtar0x66/jalnet-submission/actions/runs/38032876398) and [PR CI](https://github.com/farhanakhtar0x66/jalnet-submission/actions/runs/38032902452) completed SUCCESS. [Exact signed-APK acceptance](docs/ANDROID_PREVIEW_ACCEPTANCE.md): 28 bounded native cases PASS with Metro/API processes suspended and ADB forwarding absent. Icon/cold starts, tank/theme persistence, System OS-following, Stress coverage/weights, 150% text and offline calculators/theme were actually exercised; no crash/ANR was observed in the 30-minute session. Cached offline maps do not prove uncached tiles/Retry. Redmi, TalkBack, performance, low memory and native SQLite fault injection remain untested. [Nine inspected release captures](docs/ui/android-preview-v0.1.0/README.md). **Public release and anonymous downloaded-checksum verification PASS.** Main remains 57a4da6; [unmerged PR #2](https://github.com/farhanakhtar0x66/jalnet-submission/pull/2) awaits final-documentation CI and owner review. Later evidence-document commits differ from the immutable 952bfde artifact source; the tag/APK were not rebuilt or moved.

Use [Android testing](docs/ANDROID_TESTING.md) for verified-asset installation, checksum comparison and ten feedback checks. [Build/acceptance record](docs/ANDROID_RELEASE.md). Report redacted issues at [GitHub Issues](https://github.com/farhanakhtar0x66/jalnet-submission/issues/new).

### Credits

MIT project; retained Expo starter MIT, Cedar Apache-2.0, Lucide ISC/Feather MIT and upstream notices. OpenFreeMap · © OpenMapTiles · Data from OpenStreetMap. Dark design additionally credits MapTiler/OpenMapTiles, CartoDB, Stamen, Paul Norman and JalNet adaptation; [complete notices](third-party/openfreemap-styles/README.md). OpenAI Codex assisted development/tests/UI/docs. [Migration provenance](MIGRATION.md) is preserved.

This is a prerelease for honest feedback, not production safety, completed physical acceptance, hackathon submission or P0 completion.

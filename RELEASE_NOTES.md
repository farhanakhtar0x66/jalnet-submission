# JalNet Android prerelease notes

## v0.1.0-preview.1 — preparation in progress

**Publication: NOT VERIFIED / NO RELEASE URL. Exact source SHA: PENDING FINAL RELEASE COMMIT.** No signed distributable/runtime acceptance is claimed by this draft.

Intended asset: `JalNet-v0.1.0-preview.1-arm64-v8a.apk` plus full SHA-256 checksum. Intended identity: `org.jalnet.preview`, versionCode 2, ARM64-only.

### Intended standalone capabilities

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

Artifact size, SHA-256, signing certificate, SDK/ABI/bundle inspection, exact-APK native results and source CI: **PENDING**. The prior local engineering baseline is 212 tests / 23 suites; release-specific totals/results will be recorded after execution.

Use [Android testing](docs/ANDROID_TESTING.md) for verified-asset installation, checksum comparison and ten feedback checks. [Build/acceptance record](docs/ANDROID_RELEASE.md). Report redacted issues at [GitHub Issues](https://github.com/farhanakhtar0x66/jalnet-submission/issues/new).

### Credits

MIT project; retained Expo starter MIT, Cedar Apache-2.0, Lucide ISC/Feather MIT and upstream notices. OpenFreeMap · © OpenMapTiles · Data from OpenStreetMap. Dark design additionally credits MapTiler/OpenMapTiles, CartoDB, Stamen, Paul Norman and JalNet adaptation; [complete notices](third-party/openfreemap-styles/README.md). OpenAI Codex assisted development/tests/UI/docs. [Migration provenance](MIGRATION.md) is preserved.

This is a prerelease for honest feedback, not production safety, completed physical acceptance, hackathon submission or P0 completion.

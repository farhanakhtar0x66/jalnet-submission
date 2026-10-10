# Standalone Android preview release

Updated 2026-10-10. **Chosen strategy: Option B, standalone preview. Release build/signing/runtime/publication gates remain PENDING.** The prior `c0f229a` engineering baseline has 212 tests / 23 suites; its development APK evidence is not standalone release proof.

## Composition and identity

The preview uses on-device tank/theme SQLite, Stress calculations and public MapLibre assets. It excludes active camera/location/report/API/routes/ledger/sign-in operations. The full local Node/Cedar composition remains available for development and the future AWS architecture remains preserved.

| Field | Intended value | Artifact verification |
|---|---|---|
| Version name | 0.1.0-preview.1 | PENDING |
| Android versionCode | 2 | PENDING |
| Package | org.jalnet.preview | PENDING |
| Display name | JalNet Preview | PENDING |
| ABI | arm64-v8a only | PENDING |
| Minimum / target SDK | Inspect final merged manifest; existing baseline was 24 / 36 | PENDING |
| Filename | JalNet-v0.1.0-preview.1-arm64-v8a.apk | PENDING |
| Size / SHA-256 / public signing certificate | Record inspected artifact values only | PENDING |
| Bundled JS/Hermes / debuggable=false | Required; no Metro/development launcher | PENDING |
| Source commit / same-source CI / release URL | Record actual verified values only | PENDING |

`org.jalnet.preview` installs separately from `org.jalnet.mobile`, with separate storage and no automatic migration. The development app/drafts are not replaced. Future preview updates require this same identity/signing certificate and increasing versionCode. [Android application identity](https://developer.android.com/build/configure-app-module), [Expo variant guidance](https://docs.expo.dev/build-reference/variants/).

## Build tooling and signing

Use macOS, pinned Node 24.21.0 / pnpm 10.34.6, JDK 17 via JAVA_HOME, and Android SDK 36 via ANDROID_HOME (build-tools 36.0.0, NDK 27.1.12297006). Preview configuration must be explicit, with bundled production JavaScript, a distinct package/scheme and only ARM64 native libraries.

The release wrapper builds in an isolated copied workspace, preserving the development native project and app data. Its prepared command is:

```sh
pnpm android:preview
```

This invokes scripts/build-android-preview.ts; actual execution/verification remains pending. The owner setup uses a retained private PKCS12 keystore and macOS Keychain service org.jalnet.preview.release-signing, account jalnet-preview. These names are metadata, not passwords. Optional --keystore, --keychain-service and --keychain-account arguments select the owner's existing private material; never pass passwords in a command. Keep keystore locations private and signing custody stable.

Do not substitute `pnpm mobile` (JavaScript export), `pnpm mobile:android` (development workflow) or the prior debug APK. Record the actual build results and artifact metadata after this wrapper has been executed and verified.

The owner approved private release-key/Keychain custody. No keystore, password or populated signing properties may enter Git, command output, screenshots or CI. Signing failures must stop; generated Gradle's debug-signing default is not a release certificate. Use retained signing material for updates. This is direct APK distribution, not a Play Store release. [Android signing/custody](https://developer.android.com/studio/publish/app-signing), [Expo local production builds](https://docs.expo.dev/guides/local-app-production/).

## Exact artifact gates

- [ ] Production native build actually succeeds with ARM64-only configuration.
- [ ] Inspect package/versionCode/versionName/minSDK/targetSDK, manifest debuggability/permissions, ABI contents, native libraries and bundled JS/Hermes.
- [ ] Verify the release certificate/signatures with `apksigner verify --verbose --print-certs`; inspect alignment. If signing outside Gradle, align **before** signing; never modify the signed APK afterward. [Official apksigner reference](https://developer.android.com/tools/apksigner).
- [ ] Compute full SHA-256 and retain the exact APK/checksum/source identity outside tracked source.
- [ ] Install that exact artifact on an ARM64 emulator/device, preserving the separately installed development app.
- [ ] With Metro stopped and forwarding absent, launch from the icon and cold restart; test both appearances, tank edit/simulation/reset/persistence, Stress, preview cards and all enabled actions.
- [ ] Test internet-enabled and disconnected map behavior; no offline asset guarantee.
- [ ] Capture redacted **release-build** screenshots and actual crash/error observations.
- [ ] Run the full regression gate and same-source CI; preserve all backend/Cedar/AWS boundaries.
- [ ] Publish only after actual gates pass; download from the real GitHub prerelease and recheck SHA-256 before adding a README link.

The signed artifact test is separate from debug build/emulator history. No physical acceptance, release publication or live AWS claim is inferred from compilation.

## Publication record

Suggested tag `v0.1.0-preview.1`, asset name as above, and a SHA-256 checksum file. [RELEASE_NOTES.md](../RELEASE_NOTES.md) records capabilities, limits and the source SHA. Publish from the actual reviewed release branch commit; do not claim it corresponds to main if main has not been merged. Merging still requires owner approval.

**Current result: no verified signed artifact, release URL or completed download verification recorded.** Replace this pending record only with executed evidence. [Friend instructions](ANDROID_TESTING.md), [local engineering history](FINAL_ENGINEERING_REPORT.md), [privacy](PRIVACY.md).

Official build/signing references checked 2026-10-10. Live AWS stays BLOCKED_AWAITING_SSO; local/preview acceptance does not complete cloud P0.

# Standalone Android preview release

Updated 2026-10-10. **Option B: the standalone APK build, signing, inspection and source regression/CI gates PASS. 28 bounded native emulator cases also PASS. Public prerelease and anonymous downloaded-checksum verification PASS; physical and untested native cases stay separate.** The prior c0f229a development milestone is historical evidence, not release acceptance.

## Composition and identity

The preview uses on-device tank/theme SQLite, Stress calculations and public MapLibre assets. It excludes active camera/location/report/API/routes/ledger/sign-in operations. The full local Node/Cedar composition remains available for development; the future AWS architecture is preserved.

| Inspected artifact field | Actual value |
|---|---|
| Version name / versionCode | 0.1.0-preview.1 / 2 |
| Package / display name | org.jalnet.preview / JalNet Preview |
| ABI / native libraries | arm64-v8a only / 18 .so files |
| Minimum / target SDK | 24 / 36 |
| Filename | JalNet-v0.1.0-preview.1-arm64-v8a.apk |
| Size | 44,981,242 bytes |
| Bundled runtime | 3,701,696-byte index.android.bundle with Hermes bytecode magic; ARM64 Hermes library present |
| Public licenses/notices | 14 bundled assets |
| Manifest flags | debuggable=false; allowBackup=false; usesCleartextTraffic=false |
| Signing | APK v2/v3 signatures verified; dedicated release certificate |
| Artifact source | 952bfde5ae8dfb047f2f95f2d3763f85dd470aca, clean source |
| Release runtime / publication | 28 bounded exact-APK emulator cases PASS; public prerelease/download verification PASS |

APK SHA-256: `5cc463b5b25803c3b3e23352d3dee5313dcf5ae4a987267364704f2367cba9da`.

Public signing-certificate SHA-256: `3ca17ef66bd87b38e6900f9bc84d65df4c43cb4e669d8e0dea46c25a68b52428`. This public digest is not the private signing key.

`org.jalnet.preview` installs separately from `org.jalnet.mobile`, with separate storage and no automatic migration. The development app/drafts are not replaced. Future preview updates require the same identity/signing certificate and increasing versionCode. [Android application identity](https://developer.android.com/build/configure-app-module), [Expo variant guidance](https://docs.expo.dev/build-reference/variants/).

## Build tooling and signing

Use macOS, pinned Node 24.21.0 / pnpm 10.34.6, JDK 17 via JAVA_HOME, and Android SDK 36 via ANDROID_HOME (build-tools 36.0.0, NDK 27.1.12297006).

The executed wrapper builds in an isolated copied workspace, preserving the development native project and app data:

```sh
pnpm android:preview
```

It invokes scripts/build-android-preview.ts and stops on missing custody, unexpected configuration or failed artifact checks. The owner setup uses a retained private PKCS12 keystore and macOS Keychain service org.jalnet.preview.release-signing, account jalnet-preview. These names are metadata, not passwords. Optional --keystore, --keychain-service and --keychain-account arguments select the owner's existing private material; never pass passwords in a command. Keep keystore locations private and signing custody stable.

Do not substitute `pnpm mobile` (JavaScript export), `pnpm mobile:android` (development workflow) or the prior debug APK. Rebuilds must be inspected independently rather than inheriting the digest/results above.

The owner approved private release-key/Keychain custody. No keystore, password or populated signing properties may enter Git, command output, screenshots or CI. Signing failures stop; generated Gradle's debug-signing default is not a release certificate. This is direct APK distribution, not a Play Store release. [Android signing/custody](https://developer.android.com/studio/publish/app-signing), [Expo local production builds](https://docs.expo.dev/guides/local-app-production/).

## Exact artifact gates

- [x] Production ARM64-only native build completed from clean source 952bfde.
- [x] Package/version/SDK, manifest flags/permissions, ABI/native libraries, public notices and bundled Hermes inspected.
- [x] `apksigner verify --verbose --print-certs` verified the release certificate/v2/v3 signatures; alignment checked. Alignment precedes signing; the signed APK must remain unmodified. [Official apksigner reference](https://developer.android.com/tools/apksigner).
- [x] Full SHA-256, exact APK/checksum/source metadata retained outside tracked source.
- [x] Exact artifact installed on the owned ARM64 emulator, preserving the separately installed development app.
- [x] Execute 28 bounded no-Metro/API/no-forwarding native cases: launcher/cold starts, Light/Dark/System, tank edit/invalid/zero/simulation/reset/persistence, Stress weights/coverage/invalid, fictional/planned cards, keyboard/theme retention and 150% text. [Exact cases and limitations](ANDROID_PREVIEW_ACCEPTANCE.md); no exhaustive every-action or physical-phone acceptance is inferred.
- [x] Exercise online maps/credits and disconnected cold-start/device tools. Offline cached tiles appeared; uncached tile failure/Retry was not induced. Public maps remain internet-dependent; no offline asset guarantee.
- [x] Inspect nine unedited synthetic [release-build captures](ui/android-preview-v0.1.0/README.md), including actual splash. No crash/ANR observed in the 30-minute audit; this is scoped session evidence, not performance certification.
- [x] Source 952bfde regressions and same-source CI PASS: **229 tests / 25 suites**, all 212 prior tests retained plus 17 preview tests. [Push CI](https://github.com/farhanakhtar0x66/jalnet-submission/actions/runs/38032876398) and [PR CI](https://github.com/farhanakhtar0x66/jalnet-submission/actions/runs/38032902452) completed SUCCESS.
- [x] Publish [v0.1.0-preview.1](https://github.com/farhanakhtar0x66/jalnet-submission/releases/tag/v0.1.0-preview.1) with exactly two APK/checksum assets and independently download without authentication. At 2026-10-10T07:40:20Z the full public APK was byte-for-byte identical to the tested 44,981,242-byte artifact; its SHA-256 and checksum asset matched.

The seven runtime-composition/device-storage tests use the real source graph/feature store with the native SQLite port simulated; ten configuration/permission/signing-template/notice tests execute the real config/plugin against controlled native templates. They do not substitute for native artifact or physical-phone acceptance.

## Native acceptance and preservation

[The actual 28-case audit](ANDROID_PREVIEW_ACCEPTANCE.md) used the exact signed APK on ARM64 Android 17 / API 37.1. The original eight Metro/API processes and seven forwarding mappings were restored afterward, and the development-app metadata comparison was unchanged. No development data was cleared or migrated.

Redmi, TalkBack, performance, low-memory/native-SQLite faults, blank tank input, rapid repeated simulation and uncached-map failure/Retry remain untested in this audit. The short splash diagnostic is not a final demo video.

## Publication record

[Public v0.1.0-preview.1](https://github.com/farhanakhtar0x66/jalnet-submission/releases/tag/v0.1.0-preview.1) is confirmed isDraft=false/isPrerelease=true, with exactly two assets: [signed APK](https://github.com/farhanakhtar0x66/jalnet-submission/releases/download/v0.1.0-preview.1/JalNet-v0.1.0-preview.1-arm64-v8a.apk) and [SHA-256 checksum](https://github.com/farhanakhtar0x66/jalnet-submission/releases/download/v0.1.0-preview.1/JalNet-v0.1.0-preview.1-arm64-v8a.apk.sha256). Remote annotated tag resolves to artifact source `952bfde5ae8dfb047f2f95f2d3763f85dd470aca`.

The anonymous download was verified at 2026-10-10T07:40:20Z. An initial slow transfer timed out; a bounded range-resume completed, followed by full digest, size and byte-for-byte comparison with the tested local APK. Both assets matched. This reports one verified download, not a download-speed guarantee.

[RELEASE_NOTES.md](../RELEASE_NOTES.md) identifies the same artifact source. Main remains 57a4da6; [PR #2](https://github.com/farhanakhtar0x66/jalnet-submission/pull/2) is unmerged and awaits owner review; later documentation checks are shown on that PR. The tag/APK source stays 952bfde; this later evidence documentation may have a different commit. Keep the artifact tag fixed and record later documentation separately; no final-documentation SHA/CI result is invented.

**Current result: signed artifact, source CI, 28 bounded emulator cases and public prerelease/anonymous download verification PASS.** [Friend instructions](ANDROID_TESTING.md), [local engineering history](FINAL_ENGINEERING_REPORT.md), [privacy](PRIVACY.md).

Official build/signing references checked 2026-10-10. Live AWS stays BLOCKED_AWAITING_SSO. Release, physical demo and cloud P0 remain separate acceptance gates.

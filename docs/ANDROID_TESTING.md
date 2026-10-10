# Android preview testing

Updated 2026-10-10. **[Public prerelease](https://github.com/farhanakhtar0x66/jalnet-submission/releases/tag/v0.1.0-preview.1) and anonymous download verification PASS.** The standalone `v0.1.0-preview.1` APK from source 952bfde is built, signed and inspected; 28 bounded ARM64 emulator cases PASS. Physical acceptance remains pending. [Actual runtime cases and limits](ANDROID_PREVIEW_ACCEPTANCE.md). [Artifact record](ANDROID_RELEASE.md).

## What this preview is

A separate **JalNet Preview**, package `org.jalnet.preview`, with bundled JavaScript and no Metro, laptop, USB debugging, ADB forwarding or Node server required by testers.

It is ARM64-only: the Android runtime must support `arm64-v8a`. A 64-bit processor running a 32-bit Android installation is insufficient. The inspected minimum is Android 7 / API 24, with target API 36; graphics/device compatibility still needs real feedback. x86/x86_64-only emulators cannot establish ARM64 acceptance.

| Works on-device | Needs internet | Unavailable in this preview |
|---|---|---|
| Light/Dark/System, My Water arithmetic/simulation/persistence, fictional Water Stress and labeled feature cards | Public map tiles/glyphs/sprites | Camera, foreground location, private report upload/confirmation, saved routes/warnings/ledger and sign-in |

Cedar remains real authorization in the **local Node application**; it does not execute in this phone preview. No AWS cloud service is verified. Calculators are entered/demo assumptions; TankerOS has no booking/payment/contact and HeatSafe is PLANNED.

## Install the verified preview

1. Open the verified [v0.1.0-preview.1 prerelease](https://github.com/farhanakhtar0x66/jalnet-submission/releases/tag/v0.1.0-preview.1). Use its official assets.
2. Download the [signed ARM64 APK](https://github.com/farhanakhtar0x66/jalnet-submission/releases/download/v0.1.0-preview.1/JalNet-v0.1.0-preview.1-arm64-v8a.apk) and [published SHA-256 checksum](https://github.com/farhanakhtar0x66/jalnet-submission/releases/download/v0.1.0-preview.1/JalNet-v0.1.0-preview.1-arm64-v8a.apk.sha256). Filename: `JalNet-v0.1.0-preview.1-arm64-v8a.apk`.
3. Verify its SHA-256 against the release's checksum before installation. On macOS:
   ```sh
   shasum -a 256 JalNet-v0.1.0-preview.1-arm64-v8a.apk
   ```
   On Linux use `sha256sum`; on Windows use `Get-FileHash -Algorithm SHA256`. The full digest must match, not just its prefix. The published APK is 44,981,242 bytes with SHA-256 `5cc463b5b25803c3b3e23352d3dee5313dcf5ae4a987267364704f2367cba9da`. An anonymous download matched the tested APK byte-for-byte at 2026-10-10T07:40:20Z; compare your own full download before installation.
4. Open the APK. Android may ask you to allow installs from that browser/file manager and may warn that it is outside an app store. Review the source/permissions and approve only the verified asset. Keep platform protections enabled; stop on a blocked/signature error rather than bypassing it.
5. Launch **JalNet Preview** from its launcher icon. There must be no development-server screen.

## Data and updates

The preview installs beside the development app `org.jalnet.mobile`. It starts with separate storage and **does not import or overwrite existing JalNet drafts/tank/session data**. Keep the development app installed if it holds wanted data.

Later preview updates require the same preview package and retained signing certificate, with a higher versionCode. Install a verified compatible update in place to retain preview data; stop on a signature mismatch. Uninstalling/clearing preview storage loses its tank/preferences. Do not uninstall the development app to solve a preview installation problem. No automatic migration/backup guarantee is claimed.

Tank values and appearance are stored on-device; Stress edits are screen-local. The actual offline emulator cold start and calculators/theme passed; visible cached tiles do not establish new-area offline rendering or uncached failure/Retry. Maps contact external public asset providers, so offline tiles are not guaranteed. Do not enter sensitive information into feedback; no automatic analytics or crash-data collection is introduced.

## Ten checks for friends

1. Install and launch from the icon; note any splash/bundle/server-screen error.
2. Open the street map with internet, then observe disconnected behavior honestly.
3. Switch **Light → Dark → System** and check readable controls/credits.
4. Open My Water and restore its fixture: 1,500 L / 60% / 300 L per day → 900 L / ~72h.
5. Edit valid inputs; try zero/invalid inputs too. Restore the standard fixture before simulating one day to reproduce 600 L / 40% / ~48h.
6. Wait for saving, close/reopen and cold restart; check tank/appearance persistence.
7. Try Stress: six demo factors → 60 / HIGH / 100%; clear supply + groundwater → 55% coverage with no headline; restore.
8. Inspect TankerOS DEMO and HeatSafe PLANNED; no booking/contact is enabled.
9. Try only enabled actions. Backend-dependent actions must be clearly unavailable, with no upload/fake report result.
10. Report crashes, layout/keyboard/accessibility defects or confusing wording.

## Feedback

Open a [GitHub issue](https://github.com/farhanakhtar0x66/jalnet-submission/issues/new) with:

- Phone model, Android version and preview version.
- What you tried and exact steps to reproduce.
- Expected behavior and actual behavior.
- A screenshot with photos, notifications, account details and precise location removed.

Do not attach credentials, private drafts, raw device logs or signing material. Tell the owner privately if a screenshot cannot be safely redacted. User reports are recorded as actual evidence; installing successfully alone does not certify all functionality.

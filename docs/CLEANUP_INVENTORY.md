# Verified cleanup inventory

Recorded 2026-10-10, Asia/Kolkata, **before any deletion**. The read-only audit examined clean submission revision **c0f229a**; release work is isolated on **codex/android-preview-release**. The reproduced starting gate is **212 tests / 23 suites**, with all eight established local checks passing. This inventory authorizes no destructive repository operation, source-history removal or AWS deployment.

## Candidates and required proof

| Item | Verified references and reason | Current disposition / completion gate |
|---|---|---|
| `apps/mobile/assets/splash-icon.png` | No tracked source, configuration or documentation references. `apps/mobile/app.json` explicitly uses `assets/icon.png` for both the app icon and `expo-splash-screen`; adaptive-icon assets and favicon are separately referenced. | **REMOVED after the initial native-build proof.** The successful preview build, generated configuration and compiled resources confirmed no `splash-icon.png` reference; `icon.png` remains the configured app/splash image. Exact final-APK visual icon/splash acceptance is **PENDING**. All referenced icons/assets are retained. |
| Direct mobile dependency `expo-status-bar` | No application import or Expo plugin reference. `ThemeProvider.tsx` imports `StatusBar` from React Native and calls `StatusBar.setBarStyle`. Installed Expo metadata does not require `expo-status-bar`. References are its manifest/lockfile entries. | **REMOVED from the mobile manifest and lockfile after this inventory.** Independent diff review confirmed only this package/importer/snapshot was removed. Frozen offline installation passed; all release gates and exact-APK theme/system-bar checks remain required. |
| Signing/release/database ignore gaps | Existing rules protect `.env`, `.aws`, `.tools`, `.local-data`, generated native projects and common key formats, but did not cover root-level JKS, APK/AAB, SQLite/database sidecars or signing properties. | **NARROW IGNORE RULES ADDED** for those formats and `.release/`. No signing key, APK, database or private file was created/read/deleted to test the rules; `git check-ignore` uses hypothetical filenames. |
| Current TODO / feature summaries | TODO still lists organizer approval and phone installation as pending, describes a historical 44-test CI result as current, repeats delivered tank/Stress evaluation work, and ties recording to AWS. FEATURE_STATUS's opening still says organizer clarification pending and its older final gate is 181/16. | **DOCUMENTATION UPDATE NEEDED.** Replace the active TODO with prioritized actions and add a current capability matrix. Retain dated historical evidence, original specification and migration provenance. Preserve the separate local Build It and unverified AWS gates. |

No additional dead component, duplicate runtime utility or obsolete demo script was confirmed. Exports with no external consumer are internally used schema/constants/functions or public types; absence of an external import alone is not grounds to remove them. Demo helpers use `.js` import specifiers resolved to TypeScript sources, so a filename-only search can falsely label them unused.

## Executed dependency and preview review — 2026-10-10

The approved dependency cleanup removed the direct `expo-status-bar` entry and its lockfile package/snapshot; no other dependency was removed. Independent execution of **`CI=true pnpm install --frozen-lockfile --offline`** passed across all four workspaces: the lockfile was current and one unused package was removed from installed dependencies, without network resolution. `splash-icon.png` was subsequently **REMOVED** only after the build owner recorded a successful initial Android native preview build and verified its generated configuration/compiled resources had no reference to that asset. Independent source recheck confirms the deletion is limited to this candidate and `assets/icon.png` is retained and explicitly configured for the app and splash. That initial artifact came from dirty local source and is not the distribution artifact; visual icon/splash acceptance remains **PENDING** on the final exact APK.

Independent source review confirmed the separate `apps/mobile/preview.ts` entry reaches map/theme/calculator UI and preview device storage, while excluding API/authentication/cache/draft/report/camera/GPS composition. The normal entry still receives the original account-scoped tank store through minimal typed store injection. Preview tank data uses its own database and device-only namespace; SQLite construction is lazy. The shared ScreenHeader supplies the existing Appearance action, so a duplicate control is unnecessary. Production Cedar, authentication, API/provider/domain and AWS security code remain untouched by this preview composition.

The focused command below actually passed **84 tests / 6 suites**, including seven new preview runtime-graph/storage-port tests. Native SQLite is simulated in those storage tests; this result does not verify the signed APK or its package identity, launch, persistence, permissions or network behavior. Exact-release native acceptance and full final regression/CI are separate pending gates.

The release wrapper and native plugin received an independent read-only review. Real Expo configuration/mod functions were exercised in memory: the default configuration equals the unchanged development JSON; preview identity, plugin filtering and permission controls apply; unknown variants, wrong packages, unsupported signing templates and Gradle language fail closed. The release transformation removes only release debug signing, remains idempotent and retains development debug signing. Manifest backup/cleartext restrictions, every listed blocked permission and the ARM64-only Gradle property applied. These checks created no native files, signing material or APK and do not replace exact-artifact acceptance. The wrapper uses an ignored unique source snapshot, sanitized build environment and privately captured Keychain/apksigner output; production Cedar/AWS boundaries remain unchanged.

```sh
pnpm exec vitest run tests/standalone-preview.test.ts tests/water-persistence.test.ts tests/local-feature.test.ts tests/water.test.ts tests/water-stress.test.ts tests/theme.test.ts --reporter=verbose
```

## Protected contents and dependencies

- **Cedar:** checked-in policy/schema, genuine WASM runtime, mandatory local-server composition, fail-closed behavior, 40 real-engine tests and isolated judge proof. Cedar authorizes private server operations; it is not authentication or a phone runtime.
- **Reporting and domain:** local Node API/repository/evidence pipeline; trusted identity and persisted ownership boundaries; JPEG size/format/hash/EXIF checks; private drafts; consent, confirmation, fusion, expiry, route intersection and droplet replay/ledger logic; all regression tests.
- **Future AWS:** SDK providers, Cognito configuration, API Gateway/Lambda handlers, CDK/IAM, S3/SQS/DynamoDB/Nova/Location, deployment/smoke/account guards and cutover documentation. These are preserved implementations awaiting live verification, not dead code.
- **Mobile:** MapLibre, TanStack Query, Zustand, themes/icons/design controls, SQLite/SecureStore, My Water arithmetic/persistence, Water Stress calculations, camera/image/file/location/auth packages and the working development-client path.
- **Indirect/build requirements:** retain `react-native-svg`, required by Lucide; `expo-dev-client`, required by the existing development workflow; CDK/esbuild/tsx/TypeScript/Biome and type packages, required by configuration, bundling or checks even without direct runtime imports. Duplicate type declarations are not a material release cleanup target.
- **Evidence and attribution:** MIT and Expo notices, Cedar Apache-2.0 notices/licenses, map style descriptors and source/design credits, screenshots with dated environment labels, organizer approval record, source specification, migration and historical verification documents.

## Public-file safety audit

The read-only audit scanned **255 tracked/public candidate files**. It found **zero obvious high-signal AWS access keys, GitHub tokens, private-key blocks or credential-bearing URLs**. This is a bounded inspection, not a guarantee that every possible secret format can be detected. No real credential value is recorded here.

Generated native/build output, local databases/evidence/drafts, populated environments, private backup, signing material and APK binaries belong outside public source tracking. Distribute the verified APK and checksum through GitHub Release assets, not a source-tree binary commit. Added ignore rules are preventive; they do not remove an already tracked file. Review the actual staged filenames and content again before publication.

## Standalone-preview separation assessment

A release bundle alone cannot make the current development composition standalone: `Home.tsx` immediately queries events/routes/risks/profile, `readMobileConfig` defaults to the local emulator API, and tank persistence obtains its account scope through the API identity helper. Bundling that composition would expose unusable localhost actions to friends.

Use a separate, explicitly labeled **standalone preview composition and package identity** with no API endpoint or bearer identity. Reuse the native public map, theme and WaterHub calculators; provide an on-device-only storage scope; reject API calls before session/network access. Do not mount report submission, saved-route warnings or Cognito controls. Keep camera unavailable initially unless a separate, bounded on-device capture/draft path is actually implemented and tested. Do not manufacture successful API responses or imply Cedar executes on the phone.

A separate package prevents the preview from replacing development-app private drafts, tanks, appearance or signatures. Public map tiles/glyphs/sprites still require internet; tank calculations/persistence and fictional Stress calculations work on-device. Preserve the complete trusted local/server composition and future AWS path for their own use.

The existing Node server uses fixed Alice/Bob demo identities and loopback HTTP. It must not be exposed as a public friend-testing backend. A connected trial would need genuine separate authenticated identities, HTTPS, private evidence isolation, bounded upload/rate/retention controls and retained server-side Cedar; those prerequisites are not established by this audit.

## Verification after approved cleanup and preview work

- Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm synth`, `pnpm test`, `pnpm mobile`, `pnpm cedar` and `pnpm smoke --isolated`; preserve every baseline test and record the actual new count.
- Add meaningful tests for explicit preview configuration, API/network/session blocking and preview-local persistence separation; no fake server success.
- Inspect and test the exact signed ARM64 release APK with Metro and port forwarding absent: package/version/ABI/signature/debuggability/bundled JavaScript, launcher/cold restart, both themes, saved tank values, Stress, map connectivity and every enabled action.
- Confirm licenses, bundled styles/native runtime assets and future AWS/security files remain intact; review public files and exact-source CI before publishing a prerelease.

No deletion, dependency change, signing, device operation, Git mutation or public release was performed to create this inventory. Live AWS remains **BLOCKED_AWAITING_SSO**; no cloud service, Cedar Lambda package, physical acceptance or JalNet P0 completion is claimed.

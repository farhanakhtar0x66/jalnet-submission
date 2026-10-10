# Contributing to JalNet

Start with the [README](README.md), [current roadmap](TODO.md) and [feature boundaries](docs/FEATURE_STATUS.md). Use Node 24.21.0 and pnpm 10.34.6; install with `pnpm install --frozen-lockfile`.

The standalone preview, loopback Node/Cedar application and future AWS path are separate compositions. Preserve private drafts, consent, owner isolation, production Cedar policies, domain contracts and third-party notices. Never expose the fixed-identity local API publicly or add real credentials to mobile code.

## Changes and validation

Work on a focused branch, describe the observable problem and resulting behavior, and add meaningful regression coverage for defects. Keep refactors small. Do not remove a future provider merely because it cannot run without AWS access.

Run the established gate:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm synth
pnpm test
pnpm mobile
pnpm cedar
pnpm smoke --isolated
```

Synthesis precedes infrastructure tests. For authorization proof use `pnpm cedar:demo`. Preview changes additionally need the exact signed release artifact checks in [ANDROID_RELEASE.md](docs/ANDROID_RELEASE.md); an Android export or debug APK is not release acceptance. Release source 952bfde has 229 passing tests across 25 suites and successful [same-source CI](https://github.com/farhanakhtar0x66/jalnet-submission/actions/runs/38032876398); the [28-case exact-APK emulator audit](docs/ANDROID_PREVIEW_ACCEPTANCE.md), verified [prerelease/download](https://github.com/farhanakhtar0x66/jalnet-submission/releases/tag/v0.1.0-preview.1) and pending physical tests remain separate. Artifact tag/source is 952bfde; later documentation-evidence commits may differ. Main 57a4da6 is unchanged and PR #2 remains unmerged. Uncached map retry, TalkBack, performance and native fault injection remain untested.

Open a PR with actual commands/results, tested scope and remaining limits. Do not merge without owner approval. Use genuine commits/timestamps and disclose material AI assistance. Preserve [migration provenance](MIGRATION.md).

## Bugs and privacy

Report reproducible issues through [GitHub Issues](https://github.com/farhanakhtar0x66/jalnet-submission/issues/new), using [the tester checklist](docs/ANDROID_TESTING.md). Include model/Android/build, steps, expected/actual behavior and a redacted screenshot when useful. Omit personal photos, coordinates, serials, account IDs, private paths, bearer values and signed URLs. Do not post sensitive security exploit material publicly; arrange an appropriate private maintainer channel.

No automatic analytics or crash collection is authorized by contributing. Do not commit generated APKs, signing keys/passwords, populated environment files, runtime state or emulator artifacts. Release signing remains a separately protected owner responsibility.

Contributions use the project MIT license; retain every upstream license/NOTICE and map/style attribution.

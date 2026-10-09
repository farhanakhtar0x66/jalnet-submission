# Submission repository provenance

This repository imports the existing JalNet implementation into a clean Git history. Import commits describe migration milestones, not when the underlying work was first developed. Commit times are the actual import/development times; no historical author dates or artificial activity are manufactured. New commits identify the person performing the migration/development, not invented contributors.

Submission: [farhanakhtar0x66/jalnet-submission](https://github.com/farhanakhtar0x66/jalnet-submission).

Source: [farhanakhtar0x66/jalnet](https://github.com/farhanakhtar0x66/jalnet). Engineering baseline: [2dbbc4f](https://github.com/farhanakhtar0x66/jalnet/commit/2dbbc4f767ee6c402919319c7520c4b2c841fffe). Complete source including the reviewed UI: [8ea3ca7](https://github.com/farhanakhtar0x66/jalnet/commit/8ea3ca7e17fe81d4f7bc1cda60ae819f48f0577e), tree `f9574ec68f0f511a1e92e4de038b2dd96957ff50`. The engineering commit is an ancestor of the UI commit; no feature merge is missing. Original PR #1 remains unmerged and untouched.

The complete 188-file tracked source export is restored in seven dependency-aware stages:

| Stage | Import commit | Existing work restored |
|---|---|---|
| 1 | `8d60cdf` | Workspace tooling, dependency/workspace manifests and shared contracts |
| 2 | `2dc74d9` | Domain calculations, report/incident/reward rules, geometry and their tests |
| 3 | `e0aa967` | Cedar authorizer/interface, real policies/schema, notices and engine tests |
| 4 | `0e9aea0` | Local persistence/evidence/backend/HTTP workflow with mandatory Cedar, demo tools and tests |
| 5 | `28ceef5` | Existing AWS providers, Lambda/CDK resources, guarded cutover/smoke scripts and tests |
| 6 | `3a3ea6b` | Complete Android application, water features, redesigned UI, native icons, persistent appearance and tests/notices |
| 7 | `5c8d8e7` | Documentation, inspected synthetic screenshots, demonstration guidance and CI |

Early commits are restoration stages, not a complete runnable release. The complete import at `5c8d8e7` passed the eight original local commands with **181 tests / 16 suites**. All 188 exported source blobs and modes matched the source tree before subsequent development. The tightly coupled mobile and local-composition files are kept together rather than introducing temporarily permissive authorization or altering dependency structure to manufacture smaller commits.

Historical hashes such as `9422fc2`, `087a225`, `cffdd2a`, `2dbbc4f` and `8ea3ca7`, and original CI-run links in imported reports, refer to the source repository. They are historical evidence, not new submission-repository commits or fresh verification. Existing copyrights, licenses, third-party credits and Codex-assistance attribution remain intact. Original Git history/contributor records are retained privately in a verified full-ref mirror and independently restored bundle, and the original public repository remains unchanged; that history is not transplanted into this repository.

Only tracked source is exported. Populated environment files, credentials, map/API keys, private drafts, runtime state, generated native projects and local tool/backup directories are excluded. No source Git refs, backup bundle or local device data are published.

Live AWS remains BLOCKED_AWAITING_SSO; intended profile `jalnet`, region `ap-south-1`. Cedar remains mandatory locally and frozen at the source implementation; Lambda WASM packaging is not verified. Organizer eligibility confirmation and final physical/video acceptance are documented separately from migration and technical checks.

## Verified private backup

Before creating this history, a private mode-0700 backup was created under the original checkout’s ignored `.tools/backups/submission-20261009-191202/`. It contains `jalnet-mirror.git`, `jalnet-all-refs.bundle` and the independent `bundle-restored.git`. The bundle is **13,259,905 bytes**; SHA-256: `adfb633e44f38fa1cf3f890dd464b127e93148f68e29a67a0b4407a01293c2f3`.

Mirror `fsck`, complete-history bundle verification, restored-repository `fsck` and exact restoration of all **17 combined refs** passed. The advertised source feature/UI and PR refs are included; the UI tree is `f9574ec68f0f511a1e92e4de038b2dd96957ff50`. Original refs were unchanged. The backup and its contents remain private and are not committed here. No original repository deletion or ownership transfer was performed.

## Genuine development after import

The working baseline was followed by `a850847` (required/idempotent seed with 7 tests), `f959a0c` (reset-failure/retry/revision protection with 5 actual-hook tests over a SIMULATED React lifecycle and storage port), `e707eb3` (deliberate/distinct route-pin usability) and `7be3368` (requested aliases and mandatory Cedar/isolated-smoke CI). These are actual improvements, not extra import stages or manufactured activity.

At `7be3368`, the eight requested commands passed on 2026-10-09 at 19:38 IST with **193 tests / 18 suites**, preserving 181 imported tests. [Same-revision CI](https://github.com/farhanakhtar0x66/jalnet-submission/actions/runs/37942059301) completed SUCCESS. Thirty-three protected Cedar/backend/AWS-security files remain byte-identical. [Current acceptance](docs/SUBMISSION_STATUS.md) separates scoped native inspection from pending Redmi/rehearsal/video and live AWS gates.

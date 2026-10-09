# Submission repository provenance

This repository imports the existing JalNet implementation into a clean Git history. Import commits describe migration milestones, not when the underlying work was first developed. Commit times are the actual import/development times; no historical author dates or artificial activity are manufactured. New commits identify the person performing the migration/development, not invented contributors.

Source: [farhanakhtar0x66/jalnet](https://github.com/farhanakhtar0x66/jalnet). Engineering baseline: [2dbbc4f](https://github.com/farhanakhtar0x66/jalnet/commit/2dbbc4f767ee6c402919319c7520c4b2c841fffe). Complete source including the reviewed UI: [8ea3ca7](https://github.com/farhanakhtar0x66/jalnet/commit/8ea3ca7e17fe81d4f7bc1cda60ae819f48f0577e), tree `f9574ec68f0f511a1e92e4de038b2dd96957ff50`. The engineering commit is an ancestor of the UI commit; no feature merge is missing. Original PR #1 remains unmerged and untouched.

The complete 188-file tracked source export is restored in seven dependency-aware stages:

1. Workspace tooling, dependency/workspace manifests and shared contracts.
2. Domain calculations, report/incident/reward rules, geometry and their tests.
3. Cedar authorizer/interface, real policies/schema, notices and engine tests.
4. Local persistence/evidence/backend/HTTP workflow with mandatory Cedar already present, plus local demo tools and tests.
5. Existing AWS providers, Lambda/CDK resources, guarded cutover/smoke scripts and tests.
6. Complete Android application, water features, redesigned UI, native icons, persistent appearance and associated tests/notices.
7. Documentation, inspected synthetic screenshots, demonstration guidance and CI.

Early commits are restoration stages, not a complete runnable release. The 181-test/16-suite baseline is verified after the complete import. The tightly coupled mobile and local-composition files are kept together rather than introducing temporarily permissive authorization or altering dependency structure to manufacture smaller commits.

Historical hashes such as `9422fc2`, `087a225`, `cffdd2a`, `2dbbc4f` and `8ea3ca7`, and original CI-run links in imported reports, refer to the source repository. They are historical evidence, not new submission-repository commits or fresh verification. Existing copyrights, licenses, third-party credits and Codex-assistance attribution remain intact. Original Git history/contributor records are retained privately in a verified full-ref mirror and independently restored bundle, and the original public repository remains unchanged; that history is not transplanted into this repository.

Only tracked source is exported. Populated environment files, credentials, map/API keys, private drafts, runtime state, generated native projects and local tool/backup directories are excluded. No source Git refs, backup bundle or local device data are published.

Live AWS remains BLOCKED_AWAITING_SSO; intended profile `jalnet`, region `ap-south-1`. Cedar remains mandatory locally and frozen at the source implementation; Lambda WASM packaging is not verified. Organizer eligibility confirmation and final physical/video acceptance are documented separately from migration and technical checks.

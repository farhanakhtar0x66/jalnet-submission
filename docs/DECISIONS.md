# JalNet decisions and unresolved specification details

Planning record: 2026-10-08, Asia/Kolkata. No implementation has begun. Section references point to the supplied implementation plan unless explicitly labeled as the pasted user request.

## Planning decisions within the authorized scope

### D-01 — Respect the implementation gate

The initial pasted request §§3–4 and 21 explicitly permits audit/planning documents and requires waiting for START. The plan header and §§7,46,94 prohibit pre-clock code/repository creation/provisioning. The initial audit therefore created only the three requested planning documents. The calendar date and website countdown do not supply user authorization.

The subsequent user instruction explicitly authorizes creating the owner's GitHub repository `jalnet` and publishing the existing planning work, README and TODO before START. This supersedes the earlier repository-creation restriction only for documentation publication: initialize Git and publish a planning-only commit, preserve the source plan unchanged, and record the exception transparently. It does not authorize application code, project dependencies or AWS infrastructure. Use the verified owner's GitHub noreply identity for commits rather than publishing their personal email.

Automatic approval review rejected the initial proposed public create-and-push action because publication had been authorized without explicit authorization for public disclosure. The safe alternative created a private repository, and the user then explicitly instructed "Keep private for now." GitHub metadata and the initial remote file tree were verified after the private push.

The user subsequently explicitly authorized public visibility and write collaborator invitations for the team leader `Aryanxp1` and team member `shubhrgunjan` on October 8, 2026. The second supplied URL, `shubhrgunjan/edgemed`, was verified to belong to that user account. This new instruction supersedes the earlier temporary private-visibility preference. GitHub confirmed `visibility: public`, `private: false`, and pending invitations for both users with `permissions: write`. Invitations activate when the recipients accept; no admin/maintain role was granted. Application implementation remains gated on START.

### D-02 — Preserve the selected architecture

Use React Native/Expo/TypeScript development builds, MapLibre + Amazon Location dynamic maps, TanStack Query for server state, Zustand for UI state, shared Zod schemas, API Gateway HTTP API + TypeScript Lambda, DynamoDB + H3, private encrypted S3, Cognito, and configurable Bedrock/Nova (§§6,31,37,77,79,97–98). Choose CDK TypeScript as the single infrastructure framework because this workspace has no existing selection. Propose pnpm workspaces per §7; pin compatible versions after verification, without adding Nx/Turborepo. P0 image only; point + semantic radius; routes calculated in the backend. No model ID is selected yet.

### D-03 — Scope and ordering

The dependency graph in the status document expands §45: route risk requires both persisted route geometry and created/fused current events; useful awards require verification/eligibility and ledger atomicity. Run §99 dependency proofs before elaborate UI, then the user's phases 1–7. This reconciles the early Bedrock/route proof in §99 with full feature integration later in §46. Keep the 30-minute smoke-test target as a diagnostic intention, not a completion estimate. Freeze only after §100 evidence exists.

### D-04 — Authentication exceptions do not bypass Cognito

§6.8 allows a deterministic development demo account if auth threatens the timeline; §97.1 explicitly requires Cognito protection for reports, routes, profile and other private data. Use a real Cognito-backed demo identity through the same authorizer and owner checks. Do not ship an unauthenticated hardcoded-user bypass or client secret. Actual sign-in/token storage implementation must be verified against current Cognito/Expo documentation after START.

### D-05 — Separate mobile map access from private API access

§31.8 public-environment caution is qualified by §97.2: an intentionally extractable, expiring, action/resource/client-restricted Amazon Location map key may be bundled; AWS secret access keys cannot. Tiles/style requests go directly to Location; `/v1/routes/preview` goes through Cognito-protected JalNet Lambda. Map key receives no route actions if routes are backend-owned. Test native client restrictions plus all dependent asset requests on device before considering the map proven.

### D-06 — Rewards follow accepted usefulness, never file count

§16.2 gives example submission/first-report awards and §35.10 shows +2 provisional on submission, while §§2.6,94.7 and user §§5,9,16 demand accepted, independently useful evidence. Treat the example schedule as configurable, not an unconditional upload entitlement. Provisional +2 can apply only after a confirmed report is accepted as relevant and non-duplicate, with caps; meaningful verified/impact awards wait for independently supported usefulness. Record provisional versus verified eligibility explicitly before implementing the ledger. AI failure does not make a report ineligible; manual reports use the same acceptance/verification path. No exact final award schedule is claimed as a specified constant.

### D-07 — Include basic independent verification in P0

§5 calls confirmation of another report P0 preferred, while §§0.2,46 list second-user verification as P1. Include the small existing `/v1/events/{eventId}/confirm` capability and no-self-confirmation/proximity checks from §§10.2,30.6 in P0 to substantiate verified rewards and provenance. Defer the broader verification experience. An independently seeded observation must be labeled as a demo fixture and cannot be presented as real live corroboration.

### D-08 — P0 warning does not require alternate routing

§35.4 shows an Alternative button and §§0.3,63 mention alternatives in the narrative; §§17.3,67 explicitly make hazard-avoidance routing P1 and §69 requires only intersection/warning. Implement the affected route/incident warning first. Hide or clearly disable Alternative until a real provider-backed P1 flow works. Do not publish a dead control or use guaranteed-safety wording.

### D-09 — Keep the exact media contract and human boundary

§26.2 proposes a DrainScan obstruction class absent from the exact §8.3 assessment enum. Use §8.3 unchanged for P0; do not silently add `SEVERE_VISUAL_OBSTRUCTION`. §0.3's demonstration `HIGH` is the media severity enum; event severity is numerical (§8.1), and verification is separate (§86). A deterministic documented severity mapping/unknown policy is needed before fusion; the plan supplies a rubric but no complete numeric mapping. AI cannot independently publish critical status (§14.3).

### D-10 — Keep original evidence private, omit public photos initially

§6.7 suggests a sanitized preview; §§31.4,35.5 make public preview optional and permit reporting without public media. For P0, public cards can omit photos entirely. Keep owned original evidence private and never expose original EXIF, reporter identity, private routes, or home/tank coordinates. A later preview path must actually sanitize metadata before use, with appropriately short-lived access.

### D-11 — Demo disclosure and seed scenarios

§42.1 initially has no waterlogging at the capture location, whereas §42.2 also offers a pre-seeded unverified incident. They are alternative scenarios. Prefer a no-waterlogging starting state with a live camera-created incident and a second real account corroborating when available. If using the alternate seeded support scenario, disclose the fixture in the README/demo and do not describe it as a live witness. §44.2's recording-only AI fixture is an emergency visibly labeled mode; it never satisfies §69's live Bedrock requirement. The stricter live-core requirement in the pasted request governs P0 acceptance.

## Unresolved contract/storage details to settle before their implementation

These are design gaps, not permission to invent specified endpoints/fields. They do not block independent work after START.

| ID | Exact sections | Gap and required resolution |
|---|---|---|
| U-01 | 10.3 versus 14.1, 41.1 | The narrative requires draft creation then upload-complete notification, but the listed routes have no explicit completion operation or request bodies. Agree/document the request semantics using the specified API surface, or obtain authorization for an extension. No new endpoint is silently assumed here. Validate object ownership/content before enqueueing; repeated completion must not repeat analysis. |
| U-02 | 9.1 versus 30.7, 59 | DynamoDB TTL is listed, but event expiry must retain history. Separate logical `expiresAt` from physical deletion. Do not attach destructive TTL to canonical event metadata unless an explicit history-preservation/archive policy is defined; reserve TTL for genuinely temporary records where appropriate. |
| U-03 | 9.4 versus 8.5, 82 | A ledger idempotency GSI alone does not specify an atomic uniqueness guard. Define a conditional primary-key guard/transaction before implementation; do not assume an index makes concurrent awards unique. Validate the exact AWS transaction syntax against current official docs. |
| U-04 | 8.1 versus 15.4, 35.5, 89 | `VERIFIED` is public provenance, not a declared EventStatus. Define the threshold/evidence policy behind ACTIVE + Community verified without adding an undocumented status. Keep contradictory/stale observations MONITORING; distinguish clearance from natural expiry. |
| U-05 | 8.2, 41.1 versus 14.5, 33, 36 | Server report states and local sync states differ; failed AI still needs NEEDS_CONFIRMATION/manual entry. Document the fallback/retry transition table so upload/analysis failures retain drafts and cannot bypass confirmation. |
| U-06 | 8.1, 8.3, 14.3, 15.1–15.4 | Numeric severity mapping, unknown/manual assessment, confidence threshold, radius, expiry durations and example merge threshold need one deterministic configuration. Preserve qualitative uncertainty and conservative separate-event behavior; examples are not scientific constants. |
| U-07 | 38 versus 68, 97.2 | The early environment list omits later kill switches and the restricted public map key. Later sections supplement it; consolidate the contract in `.env.example` after START without inventing credential names/values. |
| U-08 | 81 | The example error uses REPORT_MEDIA_INVALID but that code is absent from the canonical list. Use the canonical MEDIA_ANALYSIS_FAILED or VALIDATION_FAILED as appropriate unless an explicitly documented extension is agreed. |
| U-09 | 10 prefix versus 39.3 | §10 prefixes application routes with `/v1`; §39 explicitly shows `/health`. Keep `/health` as the documented operational exception; do not silently rename it. |
| U-10 | 31.4, 50, 59, 60 | Raw-media retention is configurable but no duration is fixed. Define a bounded prototype policy and deletion behavior before retaining real evidence; retain public incident history when independent evidence supports it. |

## Official documentation checked on 2026-10-08

These checks establish documented capabilities, not account access, deployment success, or selected version compatibility. Recheck exact SDK/package APIs and versions when implementing.

| Topic | Finding | Primary source |
|---|---|---|
| Event rules | Work begins at event opening; planning allowed. Public repository, short YouTube demo, write-up, AWS shown in video, and AI tool attribution required. No inference of explicit user START from this page. | [Rules](https://www.wemakedevs.org/aws/env/rules) |
| Schedule | Oct 8–11; exact kickoff/session/deadline hours still described as being finalized. No exact end time inferred. | [Schedule](https://www.wemakedevs.org/aws/env/schedule) |
| MapLibre | Official Expo setup requires native rebuild/config plugin and says Expo Go cannot use the package. | [Expo setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/) |
| Map style | Monochrome dynamic style and MapLibre style specification documented. | [Map styles](https://docs.aws.amazon.com/location/latest/developerguide/map-styles.html) |
| Location authentication | API keys support bounded map/place/route access with expiry and web/Android/Apple client restrictions; native examples documented. Actual React Native asset/key restriction behavior is unverified. | [API keys](https://docs.aws.amazon.com/location/latest/developerguide/using-apikeys.html) |
| Location region | Mumbai endpoints for Maps/Places/Routes documented. | [Endpoints](https://docs.aws.amazon.com/general/latest/gr/location.html) |
| Routes V2 | CalculateRoutes API documents avoidance-area geometry including bounding boxes/corridors/polygons. Exact SDK calls/encoding and configured account requests remain unverified; avoidance remains P1. | [CalculateRoutes](https://docs.aws.amazon.com/location/latest/APIReference/API_CalculateRoutes.html) |
| Nova | Nova 2 Lite documents image input and Converse. Mumbai is listed for global inference, not in-region/geo inference for this model. Native structured outputs are marked unsupported: use prompting, JSON parsing and shared schema validation with one retry/manual fallback. Account/profile/IAM/image-payload limits remain unverified. | [Nova 2 Lite](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-lite.html) |
| Foreground location | Official foreground permission and one-time location APIs documented; no background collection required for P0. | [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/) |
| Camera | Official camera permissions/capture documentation checked; exact API/version/compression/file upload path to pin later. | [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/) |
| Development environment | Expo documents development builds for custom native modules and recommends physical-device development. Platform-specific version compatibility still requires checking before tool changes. | [Expo environment](https://docs.expo.dev/get-started/set-up-your-environment/) |

Nova global inference does not promise processing only inside Mumbai. Verify the actual configured profile's processing geography and IAM requirements before sending real private media; do not imply India-only residency. No SDK method, model selection, or successful integration is inferred from a documentation table.

Future verification work after START: compatible Expo/React Native/MapLibre versions; Node/JDK/Gradle/Android toolchains; Location native asset authentication and attribution; routes geometry precision/encoding; AWS SDK v3 and CDK constructs; Cognito token/authorizer flow; presign plus post-upload inspection; DynamoDB concurrency/transactions; H3 cell coverage at route/bbox edges; Nova media limits/profile access/retry/latency. Official external-data endpoint/terms/freshness verification stays deferred with P1.

## Implementation decisions after explicit START

### D-12 — Completion signal on the specified report route

U-01 is resolved using POST `/v1/reports` with a strict action discriminator: DRAFT creates an owned private draft; UPLOAD_COMPLETE references only that report ID. The server chooses all object keys, validates the actual owned bytes and queues analysis. The listed `/v1/uploads/presign` and per-route `/v1/routes/{routeId}/risk` paths are retained. No image bytes enter API Gateway.

### D-13 — Temporary LOCAL/DEMO providers, by explicit user instruction

The user's SSO-delay instruction supersedes the original prohibition on replacing live core proof with demos for continued development. This authorizes explicit local adapters, not a live-proof claim or architecture switch. File persistence, private localhost upload grants, uncertain/manual assessment and straight-line route geometry implement the same interfaces as AWS. Runtime labels disclose the mode. Cloud services never select those providers. `jalnet`, `ap-south-1`, BLOCKED_AWAITING_SSO are the agreed profile, region and blocker.

### D-14 — Toolchain and strict version pins

Official Expo SDK57 template and compatibility docs supplied RN0.86.3/React19.2.3/TypeScript6.0.3; MapLibre11.5 requires the new native architecture. Selected Node 24.21.0/pnpm10.34.6/JDK17 and Android36. Native projects are generated/ignored; app.json remains the source. Metro consumes TS-source workspace packages, so their internal TS import uses `.ts` with no-emit typecheck enabled. The official installed API37.1 phone emulator is a temporary test device, not physical-phone evidence.

### D-15 — Concrete prototype policies

LOW→1, MODERATE→2, HIGH→4, CRITICAL→5, UNKNOWN→null; citizens manually submit severity1–4, so AI cannot publish critical status. Type-specific merge/radius/expiry windows are centralized in domain policy; lower median aggregation avoids a single outlier escalation. System confidence starts0.55 and two distinct photo contributors raise it to0.7 with basic corroboration0.6, independent of model confidence. These are prototype thresholds, not measured scientific probabilities. Votes alone earn no meaningful awards; one cleared witness sets MONITORING, two set RESOLVED. Public labels say community corroborated, not official verification.

After accepted public-road human confirmation, provisional +2 is capped at10/day, with a conditional counter in the incident/report/ledger transaction. Two distinct supporting image reports allow +8 first-useful and +5 corroboration awards exactly once. Copied-image primary guards and repeated same-user incident contributions are rejected. No points accrue for raw upload/private-property reports. Drafts are capped at20/user/day. Broader trust/admin reversals and GPS-spoof resistance remain incomplete.

### D-16 — Retention and physical key implementation

Raw evidence expires after14days; incomplete multipart uploads after1day. Canonical event tables have no physical TTL; logical expiry preserves history. Public cards omit original photos entirely. DynamoDB uses four small tables with conventional `id` / `userId` key attributes rather than the illustrative prefixed PK/SK names in §9, retaining separate event/report/user-route/ledger domains and H3/user indexes. This is an explicit storage-detail deviation for simple typed queries, not a service/architecture change. Ledger guards are conditional primary keys, not GSI uniqueness.

### D-17 — Current primary references

Implementation consulted installed package types and official [Expo SDK reference](https://docs.expo.dev/versions/latest/), [MapLibre Expo setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/), [Converse](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html), [Nova schema](https://docs.aws.amazon.com/nova/latest/nova2-userguide/request-response-schema.html), [Location map keys](https://docs.aws.amazon.com/location/latest/developerguide/using-apikeys.html), [Routes V2](https://docs.aws.amazon.com/location/latest/APIReference/API_CalculateRoutes.html) and [CDK JWT authorizer](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigatewayv2_authorizers.HttpUserPoolAuthorizer.html). Documentation and types establish API shapes, not access or live success.

### D-18 — Local continuity while SSO is unavailable

The user explicitly set AWS state to BLOCKED_AWAITING_SSO, profile jalnet, region ap-south-1, and approved emulator testing. Retain the planned AWS stack and continue LOCAL/DEMO providers behind the same interfaces; no LocalStack, static credentials or successful-looking AWS fixtures. The emulator uses simulated camera/GPS, and local analysis intentionally produces uncertainty/manual entry. None is live AWS acceptance.

### D-19 — Bounded retries, queries and owner-scoped caching

Prototype policies: 20 drafts/user/day; five upload grants/report and 100/user/day; 30 route provider attempts/user/day; five-minute, maximum 200-entry warm-process owner-scoped route cache. Failed provider attempts consume quota. Upload retries reuse the owned random key. H3 queries have 512-cell/eight-concurrency/100-record page/five-page/1,000-candidate caps; fail on overflow instead of silently skipping a crowded cell. Filter/rank public current events before the 200-card response cap. These are engineering bounds, not measured live quotas or budget proof.

Offline SQLite cache lasts 24 hours and is scoped by a hash of the authenticated account scope. Only errors raised at the fetch transport boundary allow fallback, because Android native fetch uses Error rather than browser TypeError. Cached conditions are explicitly dated and never represented as current route safety. The emulator restart test exposed and verified this fix. A working retry action refreshes API queries after connectivity returns.

### D-20 — Atomic final confirmation and evidence continuity

Confirmation logically traverses SUBMITTED and atomically persists ACCEPTED/MERGED together with incident/ledger updates; storing an intermediate submitted state would introduce an unnecessary partial-commit boundary. Report observedAt/submittedAt capture the human confirmation time. SHA-256 is checked again before model assessment and human publication to reject evidence changed after completion. Live S3 presign replay/version and asynchronous duplicate-delivery tests remain pending; no claim of fully immutable object storage is made.

### D-21 — Scoped Routes ARN and foreground acquisition

Routes V2 provider ARN has an empty account component: arn:${Partition}:geo-routes:${Region}::provider/default. CDK now emits this exact shape and tests reject an account-bearing route ARN. Reference: [AWS geo-routes authorization](https://docs.aws.amazon.com/service-authorization/latest/reference/list_geo-routes.html). DynamoDB roles grant only actual service GetItem/PutItem/Query/DeleteItem actions; only the report API can write private S3 evidence, and the worker can read it.

Foreground location uses an explicitly removed watch with a 15-second timeout instead of an unbounded location request; no background task is added. The emulator returned the deliberately simulated Delhi coordinate with approximately 5 m accuracy. Reference: [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/). Native capture returned a resized 1,280×1,102 JPEG of 14,020 bytes without EXIF; its black/timestamp emulator image is not a real water issue.

### D-22 — Analysis lease prevents parallel model attempts

Acquire a conditional 90-second report analysis lease in the ledger guard namespace while atomically checking ANALYZING status. It exceeds the 60-second worker deadline and expires before the six-minute SQS visibility retry. A busy duplicate returns a retryable failure; completed reports return without another invocation. This is implemented/tested with local concurrent workers; actual SQS crash/redelivery/model-cost behavior remains IMPLEMENTED_UNVERIFIED until SSO testing.

### D-23 — Mandatory Cedar in the local private-report composition

At the user's explicit approval, add exact official `@cedar-policy/cedar-wasm@4.13.0` after an isolated successful Node 24.21.0 compatibility probe. Use the Node subpath; no browser/Hermes integration or runtime rewrite. A typed ReportAuthorizer gates `ownedReport()` for the existing ReadReport, PresignReport, CompleteUpload and ConfirmReport operations, before side effects/replay. Principal comes from the unchanged trusted server authentication mapping, resource/owner from persisted Repository data. Keep the original ownership comparison as defense in depth; preserve canonical missing-auth 401, missing-report 404 and forbidden 403.

Local server creation requires successful real Cedar initialization; it has no permissive/legacy fallback or disable switch. Strict schema/policy validation and strict request validation precede evaluation. Initialization, request/evaluation failure, unknown action and any nonempty error diagnostics/warnings fail closed and discard internals. A real overflow-policy test demonstrates Cedar Allow plus diagnostics; JalNet returns a redacted 503 and grants/writes nothing. A real explicit forbid denies an otherwise permitted owner through HTTP for all four actions.

Existing draft creation authenticates and assigns ownership before any existing-report resource exists. Upload PUT redeems the short-lived capability issued after authorization; internal analysis is a worker operation, not a user-access endpoint. These audited boundaries introduce no new role, product permission or sharing feature. Accepted replay/conflict branches retain their corresponding mandatory action.

The core constructor's additive authorizer parameter remains optional for the unchanged AWS factory and 71 baseline tests. The real local factory always supplies Cedar. Lambda/IAM/CDK/Cognito/AWS providers and deployment guards are unchanged; Cedar loader/WASM/policy asset packaging and live Lambda execution require a separate future gate. Build It local technical evidence, organizer/submission eligibility and live AWS/P0 acceptance remain separate. All 111 tests pass (40 new actual-engine tests); measurements and exact checks are in IMPLEMENTATION_REPORT.md. Apache license/NOTICE/upstream third-party notices are retained separately from MIT.

### D-24 — Freeze Cedar; explicit USB-local demo transport

The user accepted Cedar at 9422fc2 and froze authorization unless a security defect is found. The subsequent read-only audit found no such defect and identified an emulator-only upload address. Add only a development-server `--android-usb` transport selection: USB phone API/upload use loopback plus adb reverse; emulator retains 10.0.2.2. Both use the unchanged mandatory Cedar local factory, policies and domain workflow. No LAN listener, tunnel, alternate authorization or cloud composition is introduced.

Explicit mobile local/USB launch presets set provider mode/API in the shell. This keeps the local demo usable after a failed cloud cutover without overwriting actual private AWS configuration or silently downgrading a cloud runtime. Build It has a separate planned 2:45 script and physical/submission gates; live AWS retains its account/role/SSO, native Maps and dependency gates. Development APK/Metro dependence and all synthetic scene/pin/route/analysis boundaries must be disclosed. No P1/P2 or unrelated mobile UI changes.

The subsequent physical-phone walkthrough exposed two usability gaps. The local basemap's countries-only style had no street detail for pin placement; change only its URL to public OpenFreeMap Liberty, verified in the existing native client, retaining source attribution and the unchanged AWS Maps branch. A stale saved-route check lacked an in-sheet refresh action; add Refresh route reports using the existing query invalidation and explicitly color its placeholder for contrast. No routing provider, warning freshness rule or product scope changes. See BUILD_IT_DEVICE_DEMO.md for disclosures, external tile privacy and actual physical evidence.

### D-25 — Primary Build It submission and narrow feature exception

On2026-10-08 the owner explicitly replaced the acceptance-only strategy with a local Build It engineering/UI handoff objective. The [official overview](https://www.wemakedevs.org/aws/env), reread that day, supports AWS open-source local use and lists Cedar with no AWS account requirement. Cedar's real mandatory integration remains frozen9422fc2, with all40 tests unchanged; overall eligibility/opening-time/original-work participation/submission review remains separate under the [official rules](https://www.wemakedevs.org/aws/env/rules). No timestamps/history are rewritten. SSO is no longer a primary-submission dependency. Future AWS architecture/guards/cloud P0 remain intact and BLOCKED_AWAITING_SSO.

Authorize only My Water, a small explainable Water Stress sample calculator and clearly disclosed vision previews. My Water uses manual capacity/level/daily-use arithmetic, explicit one-day simulation and a versioned account-scoped row in existing `jalnet-cache.db`, not another database, backend/API, sensor or cloud dependency. Zero-use/empty-tank behavior, bounded numeric input, ordered persistence, corruption/error recovery and tank-only fixture reset are explicit. A nonzero daily-use input is at least0.01L/day; bounds are prototype input guards, not physical tank standards. No elapsed wall-clock drain, refill, baseline/anomaly or ML forecasting is implied.

Water Stress uses §21.2 weights, renormalizes available factors and suppresses score/band below60% weighted coverage. The cutoff is a documented prototype communication policy, not a scientifically calibrated rule. All pressures are fictional DEMO inputs, including edited values; no external feeds/current timestamp/confidence/official measurement claim. Stress is kept separate from tank, incident severity, routing and droplets. TankerOS shows sample DEMO suppliers/prices/volumes without a booking/payment/contact action; reservations/order simulation are absent. HeatSafe remains a PLANNED text/card preview with no heat/safety data.

Engineering adds stable local contracts/controllers and minimal usable screens; Aryan owns visual refinement using ARYAN_UI_HANDOFF.md. The owner owns phone testing/product decisions, five actual rehearsals, recording/submission and approvals. Regression HTTP smoke gains `--isolated`, using an ephemeral loopback server and temporary fixture data so the functioning USB API/Metro/private drafts need no reset. Existing smoke mode remains available. No extra framework/package/model, roles/sharing or unrelated backend refactor.

### D-26 — Owner-authorized full visual redesign and persistent appearance

On 2026-10-09 the owner explicitly assigned the complete mobile UI cleanup to Codex while Aryan is unavailable. Create **ui/jalnet-redesign** from accepted **2dbbc4f** on `codex/build-it-features`, retain all feature/core functionality and deliver a reviewable PR without merging or rewriting history. This supersedes the visual-ownership sentence in D-25, not the frozen engineering/security boundaries. Physical checks are deferred while the owner's phone battery is depleted.

Use centralized semantic light/dark palettes and reusable typed presentation components rather than a UI framework or new navigation/state architecture. Choose exactly **System (default), Light and Dark**. System follows React Native's device color scheme; explicit overrides update immediately. Persist only a device-wide appearance key via existing `expo-sqlite/kv-store` and existing `jalnet-cache.db`, serialize choices and expose redacted retry failures. Gate child rendering behind preference hydration/native splash. Appearance changes must not key/remount the form, camera or map and must not clear private drafts/tank/cache/routes.

Use **lucide-react-native@1.53.0** and Expo-compatible **react-native-svg@15.15.4** for consistent typed line icons, preserving full ISC/Feather MIT notices. Target 48dp labeled actions, safe-area-aware sheets, keyboard scrolling, semantic uncertainty and enlarged text. Native debug APK build and API37 emulator install passed; actual screen/state/theme/attribution acceptance is recorded separately, and physical Redmi acceptance is pending. Bundle/type checking alone does not prove native icon/layout compatibility.

An actual dark-map inspection found low-contrast upstream labels. Adapt only LOCAL OpenFreeMap presentation: stable bundled 47-layer Dark JSON, centralized background/label/halo colors and supplemental Dark Matter/JalNet design attribution; retain roads, geometry/layout/filter rules and vector/sprite/glyph endpoints. Keep the original descriptor and complete MIT/BSD/CC notices, native source credits and data attribution. Light uses Positron; future Amazon Location guarded URL/key/provider behavior is unchanged. This does not add a tile server/cache, promise an offline basemap or verify AWS Maps.

A cold-rehydrated private draft exposed a mobile integration defect: stored location provenance/accuracy was carried into the UI pin and then rejected by the strict confirmation coordinate schema. Normalize the restored pin and confirmation payload to explicit `{ lat, lon }`, retaining accuracy separately in `ReportFlow.tsx`. Actual native-to-local-HTTP confirmation of the preserved draft passed after the fix. Preserve the existing API/schema, storage/backend and Cedar boundaries; no relaxation or data clear was needed.

Preserve all 165 baseline tests, including 40 Cedar tests; 16 new theme tests give **181 tests / 16 suites**. The final current-source gate was rerun after all mobile fixes, including compact layout, shared text flex and coordinate normalization: **PASS for all eight local checks** — format/lint/types/synth/test/Android export/real Cedar/isolated smoke — recorded in the ignored `.tools/ui-redesign/final-*.log` files. The actual native HTTP retest and broad regression gate validate the bounded coordinate fix; no new test was added.

Scoped emulator inspection is complete: System/Light/Dark choices/overrides/OS transitions/cold restarts, both maps and viewport/pin/route retention, both new 48 dp native credits controls, reset/simulation/final tank restart and the measured compact/font-1.3 keyboard/warning/tab/footer cases passed. Only the three standard data-source credits were visibly confirmed in the native popups; keep Dark Matter design/license and JalNet adaptation credits linked in repository/recorded materials. Invalid 0 retained its text across theme change and suppressed forecast/simulation, but a valid intermediate 1 saved during per-character editing; do not describe that whole sequence as preserving the original 600 L tank. Unretaken Stress limited/missing/invalid and empty/zero-use cases, full TalkBack, redesigned Redmi, performance/offline/full permission matrix, five owner rehearsals/final recording/submission/eligibility and live AWS acceptance remain explicitly pending/separate. Live AWS stays **BLOCKED_AWAITING_SSO**; optional Cedar Lambda is unverified and P0 is not declared complete. See [UI_REDESIGN_REPORT.md](UI_REDESIGN_REPORT.md) and the [35-capture after-design pack](ui/redesign/README.md) for exact behavior/source/evidence.

# JalNet final submission package

Prepared 2026-10-09, Asia/Kolkata. These are copy-ready project materials, with explicit unfinished video/final-verification fields. Organizer approval and genuine [migration provenance](../MIGRATION.md) are already recorded. **Final video: NOT RECORDED. Video URL: NOT AVAILABLE. Form submission: NOT SENT.**

## Project title

**JalNet — Water reports, route warnings and Cedar-protected evidence**

Track: **Heat and Water**. Approach: **Build It**, running AWS-origin Cedar locally. Repository: [farhanakhtar0x66/jalnet-submission](https://github.com/farhanakhtar0x66/jalnet-submission).

## One-sentence pitch

JalNet turns a citizen’s water observation into a reviewed incident and a warning for intersecting saved routes, while mandatory Cedar authorization protects private report evidence.

## Problem statement

A waterlogged street or visible leak is easy to notice, but an isolated photograph gives other residents little context about when it was reported, whether it remains active or whether it affects their route. JalNet connects a human-confirmed observation, conservative freshness and a saved-route intersection instead of treating every photograph as verified environmental truth.

## Solution overview

Our Android prototype lets a user choose a pin, capture a JPEG, retain a private draft, upload evidence locally and manually confirm category, qualitative severity and explicit demo consent. The application creates an UNVERIFIED incident, checks its intersection with saved corridors and records an eligible provisional contribution in an idempotent droplet ledger. Reports, warnings and awards follow actual local domain logic; they are not static success screens.

This submission demonstrates a **LOCAL/DEMO** composition: fixed local identities, private local file evidence, a persisted local repository, manual assessment and straight-line route fixtures. OpenFreeMap supplies real public basemap assets. The scene/pin/corridor used for a take are staged or synthetic; no local image model interprets the photo.

## Environmental relevance

The intended benefit is to make localized waterlogging, drainage and leak observations easier to review and relate to journeys. A household calculator also makes entered water-use assumptions visible. We have not measured environmental impact, deployed across a city, validated a safety intervention or collected real utility feeds. The prototype offers inspectable information and uncertainty, not a guarantee that a road is safe or water will remain available.

## AWS open-source integration: real Cedar authorization

AWS released Cedar’s policy language and authorization engine under Apache-2.0. JalNet uses the genuine pinned **`@cedar-policy/cedar-wasm@4.13.0`** Node/WASM engine, not a mock authorization response. [AWS’s Cedar announcement](https://aws.amazon.com/about-aws/whats-new/2023/05/cedar-open-source-language-access-control/).

The local server must initialize validated Cedar policies before it can listen. Private-report ReadReport, PresignReport, CompleteUpload and ConfirmReport operations call the authorizer through `Application.ownedReport()`. The principal comes from the trusted server authentication mapping; report ownership comes from persisted repository data. The existing ownership comparison remains as defense in depth. Unknown actions, malformed inputs, initialization/evaluation failures and nonempty policy diagnostics fail closed; HTTP dependency errors are redacted. Cedar authorizes—it does not replace authentication.

The checked-in owner permit is unchanged:

```cedar
permit (
  principal is JalNet::User,
  action in [
    JalNet::Action::"ReadReport",
    JalNet::Action::"PresignReport",
    JalNet::Action::"CompleteUpload",
    JalNet::Action::"ConfirmReport"
  ],
  resource is JalNet::Report
)
when { resource.owner == principal };
```

Actual-engine HTTP tests prove owner access, foreign denial and an explicit **test-only** forbid denying an otherwise permitted owner. Denied requests create no upload grant, report mutation, analysis call, incident or droplet award. Policy-error diagnostics produce redacted failure even when a separate Cedar permit returns Allow. [Boundary and 40-test proof](CEDAR_AUTHORIZATION.md), [production policy](../policies/private-reports.cedar).

Reproduce from the repository with the pinned Node runtime:

```sh
pnpm cedar:demo
pnpm cedar
pnpm exec vitest run tests/cedar-authorization.test.ts tests/cedar-http.test.ts --reporter=verbose
```

The test engine is real; HTTP repositories/images are isolated synthetic fixtures. Prepared terminal footage must identify the tested revision and execution time. Do not show bearer values, signed URLs or private evidence.

## Architecture

**Actual local application:**

```text
Android camera + private draft + chosen pin
  → local HTTP API / fixed demo authentication
  → Application.ownedReport() fetches persisted report/owner
  → mandatory Cedar decision + ownership defense for private-report operations
  → evidence/analysis/repository interfaces
  → private local evidence + persisted report + manual assessment
  → human confirmation → incident fusion/freshness + provisional ledger
  → saved straight-line corridor intersection → route warning
```

SQLite holds private mobile drafts/cache, appearance preference and account-scoped tank values. Stress inputs stay in screen memory. OpenFreeMap style/tiles/glyphs/sprites are external network assets; the development client needs Metro/USB.

**Preserved future cloud architecture — IMPLEMENTED_UNVERIFIED:**

```text
Android → Cognito → API Gateway → Lambda → DynamoDB
  → private S3 presign/upload → SQS → analysis worker → Bedrock/Nova
  → human confirmation → incident fusion → event API
  → Amazon Location Routes → route warning → droplet ledger
```

AWS providers, CDK/IAM resources and account/role deployment guards remain in the repository. Live AWS is **BLOCKED_AWAITING_SSO**. Cedar is not composed or verified in Lambda; this submission does not claim Cognito, DynamoDB, S3, SQS, Nova or Amazon Location ran. Cloud deployment is optional to this local demonstration.

## Working features and honest scope

| Feature | What actually runs |
|---|---|
| Android map and reporting | Native street map, deliberate pin, JPEG capture, private draft/local upload, manual category/severity/consent and confirmation |
| Incident handling | Local persisted incidents, conservative fusion, UNVERIFIED/freshness/expiry labels and public-data filtering |
| Route warnings | Real intersection/risk calculation over saved **straight-line demo corridors**, refresh and stale/offline uncertainty; no road navigation/alternative-route guarantee |
| Droplets | Atomic local provisional ledger and replay/duplicate/cap guards; one eligible staged report gives +2, not measured impact |
| Cedar | Mandatory real local private-report authorization, actual-engine owner/foreign/forbid/fail-closed HTTP proof |
| Appearance | System/Light/Dark, shared icons and persisted appearance; scoped emulator evidence is separate from final Redmi acceptance |

## Calculated demos

**My Water:** remaining litres = capacity × level percentage / 100; estimated hours = remaining litres ÷ daily use × 24. Inputs 1,500 L / 60% / 300 L per day calculate **900 L / 72h**. Simulate one day without refill to calculate **600 L / 40% / 48h**. Valid values persist locally; feature-only reset preserves report/route/draft/ledger data. Zero consumption gives no depletion estimate; an empty tank gives 0 L/0h. These are entered/demo assumptions, not sensors or a validated supply forecast.

**Water Stress:** six fictional editable pressures use weights supply 25%, heat demand 15%, rainfall/recharge 15%, groundwater 20%, tanker demand 15% and leak loss 10%. Available weights are renormalized; weighted coverage below 60% suppresses the headline. The sample computes 59.5 points, rounded to **60/HIGH, 100% coverage**. Clearing supply and groundwater leaves 55% coverage and no score. This is a disclosed **DEMO INDICATOR**, not measured environmental data or a calibrated scientific standard.

## Previews and future work

TankerOS contains fictional supplier, volume and sample-price cards: **PREVIEW/DEMO**, with no booking, payment or contact. HeatSafe is **PLANNED**, with no heat measurements, heat-aware routing or safety score. IoT, real supplier operations, predictive features, push and background route learning are future work, not delivered features.

## Technology stack

Actual pinned manifests: Node 24.21.0, pnpm 10.34.6, TypeScript 6.0.3, Expo 57.0.27, React Native 0.86.3, React 19.2.3, MapLibre Native 11.5.0, TanStack Query 5.104.1, Zustand 5.0.15, Expo SQLite 57.0.4, Cedar WASM 4.13.0, H3-js 4.5.0, Zod 4.6.5, Lucide React Native 1.53.0 and React Native SVG 15.15.4. Local HTTP/file providers are implemented in TypeScript. Vitest 5.0.3 validates the local system. The preserved cloud code uses AWS SDK v3 and CDK 2.272.0. [Root manifest](../package.json), [mobile manifest](../apps/mobile/package.json).

## Validation and current acceptance

| Evidence | Actual result / limit |
|---|---|
| Sprint starting baseline | Reproduced at **57a4da6**: 193 tests / 18 suites and all eight existing gates PASS; no code changes inferred from this baseline |
| Established engineering CI | [7be3368 CI](https://github.com/farhanakhtar0x66/jalnet-submission/actions/runs/37942059301) SUCCESS; historical evidence. [Reviewed-source c2a8148 CI](https://github.com/farhanakhtar0x66/jalnet-submission/actions/runs/37954567115) also completed SUCCESS |
| Cedar proof | `pnpm cedar:demo` PASS: 4/4 owner allow, 4/4 foreign403, 4/4 TEST-ONLY owner-forbid403, zero new denial effects. Existing 40 actual-engine/HTTP tests retained. Benchmark:1,000 decisions, 500 allow /500 deny |
| Native evidence | New submission-checkout arm64 development APK built successfully with Gradle in 1m27s /368 tasks and installed in place on the owned emulator; it requires Metro. Current native capture/draft-restart/offline-retry/manual confirmation produced one UNVERIFIED incident, a corridor warning and one +2 ledger entry. [Exact final evidence](FINAL_ENGINEERING_REPORT.md); [historical 14 screenshots](ui/submission/README.md) |
| Physical device | Earlier Redmi core staged-camera → manual confirmation → UNVERIFIED incident → warning → +2 proof; latest redesigned-screen/full camera/location/offline/accessibility acceptance still PENDING |
| Reviewed stabilization source | **All eight gates PASS: 212 tests / 23 suites**, source `c2a8148`, 2026-10-09 21:18 IST; 193 baseline tests retained +19 new regression cases. [Same-source CI](https://github.com/farhanakhtar0x66/jalnet-submission/actions/runs/37954567115) SUCCESS; final delivery/native evidence in [the engineering report](FINAL_ENGINEERING_REPORT.md) |
| Rehearsals/video | Five full timed physical rehearsals NOT RUN; final video NOT RECORDED, no URL |

[Current status](SUBMISSION_STATUS.md), [physical acceptance](PHYSICAL_ACCEPTANCE.md), [rehearsal log](FIVE_REHEARSALS.md). No production rollout, live AWS verification or P0 completion is claimed.

## Official submission logistics

Official sources checked **2026-10-09 IST**. The organizer’s October 6 article explicitly gives the online deadline as **Sunday, October 11, 2026, 8:00 PM IST**, separate from the October 10 in-person closing time. [Organizer deadline announcement](https://www.wemakedevs.org/blogs/what-is-happening-in-delhi-on-10-october), [event schedule](https://www.wemakedevs.org/aws/env/schedule).

Submit one team entry with a public repository, a short problem/build/AWS write-up and a YouTube video **strictly under 3:00**, public or unlisted and accessible signed out. The event’s own form is authoritative for its fields/deadline; the public/static page exposes no final form URL, so no portal link or unseen required field is invented here. Owner login/form review and receipt verification remain required. [Official submission rules](https://www.wemakedevs.org/aws/env/rules).

Each member uses their own WeMakeDevs account/registration and event check-in, plus an AWS Builder Center student profile. The rules allow an open SheerID verification case while submitting/judging; resolve profile status personally. These profile requirements are separate from AWS cloud SSO. [Account/team rules](https://www.wemakedevs.org/aws/env/rules).

## Acknowledgements and credits

Project [MIT license](../LICENSE); retained Expo/650 Industries starter [MIT notice](../apps/mobile/LICENSE). Cedar is Apache-2.0, with unmodified upstream [license/NOTICE/third-party material](../third-party/cedar/README.md). Lucide ISC and Feather-derived MIT [notices](../third-party/lucide/LICENSE) remain distributed.

Map credits: **OpenFreeMap · © OpenMapTiles · Data from OpenStreetMap**. For Dark footage/style: **MapTiler/OpenMapTiles contributors; CartoDB; Stamen and Paul Norman; JalNet color adaptation**, with BSD/CC source/design and other imported font/icon/data [license notices](../third-party/openfreemap-styles/README.md). The native popup showed only the three standard data-source credits; additional Dark design credits are in source and recording descriptions.

Farhan Akhtar supplied the project requirements and performed the earlier owner-staged phone tests. The owner identified Aryanxp1 as team leader and shubhrgunjan as another member; no unobserved code contributions are attributed to them. The team should add only genuine individual contributions to any form field. **OpenAI Codex assisted planning, code, tests, UI and documentation**; human review and device/product work remain disclosed. No invented users, partners, impact metrics or field measurements.

## Final video field

**Video status: NOT RECORDED.**

**YouTube URL: NOT AVAILABLE — owner supplies the actual reviewed public/unlisted link after uploading.**

Use the [2:40–2:45 narration/shot plan](FINAL_DEMO_SCRIPT.md). Final publication/form submission is owner-controlled; this package has not sent anything.

## Twelve judge questions

1. **Why is JalNet different from a normal reporting app?** It connects a human-reviewed observation to incident freshness, the user’s saved-route intersection and an idempotent contribution history, while enforcing a real policy boundary for private evidence.
2. **Where does environmental data come from?** The current local demonstration uses a staged citizen capture, a synthetic pin/corridor and fictional Stress inputs. No official environmental or utility feed is connected; OpenFreeMap supplies the public basemap.
3. **How are false reports handled?** Human confirmation, explicit consent, duplicate-media/replay/self-corroboration guards, conservative UNVERIFIED labels and expiry reduce unsupported claims. They do not establish field truth; a photograph or GPS claim can still be wrong.
4. **How useful are warnings without real road routing?** They prove the incident-to-saved-corridor warning mechanism. Straight-line corridors cannot support real travel advice; actual Amazon Location road routing remains a future unverified provider.
5. **Why Cedar?** Evidence access is a clear principal/action/resource decision. Cedar makes that owner rule explicit, mandatory and demonstrably deny-capable; errors fail closed, and authorization stays separate from authentication.
6. **Does JalNet actually use AWS?** It genuinely executes AWS-origin open-source Cedar locally for Build It. No AWS cloud service is verified; SDK/CDK code alone is not a running cloud integration.
7. **What is genuinely working?** Local Android capture/private draft/upload/manual confirmation, incident processing, route intersection/warnings, ledger/replay rules, mandatory Cedar and executable water calculators, within the documented tested environment.
8. **What remains simulated?** Local identity and file providers stand in for planned cloud services; evidence/location/corridors are staged, assessment is manual with no image model, and tank/Stress inputs are assumptions or fictional pressures. TankerOS is preview-only; HeatSafe is planned.
9. **How does the tank estimate work?** Capacity × level gives litres; litres divided by constant daily use × 24 gives hours. Simulation subtracts one day’s use with no refill. It is arithmetic over inputs, not a sensor reading or supply prediction.
10. **How would JalNet scale to a real city?** The preserved interfaces/CDK path separates Cognito identity, DynamoDB/H3, private S3, SQS workers, Nova and Location Routes. Real rollout still needs verified AWS resources, operational limits, data-governance/erasure and physical validation; scale is not demonstrated.
11. **How is private evidence protected?** Server-derived ownership and mandatory Cedar gate private-report access/capabilities, with owner defense in depth and redacted errors. Public incidents omit raw media/internal contributor details. Local files/SQLite are not claimed encrypted or production-hardened.
12. **What are current limitations?** No live AWS, local image model, real road navigation, environmental feeds, sensor integration or supplier operations; latest Redmi cases, five timed rehearsals and final video remain pending. Warnings and tank estimates carry uncertainty, not safety guarantees.

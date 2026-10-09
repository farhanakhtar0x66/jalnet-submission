# JalNet — Dense Implementation Plan
## Water intelligence layer for everyday city life

**Planning snapshot:** 2026-10-07  
**Target event:** WeMakeDevs × AWS — Environmental Hacks, Heat & Water track, Oct 8–11, 2026  
**Status:** Pre-build architecture/specification only. **Do not start JalNet project code, create the project repository, or provision project-specific infrastructure before the official hackathon clock starts.** The published rules explicitly allow learning/planning beforehand but say project work begins when the clock starts.

> **Product thesis:** Google Maps answers “How do I get there?” JalNet answers “What water-related problem is happening around me, along the routes I care about, and at the place I depend on — and what should I do before it becomes my problem?”

> **Hackathon thesis:** Do **one complete, undeniable working loop** exceptionally well — **capture water issue → AI understands evidence → creates/merges incident → incident appears on local map → user/route is warned → useful contributor gets droplets** — and make every broader JalNet feature feel like a natural extension of that same event intelligence layer.

---

# 0. Executive decision sheet

## 0.1 What JalNet is

JalNet is a **fast, map-first water alert and coordination application**. It is **not a driving-navigation replacement** and it should never feel like one.

On launch, JalNet immediately opens a clean map of the user’s current or chosen area and surfaces only water/heat information that can change what the user does:

- local waterlogging and flood reports,
- road segments affected by standing water,
- leaks and burst-pipe reports,
- blocked/overflowing drains,
- local water stress,
- household/building tank stress,
- supply interruptions,
- tanker availability and ETA,
- heat + hydration exposure,
- warnings affecting the user’s saved/usual routes.

A large camera action is always available. A user can photograph or record a water issue; JalNet captures the evidence and location, analyzes it, asks for one lightweight confirmation, creates or joins an incident, and later rewards **verified usefulness**, not raw upload count.

## 0.2 What must actually work by submission

The judges explicitly state that **“one feature that runs beats five that almost do.”** Therefore P0 is deliberately narrow:

1. **Native-feeling mobile app** opens directly on a fast map.
2. **Amazon Location Service + MapLibre** renders the basemap.
3. User can grant location access or use a demo/current-location fallback.
4. Live incidents are visible and filterable by layer.
5. Camera/upload flow accepts a real image.
6. Media is uploaded privately to **Amazon S3** with a presigned URL.
7. **Amazon Bedrock / Amazon Nova multimodal understanding** classifies the water issue into a strict JSON contract.
8. User reviews/edits the AI interpretation and submits.
9. Backend creates or merges an incident.
10. Marker appears immediately on the map.
11. A saved route can intersect the new incident and show **“Your route may be affected.”**
12. Contribution receives provisional/verified droplet points according to a deterministic ledger.
13. All of the above is recorded in the three-minute demo.

Everything else should be one of:

- **P1 — functional if time permits:** My Water simulated telemetry, Water Stress layer, basic Tanker reservation, second-user verification, official alert ingestion.
- **P2 — interactive prototype using explicit simulated/demo data:** HeatSafe scoring, advanced DrainScan, supplier optimization, route learning.
- **Post-hackathon:** true sensor integrations, supplier marketplace, municipal integrations, long-term predictive models.

Dead buttons are forbidden. If a feature is not backed by real production data, it must still have a coherent interaction driven by a clearly labeled **Demo/Simulated data provider**.

## 0.3 The primary demo story

Use one narrative, not six disconnected feature tours.

**User story:**

1. User opens JalNet near a Delhi/NCR demo area.
2. Jal Pulse is calm; map is visually quiet.
3. User’s saved “University” route is visible.
4. User sees waterlogging, taps the bottom camera, photographs it.
5. Upload → S3 → Nova analyzes:
   - category: `WATERLOGGING`
   - severity: `HIGH`
   - confidence: `0.86`
   - road passability: `POOR`
   - exact depth: **not claimed**
6. User confirms.
7. Backend fuses it with another report / creates a new incident.
8. A red hazard marker/polygon appears.
9. The saved route intersects the incident buffer.
10. JalNet shows: **“Your usual route may be affected. Avoid this segment.”**
11. User gets droplets after the report becomes verified/useful.
12. Switch to **My Water**:
    - simulated building tank level is falling,
    - estimated depletion precedes next supply,
    - TankerOS suggests a reservation.
13. End with a concise AWS architecture view.

The first 10–11 steps are the judged proof. My Water/TankerOS demonstrates expansion, not the core dependency of the demo.

---

# 1. Hackathon constraints that must shape engineering

## 1.1 Official constraints

Research on 2026-10-07 confirms:

- Event: **Environmental Hacks**, Oct 8–11, 2026.
- Track: **Heat and Water** explicitly includes heatwaves, floods, monsoon waterlogging, droughts, water tankers, leaks, and groundwater.
- Teams: 1–4.
- Project work starts when the event clock starts; planning/learning beforehand is allowed.
- Submission requires:
  - public repository,
  - YouTube demo video,
  - demo video **up to three minutes**,
  - short write-up.
- AWS requirement: to be prize-eligible, the project must use an AWS open-source tool or be deployed/implemented with AWS services; rules state the demo has to show where AWS fits.
- Judging emphasizes:
  - idea/impact,
  - meaningful AWS use,
  - design/usability,
  - execution,
  - three-minute demo.
- Official schedule currently says Oct 11 is submission day, but the exact final clock time is still being finalized. Do **not** depend on a guessed deadline.

## 1.2 Consequence

Do not build the architecture judges cannot see.

A perfect Kubernetes topology is worthless here if the camera-to-alert loop fails. We need the minimum AWS architecture that is both technically sound and visually explainable:

```text
React Native / Expo
       |
       | map tiles/routes
       v
Amazon Location Service
       |
       | authenticated API
       v
API Gateway
       |
       v
AWS Lambda
  |         \
  |          \ media analysis
  v           v
DynamoDB     Amazon Bedrock (Nova)
  |
  +-------> S3 evidence bucket
  |
  +-------> route-risk / incident fusion
  |
  +-------> notifications / droplets
```

Optional P1:

```text
simulated tank sensor
       |
       v
AWS IoT Core
       |
       v
Lambda -> DynamoDB -> alert engine -> app
```

This gives the video a simple “AWS is not decorative” story:
**Amazon Location powers the map/route intelligence, S3 holds evidence, Bedrock understands evidence, Lambda runs incident logic, DynamoDB stores live state.**

---

# 2. Product doctrine

## 2.1 Non-negotiable principles

### A. Map first

The home screen is the map. No dashboard-before-map, no feed-before-map, no onboarding carousel unless permissions are actually needed.

### B. Quiet when things are normal

JalNet should not render 5,000 POIs. Restaurants, stores, petrol pumps, transit icons, landmarks and generic commercial clutter are not the product. The basemap should be monochrome/low-contrast; **water intelligence is the color**.

### C. Action beats information

Never stop at “high water stress.”

Prefer:

> Water stress is high because local demand is elevated and rainfall has been low. Your building tank is still healthy. No action needed now.

or:

> Waterlogging intersects your saved route. Leave via the eastern segment or open a lower-reported-risk alternative.

### D. The app must remain truthful about uncertainty

A camera image usually cannot establish:

- exact flood depth in centimetres,
- whether water is contaminated,
- underground leak origin,
- exact litres/hour lost,
- structural safety.

The AI can make **observations and bounded estimates**, not authoritative engineering claims.

Correct:
> “Moderate standing water visible; vehicle passability uncertain.”

Incorrect:
> “Depth: 31.4 cm” from an arbitrary uncalibrated photo.

### E. “Safe route” language is too strong

The feature can be branded as Flood-Aware / Lower-Risk Routing, but user-facing safety text should say:

> “Avoids currently known/reported water hazards.”

Never guarantee that an alternate route is safe. Missing reports do not imply safe roads.

### F. Gamification rewards value, not content volume

Never give meaningful points merely because a file was uploaded. Otherwise JalNet becomes a spam economy.

### G. Privacy is a feature

Route learning is opt-in. The app should prefer derived route summaries over long-term raw movement history.

### H. One event model powers everything

Floods, leaks, drains, supply outages, stress zones, heat hazards and tanker needs are not six separate mini-apps. They are different **event types** flowing through the same location/time/severity/verification system.

---

# 3. Personas and jobs-to-be-done

## 3.1 Everyday commuter

**Need:** “Tell me whether water conditions near me or on the route I normally take will affect my day.”

Primary surfaces:
- Live layer,
- saved routes,
- route-impact alerts,
- flood/waterlogging incidents.

## 3.2 Citizen contributor

**Need:** “I saw something wrong; let me report it in seconds and show that it helped.”

Primary surfaces:
- camera,
- AI confirmation,
- report status,
- droplets,
- contribution impact.

## 3.3 Household/building resident

**Need:** “Will we have enough water today/tomorrow, are we using unusually much, and what do I do if supply fails?”

Primary surfaces:
- My Water,
- tank level,
- usage/baseline,
- shortage forecast,
- tanker reservation.

## 3.4 Society/facility manager

**Need:** “Avoid getting a call at 7 AM saying the tank is empty.”

Primary surfaces:
- building tank,
- supply schedule,
- auto-reserve policy,
- order status,
- anomaly alert.

## 3.5 Tanker supplier/driver

**Need:** “Show me legitimate demand near my operating area and help sequence deliveries.”

Primary surfaces:
- available requests,
- service-area filter,
- accepted jobs,
- simple optimized run,
- capacity remaining.

## 3.6 Municipal/operations user — future, not required for P0

**Need:** “Which water issue should my team resolve first?”

Primary surfaces:
- incident severity,
- number of affected routes/users,
- corroboration,
- drain/leak clusters,
- resolution workflow.

---

# 4. Information architecture

## 4.1 Main navigation

Use a minimal bottom navigation with a center capture action:

```text
[ Map ]       [ CAMERA ]       [ My Water ]
                 ⬤
```

Profile is accessible from a top-right avatar on Map / My Water.

Do not put six tabs across the bottom. Layers belong inside the map.

## 4.2 Home / Map

Top:
- JalNet wordmark / droplet glyph,
- current Jal Pulse chip,
- avatar.

Map:
- current location,
- saved-route polyline if selected,
- active incident markers/clusters,
- layer-specific polygons/lines,
- no generic clutter.

Bottom floating controls:
- `Layers`,
- center camera button,
- `My radius` / recenter.

Transient bottom sheet:
- “2 issues may affect you”
- nearest high-priority event
- route impact.

## 4.3 Layers

Canonical layer IDs:

```text
LIVE
ROUTE_RISK
FLOOD
LEAKS
DRAINS
WATER_STRESS
TANKERS
HEAT_WATER
```

`LIVE` is not “all data.” It is a relevance-ranked mix of nearby conditions.

## 4.4 My Water

Core modules:

```text
Tank
Usage
Supply
Stress
Reserve Water
Alerts
```

In demo mode the data is clearly marked:

> Simulated building telemetry — demonstrates smart-tank integration.

## 4.5 Profile

- droplet balance,
- rank,
- useful contributions,
- verified incidents,
- people/routes helped,
- cosmetics,
- privacy settings,
- learned/saved routes,
- notification settings.

---

# 5. Scope table

| Capability | P0 submission | P1 if time | P2 prototype | Later production |
|---|---:|---:|---:|---:|
| Fast map launch | ✅ | | | |
| Current location | ✅ | | | |
| Monochrome water-focused basemap | ✅ | | | |
| Layer sheet | ✅ | | | |
| Seeded incidents | ✅ | | | |
| Real photo capture | ✅ | | | |
| S3 private upload | ✅ | | | |
| Bedrock image analysis | ✅ | | | |
| Human confirmation | ✅ | | | |
| Incident create/fuse | ✅ | | | |
| Route intersection warning | ✅ | | | |
| Saved route | ✅ | | | |
| Droplet ledger | ✅ | | | |
| Confirm another report | ✅ preferred | | | |
| Push notifications | | ✅ | | |
| Water Stress area layer | | ✅ | ✅ | |
| My Water telemetry UI | | ✅ | ✅ | |
| Virtual tank sensor via IoT | | ✅ | | |
| Basic tanker quote/reserve | | ✅ | ✅ | |
| Supplier mode | | | ✅ | |
| Automatic reserve | | | ✅ | ✅ |
| Background usual-route learning | | | ✅ UI | ✅ |
| Video analysis | | ✅ if stable | | |
| NDMA SACHET ingestion | | ✅ | | |
| NWDP/CGWB data ingestion | | | ✅ | ✅ |
| Heat exposure route | | | ✅ | ✅ |
| Drain blockage scoring | | ✅ via same camera model | | |
| Advanced flood prediction | | | | ✅ |
| Municipal case integration | | | | ✅ |
| Real payments | | | | ✅ |

---

# 6. Recommended technology stack

## 6.1 Mobile

**React Native + Expo + TypeScript**, using a **development build**, not Expo Go.

Why:
- fastest path for a small team,
- camera, location, notifications and filesystem are well-supported,
- single codebase,
- native-feeling UI,
- enough access to background location later.

Core packages:

```text
expo
expo-router
expo-camera
expo-location
expo-task-manager
expo-notifications
expo-file-system
expo-image-manipulator (optional compression/sanitization)
expo-haptics
expo-secure-store
expo-sqlite (offline queue/cache)
@maplibre/maplibre-react-native
@tanstack/react-query
zustand
zod
```

Do not depend on Expo Go: MapLibre React Native requires custom native code, and Expo’s background location documentation also requires a development build for full behavior.

## 6.2 Map rendering

**MapLibre React Native + Amazon Location Service dynamic maps.**

Use the AWS **Monochrome** map style as the base if visual testing is satisfactory. AWS’s Location Service map styles follow the MapLibre GL style specification and support dynamic maps.

Why this is better than directly pointing at `tile.openstreetmap.org`:

- the OpenStreetMap Foundation explicitly says OSM data is free but its public tile servers are limited and must not be treated as a general production map backend,
- AWS Location is already an important, defensible AWS component,
- vector maps are fast and styleable,
- one provider can also handle routes, matrices, geofences and trackers.

Region: default project region **`ap-south-1` (Mumbai)** where practical. Amazon Location exposes Maps, Places, Routes, Geofences and Trackers endpoints in Mumbai.

## 6.3 Backend

Recommended P0 architecture:

```text
API Gateway HTTP API
        |
   Lambda (TypeScript)
        |
        +--> DynamoDB
        +--> S3
        +--> Bedrock
        +--> Amazon Location Routes
```

Why DynamoDB for hackathon:
- no VPC,
- no connection management,
- near-zero infrastructure babysitting,
- serverless,
- easy TTL,
- excellent for event/report/order state,
- enough geospatial functionality for a city-scale prototype using H3/geohash cells.

**Important architecture seam:** all persistence must sit behind repository interfaces. For long-term geospatial analytics, a future production version can move event geometry to **Aurora PostgreSQL + PostGIS**. AWS RDS/Aurora supports PostGIS, and Aurora’s Data API can provide connectionless SQL access. This is a future upgrade, not a requirement for the weekend.

## 6.4 Spatial indexing

Use **H3** cells as the coarse geospatial index in DynamoDB.

Store:
- exact lat/lon,
- GeoJSON geometry,
- `h3_r8`,
- possibly `h3_r9` for denser urban precision.

The API converts a visible map bbox / search circle to candidate H3 cells, queries those partitions, then exact-filters distances in Lambda.

For P0:
- events are mostly points + semantic radius,
- route intersections happen after candidate retrieval,
- this is simpler than operating a spatial database.

## 6.5 Media

Private **S3 bucket**:
- Block Public Access = on.
- Client asks backend for presigned upload URL.
- Limit MIME types.
- Limit image/video size.
- Use random object keys, not user filenames.
- Store thumbnails/derived media separately if needed.
- Add lifecycle rules post-hackathon.

Suggested key pattern:

```text
evidence/{user_id}/{report_id}/original.jpg
evidence/{user_id}/{report_id}/preview.webp
```

Never expose the bucket publicly. UI requests short-lived signed GET URLs.

## 6.6 AI

Use **Amazon Bedrock multimodal understanding**, preferably a current Amazon Nova multimodal model available to the team/account.

Research notes:
- Amazon Nova models support image and video understanding.
- Nova 2 Lite supports multimodal inputs.
- Bedrock’s Converse interface gives a common model API.
- Model availability varies by region; Mumbai can use supported inference profiles/global inference depending on model/account access.

Design the application so the model ID is environment-configurable:

```text
BEDROCK_MODEL_ID=...
```

Do not hard-wire business logic to prose output. Require JSON that passes `zod` / JSON Schema validation.

## 6.7 Optional image moderation/privacy

Before publishing user-generated media:
- reject unsupported/unsafe content,
- detect obviously unrelated uploads,
- later blur faces/license plates,
- strip unnecessary metadata.

P0 can keep original evidence private and expose only a sanitized preview to other users.

## 6.8 Auth

**Amazon Cognito User Pool**:
- email/phone auth can be introduced later,
- for hackathon, support simple email auth or demo account,
- access token used by API Gateway authorizer.

If auth threatens the demo timeline, keep a deterministic “Demo account” button in development while maintaining the same backend user-id contract.

## 6.9 Notifications

P0: in-app alerts + route warning.

P1:
- `expo-notifications` token registration,
- Lambda sends push via Expo Push Service.

Production:
- native APNs/FCM through an AWS-centric notification layer such as SNS where appropriate.

Do not let push setup block the core map/report demo.

---

# 7. Repository structure

Create **only after the official clock starts**.

```text
jalnet/
├── apps/
│   ├── mobile/                 # Expo React Native app
│   └── ops-web/                # optional P2/P3 web console
├── services/
│   ├── api/                    # Lambda handlers / HTTP business logic
│   ├── media-worker/           # Bedrock media analysis
│   ├── alert-worker/           # route/radius alerts
│   └── data-ingest/            # NDMA/NWDP jobs (P1+)
├── packages/
│   ├── contracts/              # Zod schemas shared app/backend
│   ├── domain/                 # scoring/state machines
│   ├── geo/                    # H3, distance, route intersection
│   ├── ui/                     # reusable tokens/components
│   └── config/
├── infrastructure/
│   ├── cdk/                    # or SAM; pick ONE and do not mix
│   └── README.md
├── scripts/
│   ├── seed-demo.ts
│   ├── simulate-tank.ts
│   └── reset-demo.ts
├── fixtures/
│   ├── reports/
│   ├── events/
│   └── telemetry/
├── docs/
│   ├── architecture.md
│   ├── privacy.md
│   ├── demo-script.md
│   └── data-sources.md
├── .github/
│   └── workflows/
├── README.md
├── LICENSE
└── package.json
```

Use `pnpm` workspaces if the team is comfortable with them. Otherwise npm workspaces are fine. Avoid introducing Turborepo/Nx unless everyone already knows it.

---

# 8. Domain model — the foundation

## 8.1 Event

An **Event** is the canonical map object representing a water/heat condition.

```ts
type EventType =
  | "WATERLOGGING"
  | "FLOOD"
  | "LEAK"
  | "DRAIN_BLOCKAGE"
  | "DRAIN_OVERFLOW"
  | "SUPPLY_OUTAGE"
  | "WATER_STRESS"
  | "HEAT_WATER_RISK"
  | "TANKER_DEMAND";

type EventStatus =
  | "UNVERIFIED"
  | "ACTIVE"
  | "MONITORING"
  | "RESOLVED"
  | "REJECTED"
  | "EXPIRED";

interface Event {
  id: string;
  type: EventType;
  status: EventStatus;

  location: {
    lat: number;
    lon: number;
    h3R8: string;
    h3R9?: string;
    geometry?: GeoJSON.Geometry;
    semanticRadiusM: number;
    placeLabel?: string;
  };

  severity: 1 | 2 | 3 | 4 | 5;
  confidence: number;         // 0..1 system confidence, not raw LLM confidence
  verificationScore: number; // 0..1
  reportCount: number;

  firstSeenAt: string;
  lastSeenAt: string;
  expiresAt?: string;
  resolvedAt?: string;

  attributes: Record<string, unknown>;
  publicSummary: string;

  sourceTypes: Array<
    "CITIZEN" | "SENSOR" | "GOV_ALERT" | "WEATHER" | "SYSTEM"
  >;

  impact: {
    affectedSavedRoutes: number;
    estimatedNearbyUsers?: number;
  };
}
```

## 8.2 Observation / Report

A report is not itself an event. It is **evidence** that can create or support an event.

```ts
type ReportStatus =
  | "DRAFT"
  | "UPLOADING"
  | "ANALYZING"
  | "NEEDS_CONFIRMATION"
  | "SUBMITTED"
  | "MERGED"
  | "ACCEPTED"
  | "REJECTED";

interface Report {
  id: string;
  userId: string;
  status: ReportStatus;

  capturedAt: string;
  submittedAt?: string;

  location: {
    lat: number;
    lon: number;
    accuracyM?: number;
    source: "CAPTURE" | "USER_PIN" | "CURRENT_LOCATION";
  };

  media: Array<{
    kind: "IMAGE" | "VIDEO";
    s3Key: string;
    sha256?: string;
    perceptualHash?: string;
  }>;

  aiAssessment?: MediaAssessment;
  userConfirmation?: {
    category?: EventType;
    stillActive: boolean;
    note?: string;
  };

  mergedEventId?: string;
}
```

## 8.3 AI media assessment contract

```ts
interface MediaAssessment {
  relevant: boolean;

  category:
    | "WATERLOGGING"
    | "FLOOD"
    | "LEAK"
    | "DRAIN_BLOCKAGE"
    | "DRAIN_OVERFLOW"
    | "OTHER"
    | "UNCERTAIN";

  visualSeverity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "UNKNOWN";

  evidence: string[]; // short visual observations only

  passability?: {
    pedestrians: "LIKELY_OK" | "CAUTION" | "POOR" | "UNKNOWN";
    twoWheelers: "LIKELY_OK" | "CAUTION" | "POOR" | "UNKNOWN";
    cars: "LIKELY_OK" | "CAUTION" | "POOR" | "UNKNOWN";
  };

  waterDepthClass?:
    | "TRACE"
    | "SHALLOW_VISIBLE"
    | "MODERATE_VISIBLE"
    | "DEEP_OR_UNSAFE"
    | "UNKNOWN";

  drain?: {
    visible: boolean;
    obstruction: "NONE" | "POSSIBLE" | "LIKELY" | "UNKNOWN";
    overflow: "NONE" | "POSSIBLE" | "LIKELY" | "UNKNOWN";
  };

  leak?: {
    visibleFlow: boolean;
    suspectedSource:
      | "PIPE"
      | "VALVE"
      | "ROAD_SURFACE"
      | "BUILDING"
      | "UNKNOWN";
  };

  modelConfidence: number; // auxiliary only; do not display as truth
  uncertaintyReasons: string[];
  publicDraft: string;
}
```

Prompt rule:
**Do not ask the model to calculate exact depth/flow/contamination from visual evidence.**

## 8.4 Saved route

```ts
interface SavedRoute {
  id: string;
  userId: string;
  name: string; // "University", "Office", etc.
  source: "MANUAL" | "SUGGESTED";
  polyline: string; // encoded polyline
  bbox: [number, number, number, number];
  corridorWidthM: number;
  schedule?: {
    daysOfWeek: number[];
    startMinute?: number;
    toleranceMin?: number;
  };
  activeAlerts: boolean;
}
```

## 8.5 Droplet ledger

Never store only `user.totalDroplets`. Use an immutable ledger.

```ts
type DropletReason =
  | "REPORT_SUBMITTED"
  | "FIRST_VALID_REPORT"
  | "REPORT_CORROBORATED"
  | "EVENT_VERIFIED"
  | "ROUTE_USERS_HELPED"
  | "ISSUE_RESOLVED"
  | "PENALTY_DUPLICATE"
  | "PENALTY_FALSE_REPORT";

interface DropletLedgerEntry {
  id: string;
  userId: string;
  reportId?: string;
  eventId?: string;
  amount: number;
  reason: DropletReason;
  createdAt: string;
  idempotencyKey: string;
}
```

This prevents double-awards and makes the gamification system auditable.

---

# 9. DynamoDB storage design

Use a small number of tables; do not spend the weekend perfecting “single-table design.”

## 9.1 `jalnet-events`

Primary:
```text
PK: EVENT#{eventId}
SK: META
```

GSI for coarse geo:
```text
GSI1PK: CELL#{h3R8}
GSI1SK: {status}#{lastSeenAt}#{eventId}
```

TTL attribute:
```text
ttl_epoch
```

Duplicate helper records can be stored by cell if necessary.

## 9.2 `jalnet-reports`

```text
PK: REPORT#{reportId}
SK: META

GSI_USER_PK: USER#{userId}
GSI_USER_SK: {submittedAt}
```

## 9.3 `jalnet-users`

```text
PK: USER#{userId}
SK: PROFILE
```

Additional SKs:
```text
ROUTE#{routeId}
DEVICE#{deviceId}
PREFS
```

## 9.4 `jalnet-ledger`

```text
PK: USER#{userId}
SK: {createdAt}#{entryId}

GSI1PK: IDEMPOTENCY#{idempotencyKey}
```

## 9.5 `jalnet-water`

For demo / later IoT:

```text
PK: ASSET#{assetId}
SK: TS#{isoTimestamp}
```

Asset metadata:

```text
PK: ASSET#{assetId}
SK: META
```

## 9.6 `jalnet-tankers` / `jalnet-orders`

Keep separate if P1 is implemented; do not pollute core tables in a rushed manner.

---

# 10. API contract

Prefix all routes with `/v1`.

## 10.1 Session/profile

```http
GET /v1/me
PATCH /v1/me/preferences
POST /v1/devices/push-token
```

## 10.2 Events

```http
GET /v1/events?bbox=minLon,minLat,maxLon,maxLat&layers=FLOOD,LEAKS
GET /v1/events/{eventId}
POST /v1/events/{eventId}/confirm
POST /v1/events/{eventId}/resolve-request
```

Response should return **map-card data**, not internal records.

## 10.3 Upload/report pipeline

```http
POST /v1/uploads/presign
POST /v1/reports
GET  /v1/reports/{reportId}
POST /v1/reports/{reportId}/confirm
```

Suggested flow:

```text
1. create report draft
2. request presigned upload
3. upload media directly to S3
4. tell API upload complete
5. worker analyzes
6. client polls report state
7. confirmation sheet opens
8. confirm
9. event fusion runs
```

Avoid routing image bytes through API Gateway/Lambda.

## 10.4 Routes

```http
GET    /v1/routes
POST   /v1/routes
DELETE /v1/routes/{routeId}
GET    /v1/routes/{routeId}/risk
POST   /v1/routes/preview
```

## 10.5 My Water

```http
GET  /v1/water/assets
GET  /v1/water/assets/{assetId}/snapshot
GET  /v1/water/assets/{assetId}/series?range=24h
POST /v1/water/assets/{assetId}/manual-level
```

## 10.6 TankerOS

```http
POST /v1/tankers/quotes
POST /v1/tanker-orders
GET  /v1/tanker-orders/{orderId}
POST /v1/tanker-orders/{orderId}/cancel
```

P2 supplier:

```http
GET  /v1/supplier/jobs
POST /v1/supplier/jobs/{id}/accept
POST /v1/supplier/jobs/{id}/status
```

---

# 11. Map query pipeline

## 11.1 Client behavior

When map stops moving:
1. debounce ~250–400 ms,
2. obtain bbox,
3. expand bbox ~10–20% so markers do not pop at edges,
4. send selected layers,
5. React Query caches response by coarse bbox/layer key.

Do not query on every pan frame.

## 11.2 Backend

1. Convert bbox to H3 cells at chosen resolution.
2. Query active-event GSI partitions.
3. Deduplicate event IDs.
4. Exact-filter point/polygon intersection with bbox.
5. Rank.
6. Hard-cap returned records (for example 200).
7. Return simplified geometry.
8. Media thumbnails remain lazy.

## 11.3 Client rendering

Use `ShapeSource` / GeoJSON clustering where possible.

At low zoom:
- clusters only.

At neighborhood zoom:
- category glyphs.

At street zoom:
- incident radii / route intersections.

Never mount hundreds of individual React marker components if a map source/layer can render them.

---

# 12. Visual layer specification

## 12.1 LIVE

Ranking formula:

```text
relevance =
  proximity_weight
  × severity_weight
  × confidence_weight
  × freshness_weight
  × personal_route_multiplier
```

Route-affecting events get a strong multiplier.

## 12.2 FLOOD

Visual:
- waterlogging markers,
- incident radius,
- road-adjacent affected line if known,
- red/orange based on severity,
- age label in detail card.

## 12.3 LEAKS

Visual:
- droplet fracture icon,
- severity based on visible flow + corroboration, not estimated litres.

## 12.4 DRAINS

Visual:
- drain icon,
- obstruction/overflow state,
- latest inspection/report date.

## 12.5 WATER_STRESS

Display H3/admin-cell polygons, not thousands of markers.

Index 0–100 but label it **JalNet Water Stress Index**, not an official government measurement.

## 12.6 TANKERS

Display:
- demand areas,
- opted-in supplier availability,
- booked/arriving vehicle only for the user/society,
- never reveal private customer destinations publicly.

## 12.7 HEAT_WATER

Display:
- high heat/water-demand zones,
- hydration/cooling points only when data is verified,
- HeatSafe route comparison in later phases.

---

# 13. Report capture UX

Goal: useful report in **<10–15 seconds** after capture.

## 13.1 Camera screen

Elements:
- full-screen camera,
- photo/video toggle,
- flash,
- close,
- capture,
- tiny “Location attached” indicator.

Avoid category selection before capture.

## 13.2 Capture constraints

P0 image:
- JPEG,
- resize/compress before upload,
- e.g. longest edge 1600–2048 px,
- target under a few MB.

P1 video:
- cap ~10–15 seconds for demo,
- 720p is enough,
- show upload progress.

## 13.3 Location

At capture:
- sample foreground location,
- store accuracy,
- allow user to drag the incident pin before submission.

If accuracy is poor:
> “Location accuracy is ~85 m. Move the pin if needed.”

Never silently claim GPS certainty.

## 13.4 AI confirmation sheet

Example:

```text
Possible waterlogging                         HIGH

I can see:
• standing water across part of the road
• restricted vehicle path
• possible overflowing roadside drain

Road passability:
Cars: Caution / Poor
Pedestrians: Caution

[Waterlogging ▾]
[Still active ✓]

Add a note (optional)

[Submit report]
```

The user is the final classifier before public submission.

---

# 14. Bedrock media-analysis pipeline

## 14.1 Trigger design

P0 easiest:
- client confirms S3 upload,
- API enqueues analysis request / directly invokes async worker.

Preferred:
```text
API
 -> SQS analysis queue
 -> media-worker Lambda
 -> Bedrock
 -> validate JSON
 -> update Report
```

If SQS setup threatens time, direct Lambda invocation is acceptable for the weekend.

## 14.2 Model prompt requirements

System behavior:
- visual environmental incident analyst,
- conservative,
- no invented measurements,
- no person identification,
- no private-data extraction,
- JSON only.

User task should contain:
- allowed categories,
- severity rubric,
- uncertainty rules,
- required schema,
- explicit instruction:
  - do not infer contamination,
  - do not produce exact water depth without calibration,
  - do not infer pipe ownership,
  - do not infer cause unless visually supported.

## 14.3 Example severity rubric

**LOW**
- small/localized issue,
- route largely unaffected,
- low immediate inconvenience.

**MODERATE**
- meaningful standing water/leak/obstruction,
- partial route obstruction or persistent flow.

**HIGH**
- road segment materially blocked,
- drain clearly overflowing,
- heavy visible leak,
- likely impact to multiple users.

**CRITICAL**
- only for obvious large-scale dangerous conditions and preferably requires corroboration; AI alone should not auto-publish a critical status.

## 14.4 Confidence construction

Do not equate model self-confidence to system confidence.

System confidence can be:

```text
system_confidence =
  0.30 * ai_quality
+ 0.25 * media_quality
+ 0.20 * location_quality
+ 0.15 * corroboration
+ 0.10 * reporter_trust
```

For first report:
`corroboration` is low.

For multiple independent reports:
increase it.

## 14.5 Structured output validation

Pipeline:

```text
Bedrock output
   |
JSON parse
   |
Zod validation
   |
invalid?
 |        \
yes        no
 |          \
retry once   store
 |
fallback to manual classification
```

Never make the user’s report disappear because AI failed.

## 14.6 Video

Amazon Nova supports video understanding, including S3-backed video inputs. Still, video is more expensive/slow.

P1:
- upload to S3,
- analyze asynchronously,
- UI says “Analyzing video… you can leave this screen.”

Do not hold the app open waiting for a long model response.

---

# 15. Incident fusion

This is one of JalNet’s strongest technical differentiators and should be implemented simply enough to work.

## 15.1 Candidate rules

When report is confirmed, search active events in neighboring H3 cells.

Type-specific initial merge windows:

| Type | Distance candidate | Time window |
|---|---:|---:|
| Waterlogging | 150 m | 3 h |
| Flood | 300 m | 6 h |
| Leak | 60 m | 4 h |
| Drain blockage | 30 m | 7 d |
| Drain overflow | 50 m | 6 h |
| Supply outage | 500–1000 m area | 6 h |

These are product heuristics, not scientific constants. Keep them configurable.

## 15.2 Fusion score

```text
fusion_score =
  0.40 * geo_similarity
+ 0.25 * time_similarity
+ 0.20 * category_similarity
+ 0.15 * evidence_similarity
```

P0 evidence similarity can be binary/simplified.

Merge threshold example:
`>= 0.72`.

If ambiguous:
create separate event rather than aggressively merging.

## 15.3 Event update

On merge:
- increment report count,
- update `lastSeenAt`,
- recompute verification,
- severity becomes a robust aggregate, not always max,
- attach report id,
- potentially award first-report/corroboration droplets.

## 15.4 Verification state

Suggested:

```text
1 independent report
  -> UNVERIFIED

2 independent reports
OR 1 high-trust report + supporting external signal
  -> ACTIVE / VERIFIED

stale / contradictory
  -> MONITORING

explicit multiple resolved confirmations
OR expiry rule
  -> RESOLVED
```

The map can still display an unverified event, but with visual distinction.

---

# 16. Droplet economy

## 16.1 Objectives

Droplets should:
- reward socially useful reporting,
- incentivize verification,
- avoid pay-to-win,
- unlock cosmetics/status only,
- resist farming.

## 16.2 Example award schedule

```text
Report submitted and relevant          +2
First accepted report of new incident  +8
Independent corroboration              +5
Incident becomes verified             +5
Report materially affects saved route  +3
Resolution confirmed                   +8
Duplicate spam                          0
Malicious/false report                 penalty / trust decrease
```

Do not literally award per “person helped” without caps; that can explode.

Instead:

```text
impact bonus:
1–9 affected routes:      +1
10–49:                    +3
50–199:                   +6
200+:                     +10 cap
```

## 16.3 Rank cosmetics

Example:

```text
0–99        Observer
100–399     Scout
400–999     Guardian
1000–2499   Waterkeeper
2500+       Jal Guardian
```

Unlock:
- icons,
- themes,
- profile banners,
- map accent packs,
- animated droplet badge.

Never:
- hide alerts behind rank,
- boost a report’s truth merely because the reporter has a flashy rank.

Reporter trust is separate and mostly invisible.

## 16.4 Abuse controls

- same perceptual image hash → duplicate check,
- same user/category/location within short window → no additional points,
- daily provisional point cap,
- verified points delayed,
- user cannot verify own report,
- location distance sanity check,
- report deletion/reversal ledger,
- device/user rate limiting.

---

# 17. Route intelligence

## 17.1 P0 saved route

Do not attempt full background route learning first.

Flow:
1. User taps “Save route.”
2. Choose origin:
   - current location,
   - pin,
   - saved place.
3. Choose destination.
4. Amazon Location Routes calculates route.
5. User saves as “University.”
6. Store encoded polyline + corridor.

Alternative “draw route” can come later.

## 17.2 Route-impact algorithm

For each saved route:
1. decode polyline,
2. determine H3 cells along/crossing route corridor,
3. fetch active candidate events,
4. compute event-to-route minimum distance,
5. intersect event semantic radius,
6. compute risk.

Example:

```text
routeImpact =
  eventSeverity
  * eventConfidence
  * freshness
  * proximityFactor
```

Show warning when threshold crossed.

## 17.3 Lower-reported-risk alternative

Amazon Location Routes V2 supports route avoidances/areas.

Future/P1:
1. convert high-confidence flood incidents to small avoid polygons/bounding areas,
2. calculate alternate route avoiding those areas,
3. compare ETA/distance,
4. show:
   - normal route,
   - lower-reported-risk route,
   - additional time.

Copy:
> “Alternative avoids currently reported hazards; road conditions can change.”

## 17.4 Do not reroute constantly

JalNet is not navigation. It should:
- warn,
- show affected segment,
- offer “View alternative,”
- optionally deep-link to a navigation app later.

---

# 18. Usual-route learning — production design

User requirement: JalNet can learn usual routes over time, but users can manually define them.

This is privacy-sensitive; implement it as an opt-in assistant.

## 18.1 Permission levels

```text
Level 0 — No route data
Level 1 — Manual saved routes only
Level 2 — Foreground route suggestions
Level 3 — Background route learning
```

Default to Level 1 or explicit opt-in.

## 18.2 Collection

If enabled:
- balanced accuracy,
- distance/time thresholds,
- avoid constant high-precision GPS,
- batch locally.

A typical strategy:
- sample on meaningful movement,
- use accuracy threshold,
- stop when stationary,
- do not run permanent second-by-second tracking.

Platform constraints matter: Expo documents background-location limitations; behavior differs on Android/iOS and may stop when the app is terminated.

## 18.3 Trip segmentation

On device or backend:

```text
start trip:
  movement > threshold

end trip:
  dwell > 8–12 min
  AND low movement
```

Discard noisy singleton points.

## 18.4 Map matching

Use Amazon Location **Snap to Road** / route APIs where suitable to turn noisy GPS traces into road-aligned traces.

## 18.5 Frequent-route discovery

Represent each trip as:
- start H3,
- end H3,
- time bucket,
- sequence/fingerprint of traversed cells/road segments.

Cluster trips by:
- same start/end cluster,
- similar cell/road sequence,
- similar time/day.

After repeated trips:

> “You often take a similar route to this place around 8 AM. Save it as a usual route?”

The user must confirm.

## 18.6 Data minimization

Preferred design:
- raw traces stay on device,
- upload only accepted route geometry + schedule summary.

If cloud learning is ever enabled:
- explicit consent,
- short raw-trace retention,
- derived route retained,
- clear delete control.

Never build “we secretly store every place you’ve ever been.”

---

# 19. Water Radius

The Water Radius is the personal relevance zone around:
- current location,
- selected saved places,
- saved routes.

It is not necessarily a literal circle.

Components:
```text
current location radius       ~ local
home/building radius          ~ local
saved route corridor          ~ elongated
destination radius            ~ local
```

An event can be important even if it is farther away but intersects the route.

Notification ranking:

```text
route intersection > home/building impact > nearby severe event > generic nearby event
```

---

# 20. Jal Pulse

Jal Pulse is a simple summary, not a scientific official index.

Example output:

```text
JAL PULSE 72 — STABLE

1 active leak nearby
0 route-affecting floods
moderate area water stress
building tank normal
high heat after 14:00
```

Do not derive a decimal-heavy number from fake precision.

Suggested normalized risk:

```text
risk =
  0.30 * floodRisk
+ 0.20 * supplyRisk
+ 0.20 * waterStress
+ 0.15 * leakRisk
+ 0.15 * heatWaterRisk

jalPulse = round(100 * (1 - risk))
```

Hide the numeric score entirely if input data is too sparse.

---



# 21. Water Stress system

Water Stress is **not** a single raw government number. JalNet should define a transparent, product-specific index that combines environmental and local operational pressure. Never label it “official water stress.”

## 21.1 Two separate stress concepts

### Area Water Stress

Answers:

> “How strained is water availability in this area right now / soon?”

Potential signals:

```text
rainfall deficit
recent rainfall
groundwater trend
temperature / heat load
known supply outage
dry-tap reports
tanker demand
active major leaks
building-level opt-in shortage signals
```

### Personal / Building Water Stress

Answers:

> “How likely is this household/building to face a shortage soon?”

Signals:

```text
tank level
consumption rate
normal baseline
scheduled replenishment
known supply interruption
expected replenishment volume
temperature-driven demand
confirmed leak anomaly
```

Do not mix the two into one opaque score.

## 21.2 Area index

Prototype normalized components:

```text
A = supply outage pressure          0..1
B = demand / heat pressure          0..1
C = rainfall / recharge pressure    0..1
D = groundwater stress              0..1
E = tanker demand pressure          0..1
F = leak-loss pressure              0..1
```

Initial configurable formula:

```text
areaStress =
  0.25*A +
  0.15*B +
  0.15*C +
  0.20*D +
  0.15*E +
  0.10*F
```

Only include components for which current data exists. Re-normalize the weights across available components rather than interpreting missing values as zero.

Example:

```ts
function weightedAvailable(
  inputs: Array<{ value?: number; weight: number }>
): number | null {
  const usable = inputs.filter(
    (x): x is {value: number; weight: number} =>
      typeof x.value === "number"
  );
  if (!usable.length) return null;

  const w = usable.reduce((s, x) => s + x.weight, 0);
  return usable.reduce((s, x) => s + x.value * x.weight, 0) / w;
}
```

## 21.3 Confidence / coverage

A stress score without source coverage is misleading. Return:

```ts
{
  score: 72,
  band: "HIGH",
  coverage: 0.68,
  updatedAt: "...",
  contributors: [
    { name: "Groundwater", direction: "worsening" },
    { name: "Heat demand", direction: "worsening" },
    { name: "Supply status", direction: "neutral" }
  ]
}
```

If coverage is weak:
- show `Limited data`,
- do not show a precise 0–100 score,
- show the known components instead.

## 21.4 Bands

```text
0–24      LOW
25–49     MODERATE
50–74     HIGH
75–100    CRITICAL
```

These bands are a JalNet communication device, not hydrological standards.

## 21.5 Map cells

For prototype:
- use H3 cells at a resolution that produces readable neighborhood-sized polygons,
- compute stress per cell/server-side,
- simplify polygons before sending to mobile,
- interpolate only for visual continuity if explicitly marked; never fabricate station-level measurements.

## 21.6 Conservation nudges

Good:
> “Your building used 28% more water than its own recent baseline today.”

Good:
> “Tank depletion is now forecast before the next scheduled refill. Consider reducing non-essential use.”

Bad:
> “You personally wasted 64 litres.”

Without fixture-level metering, JalNet cannot attribute usage to a person.

---

# 22. My Water telemetry

## 22.1 Product modes

The feature must work even without smart hardware.

### Mode A — Manual

User/building manager enters:
- tank capacity,
- current approximate level,
- expected municipal supply times,
- optional expected refill volume.

This alone can produce a depletion estimate.

### Mode B — Demo sensor

Hackathon:
- `simulate-tank.ts` posts fake readings.
- UI clearly labels `Simulated telemetry`.

### Mode C — Real sensor

Later:
- ultrasonic tank-level sensor / pressure / flow meter,
- MQTT → AWS IoT Core,
- rules route readings into processing/storage.

## 22.2 Asset model

```ts
interface WaterAsset {
  id: string;
  ownerType: "USER" | "HOUSEHOLD" | "BUILDING";
  displayName: string;

  tank?: {
    capacityLitres: number;
    lowThresholdPct: number;
    criticalThresholdPct: number;
  };

  supplySchedule?: Array<{
    dayOfWeek: number;
    startMinute: number;
    expectedDurationMin?: number;
    expectedVolumeLitres?: number;
  }>;

  reservePolicy?: ReservePolicy;
}

interface WaterReading {
  assetId: string;
  ts: string;
  tankLevelPct?: number;
  tankVolumeLitres?: number;
  flowLpm?: number;
  source: "MANUAL" | "SIMULATOR" | "IOT";
}
```

## 22.3 Consumption-rate estimation

If tank volume is known:

```text
net depletion rate =
  (volume[t0] - volume[t1]) / elapsed_time
```

But incoming supply can distort this. Split the timeline into:
- refill phase,
- depletion phase,
- unknown/noisy phase.

Robustly estimate recent depletion using a median or trimmed mean rather than one pair of readings.

Example:

```text
last 4 valid depletion intervals:
19 L/min
21 L/min
97 L/min   <- spike/noise
20 L/min

median = 20 L/min
```

## 22.4 Estimated depletion time

If:
- current volume = `V`,
- recent valid net consumption rate = `r > 0`,

then:

```text
hours_remaining = V / r
```

In reality consumption is time-varying, so the UI should display:
> “Estimated around 08:20–09:00”

rather than:
> “Tank empties at exactly 08:37:12.”

If historical hourly patterns exist:

```text
forecast_volume(t+1) =
  current_volume
  - expected_consumption(hour)
  + expected_refill(hour)
```

Walk forward until projected volume crosses threshold.

## 22.5 Usage baseline

Build baseline by:
- day type: weekday/weekend,
- time-of-day bucket,
- trailing 7/14/28-day median.

Prototype:

```text
baseline(day, hour) =
  median(consumption for same weekday/weekend class and hour)
```

Show:
> Today 384 L vs typical 310 L (+24%)

not:
> You wasted 74 L.

## 22.6 Suspected leak anomaly

A household continuous-flow detector can be simple and understandable:

Possible leak when:
- flow remains above minimum threshold,
- continuously for > N minutes,
- during a time bucket where baseline is normally close to zero,
- no active refill event,
- persists after smoothing.

Example:

```text
flow > 1.5 L/min for 45 min
AND expected baseline < 0.3 L/min
AND tank is not currently filling
=> POSSIBLE_CONTINUOUS_FLOW
```

UI:
> “Unusual continuous water use detected for 46 min. Check taps, flush valves, pumps or outdoor use.”

Do **not** state “pipe leak confirmed.”

## 22.7 Sensor sanity checks

Reject/flag:
- tank percentage jumping 20→95→22 in 20 seconds,
- negative flow,
- timestamp far in future,
- impossible level beyond configured geometry,
- repeated exact timestamps.

Keep:
```text
reading_status = VALID | SUSPECT | DROPPED
```

---

# 23. Optional AWS IoT Core demo

Implement only after P0 is stable.

## 23.1 MQTT topic convention

```text
jalnet/v1/assets/{assetId}/telemetry
jalnet/v1/assets/{assetId}/state
```

Payload:

```json
{
  "ts": "2026-10-10T01:20:00Z",
  "tankLevelPct": 18.4,
  "flowLpm": 8.2,
  "source": "simulator"
}
```

## 23.2 Flow

```text
scripts/simulate-tank.ts
        |
       MQTT
        v
   AWS IoT Core
        |
    IoT Rule
        v
      Lambda
        |
        +--> validate reading
        +--> DynamoDB
        +--> compute forecast
        +--> create personal alert
```

## 23.3 Why this is valuable in the demo

If stable, this proves JalNet is not only a crowdsourcing app; it can consume physical infrastructure telemetry.

However, **do not show IoT if it consumes demo time without producing an obvious user-visible result**. One visual falling tank level is enough.

---

# 24. TankerOS

TankerOS must be designed as a marketplace/dispatch orchestration layer, but the hackathon should avoid pretending that real suppliers have enrolled.

## 24.1 User problem

A building manager usually notices a shortage too late:
- tank already low,
- multiple phone calls,
- uncertain pricing,
- uncertain ETA,
- no integration with expected supply.

JalNet’s value is **forecast → reserve → dispatch at the useful time**.

## 24.2 Tanker entities

```ts
interface Supplier {
  id: string;
  name: string;
  status: "DEMO" | "OPTED_IN" | "PAUSED";
  serviceCells: string[]; // H3 coarse cells
  capacitiesLitres: number[];
  operatingHours: { startMinute: number; endMinute: number };
  emergencyEnabled: boolean;
  rating?: number;
}

interface TankerQuote {
  id: string;
  supplierId: string;
  capacityLitres: number;
  estimatedArrivalStart: string;
  estimatedArrivalEnd: string;
  priceMinor: number;
  currency: "INR";
  expiresAt: string;
  source: "DEMO" | "SUPPLIER";
}

type OrderStatus =
  | "QUOTED"
  | "RESERVED"
  | "ACCEPTED"
  | "DISPATCHED"
  | "ARRIVING"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED";

interface TankerOrder {
  id: string;
  waterAssetId: string;
  quoteId: string;
  supplierId: string;
  requestedLitres: number;
  requestedWindow: { from: string; to: string };
  status: OrderStatus;
  emergency: boolean;
  createdAt: string;
}
```

## 24.3 Quote ranking

Do not say “AI chooses nearest tanker” when a deterministic optimizer suffices.

Score:

```text
supplierScore =
  ETA_weight
+ price_weight
+ capacity_fit_weight
+ service_reliability_weight
```

For prototype:

```ts
score =
  0.45 * normalizedEta +
  0.25 * normalizedPrice +
  0.20 * capacityMismatch +
  0.10 * reliabilityPenalty
```

Lowest score wins.

If later demand batching/dispatch becomes complex, optimize multiple jobs with route matrix + capacity/time constraints.

## 24.4 Reserve Water flow

```text
My Water
  ↓
Projected shortage
  ↓
"Reserve water"
  ↓
Choose amount / use recommendation
  ↓
Quotes
  ↓
Confirm
  ↓
Reserved
  ↓
Supplier accepts
  ↓
ETA
```

No real checkout required for hackathon.

Use:
> “Demo reservation — no payment processed.”

## 24.5 Auto Reserve policy

This feature has financial consequences. Production must be heavily user-controlled.

```ts
interface ReservePolicy {
  enabled: boolean;
  triggerBelowPct: number;
  projectedShortageHorizonHours: number;
  maxPriceMinor: number;
  preferredCapacityLitres?: number;
  allowEmergencySurcharge: boolean;
  cancellationGraceSeconds: number;
}
```

Trigger only when all conditions hold:

```text
projected minimum tank level < threshold
AND
expected scheduled supply will not recover level
AND
a valid quote exists
AND
quote price <= configured ceiling
AND
policy enabled
```

Then:

```text
AUTO RESERVE TRIGGERED
Cancellation window: 60 seconds
```

Production should notify before any charge and preserve consent/audit history.

## 24.6 Supplier side — P2

Minimal supplier mode can be a responsive web page:

```text
Today's jobs
---------------------------
06:50 Green Residency  8kL
07:35 Block C          5kL
09:10 Society 9        8kL
```

Actions:
- accept,
- dispatched,
- arrived,
- delivered.

Do not build a full fleet-management suite.

## 24.7 Route optimization

If implemented:
- get depot + jobs,
- use Amazon Location Route Matrix / Optimize Waypoints,
- respect truck capacity,
- split run when capacity exhausted.

Pseudocode:

```text
unserved = jobs sorted by urgency
while unserved:
  choose feasible jobs within remaining capacity
  optimize waypoint order
  emit run
  reset at depot
```

A true vehicle-routing problem with hard time windows can come later.

---

# 25. Heat + Water / HeatSafe

The hackathon track includes heat, but JalNet should keep heat tied to water rather than becoming a generic weather app.

## 25.1 What HeatSafe means

“Where will my walking route expose me to more heat, and where can I access verified water/cooling?”

Inputs later:
- ambient temperature,
- humidity / heat index,
- time of day,
- shade/tree/building proxy,
- route duration,
- verified water/cooling points.

## 25.2 Prototype route heat score

Segment-level:

```text
heatExposureSegment =
  durationMinutes
  * heatSeverity
  * sunExposureFactor
```

Route:

```text
heatExposure = sum(segments)
```

Compare alternatives:
> “Route B is 3 min longer but has ~35% lower estimated heat exposure.”

Use the word **estimated**.

## 25.3 Important limits

Do not claim:
- clinical heat safety,
- guaranteed shaded path,
- potable water unless source is verified/current.

Heat illness risk varies by person. JalNet can indicate environmental exposure, not individual medical safety.

---

# 26. DrainScan

DrainScan is a subtype of the camera/report pipeline, not a separate app.

## 26.1 P0/P1

A user captures a drain.

Bedrock returns:

```text
drain visible?
possible blockage?
likely overflow?
visible obstruction categories?
visual severity?
```

Example:
> “Drain opening is visibly obstructed by solid waste and surrounding water is pooling.”

## 26.2 Never infer an exact “76% blocked” unless calibrated

Image-only percent blockage is seductive but weak. Prefer:

```text
NONE
POSSIBLE
LIKELY
SEVERE_VISUAL_OBSTRUCTION
UNKNOWN
```

## 26.3 Municipal inspection future

Later, field-worker mode can:
- enforce standard camera angle,
- capture before/after,
- identify asset ID/QR,
- compare repeated inspections,
- create cleaning work orders.

That becomes a serious operations product without contaminating P0 scope.

---

# 27. Public and external data plan

JalNet should not be dependent on unstable scraping. Every external source needs:
- provenance,
- freshness,
- license/terms check,
- last-success timestamp,
- graceful fallback.

## 27.1 NDMA SACHET / Common Alerting Protocol

Use as an authoritative alert layer where appropriate.

Research confirms NDMA’s SACHET platform publishes disaster alerts and integrates multiple authorized agencies. CAP/RSS feeds can be consumed with normal cache semantics such as ETag handling.

Proposed ingest:

```text
EventBridge schedule
   every 5 min
        |
        v
SACHET ingest Lambda
        |
  If-None-Match: ETag
        |
        +--> 304 => no work
        |
        +--> changed XML/RSS
                 |
                 v
              parse CAP
                 |
                 v
       authoritative alert event
```

Store original:
```text
sourceUrl
sourceIdentifier
sentAt
effectiveAt
expiresAt
area geometry/description
```

Never rewrite an official warning into a stronger claim.

## 27.2 National Water Data Portal / CGWB

Groundwater data should be used primarily for:
- background area trends,
- seasonal stress,
- historical context.

Official CGWB material describes a large groundwater monitoring network and public dissemination through water-data systems. NWDP datasets expose groundwater resources in downloadable/API-oriented forms depending on dataset.

Do not promise street-level groundwater from sparse stations.

Data transformation:

```text
station observation
   ↓
quality checks
   ↓
nearest/admin/H3 aggregation
   ↓
trend / percentile
   ↓
water-stress component
```

## 27.3 CWC rainfall / water-level telemetry

Useful for:
- recent rainfall,
- river-level context,
- flood context.

Do not automatically translate upstream gauge elevation into a local street-flood depth prediction without a hydrologic model.

## 27.4 Weather forecast

Fallback-friendly provider abstraction:

```ts
interface WeatherProvider {
  getNow(lat: number, lon: number): Promise<WeatherNow>;
  getHourly(lat: number, lon: number): Promise<HourlyWeather[]>;
}
```

Potential prototype source:
- Open-Meteo ECMWF endpoint,
- or another provider available during build.

Open-Meteo’s ECMWF service exposes IFS forecast data. Cache server-side so every mobile client does not hit the public endpoint independently.

## 27.5 Data provenance object

Every derived environmental value should be able to answer:

```ts
interface Provenance {
  sourceName: string;
  sourceUrl?: string;
  fetchedAt: string;
  observedAt?: string;
  freshnessSeconds?: number;
  isSimulated: boolean;
}
```

UI detail:
> Source: CWC rainfall telemetry · observed 18 min ago

or:
> Simulated tank sensor · demo data

This is especially important in the judge demo.

---

# 28. Data-provider abstraction

Never let UI components import vendor APIs directly.

```ts
interface IncidentRepository {
  listViewport(q: ViewportQuery): Promise<MapEvent[]>;
  get(id: string): Promise<EventDetail>;
}

interface MapProvider {
  getStyleDescriptor(): Promise<unknown>;
}

interface RouteProvider {
  calculate(req: RouteRequest): Promise<RouteResult>;
}

interface EnvironmentalDataProvider {
  waterStress(cell: string): Promise<StressResult>;
}

interface TankTelemetryProvider {
  snapshot(assetId: string): Promise<WaterSnapshot>;
}
```

Providers:

```text
AWSIncidentRepository
AmazonLocationRouteProvider
NwdpEnvironmentalProvider
OpenMeteoWeatherProvider
SimulatedTankProvider
IoTTankProvider
```

This makes hackathon mock → production replacement controlled rather than ad hoc.

---

# 29. Notification engine

Notifications are one of JalNet’s most valuable long-term behaviors and one of the easiest ways to ruin the product.

## 29.1 Notification types

```text
ROUTE_AFFECTED
NEARBY_CRITICAL_EVENT
EVENT_ESCALATED
EVENT_RESOLVED
WATER_STRESS_INCREASED
TANK_LOW
PROJECTED_SHORTAGE
POSSIBLE_CONTINUOUS_USE
TANKER_STATUS
OFFICIAL_ALERT
```

## 29.2 Relevance rules

A notification must satisfy at least one:
- intersects active saved route during relevant time window,
- affects home/building asset,
- severe and close enough to current/saved location,
- status update to something the user explicitly follows,
- tanker/order update.

Do not notify because a minor leak exists 5 km away.

## 29.3 Dedupe

Generate deterministic key:

```text
{user}:{event}:{notificationType}:{riskBand}
```

Do not resend until:
- risk band materially changes,
- event status changes,
- cool-down expires.

## 29.4 Rate limits

Default example:
- max 1 low-priority environmental push / 3 h,
- high priority route/building effects bypass with stricter dedupe,
- tanker transactional updates exempt,
- quiet hours apply to low priority.

## 29.5 Actionable copy

Good:
> **Your University route is affected**  
> New waterlogging was verified near the underpass 12 min ago. View the affected segment.

Good:
> **Water may run low before morning supply**  
> Building tank is projected below 10% around 06:40.

Bad:
> Water alert!

---

# 30. Trust, moderation and adversarial design

A crowdsourced map cannot assume good behavior.

## 30.1 Threats

- repeated duplicate photos,
- old photo presented as live,
- photo taken elsewhere,
- prank flood report,
- coordinated false verification,
- report farming for droplets,
- offensive/private media,
- GPS spoofing,
- supplier spam,
- notification abuse.

## 30.2 Report trust signals

```text
fresh capture > gallery upload
high GPS accuracy > low GPS accuracy
independent reporters > same device/account
fresh media > stale media
external weather/official signal supports event > no signal
trusted history > new account
```

These are signals, not grounds for silently blocking legitimate new users.

## 30.3 Capture provenance

P0:
- camera capture timestamp,
- current app location,
- upload timestamp.

Gallery upload:
- mark source as gallery,
- do not trust EXIF as proof,
- ask user to pin location.

Never expose EXIF publicly.

## 30.4 Duplicate image detection

P1:
- SHA-256 exact duplicate,
- perceptual hash for resized/cropped duplicate,
- same user + nearby location + same category + time window.

Response:
> “This incident may already be reported. Add your confirmation instead?”

That is better than rejecting useful corroboration.

## 30.5 Reporter trust score

Keep hidden from social profile.

Example:
```text
starts neutral
+ accepted report
+ independent corroboration
+ correct resolution
- rejected malicious report
- spam duplicates
```

It can influence moderation thresholds but must not determine truth alone.

## 30.6 Verification UX

Nearby user can tap:

```text
Is this still happening?
[ Yes ] [ No / cleared ] [ Not sure ]
```

Only allow after basic location/anti-abuse checks. A user cannot self-confirm.

## 30.7 Event expiry

Events need temporal behavior.

Example defaults:

```text
waterlogging:       3 h without fresh support
flood:              6 h
leak:               12–24 h
drain blockage:     days
drain overflow:     6 h
supply outage:      source expiry / 6 h
```

Do not delete; move to expired/resolved history.

---

# 31. Security and privacy architecture

Precise location and home routes are sensitive. This section is not optional.

## 31.1 Data classification

### Highly sensitive

- precise real-time location,
- home/building location tied to account,
- route history,
- tanker delivery address.

### Sensitive

- saved routes,
- private evidence media,
- phone/email/account identifiers,
- tank usage patterns.

### Public-ish

- aggregated public incident location,
- sanitized public preview,
- public event category/status.

## 31.2 Principle: public event != reporter location

When an incident is published:
- publish event location,
- never publish reporter identity by default,
- never publish reporter’s movement trail.

## 31.3 Location privacy

Route learning:
- off by default until clear consent,
- preferably derived locally,
- raw trip points deleted after derivation,
- user can disable and delete route history.

Current-location permissions:
- request foreground first,
- background only when feature actually needs it,
- explain value before system permission dialog.

## 31.4 Media privacy

Before public display:
- remove metadata from derived preview,
- do not show original EXIF,
- keep original private,
- future: blur faces/plates,
- allow report without making media public.

## 31.5 AWS security

- S3 Block Public Access.
- SSE-S3 or SSE-KMS depending complexity.
- Presigned PUT has short expiry and constrained object key.
- API validates content type/size again after upload.
- Cognito/API authorizer for user endpoints.
- Lambda execution roles are per-service/least privilege.
- No AWS access key in mobile app.
- No Bedrock credentials in mobile.
- No secret in repository.
- environment separation: `dev`, `demo`, future `prod`.
- CloudWatch logs must not dump raw access tokens or full precise-location histories.

## 31.6 API abuse

Use:
- API Gateway throttling,
- per-user application rate limits,
- idempotency keys,
- payload schemas,
- maximum bbox size,
- bounded H3-cell fanout,
- media quotas.

## 31.7 Presigned upload contract

Client sends:
```json
{
  "reportId": "...",
  "contentType": "image/jpeg",
  "contentLength": 1432270
}
```

Backend checks:
- report ownership,
- allowed MIME,
- max size,
- not already finalized.

Returns:
```json
{
  "url": "...",
  "key": "...",
  "expiresInSec": 300
}
```

## 31.8 Never place provider secrets in Expo public env

`EXPO_PUBLIC_*` values are public to the app bundle.

Safe:
```text
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_AWS_REGION
```

Not safe:
```text
AWS_SECRET_ACCESS_KEY
BEDROCK_SECRET
COGNITO_CLIENT_SECRET
```

---

# 32. Performance budget

“Fast and not heavy like Google Maps” is a product promise, so quantify it.

These are engineering targets, not guarantees:

| Metric | Target |
|---|---:|
| Cold launch to usable shell | < 2.0 s on target demo device |
| Cached map screen first useful UI | < 1.0 s perceived |
| First incident batch after map visible | < 1.5 s on normal network |
| Layer switch UI response | < 100 ms |
| Camera open from tap | < 500 ms preferred |
| Map pan | 55–60 fps target |
| Report confirmation after AI ready | immediate |
| API p95 for viewport events | < 400 ms target |
| Marker payload | < 200 KB common viewport |
| app fatal errors during scripted demo | 0 |

## 32.1 Rules for mobile speed

- no giant component library if not needed,
- avoid heavy global re-renders,
- map event data separate from UI state,
- lazy-load secondary screens,
- thumbnails not originals,
- decode/compress before upload,
- cache last viewport,
- cluster at source layer,
- avoid dozens of animated React markers,
- no autoplay video on map,
- use skeletons sparingly; map stays usable.

## 32.2 Startup

Startup order:

```text
render shell
  ↓
restore local session/preferences
  ↓
show cached map camera + incidents
  ↓
request fresh foreground location
  ↓
refresh incidents
  ↓
fetch low-priority background cards
```

Do not block launch on:
- profile,
- weather,
- tank data,
- notification token,
- remote config.

## 32.3 Network degradation

If event API fails:
- show cached incidents with timestamp,
- banner: `Showing data from 12 min ago`,
- keep camera/report draft locally,
- retry upload later.

---

# 33. Offline-first-lite behavior

JalNet is not an offline mapping product, but basic resilience is valuable.

Use `expo-sqlite` / local persistence for:

```text
cached event batch
saved route metadata
pending report drafts
pending media metadata
preferences
last known Jal Pulse
```

State:

```text
PENDING_UPLOAD
UPLOAD_FAILED
ANALYSIS_PENDING
SYNCED
```

If network drops after capture:
> “Saved on this device. JalNet will upload when you’re online.”

Do not attempt offline basemap tile prefetch during the hackathon.

---

# 34. UI design system

## 34.1 Visual thesis

**Quiet civic intelligence.**

References in spirit:
- Apple Weather: hierarchy and environmental data,
- Linear: restraint,
- modern transit apps: map-first utility.

Avoid:
- cyberpunk,
- neon “AI” gradients everywhere,
- glass everywhere,
- 3D blobs,
- dashboard grids on home,
- over-labeled icons.

## 34.2 Color semantics

The neutral basemap should carry little chroma. Color belongs to status.

Semantic tokens:

```text
--water-normal
--info
--warning
--high
--critical
--tanker
--heat
--success
--surface
--surface-elevated
--text-primary
--text-secondary
--border
```

Do not encode status by color alone. Use icon/shape/text too.

## 34.3 Typography

Use one reliable sans family available in the app bundle/platform. Keep:
- large numeric reading,
- medium title,
- compact metadata,
- no more than ~3 hierarchy levels per card.

## 34.4 Radius/shadows

Rounded cards, but not every element a pill.

Suggested:
```text
cards: 20–24 px radius
buttons: 14–18
chips: full pill
```

Shadows:
- subtle and only for floating controls,
- Android elevation tested on device.

## 34.5 Motion

Meaningful:
- camera button compress/haptic,
- new event pulses once,
- sheet springs,
- layer switch crossfade,
- droplet award count-up.

Not:
- looping marker bounce,
- confetti for public emergencies,
- excessive parallax.

## 34.6 Accessibility

- minimum touch target ~44–48 logical px,
- readable contrast,
- dynamic text where practical,
- screen-reader labels,
- haptic not sole feedback,
- status icons plus labels,
- map list alternative later.

---

# 35. Screen-by-screen specification

## 35.1 Boot

```text
JalNet glyph
brief 300–600 ms only if needed
```

Do not force a splash animation.

## 35.2 First-use permission primer

One page:

> **See water issues that matter to you**  
> JalNet uses your location to show nearby incidents and route warnings. Your route-learning setting is separate and off until you enable it.

Buttons:
- `Use my location`
- `Choose an area instead`

Do not ask for background location here.

## 35.3 Map / calm state

- map fills screen,
- Jal Pulse top chip,
- sparse live incidents,
- center camera,
- Layers button,
- tiny current-location control.

## 35.4 Map / alert state

Bottom sheet:
```text
2 issues may affect you
HIGH · Waterlogging · 1.2 km
Intersects University route
12 min ago
```

Actions:
- `View`
- `Alternative`

## 35.5 Event detail

```text
WATERLOGGING
High · Verified
Reported 12 min ago

Road partially obstructed
3 independent reports

What we know
• standing water visible across road
• cars: poor/caution
• drain overflow possibly visible

Source
3 citizen reports

[Still happening] [Looks cleared]
```

Public media thumbnails optional.

## 35.6 Layer sheet

Bottom sheet with:
- single-select dominant layer,
- Live default,
- one line of meaning under each.

Do not stack all heatmaps simultaneously.

## 35.7 Camera

Already specified.

## 35.8 Analysis

Use a staged status:
```text
Uploading evidence...
Analyzing water issue...
Checking nearby reports...
```

Only show statuses that genuinely correspond to steps.

## 35.9 Confirmation

AI findings editable; submit.

## 35.10 Success

```text
Report submitted
+2 provisional 💧

We’ll add more when the report is verified or helps other routes.

[View on map]
```

## 35.11 Route setup

```text
Save a route

From: Current location
To: [search/pin]

Name: University

Notify me when water issues affect this route [on]

[Save route]
```

## 35.12 My Water

Hero:
```text
Tank
46%
~16 h estimated remaining
```

Secondary:
- usage vs baseline,
- next supply,
- reserve status,
- alerts.

## 35.13 Water Stress detail

Explain:
```text
HIGH

Main pressures
↑ heat-driven demand
↓ recent rainfall
↓ groundwater trend

Data coverage: moderate
Updated: 21 min ago
```

## 35.14 Tanker reserve

No fake real suppliers unless marked demo.

## 35.15 Profile

Focus impact:
```text
1,248 routes/users helped
19 useful reports
7 first discoveries
4,782 💧
Jal Guardian
```

Do not fabricate “litres saved” from visual reports.

---

# 36. Loading, empty and failure states

Every screen needs a designed failure mode.

## Map

No events:
> “Nothing urgent reported around you.”

Not:
> “No data.”

Offline:
> “Offline — showing saved incidents from 15:42.”

Permission denied:
> “Choose an area to use JalNet without location access.”

## Camera analysis fails

> “AI couldn’t confidently classify this. You can still report it manually.”

Buttons:
- Waterlogging
- Leak
- Drain
- Other

## Route service fails

Show route geometry if cached; otherwise:
> “Route service unavailable. Your saved route is still stored.”

## Bedrock timeout

Never strand the report.

## Public data stale

> “Groundwater source last updated 3 days ago.”

---

# 37. AWS infrastructure blueprint

Use **AWS CDK in TypeScript** or SAM, but choose exactly one. CDK is attractive because app/backend are TypeScript and infrastructure can be diagrammed clearly.

## 37.1 Core stack

```text
JalNetCoreStack
├── API Gateway HTTP API
├── Cognito User Pool
├── Lambda:
│   ├── eventApi
│   ├── reportApi
│   ├── uploadApi
│   ├── routeApi
│   ├── mediaWorker
│   └── alertWorker
├── S3 evidence bucket
├── DynamoDB events
├── DynamoDB reports
├── DynamoDB users
├── DynamoDB droplets
├── SQS media-analysis queue (preferred)
├── DLQ
├── EventBridge schedules
└── CloudWatch alarms/log groups
```

External managed:
```text
Amazon Location Service
Amazon Bedrock / Nova
```

P1:
```text
AWS IoT Core
```

## 37.2 IAM

Examples:

`mediaWorker`:
```text
s3:GetObject        only evidence prefix
bedrock:InvokeModel only chosen/inference-profile ARN as needed
dynamodb:UpdateItem reports/events needed
sqs:Receive/Delete  analysis queue
```

`uploadApi`:
```text
s3:PutObject via presign for bounded bucket/prefix
dynamodb:GetItem/UpdateItem report ownership/state
```

`eventApi`:
```text
dynamodb:Query events index
```

No `Action: "*" / Resource: "*"` in final if avoidable.

## 37.3 Environments

```text
dev
demo
```

Do not build production multi-account architecture during the hackathon.

Use `demo` for video and freeze its data/schema once recording starts.

---

# 38. Configuration / environment contract

Backend:

```dotenv
AWS_REGION=ap-south-1

EVENTS_TABLE=
REPORTS_TABLE=
USERS_TABLE=
DROPLET_LEDGER_TABLE=
WATER_TABLE=
ORDERS_TABLE=

EVIDENCE_BUCKET=
MEDIA_QUEUE_URL=

BEDROCK_MODEL_ID=
BEDROCK_GUARDRAIL_ID=
BEDROCK_GUARDRAIL_VERSION=

AMAZON_LOCATION_REGION=ap-south-1

DEMO_MODE=false
PUBLIC_DATA_ENABLED=false
SACHET_ENABLED=false
NWDP_ENABLED=false

MAX_IMAGE_BYTES=
MAX_VIDEO_BYTES=
```

Mobile:

```dotenv
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_AWS_REGION=ap-south-1
EXPO_PUBLIC_BUILD_ENV=demo
```

Never commit:
- credentials,
- JWTs,
- AWS access keys,
- private supplier data.

Provide `.env.example`.

---

# 39. Observability

A demo app can still fail silently. Add cheap visibility.

## 39.1 Structured logs

Log:

```json
{
  "level": "INFO",
  "op": "report.analyze",
  "reportId": "...",
  "durationMs": 1284,
  "result": "success"
}
```

Do not log:
- raw JWT,
- exact user home address unnecessarily,
- full Bedrock media payload,
- presigned URL,
- private original media URL.

## 39.2 Metrics

Track:
```text
API 5xx
media analysis failures
media analysis latency
report created
event created
event merged
route warnings produced
presign failures
```

## 39.3 Demo health endpoint

```http
GET /health
```

Returns:
```json
{
  "status": "ok",
  "build": "...",
  "dependencies": {
    "db": "ok",
    "media": "configured",
    "location": "configured"
  }
}
```

Do not call Bedrock on every health check.

---

# 40. Core algorithms

## 40.1 Distance

Use Haversine for point proximity:

```ts
const R = 6371000;

function metersBetween(
  a: {lat: number; lon: number},
  b: {lat: number; lon: number}
) {
  const toRad = (x: number) => x * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}
```

## 40.2 Freshness

```text
freshness = exp(-ageHours / tau)
```

Different `tau` by event type.

## 40.3 Route intersection

For hackathon:
- decode polyline,
- sample route points every reasonable distance,
- candidate events from route H3 cells,
- min point/segment distance to event.
- if distance <= event radius + route corridor width, intersect.

For production:
- geospatial library robust line-buffer / geometry intersection,
- eventually PostGIS.

## 40.4 Jal Pulse

Already covered; make component contribution inspectable in UI debug panel during development.

## 40.5 Water usage anomaly

Use simple robust rules before ML. Judges understand them and they are debuggable.

---

# 41. State machines

## 41.1 Report

```text
DRAFT
  ↓
UPLOADING
  ↓
ANALYZING
  ↓
NEEDS_CONFIRMATION
  ↓
SUBMITTED
  ↓
MERGED / ACCEPTED
             \
              REJECTED
```

All transitions are idempotent.

## 41.2 Event

```text
UNVERIFIED
   ↓
ACTIVE
   ↓
MONITORING
   ↓
RESOLVED
```

Side:
```text
UNVERIFIED/ACTIVE -> REJECTED
ACTIVE/MONITORING -> EXPIRED
```

## 41.3 Tanker order

```text
QUOTED -> RESERVED -> ACCEPTED -> DISPATCHED -> ARRIVING -> DELIVERED
  \          \             \
   EXPIRED    CANCELLED      FAILED
```

## 41.4 Auto-reserve

```text
DISABLED
  |
ENABLED
  ↓
WATCHING
  ↓ threshold forecast crossed
PENDING_CONFIRMATION / GRACE_WINDOW
  ↓
RESERVED
```

Every automated financial/booking action needs auditable policy input.

---

# 42. Demo data strategy

A strong demo is deterministic.

Create:

```text
scripts/seed-demo.ts
scripts/reset-demo.ts
scripts/simulate-tank.ts
```

## 42.1 Seed area

Pick one coherent Delhi/NCR neighborhood for the scripted demo.

Seed:
- 1 minor leak away from saved route,
- 1 drain report,
- 0 waterlogging events initially at demo camera location,
- 1 route from “Home” to “University/Destination,”
- building water asset,
- 2–3 demo tanker suppliers,
- water stress cells.

The live camera report creates the waterlogging event that affects the saved route.

## 42.2 Second-user corroboration

Options:
1. pre-seed one `UNVERIFIED` event then the demo upload becomes report #2;
2. keep a second phone/emulator logged into another account;
3. provide an internal demo fixture that produces a supporting observation.

Best demo:
- initial event does **not** appear as route-blocking,
- user report is enough to create/update it,
- a pre-seeded independent report makes it verified when merged.

Do not fake this invisibly. In code/README explain demo seed data.

## 42.3 Reset

One command:
```bash
pnpm demo:reset
```

Must:
- delete transient demo reports,
- restore seeded event statuses,
- reset droplets,
- reset tank telemetry,
- restore route,
- clear tanker order.

Test reset at least five times.

---

# 43. Testing strategy

## 43.1 Unit

Must have tests for:
- fusion candidate scoring,
- droplet idempotency,
- Jal Pulse weighting,
- water stress missing-component renormalization,
- tank depletion,
- anomaly detection,
- route/event distance,
- state transition validation.

## 43.2 Contract

Zod tests:
- valid Bedrock JSON,
- missing field,
- unknown category,
- confidence outside 0..1,
- invalid API request.

## 43.3 Integration

At minimum:
- presign → S3 → analyze fixture → report update,
- confirmed report → event created/merged,
- saved route → new event → warning,
- duplicate droplet call → exactly one award.

## 43.4 Mobile end-to-end manual matrix

Test on actual target Android phone.

| Scenario | Expected |
|---|---|
| Fresh install + allow location | map opens |
| Fresh install + deny | choose area works |
| No network | cached shell |
| Camera deny | explanation + settings path |
| Upload image | progress |
| Bedrock succeeds | confirmation |
| Bedrock fails | manual categories |
| Duplicate report | merge/confirm suggestion |
| route affected | warning |
| switch layers | no crash |
| reset demo | deterministic |

If there is time, add Maestro/Detox; do not sacrifice working product to install a large E2E stack.

## 43.5 Device constraints

Test:
- low/mid-tier Android,
- at least one different display size,
- both light/dark only if both are included.

If dark mode is incomplete, ship polished light mode instead of two broken themes.

---

# 44. Demo reliability engineering

The demo is the product on judging day.

## 44.1 Before recording

- recharge phone,
- disable low-power mode,
- stable Wi-Fi + hotspot fallback,
- reset demo,
- confirm Bedrock access,
- confirm S3 CORS/presign,
- open app once,
- test camera permission,
- turn off personal notifications,
- hide secrets/account IDs,
- use stable branch/tag.

## 44.2 Fallback ladder

Primary:
real Bedrock call.

Fallback 1:
if Bedrock throttles, retry once with bounded backoff.

Fallback 2:
for **recording only**, a clearly identified `DEMO_AI_FIXTURE=true` can return the same contract from fixture if service is temporarily unavailable. **Do not present that path as a live model call.** Prefer recording when the real path is healthy.

## 44.3 Never demo from development chaos

Create:
```text
git tag demo-v1
```

No dependency upgrades 30 minutes before video recording.

---

# 45. Work breakdown / dependency graph

Issue IDs can become GitHub Issues after the clock starts.

```text
JAL-001 repo + workspace
JAL-002 contracts package
JAL-003 CDK core infra
JAL-004 mobile shell/navigation
JAL-005 Amazon Location + MapLibre
JAL-006 event map API
JAL-007 seeded events
JAL-008 camera capture
JAL-009 report draft
JAL-010 S3 presign/upload
JAL-011 Bedrock media worker
JAL-012 confirmation UI
JAL-013 incident fusion
JAL-014 marker refresh
JAL-015 saved route
JAL-016 route-risk engine
JAL-017 route warning UI
JAL-018 droplet ledger
JAL-019 profile impact UI
JAL-020 layer sheet
JAL-021 Water Stress prototype
JAL-022 My Water simulated telemetry
JAL-023 Tanker quote/reservation prototype
JAL-024 AWS architecture screen/docs
JAL-025 demo reset/seed
JAL-026 QA/performance
JAL-027 README
JAL-028 demo video
JAL-029 submission writeup
```

Dependencies:

```text
001
├─002
├─003
│  ├─006
│  ├─010
│  └─011
└─004
   ├─005
   ├─008
   └─020

009 -> 010 -> 011 -> 012 -> 013 -> 014
005 -> 015 -> 016 -> 017
013 -> 018 -> 019
005 -> 021
004 -> 022 -> 023
007 + 025 -> demo stability
```

The critical path is:
**map → camera → upload → AI → event → route warning**.

---

# 46. Four-day implementation plan

The exact event deadline should be rechecked on the official schedule. This plan intentionally targets a submission-ready build **well before** the final deadline.

## Pre-clock — allowed planning only

Do:
- read docs,
- validate AWS account/student status,
- install generic tooling,
- agree roles,
- save this plan,
- sketch paper concepts,
- learn MapLibre/CDK/Bedrock.

Do **not**:
- create JalNet repo code,
- build JalNet UI components,
- provision project-specific infrastructure,
- create reusable “JalNet starter” code disguised as practice.

The rules explicitly say project work begins when the clock starts.

## Day 1 — foundation + vertical skeleton

### Block 1 — 0–2 h

- confirm official clock open,
- create public GitHub repo,
- first commit timestamp,
- initialize monorepo,
- Expo app + development build,
- CDK project,
- basic CI,
- `.env.example`,
- README stub.

Exit:
```text
repo public
app boots
infra synth works
```

### Block 2 — 2–6 h

- Amazon Location access,
- MapLibre map renders,
- current location,
- monochrome style,
- layer control shell,
- seeded local event GeoJSON first.

Exit:
```text
app opens directly on beautiful real map
```

### Block 3 — 6–10 h

- deploy API Gateway/Lambda/DynamoDB,
- `/events` endpoint,
- seed cloud events,
- viewport query,
- map cluster/markers,
- event detail sheet.

Exit:
```text
real backend -> map
```

### Block 4 — 10–14 h

- camera screen,
- location capture,
- report draft,
- presigned S3,
- image upload,
- report state UI.

Exit:
```text
camera -> private S3
```

### Block 5 — remaining

- Bedrock proof-of-concept with one test image,
- strict JSON,
- commit.

**Day 1 must end with the map and upload working.**

## Day 2 — complete killer loop

### Morning

- media worker,
- Zod validation,
- failure fallback,
- confirmation sheet.

### Midday

- incident fusion,
- create/merge,
- refresh marker after submit,
- event verification status.

### Afternoon

- saved route,
- Amazon Location routing,
- store polyline,
- route-event intersection.

### Evening

- route warning,
- droplets ledger,
- success animation,
- profile summary.

### Night

Run the exact core demo from a clean reset 5 times.

**Day 2 exit criterion:**
> Take a real picture → receive analysis → confirm → map changes → route warning → droplets.

If this is not working, do not build TankerOS yet.

## Day 3 — depth + UI + one secondary workflow

Priority sequence:

1. polish critical path,
2. Water Stress layer,
3. My Water simulated tank,
4. Tanker quote/reserve,
5. second-user verification,
6. NDMA/official public source only if stable.

If at DTU build day, use mentor time to challenge:
- whether differentiation is credible,
- whether AWS usage is meaningful,
- whether three-minute story is understandable.

By end of Day 3:
- feature freeze on core architecture,
- record a rough 3-minute rehearsal,
- cut anything confusing.

## Day 4 — submission day

### First block

- bugs only,
- responsiveness,
- content accuracy,
- reset script,
- cloud budget check.

### Second block

- README,
- architecture diagram,
- attribution/licenses,
- AWS list,
- data source list,
- AI coding tools disclosure.

### Third block

Record demo.

Do **not** wait until deadline hour.

### Fourth block

- edit video under 3:00,
- upload unlisted/public YouTube,
- test signed-out,
- write submission,
- submit,
- verify submission receipt.

Then optional blog.

---

# 47. Team allocation

## 47.1 Solo

Do only P0 + one secondary screen.

```text
You:
mobile + backend + infra + demo
```

Aggressively use fixtures and provider abstractions.

## 47.2 Two people

```text
A — backend/AWS
B — mobile/UI
```

Pair for contracts/integration.

## 47.3 Three people — ideal for JalNet

```text
A — product/mobile/map
B — backend/AWS/Bedrock/data
C — secondary UI + Tanker/My Water + QA/demo assets
```

No one works on an isolated moonshot.

## 47.4 Four people

```text
A — mobile/map
B — backend/domain
C — AWS/data/Bedrock/infra
D — My Water/Tanker + QA/demo/docs
```

All four merge against shared contracts.

---

# 48. Git workflow

Public repo history matters because rules say the project must be built during the event.

## 48.1 Branches

```text
main
feat/map
feat/report-flow
feat/route-risk
feat/my-water
```

Short-lived branches. Rebase/merge frequently.

## 48.2 Commit discipline

Good:

```text
feat(map): render Amazon Location monochrome map
feat(report): add presigned evidence upload
feat(ai): classify water incidents with Nova
feat(routes): flag events intersecting saved routes
fix(demo): make event refresh deterministic
```

Avoid one giant `final project` commit.

## 48.3 Protect demo

Once core works:
- tag it,
- avoid force-pushing main,
- keep `demo` branch if necessary.

---

# 49. CI

GitHub Actions:

```text
install
typecheck
lint
unit tests
CDK synth
```

Optional build:
- Expo/EAS can be slow; do not make it mandatory on every PR if it delays iteration.

No AWS deploy from pull requests with broad credentials.

---

# 50. Cost controls

The hackathon provides/points to AWS free-tier credits, but still set safeguards.

## 50.1 Biggest variable costs

Likely:
- Bedrock media inference,
- map tile/routing requests,
- logs if accidentally verbose,
- video processing.

## 50.2 Controls

- image compression,
- video limit,
- one AI analysis per media unless retry needed,
- cache map/event requests,
- route only on explicit user action,
- CloudWatch retention short in dev,
- S3 lifecycle,
- budgets/alerts,
- delete orphaned evidence after event.

Do not call the AI on every viewport event.

---

# 51. Competitor / adjacent-product positioning

Do not claim “nobody does any of this.” Existing products cover pieces.

| Existing category/example | What it already does | JalNet differentiation |
|---|---|---|
| CWC FloodWatch India | official flood/water-level/forecast information | local citizen evidence + personal route relevance + unified daily water UX |
| NDMA SACHET | authoritative geo-targeted disaster alerts | operational neighborhood water incidents + personal routes + household water |
| municipal water-board apps | complaints, leak/sewer reporting, sometimes tanker booking | unified map intelligence, cross-source event fusion, predictive household flow |
| tanker marketplaces | order tanker | shortage prediction + context-aware timing + water-intelligence integration |
| navigation apps | routing/closures | water-specific incident semantics and user’s saved route impact |
| shade-aware routing tools | lower-heat/shaded routes | water availability + heat exposure as part of same resilience layer |

The defensible pitch is:

> **JalNet unifies fragmented water signals into one personal water-intelligence map: crowdsourced evidence, route relevance, area stress, household supply prediction and tanker coordination.**

That is stronger than:
> “No app currently does water.”

---

# 52. Why the integrated product is coherent

A judge may ask:
> “Isn’t this too many features?”

Answer:

All modules share the same three primitives:

```text
WHERE?     location / route / asset
WHAT?      water event or water state
WHEN?      current / predicted time
```

And the same engine:

```text
SENSE
citizen + sensor + official data
        ↓
UNDERSTAND
classify + verify + fuse
        ↓
PERSONALIZE
radius + route + household
        ↓
ACT
warn + report + reserve + resolve
```

JalNet is not six applications. It is one **water-state graph** with multiple views.

---

# 53. Evidence hierarchy

Different sources have different authority.

Suggested internal order for specific claims:

```text
1. official emergency / government alert
2. trusted instrument/sensor with known provenance
3. multiple independent recent citizen reports
4. single recent citizen report
5. model-inferred condition from media
6. predictive/derived estimate
```

Do not let AI wording overwrite a government warning.

Every public card can carry:
```text
Official
Verified by community
Single report
Estimated
Simulated
```

---

# 54. Event conflict resolution

Example:
- citizen says road flooded,
- another says cleared,
- official rainfall continues.

Do not choose latest blindly.

Track observations separately.

```text
event:
 status = MONITORING
 reports:
  A: still active 10:04
  B: cleared 10:12
  C: still active 10:14
```

Resolution logic can require:
- multiple clear confirmations,
- no newer active report,
- or expiry.

---

# 55. Explainability

AI should not be a magic button.

Event detail:

```text
Why JalNet marked this HIGH

✓ standing water spans most of visible roadway
✓ two independent reports within 15 min
✓ route intersects affected area
? exact depth unknown
```

Water Stress:

```text
Why HIGH
↑  temperature pressure
↑  tanker demand
↓  recent rainfall
```

Tanker:
```text
Why this supplier
6 min earlier ETA
capacity matches request
within max price
```

This improves trust and demo clarity.

---

# 56. Search / places

JalNet should have a low-profile place search for:
- setting route destination,
- choosing manual area,
- selecting home/building.

Do not dominate home with a huge navigation search bar.

Implement using Amazon Location Places if available/configured, or another provider behind `PlaceProvider`.

Search results should not be stored as route history without consent.

---

# 57. Map accessibility fallback

Maps are visual. Later, add:

```text
Nearby issues list
```

Sorted by relevance:
- route affected,
- severity,
- distance,
- freshness.

For hackathon, an incident bottom sheet with readable list is enough to demonstrate accessible non-map content.

---

# 58. Internationalization

The product has obvious India utility.

Architecture:
```text
i18n keys from day one
English P0
Hindi P1/P2
```

Do not hardcode long user-facing strings inside components.

Examples:
```text
event.waterlogging.title
alert.routeAffected.title
water.tank.remaining
```

A polished Hindi mode would be impressive only after core reliability.

---

# 59. Data retention

Prototype policy proposal:

| Data | Default retention |
|---|---|
| public incident metadata | retained/history |
| raw report media | limited; configurable |
| sanitized preview | while event/history needs it |
| raw route-learning GPS | local/short-lived |
| saved route geometry | until user deletes |
| telemetry | aggregated after retention period |
| auth/security logs | limited operational window |

For production, write a real privacy policy and comply with applicable law/contractual obligations before public launch.

---

# 60. Deletion semantics

User deletes report:
- do not necessarily delete a verified public incident if other evidence supports it,
- detach/anonymize their contribution where possible,
- delete their private media according to policy,
- preserve minimal audit data when necessary.

User deletes saved route:
- remove geometry from account,
- cancel route-specific alerts.

User disables route learning:
- stop background tasks,
- delete raw traces,
- retain manually accepted route only if user chooses.

---

# 61. Product copy rules

Use:
- `reported`,
- `verified`,
- `possible`,
- `estimated`,
- `last observed`,
- `appears`,
- `lower-reported-risk`.

Avoid:
- `safe`,
- `guaranteed`,
- `confirmed leak` from image alone,
- `exact flood depth` without measurement,
- `AI predicted` as authority.

The language itself is part of safety engineering.

---

# 62. Demo architecture overlay

The three-minute video should briefly show architecture with animated callouts:

```text
        JalNet Mobile
      React Native / Expo
             |
     +-------+--------+
     |                |
Amazon Location    API Gateway
 maps + routes         |
                       v
                    Lambda
             +---------+---------+
             |         |         |
             v         v         v
            S3     DynamoDB   Bedrock/Nova
          evidence   state     vision
```

Narration:

> “The map and saved-route geometry come from Amazon Location. Evidence uploads directly to private S3. A Lambda pipeline asks Amazon Nova on Bedrock for a conservative structured assessment, then JalNet fuses that report into live incident state in DynamoDB and checks whether the incident intersects routes users care about.”

That demonstrates meaningful AWS use in ~15 seconds.

---

# 63. Three-minute demo script

Target **2:45–2:55**, not 2:59.9.

## 0:00–0:15 — problem

Visual:
clean app/map.

Narration:

> “Maps tell us how to get somewhere. But they don’t tell us the full water situation around our daily life: the leak outside, the drain that is about to overflow, whether waterlogging hits our usual route, or whether our building will run out tomorrow. JalNet is a water-intelligence layer for your city.”

## 0:15–0:32 — home

- pan minimally,
- show Jal Pulse,
- saved university route,
- one unrelated existing incident.

> “JalNet opens directly to a lightweight local map. It stays quiet until water information is relevant to you.”

## 0:32–1:22 — killer report loop

- tap center camera,
- capture prepared waterlogging scene/photo if physically available,
- upload,
- AI sheet returns.

> “If I see a problem, reporting takes one action. The photo is uploaded privately to S3. Amazon Nova on Bedrock analyzes visible evidence conservatively — here it detects waterlogging and poor road passability — and I confirm before it becomes public.”

Submit.

- marker appears.

> “JalNet fuses nearby observations instead of creating duplicate pins.”

## 1:22–1:45 — personalization

- route warning appears,
- select event.

> “This incident intersects a route I actually use, so JalNet warns me. It can offer an alternative that avoids currently reported hazards — not replace my navigation app.”

Show droplets quickly.

> “Useful, verified contributions earn droplets for cosmetic status, not uploads for spam.”

## 1:45–2:15 — broader water lifecycle

Switch Water Stress/My Water.

> “The same map changes by water layer. In summer, JalNet can combine supply, rainfall, groundwater and demand into an explainable stress view. For this prototype, our building telemetry is simulated and clearly labeled.”

Show falling tank.

> “The building is forecast to run low before the next supply window.”

## 2:15–2:32 — TankerOS

- reserve screen,
- demo quote.

> “Instead of discovering that at 7 AM, an opted-in building can reserve a tanker ahead of depletion. The full supplier marketplace is a prototype here; no payment is processed.”

## 2:32–2:47 — AWS

Show architecture.

Use narration in previous section.

## 2:47–2:55 — close

> “JalNet turns fragmented water signals into one answer: what is happening around me, will it affect me, and what should I do next?”

Logo:
**JalNet — Know your water before it becomes a problem.**

---

# 64. README structure

```markdown
# JalNet

> Know your water before it becomes a problem.

## Problem
## What JalNet does
## Demo
## Core workflow
## Architecture
## AWS services
## Screenshots
## How incident fusion works
## Route relevance
## Water Stress methodology
## Demo/simulated data disclosure
## Public data sources
## Local development
## Deployment
## Environment variables
## Tests
## Privacy/safety
## Known limitations
## Roadmap
## Team
## AI tools used
## Open-source acknowledgements
## License
```

Critical README section:

### Demo data disclosure

Explicitly state:
- which incident data is seeded,
- whether tank telemetry is simulated,
- whether tanker suppliers are simulated,
- what is live AWS,
- what is future.

This increases credibility.

---

# 65. Submission write-up structure

Keep it tight.

## Problem

Urban water problems are fragmented across:
- emergency warnings,
- citizen complaints,
- navigation,
- building tanks,
- tanker calls,
- environmental datasets.

People need decisions, not separate dashboards.

## Solution

JalNet:
- local map,
- evidence reporting,
- AI-assisted classification,
- incident fusion,
- personal route relevance,
- water stress,
- building shortage forecast,
- tanker coordination.

## What is actually implemented

List only working features.

## AWS

Explain **why** each service is there.

## Technical challenge

Choose one:
- incident fusion,
- route relevance,
- multimodal evidence schema.

## Limitations

Say plainly:
- street flood observations are crowd reports,
- AI does not measure exact depth,
- tank/tanker secondary demo may use simulation.

## Future

Sensors, municipal sources, supplier network.

---

# 66. Architecture questions judges may ask

## “Why not just Google Maps?”

Because JalNet’s primary object is a **water event**, not a road/POI. Route relevance is one consumer of water intelligence, alongside household supply, drains, leaks and stress.

## “Why AI?”

Use it for:
- turning heterogeneous image/video into structured evidence,
- reducing report friction.

Do **not** use it for:
- route geometry,
- deterministic supplier scoring,
- tank arithmetic.

## “What stops fake reports?”

Independent observations, location/capture context, duplicate detection, trust signals, expiry, human confirmation and explicit verification states.

## “How do you know flood depth?”

We do not claim precise depth from an uncalibrated photo. The model uses qualitative depth/passability classes unless a calibrated sensor or reference enables a measurement.

## “Where is AWS?”

Map/routes: Amazon Location.  
Evidence: S3.  
Server logic: Lambda/API Gateway.  
State: DynamoDB.  
Visual media understanding: Amazon Bedrock/Nova.

## “Is TankerOS real?”

The reservation UI/logic can be implemented, while suppliers/payment are prototype/demo data unless real integrations exist. Say exactly that.

## “Does it track me all day?”

Only if the user explicitly opts into future route-learning mode. P0 works with manually saved routes and foreground location. The privacy-first design prefers storing derived routes rather than raw movement history.

## “How is Water Stress calculated?”

From available environmental/supply signals with transparent weights and a coverage indicator. It is labeled as a JalNet index, not an official hydrologic measurement.

---

# 67. Risk register

| Risk | Probability | Impact | Mitigation / kill switch |
|---|---:|---:|---|
| MapLibre native build pain | M | H | build dev client first; fallback web/PWA only if necessary |
| Amazon Location auth integration takes too long | M | H | isolate provider; test first Day 1 |
| Bedrock model access unavailable | M | H | request/verify access early; configurable model; manual report fallback |
| Bedrock latency | M | M | async analysis + optimistic UI |
| exact video analysis too slow | H | M | ship image first; video P1 |
| location permissions fail | M | M | choose-area/manual pin |
| route avoidance API complexity | M | M | show affected segment P0; alternative P1 |
| DynamoDB geo query fanout | L for demo | M | bounded bbox/H3; viewport caps |
| gamification spam | M | M | provisional rewards + verification |
| public source schema changes | M | M | provider abstraction; disable source |
| public data unavailable | M | M | do not block P0 |
| tanker feature distracts from core | H | H | only after core passes |
| UI overbuilt, backend broken | H | H | core acceptance gate Day 2 |
| secrets accidentally recorded | M | H | dedicated demo account, redact console |
| 3-minute demo overcrowded | H | H | one narrative, cut screens |
| phone/network fails during recording | M | H | cache, hotspot, prerehearse |
| feature claims exceed evidence | M | H | copy rules + limitations section |

---

# 68. Kill switches

Remote/config flags:

```text
VIDEO_REPORTS_ENABLED
WATER_STRESS_ENABLED
MY_WATER_ENABLED
TANKER_OS_ENABLED
PUBLIC_ALERTS_ENABLED
ROUTE_ALTERNATIVES_ENABLED
BACKGROUND_ROUTE_LEARNING_ENABLED
```

If a P1 feature is unstable 2 hours before recording:
**turn it off**.

A focused app wins over a broad broken one.

---

# 69. Definition of Done — P0

A feature is not “done” because there is a screen.

## Map

- [ ] opens without crash
- [ ] uses real map provider
- [ ] location permission denial works
- [ ] events come from backend
- [ ] viewport refresh bounded
- [ ] event detail works

## Reporting

- [ ] real camera or real gallery input
- [ ] private S3 upload
- [ ] progress/error
- [ ] Bedrock invocation live
- [ ] strict validated assessment
- [ ] manual fallback
- [ ] confirmation
- [ ] event created/merged
- [ ] map refresh

## Route

- [ ] saved route persists
- [ ] event can intersect it
- [ ] route warning appears
- [ ] warning wording does not guarantee safety

## Droplets

- [ ] ledger idempotent
- [ ] points correspond to value
- [ ] profile updates
- [ ] duplicate does not farm points

## Demo

- [ ] reset command
- [ ] works 5 consecutive times
- [ ] under 3-minute script
- [ ] AWS visible
- [ ] simulated data labeled

---

# 70. Stretch acceptance criteria

## Water Stress

- [ ] real or documented external environmental input
- [ ] provenance
- [ ] coverage
- [ ] no false precision

## My Water

- [ ] simulated or real telemetry stream
- [ ] depletion estimate
- [ ] baseline
- [ ] anomaly message

## TankerOS

- [ ] quotes deterministic
- [ ] demo suppliers labeled
- [ ] reservation state
- [ ] no fake payment
- [ ] auto reserve off by default

---

# 71. “Do not build” list for this weekend

Unless P0 is already excellent:

- custom map tile server,
- full PostGIS migration,
- custom ML flood-depth model,
- computer vision training pipeline,
- blockchain,
- social feed,
- public chat,
- real payment gateway,
- driver navigation app,
- municipality work-order ERP,
- Kubernetes/EKS,
- microservice sprawl,
- elaborate admin dashboard,
- background route-learning engine,
- satellite segmentation pipeline,
- multi-city production tenancy.

All can be legitimate later. None is necessary to prove JalNet.

---

# 72. Post-hackathon technical evolution

## Phase A — validation

- pilot one campus/society/neighborhood,
- collect real report behavior,
- learn category distribution,
- measure false/duplicate reports,
- refine alerts.

## Phase B — building intelligence

- real tank sensor pilots,
- water-board supply inputs where available,
- supplier onboarding,
- usage anomaly detection.

## Phase C — city intelligence

- official alert ingestion,
- live rainfall/groundwater trend,
- municipal drain/leak integration,
- richer spatial DB.

## Phase D — predictive

- recurrent hotspot models,
- rainfall-to-waterlogging calibrated by locality,
- hydrologic/topographic features,
- uncertainty-calibrated models.

## Phase E — operations marketplace

- verified tanker suppliers,
- pricing/availability contracts,
- dispatch optimization,
- payments,
- support/refund mechanisms.

---

# 73. Production database upgrade path

If JalNet grows beyond a hackathon, geospatial workloads will eventually outgrow hand-rolled H3/DynamoDB querying.

Move event analytics to:
**Aurora PostgreSQL + PostGIS**.

Potential:

```sql
CREATE TABLE events (
  id uuid PRIMARY KEY,
  type text NOT NULL,
  status text NOT NULL,
  geom geography(Geometry, 4326) NOT NULL,
  semantic_radius_m double precision NOT NULL,
  severity smallint NOT NULL,
  confidence double precision NOT NULL,
  first_seen_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL
);

CREATE INDEX events_geom_gix
ON events USING GIST (geom);
```

Query:
```sql
SELECT *
FROM events
WHERE status = 'ACTIVE'
AND ST_DWithin(
  geom,
  ST_SetSRID(ST_Point($1, $2), 4326)::geography,
  $3
);
```

Route:
```sql
ST_Intersects(
  ST_Buffer(route_geom::geography, corridor_m)::geometry,
  event_geom
)
```

AWS documentation supports PostGIS for RDS/Aurora PostgreSQL; some current Aurora versions also expose geospatial-related extensions. Treat exact supported versions as deployment-time checks, not assumptions.

---

# 74. Future predictive waterlogging

Do not claim P0 predicts floods. The architecture can grow into prediction later.

Possible features:

```text
recent rainfall accumulation
forecast rainfall
terrain / elevation
drain density/condition
impervious surface
historical JalNet incidents
official water-level signals
```

Model target:
```text
P(waterlogging at cell within next N minutes)
```

Requirements before user-facing production:
- enough labeled incidents,
- spatial cross-validation,
- temporal holdout,
- calibration,
- uncertainty,
- false-negative/false-positive analysis,
- strong “prediction” labeling.

A pretty heatmap without validation is not a flood model.

---

# 75. Future image calibration

If actual flood depth is desired:

Options:
- known curb/tire/roadside reference dimensions,
- fixed calibrated cameras,
- depth sensor / LiDAR-equipped device,
- known drain markers,
- multiple-view geometry.

Only then introduce ranges in cm with model uncertainty.

For arbitrary citizen photos, stick to qualitative classes.

---

# 76. Public-data research notes

The implementation should use official/current docs when connecting each source.

## Hackathon

- Environmental Hacks: https://www.wemakedevs.org/aws/env
- Rules: https://www.wemakedevs.org/aws/env/rules

Important constraints verified on 2026-10-07:
- event Oct 8–11,
- teams 1–4,
- project build starts when hackathon opens,
- planning/learning beforehand is allowed,
- public repo + ≤3-minute YouTube video + short write-up,
- project must use AWS and video must visibly show it,
- judges explicitly prioritize a working feature over several nearly-working ones.

## Amazon Location Service

- Maps: https://docs.aws.amazon.com/location/latest/developerguide/maps.html
- Map styles: https://docs.aws.amazon.com/location/latest/developerguide/map-styles.html
- Dynamic maps: https://docs.aws.amazon.com/location/latest/developerguide/dynamic-maps.html
- Routes concepts/API: https://docs.aws.amazon.com/location/latest/developerguide/concepts-how.html

Research notes:
- dynamic maps are designed for MapLibre rendering,
- Monochrome map style is specifically suitable for data overlays,
- Routes supports travel modes and avoidance/exclusion behavior,
- Routes V2 includes routing matrices/waypoint optimization/Snap-to-Road APIs.

## MapLibre React Native

- Expo setup: https://maplibre.org/maplibre-react-native/docs/setup/expo/
- Getting started: https://maplibre.org/maplibre-react-native/docs/setup/getting-started/

Important:
- MapLibre React Native is not available inside stock Expo Go; use a development/native build.

## OpenStreetMap tiles

- Tile policy: https://operations.osmfoundation.org/policies/tiles/

Use OSM data attribution as required, but do not treat the community `tile.openstreetmap.org` service as JalNet’s production tile CDN.

## Amazon Nova / Bedrock

- Nova multimodal understanding:
  https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-multimodal-models.html
- Nova modality support:
  https://docs.aws.amazon.com/nova/latest/userguide/modalities.html
- Bedrock docs:
  https://docs.aws.amazon.com/bedrock/

Research confirms Nova can consume image/video inputs, including S3-backed media for supported models/interfaces. Confirm the exact model and inference profile available in the hackathon AWS account/region before coding against a hard-coded model ID.

## India official disaster alerts

- NDMA SACHET: https://sachet.ndma.gov.in/
- CAP India RSS is exposed by the SACHET/alerting ecosystem; verify endpoint/terms before production ingestion.

## Groundwater/water data

- Central Ground Water Board: https://cgwb.gov.in/
- National Water Data Portal: https://nwdp.nwic.in/

Use station observations at the spatial/temporal resolution they actually support. Do not convert sparse groundwater stations into false street-level precision.

## Forecast fallback

- Open-Meteo ECMWF: https://open-meteo.com/en/docs/ecmwf-api

Cache public API responses and verify terms/attribution.

---

# 77. Architecture Decision Records

Create `/docs/adr/`.

## ADR-001 — Map provider

**Decision:** MapLibre React Native + Amazon Location Service dynamic maps.

**Reason:** minimal data-overlay map, AWS relevance, mobile support, avoids reliance on OSM public tile servers.

**Rejected:**
- building own tile server,
- direct OSM tile CDN,
- full Google Maps product dependency.

## ADR-002 — Primary database

**Decision:** DynamoDB + H3 for hackathon.

**Reason:** serverless/no VPC/fast operations.

**Future:** PostGIS.

## ADR-003 — AI boundary

**Decision:** Bedrock only converts visual media to conservative structured evidence.

**Not responsible for:** truth, route math, tank forecasts, supplier ranking.

## ADR-004 — Route learning

**Decision:** manual saved routes P0, learning later opt-in.

**Reason:** scope + privacy.

## ADR-005 — Tank data

**Decision:** simulated telemetry is permitted in prototype but visibly labeled.

**Reason:** no real building hardware available during hackathon.

---

# 78. Suggested domain package layout

```text
packages/domain/src/
├── events/
│   ├── types.ts
│   ├── severity.ts
│   ├── verification.ts
│   └── expiry.ts
├── reports/
│   ├── types.ts
│   ├── assessment.ts
│   └── fusion.ts
├── routes/
│   ├── types.ts
│   └── risk.ts
├── droplets/
│   ├── types.ts
│   └── awards.ts
├── water/
│   ├── telemetry.ts
│   ├── baseline.ts
│   ├── forecast.ts
│   └── anomaly.ts
├── tanker/
│   ├── types.ts
│   ├── quote.ts
│   └── reserve.ts
└── stress/
    ├── index.ts
    └── coverage.ts
```

Pure domain functions should be testable without AWS.

---

# 79. Mobile state architecture

Use **TanStack Query** for server state and **Zustand** for small client/UI state.

TanStack Query:
```text
events
event detail
reports
routes
water snapshot
orders
profile
```

Zustand:
```text
selected layer
map camera preference
open sheet
report draft UI
demo feature toggles
```

Do not duplicate server data into Zustand.

---

# 80. Cache keys

Examples:

```ts
["events", viewportCellKey, selectedLayer]
["event", eventId]
["routes"]
["routeRisk", routeId]
["report", reportId]
["waterSnapshot", assetId]
["tankerQuotes", assetId, amount]
["me"]
```

On report confirm:
- invalidate nearby events,
- invalidate route risks,
- invalidate profile/droplets.

---

# 81. Error contract

Backend errors:

```json
{
  "error": {
    "code": "REPORT_MEDIA_INVALID",
    "message": "The uploaded media could not be processed.",
    "requestId": "..."
  }
}
```

Canonical codes:
```text
AUTH_REQUIRED
FORBIDDEN
VALIDATION_FAILED
REPORT_NOT_FOUND
REPORT_BAD_STATE
UPLOAD_TOO_LARGE
UPLOAD_TYPE_UNSUPPORTED
MEDIA_ANALYSIS_FAILED
ROUTE_PROVIDER_FAILED
RATE_LIMITED
DEPENDENCY_UNAVAILABLE
INTERNAL_ERROR
```

Mobile maps codes to useful messages, not raw Lambda stack traces.

---

# 82. Idempotency

Important operations:
- confirm report,
- award droplets,
- reserve tanker,
- supplier status transition.

Client supplies:
```text
Idempotency-Key: uuid
```

Backend stores/guards operation key.

Double-tapping `Submit` must not create two incidents/orders.

---

# 83. Time handling

Backend:
- always UTC ISO-8601.

Client:
- render local time.

Store:
```text
capturedAt
observedAt
submittedAt
lastSeenAt
expiresAt
```

Do not conflate them.

Example:
gallery image captured yesterday but uploaded now:
- lower “live incident” confidence,
- user explicitly confirms if it is still current.

---

# 84. Geospatial precision policy

Store precise report coordinates privately.

Public display may:
- use exact event location when it is a public-road issue,
- fuzz location for household/private property reports.

Never publish home tank coordinates as public event pins.

Supplier only receives delivery location after legitimate reservation/acceptance according to policy.

---

# 85. Event geometry evolution

P0:
```text
Point + semantic radius
```

P1:
```text
road segment line
```

P2:
```text
polygon / multipolygon
```

This keeps incident fusion simple while leaving room for more accurate affected areas.

---

# 86. Severity vs impact vs confidence

Keep these separate.

**Severity**
> How serious does the condition itself appear?

**Impact**
> How many relevant routes/users/assets could it affect?

**Confidence**
> How well-supported is our belief that it is current/correct?

Example:
```text
small leak:
severity 2
impact 4 (main road)
confidence 0.95

huge isolated puddle:
severity 4
impact 1
confidence 0.55
```

Map ranking may combine them, but UI must not confuse them.

---

# 87. Priority model for operations

Future municipal priority:

```text
priority =
  0.35 * severity
+ 0.30 * impact
+ 0.20 * confidence
+ 0.15 * persistence
```

Do not rank solely by most dramatic photo.

---

# 88. API performance safeguards

Viewport endpoint:
- max bbox area,
- max cells,
- max result count,
- client debounce,
- ETag/cache where possible.

Media:
- hard size caps.

Search:
- min character count,
- debounce.

Routes:
- cache by origin/destination/travel mode/hash.

---

# 89. Public status logic

User-facing:

```text
Single report
Community verified
Official
Resolved
Last seen X min ago
```

Do not expose:
```text
confidence = 0.623914
```

Use confidence internally; communicate provenance externally.

---

# 90. Demo mode

`DEMO_MODE` is not a synonym for fake everything.

It means:
- seeded public events,
- fixed building asset,
- simulated tank sensor,
- demo tanker suppliers,
- deterministic reset.

Still real:
- map,
- camera,
- S3 upload,
- Bedrock call,
- report processing,
- event fusion,
- route intersection,
- DynamoDB writes.

This is the balance that makes the prototype both reliable and credible.

---

# 91. Final product pitch

## One sentence

> **JalNet is a map-first water intelligence layer that turns citizen evidence, environmental data and household water state into alerts and actions that are personally relevant.**

## Five-second version

> **Waze tells you there’s traffic ahead. JalNet tells you there’s water ahead — or that there won’t be water tomorrow.**

## Technical version

> **JalNet fuses multimodal citizen observations and water data into geospatial events, then checks those events against the places, routes and water assets users depend on.**

## Avoid saying

> “We built an AI app that solves all water problems.”

---

# 92. Final strategic priority

If the team has only enough time to make **one** thing remarkable, make this flow perfect:

```text
OPEN MAP
   ↓
CAPTURE REAL WATER ISSUE
   ↓
PRIVATE EVIDENCE UPLOAD
   ↓
BEDROCK STRUCTURED ANALYSIS
   ↓
USER CONFIRMATION
   ↓
INCIDENT FUSION
   ↓
MAP CHANGES
   ↓
MY SAVED ROUTE IS AFFECTED
   ↓
ACTIONABLE WARNING
```

That loop alone expresses:

- environmental impact,
- AWS,
- AI with a legitimate job,
- great UI,
- map intelligence,
- personalization,
- crowdsourcing,
- trust,
- an obvious real-world use case.

**Everything else earns the right to exist only after this works.**

---

# 93. Build-order checklist

## Before coding

- [ ] official hackathon clock has started
- [ ] team check-in/eligibility done
- [ ] AWS account access works
- [ ] Bedrock model availability checked
- [ ] Android dev-build prerequisites installed
- [ ] target demo phone available
- [ ] responsibilities assigned

## Core

- [ ] repo
- [ ] mobile shell
- [ ] MapLibre development build
- [ ] Amazon Location map
- [ ] backend infra
- [ ] event store
- [ ] event API
- [ ] event map rendering
- [ ] camera
- [ ] report draft
- [ ] S3
- [ ] Bedrock
- [ ] confirmation
- [ ] fusion
- [ ] route
- [ ] route risk
- [ ] droplets
- [ ] demo reset

## Only then

- [ ] Water Stress
- [ ] My Water
- [ ] TankerOS
- [ ] official data
- [ ] video capture
- [ ] push
- [ ] cosmetics

## Submission

- [ ] public repo
- [ ] readme
- [ ] architecture diagram
- [ ] tests green
- [ ] no secrets
- [ ] demo under 3:00
- [ ] YouTube signed-out test
- [ ] writeup
- [ ] AWS visibly shown
- [ ] simulated features disclosed
- [ ] AI coding tools credited
- [ ] final submit well before deadline

---

# 94. Research conclusions / decisions that close major gaps

1. **Do not use stock Expo Go** for this stack; MapLibre React Native requires a custom native/development build.
2. **Do not serve production maps from OSM’s public tile endpoint.** Use Amazon Location’s hosted map service while preserving required map-data attribution.
3. **Do not invent exact water depth from a citizen photo.** Use qualitative visual classes unless calibrated measurement exists.
4. **Do not call alternatives “safe.”** Say they avoid currently known/reported hazards.
5. **Do not implement background route learning before manual routes.** Manual saved routes prove the core value with less scope and privacy risk.
6. **Do not make Bedrock the source of truth.** It proposes structured observations; the human confirms and the event system verifies.
7. **Do not reward uploads.** Reward accepted, independently useful observations.
8. **Do not let Water Stress pretend to be an official index.** Show methodology + data coverage.
9. **Do not fake tanker companies.** Demo suppliers are explicitly demo data until onboarding exists.
10. **Do not let secondary features threaten the killer loop.** The published judging guidance directly rewards one working feature over five almost-working ones.
11. **Do not start project code before the clock.** The official rules allow planning and practice but require the actual project to be new once the hackathon opens.
12. **Do not claim no competitor exists.** CWC, NDMA, municipal/tanker and routing products cover individual pieces. JalNet’s novelty is the integrated, personal, event-centric water layer.

---

# 95. Source checklist for the team

Re-open these immediately before implementation because service docs/availability can change:

- WeMakeDevs Environmental Hacks overview  
  https://www.wemakedevs.org/aws/env
- WeMakeDevs rules  
  https://www.wemakedevs.org/aws/env/rules
- Amazon Location Maps  
  https://docs.aws.amazon.com/location/latest/developerguide/maps.html
- Amazon Location map styles  
  https://docs.aws.amazon.com/location/latest/developerguide/map-styles.html
- Amazon Location routing concepts  
  https://docs.aws.amazon.com/location/latest/developerguide/concepts-how.html
- MapLibre React Native Expo setup  
  https://maplibre.org/maplibre-react-native/docs/setup/expo/
- Expo Location  
  https://docs.expo.dev/versions/latest/sdk/location/
- Expo Camera  
  https://docs.expo.dev/versions/latest/sdk/camera/
- Amazon Bedrock  
  https://docs.aws.amazon.com/bedrock/
- Amazon Nova multimodal understanding  
  https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-multimodal-models.html
- OpenStreetMap tile policy  
  https://operations.osmfoundation.org/policies/tiles/
- NDMA SACHET  
  https://sachet.ndma.gov.in/
- Central Ground Water Board  
  https://cgwb.gov.in/
- National Water Data Portal  
  https://nwdp.nwic.in/
- Open-Meteo ECMWF API  
  https://open-meteo.com/en/docs/ecmwf-api

---

# 96. Final note to the implementation team

JalNet can easily become a scope monster because every water problem is interesting. The architecture should support that breadth, but the hackathon build must communicate **one compact truth**:

> A person sees a water problem. JalNet understands and verifies it. The city map changes. The people who actually depend on that place or route learn about it before it becomes their problem.

Then show that the same event intelligence can extend naturally to scarcity, tanks, tankers, drains and heat.

If the team preserves that hierarchy, the product will feel ambitious rather than unfinished.

**End of implementation plan.**


# 97. Authentication detail — mobile map access vs JalNet API access

This distinction closes an important implementation gap.

## 97.1 JalNet application API

Use **Cognito-backed authentication** for JalNet-owned user data:

```text
mobile
  |
Cognito sign-in/token
  |
API Gateway authorizer
  |
Lambda
```

Protect:
- `/me`,
- reports,
- routes,
- droplets,
- My Water,
- tanker reservations.

## 97.2 Amazon Location map assets

Interactive map tiles/style requests should not bounce through the JalNet Lambda API; that adds latency and needless bandwidth.

Amazon Location officially supports **API keys for read-only Maps, Places and Routes use**, and allows client restrictions for web domains or Android/Apple apps.

For the hackathon:

```text
MapLibre mobile
      |
restricted Amazon Location API key
      |
Amazon Location Maps
```

Create a dedicated key with:
- only required `geo-maps:Get*` actions initially,
- the specific default map resource/provider ARN,
- Android/iOS client restriction when practical,
- explicit expiration after the hackathon/demo period.

If Places is used directly, add only the required place actions. If routes go through JalNet’s backend, do **not** grant route actions to the map key.

An Amazon Location API key is intentionally usable from client software and therefore must be treated as **extractable**, not as an AWS secret access key. Restrict its capabilities, client identities and expiry accordingly.

Possible mobile env:

```dotenv
# Public/restricted client credential; never grant general AWS access.
EXPO_PUBLIC_LOCATION_MAP_KEY=v1.public....
```

Still forbidden in mobile:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
Bedrock credentials
Lambda execution credentials
private Cognito client secret
```

For a more controlled production architecture, use Cognito/federated credentials or the Amazon Location mobile authentication helpers where appropriate.

Reference:
https://docs.aws.amazon.com/location/latest/developerguide/using-apikeys.html

## 97.3 Route calls

Recommended P0:
```text
mobile -> JalNet /routes/preview -> Lambda -> Amazon Location Routes
```

Reasons:
- centralized hazard-avoidance logic,
- input rate limits,
- response caching,
- the app never decides which incident polygons are trustworthy enough to avoid,
- easier observability.

Map rendering remains direct for speed.

## 97.4 Mumbai endpoints

AWS currently exposes Amazon Location Maps, Places, Routes, Geofences and Trackers endpoints in **Asia Pacific (Mumbai), `ap-south-1`**. Reconfirm at build time.

Reference:
https://docs.aws.amazon.com/general/latest/gr/location.html

---

# 98. Bedrock region/model pinning

Do not assume that a model ID usable in one AWS region is directly invocable in every other region.

At hackathon start:

```bash
# Conceptual checklist, not a pre-clock project action:
1. open Bedrock model catalog
2. confirm chosen Nova model
3. confirm account access
4. confirm supported inference profile from ap-south-1
5. run a tiny image test
6. record the working model/inference ID in demo env
```

Current AWS documentation lists **Amazon Nova 2 Lite global inference** with `ap-south-1` among Asia-Pacific destination regions. Availability and access can change, so keep:

```text
BEDROCK_MODEL_ID
```

fully configurable and never write application behavior that depends on one literal ID.

Reference:
https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-lite.html

---

# 99. First 30-minute integration smoke test after the clock starts

Before designing beautiful cards, prove the risky dependencies:

```text
[1] Expo development build installs
[2] MapLibre renders an Amazon Location map
[3] phone foreground location appears on map
[4] Lambda hello endpoint returns
[5] DynamoDB test write/read works
[6] presigned S3 PUT works from phone
[7] Bedrock/Nova receives one test image and returns text/JSON
[8] Amazon Location Routes calculates one route
```

If any one fails, assign it immediately rather than discovering it on Day 2.

The purpose is not to build JalNet before the clock; it is to de-risk JalNet **as the first work after the official start**.

---

# 100. Architecture freeze criteria

Freeze the core architecture when all are true:

```text
map provider works on physical phone
event API is stable
camera-to-S3 works
Bedrock structured result works
event create/merge works
route risk works
demo reset works
```

After freeze:
- no database redesign,
- no mobile framework switch,
- no map provider switch,
- no “let's rewrite in Rust because it would be cool,”
- no dependency major-version upgrades.

The remaining time belongs to correctness, visual polish, secondary value and the submission.


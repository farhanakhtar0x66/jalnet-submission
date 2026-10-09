import { savedRouteInputSchema } from "../packages/contracts/src/events.js";
import { encodePolyline } from "../packages/geo/src/index.js";
import type { Application } from "../services/core/application.js";
import { LocalRoutes } from "../services/providers/local.js";
import { LocalRepository } from "../services/providers/local-repository.js";

export const localDemoCorridor = savedRouteInputSchema.parse({
  name: "LOCAL/DEMO corridor",
  origin: { lat: 28.6139, lon: 77.205 },
  destination: { lat: 28.6139, lon: 77.215 },
  travelMode: "Car",
  activeAlerts: true,
});
const corridorPolyline = encodePolyline([
  [localDemoCorridor.origin.lon, localDemoCorridor.origin.lat],
  [localDemoCorridor.destination.lon, localDemoCorridor.destination.lat],
]);

export async function ensureLocalDemoCorridor(app: Application) {
  if (
    !(app.repository instanceof LocalRepository) ||
    !(app.routeProvider instanceof LocalRoutes)
  )
    throw new Error(
      "Demo seeding requires local repository and route providers",
    );
  const routes = await app.repository.routes("local-alice");
  // SavedRoute retains geometry, name and alerts, not travel mode. The local
  // fixture always submits the exact Car request; ordered geometry identifies
  // its persisted endpoints without inventing absent metadata.
  if (
    routes.some(
      (route) =>
        route.source === "MANUAL" &&
        route.name === localDemoCorridor.name &&
        route.polyline === corridorPolyline &&
        route.activeAlerts === localDemoCorridor.activeAlerts,
    )
  )
    return "already-present" as const;
  if (routes.length >= 5)
    throw new Error(
      "LOCAL/DEMO corridor was not seeded: local-alice already has five saved routes. Preserve existing routes; deliberately remove an unwanted route before retrying.",
    );
  await app.saveRoute("local-alice", localDemoCorridor);
  return "created" as const;
}

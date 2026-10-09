import { latLngToCell } from "h3-js";
import type { z } from "zod";
import type {
  confirmReportSchema,
  SavedRoute,
  WaterEvent,
} from "../../contracts/src/events.js";
import {
  decodePolyline,
  distanceM,
  routeDistanceM,
} from "../../geo/src/index.js";

export const incidentPolicy = {
  WATERLOGGING: { mergeM: 150, mergeHours: 3, radiusM: 60, expiryHours: 3 },
  FLOOD: { mergeM: 300, mergeHours: 6, radiusM: 150, expiryHours: 6 },
  LEAK: { mergeM: 60, mergeHours: 4, radiusM: 20, expiryHours: 24 },
  DRAIN_BLOCKAGE: {
    mergeM: 30,
    mergeHours: 168,
    radiusM: 15,
    expiryHours: 168,
  },
  DRAIN_OVERFLOW: { mergeM: 50, mergeHours: 6, radiusM: 30, expiryHours: 6 },
} as const;
export type ConfirmedObservation = z.infer<typeof confirmReportSchema>;
export function isCurrent(event: WaterEvent, now: string): boolean {
  return (
    ["UNVERIFIED", "ACTIVE", "MONITORING"].includes(event.status) &&
    Date.parse(event.expiresAt) > Date.parse(now)
  );
}
export function fusionCandidate(
  events: WaterEvent[],
  observation: ConfirmedObservation,
  now: string,
): WaterEvent | undefined {
  const policy = incidentPolicy[observation.category];
  const scored = events
    .filter(
      (e) =>
        e.type === observation.category &&
        e.attributes.publicRoad === observation.publicRoad &&
        isCurrent(e, now),
    )
    .map((event) => {
      const distance = distanceM(event.location, observation.location);
      const age = Math.max(
        0,
        (Date.parse(now) - Date.parse(event.lastSeenAt)) / 3_600_000,
      );
      const score =
        0.4 * (1 - distance / policy.mergeM) +
        0.25 * (1 - age / policy.mergeHours) +
        0.2 +
        0.15;
      return { event, score, distance, age };
    })
    .filter(
      (x) =>
        x.distance <= policy.mergeM &&
        x.age <= policy.mergeHours &&
        x.score >= 0.72,
    )
    .sort((a, b) => b.score - a.score || a.event.id.localeCompare(b.event.id));
  // Avoid aggressively merging when multiple candidates are similarly plausible.
  if (scored[1] && scored[0] && scored[0].score - scored[1].score < 0.08)
    return undefined;
  return scored[0]?.event;
}
export function eventForObservation(
  id: string,
  observation: ConfirmedObservation,
  now: string,
  previous?: WaterEvent,
): WaterEvent {
  const policy = incidentPolicy[observation.category];
  const location = previous?.location ?? {
    ...observation.location,
    h3R8: latLngToCell(observation.location.lat, observation.location.lon, 8),
    semanticRadiusM: policy.radiusM,
  };
  const severities = [
    ...(Array.isArray(previous?.attributes.severities)
      ? previous.attributes.severities.filter(
          (n): n is number => typeof n === "number",
        )
      : []),
    observation.severity,
  ].sort((a, b) => a - b);
  const middle =
    severities[Math.floor((severities.length - 1) / 2)] ?? observation.severity;
  return {
    id: previous?.id ?? id,
    type: observation.category,
    status: previous?.status ?? "UNVERIFIED",
    location,
    severity: Math.min(4, Math.max(1, middle)) as WaterEvent["severity"],
    confidence: previous?.confidence ?? 0.55,
    verificationScore: previous?.verificationScore ?? 0,
    reportCount: (previous?.reportCount ?? 0) + 1,
    firstSeenAt: previous?.firstSeenAt ?? now,
    lastSeenAt: now,
    expiresAt: new Date(
      Date.parse(now) + policy.expiryHours * 3_600_000,
    ).toISOString(),
    attributes: {
      ...previous?.attributes,
      severities,
      publicRoad: observation.publicRoad,
    },
    publicSummary: `Reported ${observation.category.toLowerCase().replaceAll("_", " ")}. Exact measurements and road conditions are uncertain.`,
    sourceTypes: ["CITIZEN"],
    impact: { affectedSavedRoutes: 0 },
  };
}
export function routeRisk(route: SavedRoute, event: WaterEvent, now: string) {
  const distance = routeDistanceM(
    event.location,
    decodePolyline(route.polyline),
  );
  const intersects =
    route.activeAlerts &&
    isCurrent(event, now) &&
    event.attributes.publicRoad !== false &&
    distance <= event.location.semanticRadiusM + route.corridorWidthM;
  const freshness = Math.exp(
    -Math.max(0, (Date.parse(now) - Date.parse(event.lastSeenAt)) / 3_600_000) /
      3,
  );
  const score = intersects ? event.severity * event.confidence * freshness : 0;
  return {
    eventId: event.id,
    intersects,
    warning: intersects && score >= 0.8,
    score,
    message: "Your route may be affected by currently reported water hazards.",
  };
}

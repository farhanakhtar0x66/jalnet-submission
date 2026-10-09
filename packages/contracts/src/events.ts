import { z } from "zod";
import {
  coordinatesSchema,
  eventStatusSchema,
  eventTypeSchema,
  utcTimestampSchema,
} from "./index.ts";

export const eventSchema = z.strictObject({
  id: z.uuid(),
  type: eventTypeSchema,
  status: eventStatusSchema,
  location: coordinatesSchema.extend({
    h3R8: z.string(),
    h3R9: z.string().optional(),
    semanticRadiusM: z.number().positive().max(1000),
    placeLabel: z.string().max(160).optional(),
  }),
  severity: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  confidence: z.number().min(0).max(1),
  verificationScore: z.number().min(0).max(1),
  reportCount: z.number().int().positive(),
  firstSeenAt: utcTimestampSchema,
  lastSeenAt: utcTimestampSchema,
  expiresAt: utcTimestampSchema,
  resolvedAt: utcTimestampSchema.optional(),
  attributes: z.record(z.string(), z.unknown()),
  publicSummary: z.string().max(500),
  sourceTypes: z.array(
    z.enum(["CITIZEN", "SENSOR", "GOV_ALERT", "WEATHER", "SYSTEM"]),
  ),
  impact: z.strictObject({
    affectedSavedRoutes: z.number().int().nonnegative(),
  }),
});
export type WaterEvent = z.infer<typeof eventSchema>;
export const savedRouteSchema = z.strictObject({
  id: z.uuid(),
  userId: z.string(),
  name: z.string().trim().min(1).max(80),
  source: z.literal("MANUAL"),
  polyline: z.string().min(1),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  corridorWidthM: z.number().min(1).max(200),
  activeAlerts: z.boolean(),
});
export type SavedRoute = z.infer<typeof savedRouteSchema>;
export const savedRouteInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  origin: coordinatesSchema,
  destination: coordinatesSchema,
  travelMode: z.enum(["Car", "Pedestrian", "Scooter"]),
  activeAlerts: z.boolean(),
});
export const confirmReportSchema = z.strictObject({
  category: z.enum([
    "WATERLOGGING",
    "FLOOD",
    "LEAK",
    "DRAIN_BLOCKAGE",
    "DRAIN_OVERFLOW",
  ]),
  stillActive: z.literal(true),
  severity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  note: z.string().trim().max(500).optional(),
  location: coordinatesSchema,
  publicRoad: z.boolean(), // Explicit public-road consent; household/property reports stay private.
});
export const viewportSchema = z.strictObject({
  bbox: z
    .tuple([
      z.number().min(-180).max(180),
      z.number().min(-85).max(85),
      z.number().min(-180).max(180),
      z.number().min(-85).max(85),
    ])
    .refine(
      ([west, south, east, north]) =>
        west < east && south < north && (east - west) * (north - south) <= 0.04,
      "Viewport must be ordered and at most 0.04 square degrees",
    ),
  layer: z.enum(["LIVE", "FLOOD", "LEAKS", "DRAINS", "ROUTE_RISK"]),
});
export const ledgerEntrySchema = z.strictObject({
  id: z.uuid(),
  userId: z.string(),
  reportId: z.uuid().optional(),
  eventId: z.uuid(),
  amount: z.number().int(),
  reason: z.enum([
    "REPORT_SUBMITTED",
    "FIRST_VALID_REPORT",
    "REPORT_CORROBORATED",
    "EVENT_VERIFIED",
    "ROUTE_USERS_HELPED",
    "ISSUE_RESOLVED",
    "PENALTY_DUPLICATE",
    "PENALTY_FALSE_REPORT",
  ]),
  createdAt: utcTimestampSchema,
  idempotencyKey: z.string().min(1),
});
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;

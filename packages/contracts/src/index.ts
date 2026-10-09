import { z } from "zod";

export const coordinatesSchema = z.strictObject({
  lat: z.number().finite().min(-85).max(85),
  lon: z.number().finite().min(-180).max(180),
});
export const eventTypeSchema = z.enum([
  "WATERLOGGING",
  "FLOOD",
  "LEAK",
  "DRAIN_BLOCKAGE",
  "DRAIN_OVERFLOW",
  "SUPPLY_OUTAGE",
  "WATER_STRESS",
  "HEAT_WATER_RISK",
  "TANKER_DEMAND",
]);
export const eventStatusSchema = z.enum([
  "UNVERIFIED",
  "ACTIVE",
  "MONITORING",
  "RESOLVED",
  "REJECTED",
  "EXPIRED",
]);
export const reportStatusSchema = z.enum([
  "DRAFT",
  "UPLOADING",
  "ANALYZING",
  "NEEDS_CONFIRMATION",
  "SUBMITTED",
  "MERGED",
  "ACCEPTED",
  "REJECTED",
]);
export const utcTimestampSchema = z.iso.datetime();
const passabilitySchema = z.enum(["LIKELY_OK", "CAUTION", "POOR", "UNKNOWN"]);
const obstructionSchema = z.enum(["NONE", "POSSIBLE", "LIKELY", "UNKNOWN"]);

// Exact §8.3 assessment: unknown fields, measurements and unsupported enum values fail.
export const mediaAssessmentSchema = z.strictObject({
  relevant: z.boolean(),
  category: z.enum([
    "WATERLOGGING",
    "FLOOD",
    "LEAK",
    "DRAIN_BLOCKAGE",
    "DRAIN_OVERFLOW",
    "OTHER",
    "UNCERTAIN",
  ]),
  visualSeverity: z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL", "UNKNOWN"]),
  evidence: z.array(z.string().trim().min(1).max(240)).max(12),
  passability: z
    .strictObject({
      pedestrians: passabilitySchema,
      twoWheelers: passabilitySchema,
      cars: passabilitySchema,
    })
    .optional(),
  waterDepthClass: z
    .enum([
      "TRACE",
      "SHALLOW_VISIBLE",
      "MODERATE_VISIBLE",
      "DEEP_OR_UNSAFE",
      "UNKNOWN",
    ])
    .optional(),
  drain: z
    .strictObject({
      visible: z.boolean(),
      obstruction: obstructionSchema,
      overflow: obstructionSchema,
    })
    .optional(),
  leak: z
    .strictObject({
      visibleFlow: z.boolean(),
      suspectedSource: z.enum([
        "PIPE",
        "VALVE",
        "ROAD_SURFACE",
        "BUILDING",
        "UNKNOWN",
      ]),
    })
    .optional(),
  modelConfidence: z.number().finite().min(0).max(1),
  uncertaintyReasons: z.array(z.string().trim().min(1).max(240)).max(12),
  publicDraft: z.string().trim().min(1).max(500),
});
export type MediaAssessment = z.infer<typeof mediaAssessmentSchema>;

export const reportLocationSchema = coordinatesSchema.extend({
  accuracyM: z.number().finite().min(0).max(10_000).optional(),
  source: z.enum(["CAPTURE", "USER_PIN", "CURRENT_LOCATION"]),
});
export const reportSchema = z.strictObject({
  id: z.uuid(),
  userId: z.string().min(1),
  status: reportStatusSchema,
  capturedAt: utcTimestampSchema,
  observedAt: utcTimestampSchema.optional(),
  submittedAt: utcTimestampSchema.optional(),
  location: reportLocationSchema,
  media: z
    .array(
      z.strictObject({
        kind: z.enum(["IMAGE", "VIDEO"]),
        s3Key: z.string().min(1),
        sha256: z
          .string()
          .regex(/^[a-f0-9]{64}$/)
          .optional(),
        perceptualHash: z.string().optional(),
      }),
    )
    .max(1),
  upload: z
    .strictObject({
      contentLength: z.number().int().positive().max(4_000_000),
      contentType: z.literal("image/jpeg"),
    })
    .optional(),
  analysisProvenance: z.enum(["LOCAL_DEMO", "AWS_UNVERIFIED"]).optional(),
  aiAssessment: mediaAssessmentSchema.optional(),
  userConfirmation: z
    .strictObject({
      category: eventTypeSchema.optional(),
      stillActive: z.boolean(),
      note: z.string().max(500).optional(),
    })
    .optional(),
  mergedEventId: z.uuid().optional(),
});
export type Report = z.infer<typeof reportSchema>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const createReportRequestSchema = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("DRAFT"),
    capturedAt: utcTimestampSchema,
    location: reportLocationSchema,
  }),
  z.strictObject({ action: z.literal("UPLOAD_COMPLETE"), reportId: z.uuid() }),
]);
export const presignRequestSchema = z.strictObject({
  reportId: z.uuid(),
  contentType: z.literal("image/jpeg"),
  contentLength: z.number().int().positive().max(4_000_000),
});
export const routePreviewRequestSchema = z.strictObject({
  origin: coordinatesSchema,
  destination: coordinatesSchema,
  travelMode: z.enum(["Car", "Pedestrian", "Scooter"]),
});
export const routeResultSchema = z.strictObject({
  // Routes V2 flexible polyline is deliberately not mislabeled as Google's encoding.
  geometry: z
    .array(
      z.tuple([z.number().min(-180).max(180), z.number().min(-85).max(85)]),
    )
    .min(2)
    .max(50_000),
  distanceM: z.number().finite().nonnegative(),
  durationSec: z.number().finite().nonnegative(),
});
export const apiErrorCodes = z.enum([
  "AUTH_REQUIRED",
  "FORBIDDEN",
  "VALIDATION_FAILED",
  "REPORT_NOT_FOUND",
  "REPORT_BAD_STATE",
  "UPLOAD_TOO_LARGE",
  "UPLOAD_TYPE_UNSUPPORTED",
  "MEDIA_ANALYSIS_FAILED",
  "ROUTE_PROVIDER_FAILED",
  "RATE_LIMITED",
  "DEPENDENCY_UNAVAILABLE",
  "INTERNAL_ERROR",
]);
export const apiErrorSchema = z.strictObject({
  error: z.strictObject({
    code: apiErrorCodes,
    message: z.string(),
    requestId: z.string(),
  }),
});

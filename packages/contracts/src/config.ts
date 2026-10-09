import { z } from "zod";

const value = z.string().trim().min(1).max(2048);
const identifier = value.regex(/^[A-Za-z0-9._:/-]+$/);
export const serverConfigSchema = z
  .object({
    AWS_REGION: z.literal("ap-south-1"),
    REPORTS_TABLE: identifier,
    EVENTS_TABLE: identifier,
    USERS_TABLE: identifier,
    DROPLET_LEDGER_TABLE: identifier,
    EVIDENCE_BUCKET: value.regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/),
    MEDIA_QUEUE_URL: z
      .url()
      .regex(
        /^https:\/\/sqs\.ap-south-1\.amazonaws\.com\/\d{12}\/[A-Za-z0-9_-]+$/,
      ),
    MEDIA_QUEUE_ARN: value.regex(
      /^arn:aws:sqs:ap-south-1:\d{12}:[A-Za-z0-9_-]+$/,
    ),
    BEDROCK_MODEL_ID: identifier,
    COGNITO_ISSUER: z
      .url()
      .regex(
        /^https:\/\/cognito-idp\.ap-south-1\.amazonaws\.com\/ap-south-1_[A-Za-z0-9]+$/,
      ),
    COGNITO_CLIENT_ID: value.regex(/^[a-z0-9]+$/),
  })
  .superRefine((config, ctx) => {
    const queue = config.MEDIA_QUEUE_URL.split("/").slice(-2).join(":");
    if (!config.MEDIA_QUEUE_ARN.endsWith(`:${queue}`))
      ctx.addIssue({
        code: "custom",
        path: ["MEDIA_QUEUE_ARN"],
        message: "Queue URL and ARN must identify the same queue",
      });
  });

export function readServerConfig(env: Record<string, string | undefined>) {
  const parsed = serverConfigSchema.safeParse(env);
  if (!parsed.success)
    throw new Error(
      `Missing or invalid server configuration: ${[...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))].join(", ")}`,
    );
  return parsed.data;
}

export function readMobileConfig(env: Record<string, string | undefined>) {
  const mode = env.EXPO_PUBLIC_PROVIDER_MODE ?? "local-demo";
  if (mode === "local-demo")
    return {
      mode: "local-demo" as const,
      apiUrl: z
        .url()
        .parse(env.EXPO_PUBLIC_API_BASE_URL ?? "http://10.0.2.2:8787"),
    };
  if (mode !== "aws")
    throw new Error("Invalid provider mode; use local-demo or aws");
  const schema = z.object({
    EXPO_PUBLIC_API_BASE_URL: z
      .url()
      .regex(
        /^https:\/\/[a-z0-9]+\.execute-api\.ap-south-1\.amazonaws\.com\/?$/,
      ),
    EXPO_PUBLIC_AWS_REGION: z.literal("ap-south-1"),
    EXPO_PUBLIC_COGNITO_POOL_ID: value.regex(/^ap-south-1_[A-Za-z0-9]+$/),
    EXPO_PUBLIC_COGNITO_CLIENT_ID: value.regex(/^[a-z0-9]+$/),
    EXPO_PUBLIC_COGNITO_DOMAIN: z
      .url()
      .regex(/^https:\/\/[a-z0-9-]+\.auth\.ap-south-1\.amazoncognito\.com$/),
    EXPO_PUBLIC_LOCATION_MAP_KEY: value.regex(/^v1\.public\.[A-Za-z0-9._-]+$/),
    EXPO_PUBLIC_LOCATION_MAP_RESOURCE_ARN: z.literal(
      "arn:aws:geo-maps:ap-south-1::provider/default",
    ),
    EXPO_PUBLIC_ANDROID_CERT_SHA1: value.regex(
      /^([A-Fa-f0-9]{2}:){19}[A-Fa-f0-9]{2}$/,
    ),
  });
  const parsed = schema.safeParse(env);
  if (!parsed.success)
    throw new Error(
      `AWS configuration blocked: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}. Supply actual deployment outputs and a restricted map key.`,
    );
  return {
    mode: "aws" as const,
    apiUrl: parsed.data.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, ""),
    ...parsed.data,
  };
}

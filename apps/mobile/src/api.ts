import { readMobileConfig } from "@jalnet/contracts/config";
import * as SecureStore from "expo-secure-store";
import { z } from "zod";
import { jsonRequest } from "./transport";
export { HttpError, NetworkError } from "./transport";
export let configurationError = "";
export const mobileConfig = (() => {
  try {
    return readMobileConfig({
      EXPO_PUBLIC_PROVIDER_MODE: process.env.EXPO_PUBLIC_PROVIDER_MODE,
      EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
      EXPO_PUBLIC_AWS_REGION: process.env.EXPO_PUBLIC_AWS_REGION,
      EXPO_PUBLIC_COGNITO_POOL_ID: process.env.EXPO_PUBLIC_COGNITO_POOL_ID,
      EXPO_PUBLIC_COGNITO_CLIENT_ID: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID,
      EXPO_PUBLIC_COGNITO_DOMAIN: process.env.EXPO_PUBLIC_COGNITO_DOMAIN,
      EXPO_PUBLIC_LOCATION_MAP_KEY: process.env.EXPO_PUBLIC_LOCATION_MAP_KEY,
      EXPO_PUBLIC_LOCATION_MAP_RESOURCE_ARN:
        process.env.EXPO_PUBLIC_LOCATION_MAP_RESOURCE_ARN,
      EXPO_PUBLIC_ANDROID_CERT_SHA1: process.env.EXPO_PUBLIC_ANDROID_CERT_SHA1,
    });
  } catch (error) {
    configurationError =
      error instanceof Error ? error.message : "Invalid mobile configuration";
    return null;
  }
})();
export const isLocal = mobileConfig?.mode === "local-demo";
const sessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  expiresAt: z.number().finite(),
  accountScope: z.string().min(1),
});
async function sessionIdentity() {
  if (isLocal)
    return {
      accessToken: "LOCAL_DEMO_ALICE",
      accountScope: "LOCAL_DEMO_ALICE",
      expiresAt: Number.MAX_SAFE_INTEGER,
    };
  const stored = await SecureStore.getItemAsync("jalnet.session");
  let value: unknown;
  try {
    value = stored ? JSON.parse(stored) : null;
  } catch {
    value = null;
  }
  const parsed = sessionSchema.safeParse(value);
  if (
    !parsed.success ||
    mobileConfig?.mode !== "aws" ||
    !parsed.data.accountScope.startsWith(
      `cognito:${mobileConfig.EXPO_PUBLIC_COGNITO_POOL_ID}:`,
    )
  )
    throw new Error(
      "Sign in again before opening private drafts or cached routes",
    );
  return parsed.data;
}
export async function storageScope() {
  return (await sessionIdentity()).accountScope;
}
export async function api<T>(
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
  expectedScope?: string,
) {
  const session = await sessionIdentity();
  if (!mobileConfig)
    throw new Error(
      "AWS sign-in and API configuration are required; live access is blocked.",
    );
  if (expectedScope && expectedScope !== session.accountScope)
    throw new Error("Account changed; original private data was kept");
  if (!isLocal) {
    if (session.expiresAt <= Date.now())
      throw new Error(
        "Session expired. Sign in again; your private draft is retained.",
      );
  }
  return schema.parse(
    await jsonRequest(
      mobileConfig.apiUrl,
      path,
      session.accessToken,
      body,
      method,
    ),
  );
}

import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { encode } from "jpeg-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HttpError,
  jsonRequest,
  NetworkError,
} from "../apps/mobile/src/transport.js";
import {
  readMobileConfig,
  readServerConfig,
} from "../packages/contracts/src/config.js";
import {
  assertIdentity,
  assertMapsKey,
  cleanAwsEnvironment,
  cutoverConfigSchema,
  liveArguments,
  privateJson,
} from "../scripts/aws-safety.js";
import {
  assertDistinctDemoAccounts,
  controlledCapture,
} from "../scripts/smoke-aws.js";
import { authorizerSubject, makeHandler } from "../services/aws/runtime.js";

// Deliberately LOCAL unit-test identifiers; never deployment configuration.
const config = cutoverConfigSchema.parse({
  expectedAccountId: "123456789012",
  expectedRoleArn:
    "arn:aws:iam::123456789012:role/aws-reserved/sso.amazonaws.com/ap-south-1/AWSReservedSSO_UnitOnly",
  region: "ap-south-1",
  stackName: "JalNetDev",
  bedrockModelId: "unit-model",
  bedrockInvokeArns: [
    "arn:aws:bedrock:ap-south-1::foundation-model/unit-model",
  ],
  mapKeyName: "unit-only",
  androidCertificateSha1: Array(20).fill("AB").join(":"),
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe("LOCAL cutover guards; no AWS proof or network calls", () => {
  it("requires explicit live consent, jalnet profile and private target config", () => {
    expect(() => liveArguments([], ["--profile", "--config"])).toThrow(
      "--live",
    );
    expect(() =>
      liveArguments(
        ["--live", "--profile", "default", "--config", "/unit"],
        ["--profile", "--config"],
      ),
    ).toThrow("--profile jalnet");
    expect(() =>
      liveArguments(
        ["--live", "--profile", "jalnet"],
        ["--profile", "--config"],
      ),
    ).toThrow("private --config");
    expect(() =>
      liveArguments(
        ["--live", "--profile", "jalnet", "--profile", "jalnet"],
        ["--profile"],
      ),
    ).toThrow("repeated");
  });
  it("fails the actual smoke CLI without live or profile flags before invoking AWS", async () => {
    for (const args of [[], ["--live", "--config", "/unit"]]) {
      const result = await promisify(execFile)(
        process.execPath,
        ["--import", "tsx", "scripts/smoke-aws.ts", ...args],
        { timeout: 10_000 },
      ).catch(
        (error: { code: number; stdout: string; stderr: string }) => error,
      );
      expect(result).toMatchObject({ code: 2, stdout: "" });
      expect(result.stderr).toMatch(/--live|--profile jalnet/);
    }
  });
  it("rejects the wrong account, role, IAM user and malformed identity", () => {
    for (const identity of [
      {
        Account: "000000000000",
        Arn: "arn:aws:sts::000000000000:assumed-role/AWSReservedSSO_UnitOnly/session",
      },
      {
        Account: config.expectedAccountId,
        Arn: `arn:aws:sts::${config.expectedAccountId}:assumed-role/Other/session`,
      },
      {
        Account: config.expectedAccountId,
        Arn: `arn:aws:iam::${config.expectedAccountId}:user/unit`,
      },
      {},
    ])
      expect(() => assertIdentity(config, identity)).toThrow("STOP:");
    expect(() =>
      assertIdentity(config, {
        Account: config.expectedAccountId,
        Arn: `arn:aws:sts::${config.expectedAccountId}:assumed-role/AWSReservedSSO_UnitOnly/session`,
      }),
    ).not.toThrow();
  });
  it("rejects wildcard model grants and conflicting target/endpoint configuration", () => {
    expect(
      cutoverConfigSchema.safeParse({
        ...config,
        bedrockModelId: "unlisted-unit-model",
      }).success,
    ).toBe(false);
    expect(
      cutoverConfigSchema.safeParse({ ...config, bedrockInvokeArns: ["*"] })
        .success,
    ).toBe(false);
    expect(
      cutoverConfigSchema.safeParse({
        ...config,
        expectedRoleArn: "arn:aws:iam::000000000000:role/UnitOnly",
      }).success,
    ).toBe(false);
    expect(() =>
      cleanAwsEnvironment(config, { AWS_PROFILE: "default" }),
    ).toThrow("Conflicting");
    expect(() =>
      cleanAwsEnvironment(config, { AWS_ENDPOINT_URL: "https://localhost" }),
    ).toThrow("overrides");
  });
  it("rejects malformed/expired key metadata and unapproved callers before mobile configuration", () => {
    const now = Date.now();
    const resource = "arn:aws:geo-maps:ap-south-1::provider/default";
    const app = {
      Package: "org.jalnet.mobile",
      CertificateFingerprint: config.androidCertificateSha1,
    };
    const key = {
      KeyArn: `arn:aws:geo:${config.region}:${config.expectedAccountId}:api-key/${config.mapKeyName}`,
      ExpireTime: new Date(now + 86_400_000).toISOString(),
      Restrictions: {
        AllowActions: ["geo-maps:*"],
        AllowResources: [resource],
        AllowAndroidApps: [app],
      },
    };
    expect(() => assertMapsKey(config, resource, key, now)).not.toThrow();
    for (const invalid of [
      { ...key, ExpireTime: "invalid-private-expiry" },
      { ...key, ExpireTime: new Date(now).toISOString() },
      { ...key, ExpireTime: new Date(now + 8 * 86_400_000).toISOString() },
      { ...key, NoExpiry: true },
      {
        ...key,
        Restrictions: { ...key.Restrictions, AllowActions: ["geo-routes:*"] },
      },
      {
        ...key,
        Restrictions: {
          ...key.Restrictions,
          AllowAndroidApps: [app, { ...app, Package: "unit.other" }],
        },
      },
      {
        ...key,
        Restrictions: { ...key.Restrictions, AllowReferers: ["https://unit"] },
      },
    ])
      expect(() => assertMapsKey(config, resource, invalid, now)).toThrow();
  });
  it("rejects two tokens for the same authenticated subject before workflow writes", () => {
    const first = { userId: randomUUID(), droplets: 0, ledger: [] };
    const second = { ...first, userId: randomUUID() };
    expect(() => assertDistinctDemoAccounts([first, second])).not.toThrow();
    for (const invalid of [
      [first, first],
      [first, { ...second, droplets: 2 }],
      [first, { ...second, ledger: [{ points: 0 }] }],
      [first, { ...second, userId: "malformed" }],
    ])
      expect(() => assertDistinctDemoAccounts(invalid)).toThrow(
        "two distinct authenticated",
      );
  });
  it("requires every server live value and does not infer region/model/queue", () => {
    expect(() => readServerConfig({})).toThrow("AWS_REGION");
    expect(() => readServerConfig({ AWS_REGION: "ap-south-1" })).toThrow(
      "BEDROCK_MODEL_ID",
    );
    expect(() => readServerConfig({ AWS_REGION: "ap-south-1" })).toThrow(
      "MEDIA_QUEUE_ARN",
    );
  });
  it("keeps explicit LOCAL/DEMO defaults but blocks missing/copy-pasted AWS configuration", () => {
    expect(readMobileConfig({}).mode).toBe("local-demo");
    expect(() =>
      readMobileConfig({
        EXPO_PUBLIC_PROVIDER_MODE: "aws",
        EXPO_PUBLIC_API_BASE_URL: "http://10.0.2.2:8787",
      }),
    ).toThrow("EXPO_PUBLIC_API_BASE_URL");
    expect(() =>
      readMobileConfig({ EXPO_PUBLIC_PROVIDER_MODE: "aws" }),
    ).toThrow("EXPO_PUBLIC_COGNITO_POOL_ID");
    expect(() =>
      readMobileConfig({ EXPO_PUBLIC_PROVIDER_MODE: "unexpected" }),
    ).toThrow("Invalid provider");
  });
  it("requires private bounded regular JSON files instead of symlinks or public files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "jalnet-guard-"));
    try {
      const path = join(dir, "unit.json");
      await writeFile(path, "{}", { mode: 0o600 });
      expect(await privateJson(path)).toEqual({});
      await symlink(path, join(dir, "link.json"));
      await expect(privateJson(join(dir, "link.json"))).rejects.toThrow(
        "no symlinks",
      );
      await expect(privateJson(path, 1)).rejects.toThrow("bounded");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
  it("checks approved capture directory/hash/freshness before any upload", async () => {
    const dir = await mkdtemp(join(tmpdir(), "jalnet-capture-"));
    try {
      const bytes = encode(
        { data: Buffer.alloc(8 * 8 * 4, 120), width: 8, height: 8 },
        90,
      ).data;
      const path = join(dir, "unit.jpg"),
        now = Date.now();
      await writeFile(path, bytes);
      const image = {
        path,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        capturedAt: new Date(now).toISOString(),
        location: { lat: 0, lon: 0 },
      };
      expect(await controlledCapture(dir, image, now)).toEqual(bytes);
      await expect(
        controlledCapture(dir, { ...image, sha256: "0".repeat(64) }, now),
      ).rejects.toThrow("hash");
      await expect(
        controlledCapture(dir, image, now + 86_400_001),
      ).rejects.toThrow("fresh");
      await symlink(path, join(dir, "link.jpg"));
      await expect(
        controlledCapture(dir, { ...image, path: join(dir, "link.jpg") }, now),
      ).rejects.toThrow("regular");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
describe("LOCAL trusted-authorizer boundary (no JWT cryptography simulated)", () => {
  const event = (claims?: Record<string, string>) =>
    ({
      rawPath: "/v1/me",
      requestContext: {
        requestId: "unit",
        http: { method: "GET" },
        ...(claims ? { authorizer: { jwt: { claims } } } : {}),
      },
      headers: {
        authorization: "Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJkZW1vIn0.",
      },
    }) as unknown as APIGatewayProxyEventV2WithJWTAuthorizer;
  it("rejects a JWT-shaped bearer without trusted gateway context with 401", async () => {
    const result = await makeHandler(["/v1"])(event());
    expect(result.statusCode).toBe(401);
    expect(result.body).toContain("AUTH_REQUIRED");
    expect(result.body).not.toContain("eyJ");
  });
  it("rejects wrong issuer/client, ID tokens and invalid subjects", () => {
    vi.stubEnv("COGNITO_ISSUER", "https://unit-issuer");
    vi.stubEnv("COGNITO_CLIENT_ID", "unit-client");
    const claims = {
      sub: randomUUID(),
      iss: "https://unit-issuer",
      client_id: "unit-client",
      token_use: "access",
    };
    for (const change of [
      { iss: "wrong" },
      { client_id: "wrong" },
      { token_use: "id" },
      { sub: "demo" },
    ])
      expect(() => authorizerSubject(event({ ...claims, ...change }))).toThrow(
        "Sign in",
      );
    expect(authorizerSubject(event(claims))).toBe(claims.sub);
  });
});
describe("LOCAL mobile failure transport", () => {
  it("classifies native offline errors without exposing dependency details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("private-provider-diagnostic")),
    );
    await expect(
      jsonRequest("http://127.0.0.1", "/v1/me", "unit-bearer"),
    ).rejects.toBeInstanceOf(NetworkError);
    await expect(
      jsonRequest("http://127.0.0.1", "/v1/me", "unit-bearer"),
    ).rejects.not.toThrow("private-provider");
  });
  it("returns a useful sign-in error for a gateway non-JSON 401 without masking it as offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 })),
    );
    await expect(
      jsonRequest("http://127.0.0.1", "/v1/me", "unit-bearer"),
    ).rejects.toBeInstanceOf(HttpError);
    await expect(
      jsonRequest("http://127.0.0.1", "/v1/me", "unit-bearer"),
    ).rejects.toThrow("Sign in again");
  });
});

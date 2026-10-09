import { createHash } from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { decode } from "jpeg-js";
import { z } from "zod";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { readServerConfig } from "../packages/contracts/src/config.js";
import { reportSchema } from "../packages/contracts/src/index.js";
import { cloudApplication } from "../services/aws/runtime.js";
import {
  awsJson,
  assertIdentity,
  assertMapsKey,
  cleanAwsEnvironment,
  type CutoverConfig,
  type CutoverOutputs,
  deployedOutputs,
  guardLiveIdentity,
  liveArguments,
  privateJson,
  readCutoverConfig,
} from "./aws-safety.js";

const point = z.strictObject({
  lat: z.number().min(-85).max(85),
  lon: z.number().min(-180).max(180),
});
const capture = z.strictObject({
  path: z.string(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  capturedAt: z.iso.datetime(),
  location: point,
});
export const smokeManifestSchema = z.strictObject({
  runId: z.uuid(),
  captureDirectory: z.string(),
  captures: z.array(capture).min(1).max(2),
  tokenFiles: z.array(z.string()).length(2).optional(),
  observations: z
    .array(
      z.strictObject({
        category: z.enum([
          "WATERLOGGING",
          "FLOOD",
          "LEAK",
          "DRAIN_BLOCKAGE",
          "DRAIN_OVERFLOW",
        ]),
        severity: z.number().int().min(1).max(4),
        location: point,
        stillActive: z.literal(true),
        publicRoad: z.literal(true),
      }),
    )
    .length(2)
    .optional(),
  route: z.strictObject({ origin: point, destination: point }),
});
export function assertDistinctDemoAccounts(profiles: unknown[]) {
  const parsed = z
    .array(
      z.object({
        userId: z.uuid(),
        droplets: z.literal(0),
        ledger: z.array(z.unknown()).length(0),
      }),
    )
    .length(2)
    .safeParse(profiles);
  if (!parsed.success || parsed.data[0]?.userId === parsed.data[1]?.userId)
    throw new Error(
      "Use two distinct authenticated demo accounts with empty ledger/balances",
    );
}
export async function controlledCapture(
  directory: string,
  image: z.infer<typeof capture>,
  now = Date.now(),
) {
  if (!isAbsolute(directory) || !isAbsolute(image.path))
    throw new Error("Capture paths must be absolute");
  const folder = await realpath(directory),
    actual = await realpath(image.path);
  const child = relative(folder, actual),
    stat = await lstat(image.path);
  if (
    !child ||
    child.startsWith("..") ||
    isAbsolute(child) ||
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.size < 4 ||
    stat.size > 3_750_000 ||
    !image.path.endsWith(".jpg")
  )
    throw new Error(
      "Capture must be a bounded regular .jpg inside the approved directory",
    );
  const age = now - Date.parse(image.capturedAt);
  if (age < -300_000 || age > 86_400_000)
    throw new Error(
      "Capture must be fresh within the past day (five minutes maximum future skew)",
    );
  const bytes = await readFile(image.path);
  if (
    bytes.length !== stat.size ||
    createHash("sha256").update(bytes).digest("hex") !== image.sha256
  )
    throw new Error("Capture hash/length mismatch; contents withheld");
  if (
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8 ||
    bytes.at(-2) !== 0xff ||
    bytes.at(-1) !== 0xd9
  )
    throw new Error("Capture is not a complete JPEG");
  decode(bytes, {
    useTArray: true,
    maxResolutionInMP: 4,
    maxMemoryUsageInMB: 64,
  });
  if (bytes.includes(Buffer.from("Exif\0\0")))
    throw new Error("Use an EXIF-stripped capture from the native pipeline");
  return bytes;
}
const object = (value: unknown) =>
  z.record(z.string(), z.unknown()).parse(value);
const assert: (condition: unknown, message: string) => asserts condition = (
  condition,
  message,
) => {
  if (!condition) throw new Error(message);
};
const log = (message: string) => process.stdout.write(`${message}\n`);
async function request(url: string, token?: string, body?: unknown) {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  return {
    status: response.status,
    data: (await response.json().catch(() => null)) as unknown,
  };
}
async function api(
  outputs: CutoverOutputs,
  path: string,
  token: string,
  body?: unknown,
) {
  const result = await request(`${outputs.ApiUrl}${path}`, token, body);
  assert(
    result.status === 200,
    "Live application request failed; private diagnostics withheld",
  );
  return result.data;
}
async function dependencies(config: CutoverConfig, outputs: CutoverOutputs) {
  const failed: string[] = [];
  const probe = async (name: string, run: () => Promise<void>) => {
    try {
      await run();
      log(`Read-only dependency probe succeeded: ${name}; workflow pending`);
    } catch {
      failed.push(name);
      log(`Dependency probe failed: ${name}; diagnostics withheld`);
    }
  };
  for (const table of [
    outputs.REPORTS_TABLE,
    outputs.EVENTS_TABLE,
    outputs.USERS_TABLE,
    outputs.DROPLET_LEDGER_TABLE,
  ])
    await probe("DynamoDB metadata", async () => {
      const data = object(
        object(
          await awsJson(config, [
            "dynamodb",
            "describe-table",
            "--table-name",
            table,
          ]),
        ).Table,
      );
      assert(
        data.TableArn ===
          `arn:aws:dynamodb:${config.region}:${config.expectedAccountId}:table/${table}` &&
          data.TableStatus === "ACTIVE",
        "Table account/state mismatch",
      );
      if ([outputs.EVENTS_TABLE, outputs.DROPLET_LEDGER_TABLE].includes(table))
        assert(
          z
            .array(z.object({ IndexName: z.string(), IndexStatus: z.string() }))
            .parse(data.GlobalSecondaryIndexes)
            .some(
              (g) =>
                g.IndexName ===
                  (table === outputs.EVENTS_TABLE ? "ByH3" : "ByUser") &&
                g.IndexStatus === "ACTIVE",
            ),
          "Required index unavailable",
        );
    });
  await probe("private regional S3 bucket", async () => {
    const args = [
      "--bucket",
      outputs.EVIDENCE_BUCKET,
      "--expected-bucket-owner",
      config.expectedAccountId,
    ];
    assert(
      object(await awsJson(config, ["s3api", "get-bucket-location", ...args]))
        .LocationConstraint === config.region,
      "Bucket region mismatch",
    );
    const block = object(
      object(
        await awsJson(config, ["s3api", "get-public-access-block", ...args]),
      ).PublicAccessBlockConfiguration,
    );
    assert(
      [
        "BlockPublicAcls",
        "IgnorePublicAcls",
        "BlockPublicPolicy",
        "RestrictPublicBuckets",
      ].every((key) => block[key] === true),
      "Bucket not private",
    );
    assert(
      object(await awsJson(config, ["s3api", "get-bucket-encryption", ...args]))
        .ServerSideEncryptionConfiguration,
      "Bucket encryption missing",
    );
  });
  await probe("Cognito + Gateway JWT configuration", async () => {
    const pool = object(
      object(
        await awsJson(config, [
          "cognito-idp",
          "describe-user-pool",
          "--user-pool-id",
          outputs.UserPoolId,
        ]),
      ).UserPool,
    );
    assert(
      pool.Arn ===
        `arn:aws:cognito-idp:${config.region}:${config.expectedAccountId}:userpool/${outputs.UserPoolId}`,
      "Pool ownership mismatch",
    );
    const client = object(
      object(
        await awsJson(config, [
          "cognito-idp",
          "describe-user-pool-client",
          "--user-pool-id",
          outputs.UserPoolId,
          "--client-id",
          outputs.UserPoolClientId,
        ]),
      ).UserPoolClient,
    );
    assert(
      !client.ClientSecret &&
        z.array(z.string()).parse(client.AllowedOAuthFlows).includes("code") &&
        z
          .array(z.string())
          .parse(client.CallbackURLs)
          .includes("jalnet://auth"),
      "Public PKCE client mismatch",
    );
    const auth = object(
      await awsJson(config, [
        "apigatewayv2",
        "get-authorizers",
        "--api-id",
        outputs.ApiId,
      ]),
    );
    assert(
      z
        .array(
          z.object({
            AuthorizerType: z.string(),
            JwtConfiguration: z.object({
              Audience: z.array(z.string()),
              Issuer: z.string(),
            }),
          }),
        )
        .parse(auth.Items)
        .some(
          (a) =>
            a.AuthorizerType === "JWT" &&
            a.JwtConfiguration.Issuer === outputs.COGNITO_ISSUER &&
            a.JwtConfiguration.Audience.includes(outputs.UserPoolClientId),
        ),
      "JWT issuer/audience mismatch",
    );
    const routes = object(
      await awsJson(config, [
        "apigatewayv2",
        "get-routes",
        "--api-id",
        outputs.ApiId,
      ]),
    );
    assert(
      z
        .array(
          z.object({ RouteKey: z.string(), AuthorizationType: z.string() }),
        )
        .parse(routes.Items)
        .every(
          (route) =>
            route.AuthorizationType ===
            (route.RouteKey === "GET /health" ? "NONE" : "JWT"),
        ),
      "Unprotected application route",
    );
    assert(
      (await request(`${outputs.ApiUrl}/health`)).status === 200,
      "Health unavailable",
    );
  });
  await probe("SQS/DLQ + enabled bounded worker", async () => {
    for (const [url, arn] of [
      [outputs.MEDIA_QUEUE_URL, outputs.MEDIA_QUEUE_ARN],
      [outputs.AnalysisDLQUrl, outputs.AnalysisDLQArn],
    ]) {
      const attr = object(
        object(
          await awsJson(config, [
            "sqs",
            "get-queue-attributes",
            "--queue-url",
            url as string,
            "--attribute-names",
            "All",
          ]),
        ).Attributes,
      );
      assert(
        attr.QueueArn === arn && attr.SqsManagedSseEnabled === "true",
        "Queue identity/encryption mismatch",
      );
      if (url === outputs.MEDIA_QUEUE_URL) {
        const redrive = object(
          JSON.parse(z.string().parse(attr.RedrivePolicy)),
        );
        assert(
          attr.VisibilityTimeout === "360" &&
            redrive.deadLetterTargetArn === outputs.AnalysisDLQArn &&
            Number(redrive.maxReceiveCount) === 3,
          "Queue retry policy mismatch",
        );
      }
    }
    const sources = object(
      await awsJson(config, [
        "lambda",
        "list-event-source-mappings",
        "--function-name",
        outputs.AnalysisWorkerName,
        "--event-source-arn",
        outputs.MEDIA_QUEUE_ARN,
      ]),
    );
    assert(
      z
        .array(
          z.object({
            State: z.string(),
            BatchSize: z.number(),
            FunctionResponseTypes: z.array(z.string()).optional(),
          }),
        )
        .parse(sources.EventSourceMappings)
        .some(
          (s) =>
            s.State === "Enabled" &&
            s.BatchSize === 1 &&
            s.FunctionResponseTypes?.includes("ReportBatchItemFailures"),
        ),
      "Worker source unavailable",
    );
    const worker = object(
      await awsJson(config, [
        "lambda",
        "get-function-configuration",
        "--function-name",
        outputs.AnalysisWorkerName,
      ]),
    );
    assert(
      worker.Timeout === 60 && worker.Runtime === "nodejs24.x",
      "Worker limits/runtime mismatch",
    );
    assert(
      object(
        await awsJson(config, [
          "lambda",
          "get-function-concurrency",
          "--function-name",
          outputs.AnalysisWorkerName,
        ]),
      ).ReservedConcurrentExecutions === 2,
      "Unbounded worker concurrency",
    );
  });
  await probe("expiring restricted Maps V2 key metadata", async () => {
    assertMapsKey(
      config,
      outputs.LocationMapsResourceArn,
      await awsJson(config, [
        "location",
        "describe-key",
        "--key-name",
        config.mapKeyName,
      ]),
    );
  });
  await probe("Maps V2 IAM-authenticated style descriptor", async () => {
    await mkdir(resolve(".cutover"), { recursive: true, mode: 0o700 });
    const directory = await mkdtemp(resolve(".cutover/maps-"));
    const path = resolve(directory, "style.json");
    await awsJson(config, [
      "geo-maps",
      "get-style-descriptor",
      "--style",
      "Monochrome",
      "--color-scheme",
      "Light",
      path,
    ]);
    await chmod(path, 0o600);
    z.object({
      version: z.literal(8),
      sources: z.record(z.string(), z.unknown()),
      layers: z.array(z.unknown()).min(1),
    }).parse(await privateJson(path, 2_000_000));
  });
  if (failed.length)
    throw new Error(
      `Dependency probes failed: ${failed.join(", ")}; no test writes performed`,
    );
}
async function main() {
  const args = liveArguments(process.argv.slice(2), [
      "--profile",
      "--config",
      "--stage",
      "--manifest",
    ]),
    stage = args["--stage"];
  assert(
    ["dependencies", "providers", "workflow"].includes(stage ?? ""),
    "Explicit --stage dependencies|providers|workflow is required",
  );
  const config = await readCutoverConfig(args["--config"] as string);
  // Validate controlled inputs before AWS access. No default account, pin, token,
  // image or model; no fake JPEG fixtures may substitute for live evidence.
  const manifest =
    stage === "dependencies"
      ? undefined
      : smokeManifestSchema.parse(await privateJson(args["--manifest"] ?? ""));
  const images: Buffer[] = [];
  if (manifest)
    for (const image of manifest.captures)
      images.push(await controlledCapture(manifest.captureDirectory, image));
  if (stage === "workflow")
    assert(
      manifest?.captures.length === 2 &&
        manifest.tokenFiles &&
        manifest.observations &&
        manifest.captures[0]?.sha256 !== manifest.captures[1]?.sha256,
      "Workflow requires two distinct actual captures/observations, private tokens and a real road corridor",
    );
  const tokens = manifest?.tokenFiles
    ? await Promise.all(
        manifest.tokenFiles.map(
          async (path) =>
            z
              .strictObject({ accessToken: z.string().min(20).max(16_000) })
              .parse(await privateJson(path, 20_000)).accessToken,
        ),
      )
    : [];
  if (stage === "workflow")
    assert(
      tokens.length === 2 && tokens[0] !== tokens[1],
      "Two distinct authenticated demo accounts are required",
    );
  await guardLiveIdentity(config);
  Object.assign(process.env, cleanAwsEnvironment(config));
  assertIdentity(
    config,
    await new STSClient({
      profile: "jalnet",
      region: config.region,
      maxAttempts: 1,
    }).send(new GetCallerIdentityCommand({}), {
      abortSignal: AbortSignal.timeout(10_000),
    }),
  );
  const outputs = await deployedOutputs(config);
  Object.assign(
    process.env,
    readServerConfig({ ...outputs, AWS_REGION: config.region }),
  );
  await dependencies(config, outputs);
  if (stage === "dependencies") {
    log(
      "Read-only checks ended; model, route, native maps and workflow pending.",
    );
    return;
  }
  assert(manifest && images[0], "Controlled capture required");
  await mkdir(resolve(".cutover"), { recursive: true, mode: 0o700 });
  const receipt = resolve(`.cutover/smoke-${manifest.runId}.json`);
  await writeFile(
    receipt,
    JSON.stringify({
      runId: manifest.runId,
      stage,
      status: "STARTED",
      startedAt: new Date().toISOString(),
    }),
    { mode: 0o600, flag: "wx" },
  );
  const app = cloudApplication("jalnet");
  await app.analysis.assess(images[0]);
  log(
    "Independent Nova image assessment returned schema-valid data; queued workflow pending.",
  );
  await app.routeProvider.calculate(
    manifest.route.origin,
    manifest.route.destination,
    "Car",
  );
  log("Independent Location route returned validated road geometry.");
  if (stage === "providers") {
    const image = manifest.captures[0],
      user = `cutover-${manifest.runId}`;
    const draft = await app.createReport(user, {
      action: "DRAFT",
      capturedAt: image?.capturedAt,
      location: { ...image?.location, source: "USER_PIN" },
    });
    assert(
      (await app.ownedReport(user, draft.id)).id === draft.id,
      "DynamoDB round-trip failed",
    );
    const grant = await app.presign(user, {
      reportId: draft.id,
      contentType: "image/jpeg",
      contentLength: images[0].length,
    });
    assert(
      (
        await fetch(grant.url, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: new Uint8Array(images[0]),
          redirect: "error",
          signal: AbortSignal.timeout(20_000),
        })
      ).ok,
      "Private S3 PUT failed",
    );
    assert(
      createHash("sha256")
        .update(
          await app.evidence.read(
            (await app.ownedReport(user, draft.id)).media[0]?.s3Key as string,
          ),
        )
        .digest("hex") === image?.sha256,
      "Private S3 hash mismatch",
    );
    // Keep UPLOADING rather than strand an unqueued ANALYZING report.
    await writeFile(
      receipt,
      JSON.stringify({
        runId: manifest.runId,
        stage,
        status: "PROVIDER_CHECKS_ENDED",
        reportIds: [draft.id],
      }),
      { mode: 0o600 },
    );
    log(
      "DynamoDB/private S3 provider checks ended. No event, queue job or reward created; native maps/workflow pending.",
    );
    return;
  }
  for (const token of [undefined, "eyJhbGciOiJub25lIn0.eyJzdWIiOiJkZW1vIn0."])
    assert(
      (await request(`${outputs.ApiUrl}/v1/me`, token)).status === 401,
      "Gateway accepted missing/unsigned JWT-shaped bearer",
    );
  const profiles: unknown[] = [];
  for (const token of tokens) {
    const profile = object(await api(outputs, "/v1/me", token));
    profiles.push(profile);
    assert(
      profile.droplets === 0 &&
        z.array(z.unknown()).parse(profile.ledger).length === 0 &&
        z.array(z.unknown()).parse(await api(outputs, "/v1/routes", token))
          .length === 0,
      "Use fresh dedicated demo accounts with empty ledger/routes",
    );
  }
  assertDistinctDemoAccounts(profiles);
  const savedRoute = object(
    object(
      await api(outputs, "/v1/routes", tokens[0] as string, {
        name: `Cutover ${manifest.runId}`,
        ...manifest.route,
        travelMode: "Car",
        activeAlerts: true,
      }),
    ).route,
  );
  const ids: string[] = [];
  let eventId = "";
  for (let i = 0; i < 2; i++) {
    const image = manifest.captures[i],
      token = tokens[i] as string;
    const created = reportSchema.parse(
      await api(outputs, "/v1/reports", token, {
        action: "DRAFT",
        capturedAt: image?.capturedAt,
        location: { ...image?.location, source: "USER_PIN" },
      }),
    );
    ids.push(created.id);
    assert(
      (
        await request(
          `${outputs.ApiUrl}/v1/reports/${created.id}`,
          tokens[1 - i],
        )
      ).status === 403,
      "Cross-account report access accepted",
    );
    const grant = z.object({ url: z.url(), expiresIn: z.literal(300) }).parse(
      await api(outputs, "/v1/uploads/presign", token, {
        reportId: created.id,
        contentType: "image/jpeg",
        contentLength: images[i]?.length,
      }),
    );
    assert(
      (
        await fetch(grant.url, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: new Uint8Array(images[i] as Buffer),
          redirect: "error",
          signal: AbortSignal.timeout(20_000),
        })
      ).ok,
      "API-presigned upload failed",
    );
    await api(outputs, "/v1/reports", token, {
      action: "UPLOAD_COMPLETE",
      reportId: created.id,
    });
    let ready = false;
    for (let poll = 0; poll < 30; poll++) {
      const report = reportSchema.parse(
        await api(outputs, `/v1/reports/${created.id}`, token),
      );
      if (report.status === "NEEDS_CONFIRMATION") {
        assert(
          report.aiAssessment && report.analysisProvenance === "AWS_UNVERIFIED",
          "Manual fallback cannot pass live model workflow",
        );
        ready = true;
        break;
      }
      await new Promise((finish) => setTimeout(finish, 2_000));
    }
    assert(ready, "Worker exceeded bounded polling window");
    const confirmation = object(
      await api(
        outputs,
        `/v1/reports/${created.id}/confirm`,
        token,
        manifest.observations?.[i],
      ),
    );
    const id = z.uuid().parse(confirmation.eventId);
    assert(
      i === 0 || id === eventId,
      "Actual evidence did not fuse; do not fabricate/move data to force a pass",
    );
    eventId = id;
    const replay = object(
      await api(
        outputs,
        `/v1/reports/${created.id}/confirm`,
        token,
        manifest.observations?.[i],
      ),
    );
    assert(
      replay.replay === true && replay.eventId === id,
      "Confirmation replay not idempotent",
    );
  }
  const observation = manifest.observations?.[0]?.location as z.infer<
    typeof point
  >;
  const bbox = [
    observation.lon - 0.01,
    observation.lat - 0.01,
    observation.lon + 0.01,
    observation.lat + 0.01,
  ];
  const events = z
    .array(z.record(z.string(), z.unknown()))
    .parse(
      await api(
        outputs,
        `/v1/events?bbox=${bbox.join(",")}&layers=LIVE`,
        tokens[0] as string,
      ),
    );
  assert(
    events.some(
      (event) =>
        event.id === eventId &&
        event.status === "ACTIVE" &&
        event.reportCount === 2,
    ) &&
      !JSON.stringify(events).includes("supporterIds") &&
      !JSON.stringify(events).includes("mediaHashes") &&
      !JSON.stringify(events).includes("s3Key"),
    "Event/fusion/privacy assertion failed",
  );
  const risk = object(
    await api(outputs, `/v1/routes/${savedRoute.id}/risk`, tokens[0] as string),
  );
  assert(
    z
      .array(z.object({ eventId: z.string(), warning: z.boolean() }))
      .parse(risk.risks)
      .some((entry) => entry.eventId === eventId && entry.warning),
    "Actual route did not warn for the actual intersecting incident",
  );
  let ledgerReady = false;
  for (let poll = 0; poll < 10; poll++) {
    const first = object(await api(outputs, "/v1/me", tokens[0] as string)),
      second = object(await api(outputs, "/v1/me", tokens[1] as string));
    if (first.droplets === 10 && second.droplets === 7) {
      ledgerReady = true;
      break;
    }
    await new Promise((finish) => setTimeout(finish, 2_000));
  }
  assert(
    ledgerReady,
    "Ledger balances did not reach exact 10/7 within bounded GSI polling",
  );
  await writeFile(
    receipt,
    JSON.stringify({
      runId: manifest.runId,
      stage,
      status: "WORKFLOW_CHECKS_ENDED",
      reportIds: ids,
      eventId,
      routeId: savedRoute.id,
      endedAt: new Date().toISOString(),
    }),
    { mode: 0o600 },
  );
  log(
    "Bounded deployed workflow checks ended. Native maps, PKCE and physical capture remain separate gates. No automatic VERIFIED status or demo recording.",
  );
}
if (process.argv[1]?.endsWith("smoke-aws.ts")) {
  const deadline = setTimeout(() => {
    process.stderr.write(
      "Smoke budget exhausted; inspect private partial data. No deletion attempted.\n",
    );
    process.exit(2);
  }, 600_000);
  main()
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "";
      process.stderr.write(
        message.startsWith("BLOCKED_AWAITING_SSO") ||
          message.startsWith("Explicit --") ||
          message.startsWith("STOP:")
          ? `${message}\n`
          : "Live smoke stopped; inspect failed stage privately. Secrets and raw diagnostics withheld; no cleanup attempted.\n",
      );
      process.exitCode = 2;
    })
    .finally(() => clearTimeout(deadline));
}

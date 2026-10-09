import { execFile } from "node:child_process";
import { lstat, readFile } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { promisify } from "node:util";
import { z } from "zod";

const exec = promisify(execFile);
export const cutoverConfigSchema = z
  .strictObject({
    expectedAccountId: z.string().regex(/^\d{12}$/),
    expectedRoleArn: z
      .string()
      .regex(/^arn:aws:iam::\d{12}:role\/[A-Za-z0-9_+=,.@/-]+$/),
    region: z.literal("ap-south-1"),
    stackName: z.literal("JalNetDev"),
    bedrockModelId: z
      .string()
      .min(1)
      .max(2048)
      .regex(/^[A-Za-z0-9._:/-]+$/),
    bedrockInvokeArns: z
      .array(
        z
          .string()
          .regex(
            /^arn:aws:bedrock:[a-z0-9-]+:\d{0,12}:(foundation-model|inference-profile|application-inference-profile)\/[A-Za-z0-9._:/-]+$/,
          ),
      )
      .min(1)
      .max(20),
    bootstrapExecutionPolicyArn: z
      .string()
      .regex(/^arn:aws:iam::\d{12}:policy\/[A-Za-z0-9_+=,.@/-]+$/)
      .optional(),
    mapKeyName: z.string().regex(/^[A-Za-z0-9._-]{1,100}$/),
    androidCertificateSha1: z
      .string()
      .regex(/^([A-Fa-f0-9]{2}:){19}[A-Fa-f0-9]{2}$/),
  })
  .superRefine((config, ctx) => {
    if (
      !config.bedrockInvokeArns.some((arn) =>
        config.bedrockModelId.startsWith("arn:")
          ? arn === config.bedrockModelId
          : arn.endsWith(`/${config.bedrockModelId}`),
      )
    )
      ctx.addIssue({
        code: "custom",
        path: ["bedrockInvokeArns"],
        message:
          "Selected model/profile must be included in the exact invocation allowlist",
      });
    if (
      !config.expectedRoleArn.startsWith(
        `arn:aws:iam::${config.expectedAccountId}:role/`,
      )
    )
      ctx.addIssue({
        code: "custom",
        path: ["expectedRoleArn"],
        message: "Role account mismatch",
      });
    for (const arn of config.bedrockInvokeArns) {
      const account = arn.split(":")[4];
      const resource = arn.split(":").slice(5).join(":");
      if (
        (resource.startsWith("foundation-model/") && account !== "") ||
        (!resource.startsWith("foundation-model/") &&
          account !== config.expectedAccountId)
      )
        ctx.addIssue({
          code: "custom",
          path: ["bedrockInvokeArns"],
          message: "Invalid foundation-model or account-owned profile ARN",
        });
      if (account && account !== config.expectedAccountId)
        ctx.addIssue({
          code: "custom",
          path: ["bedrockInvokeArns"],
          message: "Model/profile account mismatch",
        });
    }
    if (
      config.bootstrapExecutionPolicyArn &&
      !config.bootstrapExecutionPolicyArn.startsWith(
        `arn:aws:iam::${config.expectedAccountId}:policy/`,
      )
    )
      ctx.addIssue({
        code: "custom",
        path: ["bootstrapExecutionPolicyArn"],
        message: "Execution policy account mismatch",
      });
  });
export type CutoverConfig = z.infer<typeof cutoverConfigSchema>;

export function liveArguments(argv: string[], allowed: readonly string[]) {
  if (!argv.includes("--live"))
    throw new Error(
      "BLOCKED_AWAITING_SSO: explicit --live is required; no AWS calls made",
    );
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--live") continue;
    if (!flag || !allowed.includes(flag) || args[flag] !== undefined)
      throw new Error("Unknown or repeated live command argument");
    const next = argv[++i];
    if (!next || next.startsWith("--"))
      throw new Error(`Missing value for ${flag}`);
    args[flag] = next;
  }
  if (args["--profile"] !== "jalnet")
    throw new Error("Explicit --profile jalnet is required");
  if (!args["--config"])
    throw new Error(
      "A private --config file with the expected account and role is required",
    );
  return args;
}

export async function privateJson(
  path: string,
  maxBytes = 64_000,
): Promise<unknown> {
  if (!isAbsolute(path))
    throw new Error("Private input must use an absolute path");
  const file = await lstat(path);
  if (
    !file.isFile() ||
    file.isSymbolicLink() ||
    file.size > maxBytes ||
    (file.mode & 0o077) !== 0
  )
    throw new Error(
      "Private input must be a bounded regular file with mode 600 (no symlinks)",
    );
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    throw new Error("Private input must be valid JSON; contents withheld");
  }
}
export async function readCutoverConfig(path: string) {
  const parsed = cutoverConfigSchema.safeParse(await privateJson(path));
  if (!parsed.success)
    throw new Error(
      `Invalid cutover configuration fields: ${[...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))].join(", ")}; values withheld`,
    );
  return parsed.data;
}

export function cleanAwsEnvironment(
  config: CutoverConfig,
  env: Record<string, string | undefined> = process.env,
) {
  const prohibited = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_SESSION_TOKEN",
    "AWS_SECURITY_TOKEN",
    "AWS_WEB_IDENTITY_TOKEN_FILE",
    "AWS_ROLE_ARN",
    "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI",
    "AWS_CONTAINER_CREDENTIALS_FULL_URI",
  ];
  if (
    prohibited.some((key) => env[key]) ||
    Object.keys(env).some(
      (key) => key.startsWith("AWS_ENDPOINT_URL") && env[key],
    )
  )
    throw new Error(
      "Live cutover requires the local SSO profile without credential or endpoint overrides; values withheld",
    );
  if (
    (env.AWS_PROFILE && env.AWS_PROFILE !== "jalnet") ||
    (env.AWS_REGION && env.AWS_REGION !== config.region) ||
    (env.AWS_DEFAULT_REGION && env.AWS_DEFAULT_REGION !== config.region) ||
    (env.CDK_DEFAULT_ACCOUNT &&
      env.CDK_DEFAULT_ACCOUNT !== config.expectedAccountId)
  )
    throw new Error("Conflicting AWS profile, region or account environment");
  return {
    ...env,
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .parse(env.NODE_ENV ?? "development"),
    AWS_PROFILE: "jalnet",
    AWS_REGION: config.region,
    AWS_DEFAULT_REGION: config.region,
    AWS_EC2_METADATA_DISABLED: "true",
    AWS_IGNORE_CONFIGURED_ENDPOINT_URLS: "true",
    AWS_PAGER: "",
    AWS_CLI_AUTO_PROMPT: "off",
  };
}

export async function awsJson(
  config: CutoverConfig,
  args: string[],
): Promise<unknown> {
  try {
    const { stdout } = await exec(
      "aws",
      [
        ...args,
        "--profile",
        "jalnet",
        "--region",
        config.region,
        "--output",
        "json",
        "--no-cli-pager",
        "--cli-connect-timeout",
        "5",
        "--cli-read-timeout",
        "15",
      ],
      {
        env: cleanAwsEnvironment(config),
        timeout: 30_000,
        maxBuffer: 1_000_000,
      },
    );
    return JSON.parse(stdout);
  } catch {
    throw new Error(
      `AWS ${args[0]} ${args[1]} failed; stop and inspect privately (diagnostics withheld)`,
    );
  }
}
export function assertIdentity(config: CutoverConfig, identity: unknown) {
  const parsed = z
    .object({ Account: z.string(), Arn: z.string() })
    .safeParse(identity);
  const role = config.expectedRoleArn.split("/").at(-1);
  if (
    !parsed.success ||
    parsed.data.Account !== config.expectedAccountId ||
    !parsed.data.Arn.startsWith(
      `arn:aws:sts::${config.expectedAccountId}:assumed-role/${role}/`,
    )
  )
    throw new Error(
      "STOP: AWS account/role does not match the privately approved hackathon target",
    );
}
export async function guardLiveIdentity(config: CutoverConfig) {
  cleanAwsEnvironment(config);
  let sso = false;
  for (const field of ["sso_session", "sso_start_url"]) {
    try {
      const { stdout } = await exec(
        "aws",
        ["configure", "get", field, "--profile", "jalnet"],
        { env: cleanAwsEnvironment(config), timeout: 5_000, maxBuffer: 8_000 },
      );
      if (stdout.trim()) {
        sso = true;
        break;
      }
    } catch {
      /* Missing field is allowed; both missing blocks live use. */
    }
  }
  if (!sso)
    throw new Error(
      "BLOCKED_AWAITING_SSO: jalnet must be an actual local AWS SSO profile and AWS CLI must be installed",
    );
  assertIdentity(config, await awsJson(config, ["sts", "get-caller-identity"]));
}

export const outputsSchema = z.object({
  ApiUrl: z.url(),
  ApiId: z.string().min(1),
  UserPoolId: z.string().min(1),
  UserPoolClientId: z.string().min(1),
  CognitoDomain: z.url(),
  REPORTS_TABLE: z.string().min(1),
  EVENTS_TABLE: z.string().min(1),
  USERS_TABLE: z.string().min(1),
  DROPLET_LEDGER_TABLE: z.string().min(1),
  EVIDENCE_BUCKET: z.string().min(1),
  MEDIA_QUEUE_URL: z.url(),
  MEDIA_QUEUE_ARN: z.string().min(1),
  BEDROCK_MODEL_ID: z.string().min(1),
  COGNITO_ISSUER: z.url(),
  COGNITO_CLIENT_ID: z.string().min(1),
  AnalysisWorkerName: z.string().min(1),
  AnalysisDLQUrl: z.url(),
  AnalysisDLQArn: z.string().min(1),
  LocationMapsResourceArn: z.string().min(1),
  LocationRoutesResourceArn: z.string().min(1),
});
export type CutoverOutputs = z.infer<typeof outputsSchema>;
export function assertMapsKey(
  config: CutoverConfig,
  mapsResourceArn: string,
  value: unknown,
  now = Date.now(),
) {
  const key = z
    .object({
      KeyArn: z.string(),
      NoExpiry: z.boolean().optional(),
      ExpireTime: z.string(),
      Restrictions: z.strictObject({
        AllowActions: z.array(z.string()),
        AllowResources: z.array(z.string()),
        AllowAndroidApps: z.array(
          z.strictObject({
            Package: z.string(),
            CertificateFingerprint: z.string(),
          }),
        ),
        AllowAppleApps: z.array(z.unknown()).optional(),
        AllowReferers: z.array(z.string()).optional(),
      }),
    })
    .safeParse(value);
  if (!key.success)
    throw new Error("Maps key metadata is invalid; values withheld");
  const expiry = Date.parse(key.data.ExpireTime);
  const restrictions = key.data.Restrictions;
  const app = restrictions.AllowAndroidApps[0];
  if (
    key.data.KeyArn !==
      `arn:aws:geo:${config.region}:${config.expectedAccountId}:api-key/${config.mapKeyName}` ||
    key.data.NoExpiry ||
    !Number.isFinite(expiry) ||
    expiry <= now ||
    expiry > now + 7 * 86_400_000 ||
    JSON.stringify(restrictions.AllowActions) !== '["geo-maps:*"]' ||
    JSON.stringify(restrictions.AllowResources) !==
      JSON.stringify([mapsResourceArn]) ||
    restrictions.AllowAndroidApps.length !== 1 ||
    app?.Package !== "org.jalnet.mobile" ||
    app.CertificateFingerprint.toLowerCase() !==
      config.androidCertificateSha1.toLowerCase() ||
    (restrictions.AllowAppleApps?.length ?? 0) > 0 ||
    (restrictions.AllowReferers?.length ?? 0) > 0
  )
    throw new Error(
      "Actual maps key restrictions/ownership/expiry do not match cutover requirements",
    );
}
export function normalizeStackOutputs(outputs: Record<string, unknown>) {
  // CDK/CloudFormation logical output IDs are alphanumeric, while runtime
  // environment names contain underscores. Resolve names, never invent values.
  return Object.fromEntries(
    Object.keys(outputsSchema.shape).map((key) => [
      key,
      outputs[key.replaceAll("_", "")],
    ]),
  );
}
export async function deployedOutputs(config: CutoverConfig) {
  const data = z
    .object({
      Stacks: z
        .array(
          z.object({
            StackId: z.string(),
            StackStatus: z.string(),
            Tags: z.array(z.object({ Key: z.string(), Value: z.string() })),
            Parameters: z.array(
              z.object({
                ParameterKey: z.string(),
                ParameterValue: z.string(),
              }),
            ),
            Outputs: z.array(
              z.object({ OutputKey: z.string(), OutputValue: z.string() }),
            ),
          }),
        )
        .length(1),
    })
    .parse(
      await awsJson(config, [
        "cloudformation",
        "describe-stacks",
        "--stack-name",
        config.stackName,
      ]),
    );
  const stack = data.Stacks[0];
  if (
    !stack?.StackId.startsWith(
      `arn:aws:cloudformation:${config.region}:${config.expectedAccountId}:stack/${config.stackName}/`,
    ) ||
    !["CREATE_COMPLETE", "UPDATE_COMPLETE"].includes(stack.StackStatus) ||
    !stack.Tags.some(
      (tag) => tag.Key === "Project" && tag.Value === "JalNet",
    ) ||
    !stack.Tags.some(
      (tag) => tag.Key === "Environment" && tag.Value === "p0-dev",
    )
  )
    throw new Error(
      "STOP: expected healthy tagged JalNet P0 development stack was not found",
    );
  const parameters = Object.fromEntries(
    stack.Parameters.map((p) => [p.ParameterKey, p.ParameterValue]),
  );
  if (
    parameters.BedrockModelId !== config.bedrockModelId ||
    parameters.BedrockInvokeArns !== config.bedrockInvokeArns.join(",")
  )
    throw new Error(
      "STOP: deployed model parameters differ from approved private configuration",
    );
  const outputs = outputsSchema.parse(
    normalizeStackOutputs(
      Object.fromEntries(
        stack.Outputs.map((out) => [out.OutputKey, out.OutputValue]),
      ),
    ),
  );
  if (
    outputs.ApiUrl !==
      `https://${outputs.ApiId}.execute-api.${config.region}.amazonaws.com` ||
    !outputs.MEDIA_QUEUE_ARN.startsWith(
      `arn:aws:sqs:${config.region}:${config.expectedAccountId}:`,
    ) ||
    !outputs.AnalysisDLQArn.startsWith(
      `arn:aws:sqs:${config.region}:${config.expectedAccountId}:`,
    )
  )
    throw new Error(
      "STOP: API or queue outputs do not belong to the approved target",
    );
  if (
    outputs.BEDROCK_MODEL_ID !== config.bedrockModelId ||
    outputs.LocationMapsResourceArn !==
      `arn:aws:geo-maps:${config.region}::provider/default` ||
    outputs.LocationRoutesResourceArn !==
      `arn:aws:geo-routes:${config.region}::provider/default`
  )
    throw new Error("STOP: model or Location output mismatch");
  return outputs;
}

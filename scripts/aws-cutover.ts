import { execFile, spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import {
  cleanAwsEnvironment,
  deployedOutputs,
  guardLiveIdentity,
  liveArguments,
  readCutoverConfig,
} from "./aws-safety.js";

async function main() {
  const args = liveArguments(process.argv.slice(2), [
    "--profile",
    "--config",
    "--action",
  ]);
  const action = args["--action"];
  if (
    !["check", "bootstrap", "synth", "diff", "deploy", "outputs"].includes(
      action ?? "",
    )
  )
    throw new Error(
      "Explicit --action check|bootstrap|synth|diff|deploy|outputs is required",
    );
  const config = await readCutoverConfig(args["--config"] as string);
  await guardLiveIdentity(config);
  process.stdout.write(
    "Approved hackathon account/role matched; identifiers withheld.\n",
  );
  if (action === "check") return;
  if (action === "outputs") {
    const outputs = await deployedOutputs(config);
    await mkdir(resolve(".cutover"), { recursive: true, mode: 0o700 });
    await writeFile(
      resolve(".cutover/outputs.json"),
      JSON.stringify(outputs, null, 2),
      { mode: 0o600 },
    );
    process.stdout.write(
      "Actual stack outputs saved privately to .cutover/outputs.json; service access remains unverified.\n",
    );
    return;
  }
  if (action === "bootstrap" && !config.bootstrapExecutionPolicyArn)
    throw new Error(
      "Bootstrap requires an explicitly approved account-owned CloudFormation execution policy ARN",
    );
  const cdkArgs =
    action === "bootstrap"
      ? [
          "bootstrap",
          `aws://${config.expectedAccountId}/${config.region}`,
          "--cloudformation-execution-policies",
          config.bootstrapExecutionPolicyArn as string,
        ]
      : [
          action as string,
          config.stackName,
          "--app",
          "node --import tsx infrastructure/cdk/app.ts",
          ...(action === "diff" ? ["--no-change-set"] : []),
          ...(action === "deploy"
            ? [
                "--require-approval",
                "broadening",
                "--parameters",
                `BedrockModelId=${config.bedrockModelId}`,
                "--parameters",
                `BedrockInvokeArns=${config.bedrockInvokeArns.join(",")}`,
              ]
            : []),
        ];
  // CDK output may contain account/resource identifiers; never record/share this
  // private terminal during deployment. Keep CDK's interactive broadening review.
  const env = {
    ...cleanAwsEnvironment(config),
    JALNET_DEPLOY_ACCOUNT: config.expectedAccountId,
    JALNET_DEPLOY_REGION: config.region,
  };
  if (action === "deploy" || action === "bootstrap") {
    const code = await new Promise<number | null>((finish, reject) => {
      const child = spawn(
        "pnpm",
        ["exec", "cdk", ...cdkArgs, "--profile", "jalnet"],
        { env, stdio: "inherit" },
      );
      child.once("error", reject);
      child.once("exit", finish);
    });
    if (code !== 0)
      throw new Error(
        "CDK execution stopped; review the private terminal and do not bypass approval",
      );
    return;
  }
  await mkdir(resolve(".cutover"), { recursive: true, mode: 0o700 });
  try {
    const result = await promisify(execFile)(
      "pnpm",
      ["exec", "cdk", ...cdkArgs, "--profile", "jalnet"],
      { env, timeout: 1_200_000, maxBuffer: 10_000_000 },
    );
    await writeFile(
      resolve(`.cutover/${action}.log`),
      result.stdout + result.stderr,
      { mode: 0o600 },
    );
    process.stdout.write(
      `CDK ${action} finished; review .cutover/${action}.log privately. No live service verification implied.\n`,
    );
  } catch {
    throw new Error(
      `CDK ${action} stopped. Do not bypass approval or retry blindly; use the reviewed interactive command in the runbook.`,
    );
  }
}
main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error && !("issues" in error) ? error.message : "Cutover validation failed; private data withheld"}\n`,
  );
  process.exitCode = 2;
});

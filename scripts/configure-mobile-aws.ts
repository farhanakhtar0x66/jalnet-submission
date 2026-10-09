import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { readMobileConfig } from "../packages/contracts/src/config.js";
import {
  assertMapsKey,
  awsJson,
  deployedOutputs,
  guardLiveIdentity,
  liveArguments,
  readCutoverConfig,
} from "./aws-safety.js";

async function main() {
  const args = liveArguments(process.argv.slice(2), ["--profile", "--config"]);
  const config = await readCutoverConfig(args["--config"] as string);
  await guardLiveIdentity(config);
  const outputs = await deployedOutputs(config);
  const key = z
    .object({
      Key: z.string(),
    })
    .passthrough()
    .parse(
      await awsJson(config, [
        "location",
        "describe-key",
        "--key-name",
        config.mapKeyName,
      ]),
    );
  assertMapsKey(config, outputs.LocationMapsResourceArn, key);
  const env = {
    EXPO_PUBLIC_PROVIDER_MODE: "aws",
    EXPO_PUBLIC_API_BASE_URL: outputs.ApiUrl,
    EXPO_PUBLIC_AWS_REGION: config.region,
    EXPO_PUBLIC_COGNITO_POOL_ID: outputs.UserPoolId,
    EXPO_PUBLIC_COGNITO_CLIENT_ID: outputs.UserPoolClientId,
    EXPO_PUBLIC_COGNITO_DOMAIN: outputs.CognitoDomain,
    EXPO_PUBLIC_LOCATION_MAP_KEY: key.Key,
    EXPO_PUBLIC_LOCATION_MAP_RESOURCE_ARN: outputs.LocationMapsResourceArn,
    EXPO_PUBLIC_ANDROID_CERT_SHA1: config.androidCertificateSha1,
  };
  readMobileConfig(env);
  // No server resource environment, client secret or AWS credential is exposed.
  await writeFile(
    resolve("apps/mobile/.env"),
    `${Object.entries(env)
      .map(([name, value]) => `${name}=${value}`)
      .join("\n")}\n`,
    { mode: 0o600 },
  );
  process.stdout.write(
    "Actual mobile AWS environment saved privately. Restart Metro; native maps/key enforcement and PKCE remain unverified.\n",
  );
}
main().catch(() => {
  process.stderr.write(
    "Mobile cutover stopped: inspect actual configuration/key privately; values withheld.\n",
  );
  process.exitCode = 2;
});

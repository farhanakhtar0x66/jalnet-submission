import { App } from "aws-cdk-lib";
import { JalnetStack } from "./stack.js";

const account = process.env.JALNET_DEPLOY_ACCOUNT;
const region = process.env.JALNET_DEPLOY_REGION;
if (
  (account || region) &&
  (!account || !/^\d{12}$/.test(account) || region !== "ap-south-1")
)
  throw new Error(
    "Both actual JALNET_DEPLOY_ACCOUNT and JALNET_DEPLOY_REGION=ap-south-1 are required for account-bound synthesis",
  );
// Default synth remains credential-free; guarded cutover binds a real account.
new JalnetStack(
  new App(),
  "JalNetDev",
  account ? { env: { account, region: region as string } } : {},
);

import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { requireStoppedDemoServer } from "./local-safety.js";

if (process.argv[2] !== "--local")
  throw new Error(
    "Only explicit --local reset is supported; no AWS deletion permitted",
  );
await requireStoppedDemoServer();
await rm(resolve(".local-data"), { recursive: true, force: true });
process.stdout.write(
  "LOCAL/DEMO data reset. Stop the local server before reset, then restart it. No AWS resources changed.\n",
);

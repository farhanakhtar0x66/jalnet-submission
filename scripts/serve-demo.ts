import {
  chmod,
  mkdtemp,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { createLocalServer } from "../services/local/server.js";
import { ensureLocalDemoCorridor } from "./demo-seed-fixture.js";

const { values } = parseArgs({
  options: {
    "android-usb": { type: "boolean" },
    resume: { type: "string" },
    port: { type: "string", default: "8787" },
  },
});
const port = Number(values.port);
if (
  !/^\d+$/.test(values.port ?? "") ||
  !Number.isInteger(port) ||
  port < 1024 ||
  port > 65535
)
  throw new Error("Demo port must be an integer from 1024 to 65535");

// A fresh take never replaces .local-data or deletes prior server evidence.
const directory = values.resume
  ? await realpath(values.resume)
  : await mkdtemp(join(tmpdir(), "jalnet-interactive-demo-"));
const marker = join(directory, ".jalnet-isolated-demo");
if (values.resume) {
  if ((await readFile(marker, "utf8")) !== "JALNET_ISOLATED_DEMO_V1\n")
    throw new Error("Resume requires a directory created by demo:serve");
} else {
  await chmod(directory, 0o700);
  await writeFile(marker, "JALNET_ISOLATED_DEMO_V1\n", {
    mode: 0o600,
    flag: "wx",
  });
}
const uploadHost = values["android-usb"] ? "127.0.0.1" : "10.0.2.2";
const { server, app } = await createLocalServer({
  stateFile: join(directory, "state.json"),
  evidenceDirectory: join(directory, "evidence"),
  evidenceBaseUrl: `http://${uploadHost}:${port}`,
});
if (!values.resume) await ensureLocalDemoCorridor(app);
await new Promise<void>((resolve, reject) => {
  server.once("error", reject);
  server.listen(port, "127.0.0.1", resolve);
});
process.stdout.write(
  `LOCAL/DEMO API ready on 127.0.0.1:${port}; mandatory Cedar. ${values.resume ? "Resumed existing take; data retained." : "Fresh take: one corridor, no incidents, zero droplets."}\nPrivate state directory: ${directory}\nResume this same take with: pnpm demo:serve${values["android-usb"] ? " --android-usb" : ""} --port ${port} --resume ${JSON.stringify(directory)}\nDo not switch servers while a wanted private draft depends on the previous server. .local-data and phone drafts are untouched. AWS is unverified.\n`,
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => server.close(() => process.exit(0)));

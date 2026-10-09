import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { createLocalServer } from "../services/local/server.js";

const port = 8787;
const { values } = parseArgs({
  options: { "android-usb": { type: "boolean" } },
});
const androidHost = values["android-usb"] ? "127.0.0.1" : "10.0.2.2";
const { server } = await createLocalServer({
  stateFile: resolve(".local-data/state.json"),
  evidenceDirectory: resolve(".local-data/evidence"),
  evidenceBaseUrl: `http://${androidHost}:${port}`,
});
server.listen(port, "127.0.0.1", () =>
  process.stdout.write(
    `JalNet LOCAL/DEMO API: http://127.0.0.1:${port}; mandatory Cedar private-report authorization; Android upload host ${androidHost}${values["android-usb"] ? " via adb reverse" : " (emulator)"}. No AWS integrations verified.\n`,
  ),
);

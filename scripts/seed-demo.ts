import { resolve } from "node:path";
import { Application } from "../services/core/application.js";
import {
  LocalAnalysis,
  LocalEvidence,
  LocalRoutes,
} from "../services/providers/local.js";
import { LocalRepository } from "../services/providers/local-repository.js";
import { ensureLocalDemoCorridor } from "./demo-seed-fixture.js";
import { requireStoppedDemoServer } from "./local-safety.js";

if (process.argv[2] !== "--local")
  throw new Error("Only --local is supported; no cloud fixture injection");
await requireStoppedDemoServer();
const repo = new LocalRepository(resolve(".local-data/state.json"));
await repo.load();
const app = new Application(
  repo,
  new LocalEvidence(resolve(".local-data/evidence"), "http://10.0.2.2:8787"),
  new LocalAnalysis(),
  new LocalRoutes(),
);
const result = await ensureLocalDemoCorridor(app);
process.stdout.write(
  `${result === "created" ? "Seeded" : "Already present:"} LOCAL/DEMO straight-line corridor; no fabricated observations or AWS writes.\n`,
);

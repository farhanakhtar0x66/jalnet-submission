import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { decodePolyline } from "../packages/geo/src/index.js";
import {
  ensureLocalDemoCorridor,
  localDemoCorridor,
} from "../scripts/demo-seed-fixture.js";
import { Application } from "../services/core/application.js";
import {
  LocalAnalysis,
  LocalEvidence,
  LocalRoutes,
} from "../services/providers/local.js";
import { LocalRepository } from "../services/providers/local-repository.js";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});
async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "jalnet-demo-seed-test-"));
  directories.push(directory);
  const stateFile = join(directory, "state.json");
  const repo = new LocalRepository(stateFile);
  await repo.load();
  const routes = new LocalRoutes();
  const calculate = vi.spyOn(routes, "calculate");
  const app = new Application(
    repo,
    new LocalEvidence(join(directory, "evidence"), "http://127.0.0.1"),
    new LocalAnalysis(),
    routes,
    () => "2026-10-09T08:00:00.000Z",
  );
  const persisted = async () => {
    const restored = new LocalRepository(stateFile);
    await restored.load();
    return restored;
  };
  return { app, repo, calculate, stateFile, persisted };
}

describe("deterministic LOCAL/DEMO corridor seed with real local persistence", () => {
  it("adds the missing fixture alongside an unrelated route and preserves it", async () => {
    const { app, repo, calculate, persisted } = await fixture();
    const unrelated = await app.saveRoute("local-alice", {
      ...localDemoCorridor,
      name: "My existing route",
      destination: { lat: 28.62, lon: 77.22 },
    });
    calculate.mockClear();
    expect(await ensureLocalDemoCorridor(app)).toBe("created");
    expect(calculate).toHaveBeenCalledExactlyOnceWith(
      localDemoCorridor.origin,
      localDemoCorridor.destination,
      "Car",
    );
    const routes = await (await persisted()).routes("local-alice");
    expect(routes).toHaveLength(2);
    expect(routes.find((route) => route.id === unrelated.route.id)).toEqual(
      unrelated.route,
    );
    const corridor = routes.find(
      (route) => route.name === localDemoCorridor.name,
    );
    expect(corridor?.activeAlerts).toBe(true);
    expect(decodePolyline(corridor?.polyline ?? "")).toEqual([
      [77.205, 28.6139],
      [77.215, 28.6139],
    ]);
    expect(await repo.ledger("local-alice")).toEqual([]);
  });

  it("repeated seeding keeps the same persisted route and spends no new calculation", async () => {
    const { app, repo, calculate, stateFile } = await fixture();
    expect(await ensureLocalDemoCorridor(app)).toBe("created");
    const before = await readFile(stateFile, "utf8");
    const first = await repo.routes("local-alice");
    calculate.mockClear();
    expect(await ensureLocalDemoCorridor(app)).toBe("already-present");
    expect(await repo.routes("local-alice")).toEqual(first);
    expect(await readFile(stateFile, "utf8")).toBe(before);
    expect(calculate).not.toHaveBeenCalled();
  });

  it.each([
    {
      description: "different ordered endpoints",
      input: {
        ...localDemoCorridor,
        origin: localDemoCorridor.destination,
        destination: localDemoCorridor.origin,
      },
    },
    {
      description: "alerts disabled",
      input: { ...localDemoCorridor, activeAlerts: false },
    },
  ])(
    "does not falsely accept a namesake with $description",
    async ({ input }) => {
      const { app, persisted } = await fixture();
      const namesake = await app.saveRoute("local-alice", input);
      expect(await ensureLocalDemoCorridor(app)).toBe("created");
      const routes = await (await persisted()).routes("local-alice");
      expect(routes).toHaveLength(2);
      expect(routes.find((route) => route.id === namesake.route.id)).toEqual(
        namesake.route,
      );
    },
  );

  it("fails clearly at the five-route cap without false success or state changes", async () => {
    const { app, repo, calculate, stateFile, persisted } = await fixture();
    for (let index = 0; index < 5; index++)
      await app.saveRoute("local-alice", {
        ...localDemoCorridor,
        name: `Existing route ${index + 1}`,
      });
    const before = await readFile(stateFile, "utf8");
    const routes = await repo.routes("local-alice");
    calculate.mockClear();
    await expect(ensureLocalDemoCorridor(app)).rejects.toThrow(
      "LOCAL/DEMO corridor was not seeded: local-alice already has five saved routes",
    );
    expect(await readFile(stateFile, "utf8")).toBe(before);
    expect(await (await persisted()).routes("local-alice")).toEqual(routes);
    expect(calculate).not.toHaveBeenCalled();
  });

  it("recognizes an existing corridor even when all five route slots are occupied", async () => {
    const { app, calculate, stateFile } = await fixture();
    await ensureLocalDemoCorridor(app);
    for (let index = 0; index < 4; index++)
      await app.saveRoute("local-alice", {
        ...localDemoCorridor,
        name: `Existing route ${index + 1}`,
      });
    const before = await readFile(stateFile, "utf8");
    calculate.mockClear();
    expect(await ensureLocalDemoCorridor(app)).toBe("already-present");
    expect(await readFile(stateFile, "utf8")).toBe(before);
    expect(calculate).not.toHaveBeenCalled();
  });

  it("does not mistake another account's corridor for Alice's or mutate that account", async () => {
    const { app, persisted } = await fixture();
    const bob = await app.saveRoute("local-bob", localDemoCorridor);
    expect(await ensureLocalDemoCorridor(app)).toBe("created");
    const restored = await persisted();
    expect(await restored.routes("local-bob")).toEqual([bob.route]);
    expect(await restored.routes("local-alice")).toHaveLength(1);
  });
});

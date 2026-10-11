import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import { deviceTankStore } from "../apps/mobile/src/preview/storage.js";
import {
  simulateTankDay,
  tankDemoFixture,
} from "../packages/domain/src/water.js";

vi.mock("../apps/mobile/node_modules/expo-sqlite/kv-store", () => ({
  SQLiteStorage: class {
    getItemAsync = vi.fn();
    setItemAsync = vi.fn();
  },
}));

const root = fileURLToPath(new URL("..", import.meta.url));
function modulePath(from: string, specifier: string) {
  let base: string;
  if (specifier.startsWith(".")) base = resolve(dirname(from), specifier);
  else if (specifier.startsWith("@jalnet/contracts"))
    base = resolve(
      root,
      "packages/contracts/src",
      specifier.slice("@jalnet/contracts".length + 1) || "index",
    );
  else if (specifier === "@jalnet/geo")
    base = resolve(root, "packages/geo/src/index");
  else return null;
  const withoutJs = base.replace(/\.js$/, "");
  const path = [
    base,
    `${withoutJs}.ts`,
    `${withoutJs}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ].find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
  if (!path) throw new Error(`Unresolved application import: ${specifier}`);
  return path;
}

// Traverse emitted runtime imports, not type imports or a hardcoded list of
// expected files. This catches accidental connection of the preview to the
// authenticated/server composition as shared UI is maintained.
function runtimeGraph(entry: string) {
  const files = new Map<string, string>();
  const external = new Set<string>();
  function visit(path: string) {
    if (files.has(path)) return;
    const source = readFileSync(path, "utf8");
    if (path.endsWith(".json")) {
      files.set(path, source);
      return;
    }
    const output = ts.transpileModule(source, {
      fileName: path,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2023,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    files.set(path, output);
    for (const { fileName } of ts.preProcessFile(output, true, true)
      .importedFiles) {
      const target = modulePath(path, fileName);
      if (target) visit(target);
      else external.add(fileName);
    }
  }
  visit(resolve(root, entry));
  return { files, external };
}

describe("standalone preview runtime composition", () => {
  const graph = runtimeGraph("apps/mobile/preview.ts");
  const paths = [...graph.files.keys()].map((path) => relative(root, path));
  it("reaches the real water/domain/theme/map UI without reaching the server client", () => {
    expect(paths).toContain("apps/mobile/src/features/MyWater.tsx");
    expect(paths).toContain("apps/mobile/src/features/WaterStress.tsx");
    expect(paths).toContain("packages/domain/src/water.ts");
    expect(graph.external.has("@maplibre/maplibre-react-native")).toBe(true);
    for (const file of [
      "Home.tsx",
      "api.ts",
      "cache.ts",
      "drafts.ts",
      "ReportFlow.tsx",
      "SignIn.tsx",
      "transport.ts",
      "features/storage.ts",
    ])
      expect(paths).not.toContain(`apps/mobile/src/${file}`);
    expect(paths.some((path) => path.startsWith("services/"))).toBe(false);
  });
  it("loads no camera/GPS/auth/network transport or fixed demo bearer", () => {
    for (const dependency of [
      "expo-camera",
      "expo-location",
      "expo-secure-store",
      "expo-auth-session",
      "expo/fetch",
      "@tanstack/react-query",
    ])
      expect(graph.external.has(dependency)).toBe(false);
    const emitted = [...graph.files.values()].join("\n");
    expect(emitted).not.toMatch(/LOCAL_DEMO_(?:ALICE|BOB)/);
    expect(emitted).not.toMatch(
      /10\.0\.2\.2|127\.0\.0\.1|localhost|execute-api/,
    );
    expect(emitted).not.toMatch(/\bfetch\s*\(/);
  });
  it("keeps the normal entry connected to the original trusted composition", () => {
    const normal = runtimeGraph("apps/mobile/index.ts");
    const normalPaths = [...normal.files.keys()].map((path) =>
      relative(root, path),
    );
    expect(normalPaths).toContain("apps/mobile/src/ReportFlow.tsx");
    expect(normalPaths).toContain("apps/mobile/src/api.ts");
    expect(normalPaths).toContain("apps/mobile/src/features/storage.ts");
    expect(normalPaths).not.toContain("apps/mobile/src/preview/storage.ts");
  });
});

function storageFixture() {
  const rows = new Map<string, string>();
  const storage = {
    getItemAsync: vi.fn(async (key: string) => rows.get(key) ?? null),
    setItemAsync: vi.fn(async (key: string, value: string) => {
      rows.set(key, value);
    }),
  };
  return { rows, storage, open: () => deviceTankStore(storage) };
}

describe("standalone preview device water store (native SQLite port simulated)", () => {
  it("loads an absent fixture without inventing a persisted record", async () => {
    const { open, storage } = storageFixture();
    expect(await open().load()).toEqual({
      value: tankDemoFixture(),
      persisted: false,
      scope: "standalone-device-v1",
    });
    expect(storage.setItemAsync).not.toHaveBeenCalled();
  });
  it("saves a real simulated day and restores it through a new device store", async () => {
    const { open, rows } = storageFixture();
    const state = simulateTankDay(tankDemoFixture());
    const scope = (await open().load()).scope;
    await open().save(state, scope);
    expect((await open().load()).value).toEqual(state);
    expect((await open().load()).persisted).toBe(true);
    expect([...rows.keys()]).toEqual(["standalone-device-v1:tank-v1"]);
  });
  it("reset changes only its tank record and rejects an unrelated scope", async () => {
    const { open, rows, storage } = storageFixture();
    rows.set("unrelated-private-draft", "preserve");
    const store = open();
    await expect(store.save(tankDemoFixture(), "foreign")).rejects.toThrow(
      "Account changed",
    );
    expect(storage.setItemAsync).not.toHaveBeenCalled();
    await store.reset();
    expect(rows.get("unrelated-private-draft")).toBe("preserve");
    expect((await store.load()).value).toEqual(tankDemoFixture());
  });
  it("keeps corrupt saved values intact rather than claiming a successful restore", async () => {
    const { open, rows, storage } = storageFixture();
    rows.set("standalone-device-v1:tank-v1", "not valid JSON");
    await expect(open().load()).rejects.toThrow("Saved water data is invalid");
    expect(rows.get("standalone-device-v1:tank-v1")).toBe("not valid JSON");
    expect(storage.setItemAsync).not.toHaveBeenCalled();
  });
});

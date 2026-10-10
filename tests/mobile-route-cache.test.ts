import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { cachedApi } from "../apps/mobile/src/cache.js";
import {
  renderableSavedRouteSchema,
  routeErrorMessage,
} from "../apps/mobile/src/routeGeometry.js";
import { encodePolyline } from "../packages/geo/src/index.js";

// Exercise the actual cache boundary; transport and native SQLite are simulated.
const ports = vi.hoisted(() => ({
  api: vi.fn(),
  db: {
    execAsync: vi.fn(async () => {}),
    runAsync: vi.fn(async () => {}),
    getFirstAsync: vi.fn(),
  },
  NetworkError: class extends Error {},
}));
vi.mock("../apps/mobile/src/api", () => ({
  api: ports.api,
  storageScope: async () => "LOCAL_DEMO_ALICE",
  NetworkError: ports.NetworkError,
}));
vi.mock("../apps/mobile/node_modules/expo-sqlite", () => ({
  openDatabaseAsync: async () => ports.db,
}));
vi.mock("../apps/mobile/node_modules/expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  digestStringAsync: async () => "synthetic-cache-scope",
}));

const fixture = {
  id: "f2c85677-8f32-4232-8d78-031a177a5cb0",
  userId: "LOCAL_DEMO_ALICE",
  name: "Synthetic route",
  source: "MANUAL",
  polyline: encodePolyline([
    [77.204, 28.6],
    [77.209, 28.615],
  ]),
  bbox: [77.204, 28.6, 77.209, 28.615],
  corridorWidthM: 30,
  activeAlerts: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  ports.api.mockReset();
  ports.db.getFirstAsync.mockReset();
});

describe("saved-route cache validation (native storage and transport simulated)", () => {
  it("does not cache malformed fresh geometry or hide it behind an old successful cache", async () => {
    ports.db.getFirstAsync.mockResolvedValue({
      body: JSON.stringify([fixture]),
      savedAt: Date.now(),
    });
    ports.api.mockImplementation(async (_path: string, schema: z.ZodType) =>
      schema.parse([{ ...fixture, polyline: "abc" }]),
    );
    await expect(
      cachedApi("/v1/routes", z.array(renderableSavedRouteSchema)),
    ).rejects.toThrow("Saved route data could not be validated");
    expect(ports.db.runAsync).not.toHaveBeenCalled();
    expect(ports.db.getFirstAsync).not.toHaveBeenCalled();
  });

  it("rejects malformed cached geometry during offline reuse with a redacted message", async () => {
    ports.api.mockRejectedValue(new ports.NetworkError("Offline"));
    ports.db.getFirstAsync.mockResolvedValue({
      body: JSON.stringify([{ ...fixture, polyline: "abc" }]),
      savedAt: Date.now(),
    });
    const outcome = await cachedApi(
      "/v1/routes",
      z.array(renderableSavedRouteSchema),
    ).catch((error: unknown) => error);
    expect(outcome).toBeInstanceOf(z.ZodError);
    expect(routeErrorMessage(outcome as Error)).toBe(
      "Saved route data could not be validated. Refresh route reports.",
    );
    expect(ports.db.getFirstAsync).toHaveBeenCalledOnce();
    expect(ports.db.runAsync).not.toHaveBeenCalled();
  });
});

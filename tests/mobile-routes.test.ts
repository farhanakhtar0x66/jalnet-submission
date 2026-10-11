import { describe, expect, it } from "vitest";
import {
  renderableSavedRouteSchema,
  routeErrorMessage,
} from "../apps/mobile/src/routeGeometry.js";
import { savedRouteSchema } from "../packages/contracts/src/events.js";
import { decodePolyline, encodePolyline } from "../packages/geo/src/index.js";

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

describe("mobile saved-route render boundary", () => {
  it("preserves the real route encoding and coordinates for valid fixtures", () => {
    const route = renderableSavedRouteSchema.parse(fixture);
    expect(route).toEqual(fixture);
    expect(decodePolyline(route.polyline)).toEqual([
      [77.204, 28.6],
      [77.209, 28.615],
    ]);
  });

  it.each(["abc", "?", "_"])(
    "rejects malformed or truncated polyline %s accepted by the shared shape contract",
    (polyline) => {
      const route = { ...fixture, polyline };
      expect(savedRouteSchema.safeParse(route).success).toBe(true);
      expect(() => decodePolyline(polyline)).toThrow();
      const result = renderableSavedRouteSchema.safeParse(route);
      expect(result.success).toBe(false);
      if (result.success) throw new Error("Expected invalid route");
      const message = routeErrorMessage(result.error);
      expect(message).toBe(
        "Saved route data could not be validated. Refresh route reports.",
      );
      expect(message).not.toContain(polyline);
      expect(message).not.toContain("ZodError");
    },
  );

  it("rejects a one-point route that cannot form a native LineString", () => {
    const route = {
      ...fixture,
      polyline: encodePolyline([[77.204, 28.6]]),
    };
    expect(savedRouteSchema.safeParse(route).success).toBe(true);
    expect(decodePolyline(route.polyline)).toHaveLength(1);
    expect(renderableSavedRouteSchema.safeParse(route).success).toBe(false);
  });

  it.each([
    [77.2, 86],
    [181, 28.6],
  ] as [number, number][])(
    "rejects encoded out-of-range point %s,%s before map rendering",
    (lon, lat) => {
      const route = {
        ...fixture,
        polyline: encodePolyline([
          [lon, lat],
          [77.21, 28.61],
        ]),
      };
      expect(savedRouteSchema.safeParse(route).success).toBe(true);
      expect(renderableSavedRouteSchema.safeParse(route).success).toBe(false);
    },
  );

  it("retains an already redacted transport failure without inventing success", () => {
    expect(routeErrorMessage(new Error("Network unavailable. Retry."))).toBe(
      "Network unavailable. Retry.",
    );
  });
});

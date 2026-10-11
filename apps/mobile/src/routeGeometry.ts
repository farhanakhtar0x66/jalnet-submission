import { savedRouteSchema } from "@jalnet/contracts/events";
import { decodePolyline } from "@jalnet/geo";
import { z } from "zod";

const invalidRouteMessage =
  "Saved route data could not be validated. Refresh route reports.";

// Apply the render boundary before either fresh caching or cached-row reuse.
// Keep the shared API contract and route encoding unchanged.
export const renderableSavedRouteSchema = savedRouteSchema.superRefine(
  (route, ctx) => {
    try {
      const points = decodePolyline(route.polyline);
      if (
        points.length >= 2 &&
        points.every(
          ([lon, lat]) =>
            Number.isFinite(lon) &&
            Number.isFinite(lat) &&
            Math.abs(lon) <= 180 &&
            Math.abs(lat) <= 85,
        )
      )
        return;
    } catch {
      // Malformed geometry never reaches the native map or public error text.
    }
    ctx.addIssue({
      code: "custom",
      path: ["polyline"],
      message: invalidRouteMessage,
    });
  },
);

export function routeErrorMessage(error: Error) {
  return error instanceof z.ZodError ? invalidRouteMessage : error.message;
}

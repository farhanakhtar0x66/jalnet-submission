import { randomUUID } from "node:crypto";
import { z } from "zod";
import { viewportSchema } from "../../packages/contracts/src/events.js";
import { routePreviewRequestSchema } from "../../packages/contracts/src/index.js";
import { ApiFailure, type Application, publicEvent } from "./application.js";

export interface Request {
  method: string;
  path: string;
  userId: string;
  query: Record<string, string | undefined>;
  body: unknown;
}
export function parseRequestBody(text: string) {
  if (Buffer.byteLength(text) > 64_000)
    throw new ApiFailure(
      "VALIDATION_FAILED",
      413,
      "Request body exceeds the JSON limit",
    );
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new ApiFailure(
      "VALIDATION_FAILED",
      400,
      "Request body must be valid JSON",
    );
  }
}
export async function dispatch(
  app: Application,
  request: Request,
  onReady: (id: string) => Promise<void>,
) {
  const { method, path, userId, body, query } = request;
  if (!userId)
    throw new ApiFailure("AUTH_REQUIRED", 401, "Sign in to continue");
  if (method === "GET" && path === "/v1/me") return app.profile(userId);
  if (method === "POST" && path === "/v1/reports") {
    const report = await app.createReport(userId, body);
    if (report.status === "ANALYZING") await onReady(report.id);
    return report;
  }
  if (method === "POST" && path === "/v1/uploads/presign")
    return app.presign(userId, body);
  const reportMatch = path.match(/^\/v1\/reports\/([^/]+)(\/confirm)?$/);
  if (reportMatch?.[1]) {
    const id = z.uuid().parse(reportMatch[1]);
    if (method === "GET" && !reportMatch[2]) return app.ownedReport(userId, id);
    if (method === "POST" && reportMatch[2])
      return app.confirm(userId, id, body);
  }
  if (method === "GET" && path === "/v1/events") {
    const params = viewportSchema.parse({
      bbox: query.bbox?.split(",").map(Number),
      layer: query.layers ?? "LIVE",
    });
    return app.events(params.bbox, params.layer);
  }
  const eventMatch = path.match(/^\/v1\/events\/([^/]+)$/);
  if (method === "GET" && eventMatch?.[1]) {
    const event = await app.repository.getEvent(z.uuid().parse(eventMatch[1]));
    if (event?.attributes.publicRoad !== true)
      throw new ApiFailure("FORBIDDEN", 404, "Event not available");
    return publicEvent(event);
  }
  const voteMatch = path.match(
    /^\/v1\/events\/([^/]+)\/(confirm|resolve-request)$/,
  );
  if (method === "POST" && voteMatch?.[1])
    return app.vote(
      userId,
      z.uuid().parse(voteMatch[1]),
      voteMatch[2] === "resolve-request"
        ? { ...(body as Record<string, unknown>), action: "CLEARED" }
        : body,
    );
  if (method === "GET" && path === "/v1/routes")
    return app.repository.routes(userId);
  const riskMatch = path.match(/^\/v1\/routes\/([^/]+)\/risk$/);
  if (method === "GET" && riskMatch?.[1]) {
    const id = z.uuid().parse(riskMatch[1]);
    const risk = (await app.risks(userId)).find((r) => r.route.id === id);
    if (!risk) throw new ApiFailure("FORBIDDEN", 404, "Route not found");
    return risk;
  }

  if (method === "POST" && path === "/v1/routes")
    return app.saveRoute(userId, body);
  if (method === "POST" && path === "/v1/routes/preview") {
    const input = routePreviewRequestSchema.parse(body);
    return {
      ...(await app.previewRoute(userId, input)),
      provenance: app.routeProvider.provenance,
    };
  }
  const routeMatch = path.match(/^\/v1\/routes\/([^/]+)$/);
  if (method === "DELETE" && routeMatch?.[1]) {
    await app.repository.deleteRoute(userId, z.uuid().parse(routeMatch[1]));
    return { deleted: true };
  }
  throw new ApiFailure("VALIDATION_FAILED", 404, "Unknown endpoint");
}
export function errorResponse(
  error: unknown,
  requestId: string = randomUUID(),
) {
  if (error instanceof z.ZodError)
    return {
      status: 400,
      body: {
        error: {
          code: "VALIDATION_FAILED",
          message: "Request does not match the API contract",
          requestId,
        },
      },
    };
  if (error instanceof ApiFailure)
    return {
      status: error.status,
      body: { error: { code: error.code, message: error.message, requestId } },
    };
  // No raw AWS/provider messages, JWTs, model outputs or private payloads in public errors.
  return {
    status: 503,
    body: {
      error: {
        code: "DEPENDENCY_UNAVAILABLE",
        message: "Dependency unavailable; retry shortly",
        requestId,
      },
    },
  };
}

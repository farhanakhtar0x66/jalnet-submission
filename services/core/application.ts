import { createHash, randomUUID } from "node:crypto";
import { decode } from "jpeg-js";
import { z } from "zod";
import {
  confirmReportSchema,
  type LedgerEntry,
  savedRouteInputSchema,
  type WaterEvent,
} from "../../packages/contracts/src/events.js";
import {
  coordinatesSchema,
  createReportRequestSchema,
  mediaAssessmentSchema,
  presignRequestSchema,
  type Report,
  routePreviewRequestSchema,
} from "../../packages/contracts/src/index.js";
import {
  eventForObservation,
  fusionCandidate,
  isCurrent,
  routeRisk,
} from "../../packages/domain/src/incidents.js";
import { distanceM, encodePolyline } from "../../packages/geo/src/index.js";
import type {
  AnalysisProvider,
  EvidenceProvider,
  ReportAction,
  ReportAuthorizer,
  Repository,
  RouteProvider,
} from "./ports.js";

export class ApiFailure extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
const fail = (code: string, status: number, message: string): never => {
  throw new ApiFailure(code, status, message);
};
const supporters = (event: WaterEvent): string[] =>
  z.array(z.string()).catch([]).parse(event.attributes.supporterIds);
// Only publish the consent flag. Internal contributor IDs and evidence hashes stay private.
export function publicEvent(event: WaterEvent, now = new Date().toISOString()) {
  const labels: Record<WaterEvent["status"], string> = {
    ACTIVE: "Community corroborated",
    UNVERIFIED: "Single report / unverified",
    MONITORING: "Clearance reported / monitoring",
    RESOLVED: "Community reports indicate clearance",
    EXPIRED: "Expired observation / current conditions unknown",
    REJECTED: "Rejected observation",
  };
  return {
    ...event,
    attributes: { publicRoad: event.attributes.publicRoad === true },
    provenance: "CITIZEN_REPORT",
    freshness:
      Date.parse(event.expiresAt) <= Date.parse(now)
        ? "EXPIRED"
        : Date.parse(now) - Date.parse(event.lastSeenAt) > 3_600_000
          ? "AGING"
          : "RECENT",
    verificationLabel:
      Date.parse(event.expiresAt) <= Date.parse(now)
        ? labels.EXPIRED
        : labels[event.status],
  };
}
export class Application {
  private readonly routeCache = new Map<
    string,
    { expires: number; result: Awaited<ReturnType<RouteProvider["calculate"]>> }
  >();
  constructor(
    readonly repository: Repository,
    readonly evidence: EvidenceProvider,
    readonly analysis: AnalysisProvider,
    readonly routeProvider: RouteProvider,
    private readonly clock = () => new Date().toISOString(),
    private readonly reportAuthorizer?: ReportAuthorizer,
  ) {}
  private requireFreshCapture(capturedAt: string) {
    const age = Date.parse(this.clock()) - Date.parse(capturedAt);
    if (!Number.isFinite(age) || age > 86_400_000 || age < -300_000)
      return fail(
        "VALIDATION_FAILED",
        400,
        "Capture must be within the past day; retake stale evidence or correct the device clock",
      );
  }
  async ownedReport(
    userId: string,
    id: string,
    action: ReportAction = "ReadReport",
  ): Promise<Report> {
    const report = await this.repository.getReport(id);
    if (!report) return fail("REPORT_NOT_FOUND", 404, "Report not found");
    if (
      this.reportAuthorizer &&
      (await this.reportAuthorizer.authorize({
        principalId: userId,
        action,
        reportId: report.id,
        ownerId: report.userId,
      })) !== "ALLOW"
    )
      return fail(
        "FORBIDDEN",
        403,
        report.userId === userId
          ? "Private report access denied"
          : "Report belongs to another user",
      );
    // Defense in depth, including the unchanged AWS composition.
    if (report.userId !== userId)
      return fail("FORBIDDEN", 403, "Report belongs to another user");
    return report;
  }
  async createReport(userId: string, input: unknown) {
    const request = createReportRequestSchema.parse(input);
    if (request.action === "UPLOAD_COMPLETE")
      return this.completeUpload(userId, request.reportId);
    this.requireFreshCapture(request.capturedAt);
    const report: Report = {
      id: randomUUID(),
      userId,
      status: "DRAFT",
      capturedAt: request.capturedAt,
      location: request.location,
      media: [],
    };
    const key = `drafts:${userId}:${this.clock().slice(0, 10)}`;
    for (let attempt = 0; attempt < 5; attempt++) {
      const count = await this.repository.counter(key);
      if (count >= 20)
        return fail("RATE_LIMITED", 429, "Daily private draft limit reached");
      if (
        await this.repository.commit({
          report,
          ledger: [],
          guards: [{ key, expected: count, value: count + 1 }],
        })
      )
        return report;
    }
    return fail("RATE_LIMITED", 429, "Concurrent request; retry shortly");
  }
  async presign(userId: string, input: unknown) {
    const request = presignRequestSchema.parse(input);
    for (let attempt = 0; attempt < 5; attempt++) {
      const report = await this.ownedReport(
        userId,
        request.reportId,
        "PresignReport",
      );
      this.requireFreshCapture(report.capturedAt);
      if (!["DRAFT", "UPLOADING"].includes(report.status))
        return fail(
          "REPORT_BAD_STATE",
          409,
          "Report no longer accepts uploads",
        );
      const reportGuard = `uploads:${report.id}`;
      const dailyGuard = `uploads:${userId}:${this.clock().slice(0, 10)}`;
      const [tries, daily] = await Promise.all([
        this.repository.counter(reportGuard),
        this.repository.counter(dailyGuard),
      ]);
      if (tries >= 5 || daily >= 100)
        return fail("RATE_LIMITED", 429, "Private upload retry limit reached");
      const key =
        report.media[0]?.s3Key ??
        `private/${userId}/${report.id}/${randomUUID()}.jpg`;
      const next: Report = {
        ...report,
        status: "UPLOADING",
        media: [{ kind: "IMAGE", s3Key: key }],
        upload: {
          contentLength: request.contentLength,
          contentType: request.contentType,
        },
      };
      if (
        !(await this.repository.commit({
          report: next,
          expectedReportStatus: report.status,
          ledger: [],
          guards: [
            { key: reportGuard, expected: tries, value: tries + 1 },
            { key: dailyGuard, expected: daily, value: daily + 1 },
          ],
        }))
      )
        continue;
      return {
        ...(await this.evidence.presign(key, request.contentLength)),
        reportId: report.id,
      };
    }
    return fail(
      "RATE_LIMITED",
      429,
      "Concurrent upload request; retry shortly",
    );
  }
  async completeUpload(userId: string, id: string) {
    const report = await this.ownedReport(userId, id, "CompleteUpload");
    if (["NEEDS_CONFIRMATION", "ACCEPTED", "MERGED"].includes(report.status))
      return report;
    this.requireFreshCapture(report.capturedAt);
    if (report.status === "ANALYZING") return report;
    const media = report.media[0];
    if (report.status !== "UPLOADING" || !media || !report.upload)
      return fail("REPORT_BAD_STATE", 409, "No pending upload");
    const bytes = await this.evidence.read(media.s3Key);
    if (
      bytes.length !== report.upload.contentLength ||
      bytes.length > 4_000_000
    )
      return fail(
        "UPLOAD_TOO_LARGE",
        400,
        "Uploaded bytes do not match declared size",
      );
    if (
      bytes[0] !== 0xff ||
      bytes[1] !== 0xd8 ||
      bytes[2] !== 0xff ||
      bytes.at(-2) !== 0xff ||
      bytes.at(-1) !== 0xd9
    )
      return fail("UPLOAD_TYPE_UNSUPPORTED", 400, "Upload is not a JPEG");
    try {
      decode(bytes, {
        useTArray: true,
        maxResolutionInMP: 4,
        maxMemoryUsageInMB: 64,
      });
    } catch {
      return fail(
        "UPLOAD_TYPE_UNSUPPORTED",
        400,
        "JPEG could not be decoded within image limits",
      );
    }
    const next: Report = {
      ...report,
      status: "ANALYZING",
      media: [
        { ...media, sha256: createHash("sha256").update(bytes).digest("hex") },
      ],
    };
    if (!(await this.repository.putReport(next, "UPLOADING")))
      return this.ownedReport(userId, id, "CompleteUpload");
    return next;
  }
  async analyze(id: string) {
    let report: Report | undefined;
    for (let attempt = 0; attempt < 5; attempt++) {
      const current = await this.repository.getReport(id);
      if (current?.status !== "ANALYZING" || !current.media[0]) return;
      const key = `analysis-lease:${id}`;
      const lease = await this.repository.counter(key);
      const now = Date.parse(this.clock());
      if (lease > now)
        throw new ApiFailure(
          "DEPENDENCY_UNAVAILABLE",
          503,
          "Analysis is already in progress; retry later",
        );
      // Longer than the 60-second Lambda deadline; crashed holders expire before SQS retry.
      if (
        await this.repository.commit({
          report: current,
          expectedReportStatus: "ANALYZING",
          ledger: [],
          guards: [{ key, expected: lease, value: now + 90_000 }],
        })
      ) {
        report = current;
        break;
      }
    }
    if (!report?.media[0])
      throw new ApiFailure(
        "DEPENDENCY_UNAVAILABLE",
        503,
        "Analysis lease changed; retry later",
      );
    let assessment: Report["aiAssessment"];
    try {
      this.requireFreshCapture(report.capturedAt);
      const image = await this.evidence.read(report.media[0].s3Key);
      if (
        createHash("sha256").update(image).digest("hex") !==
        report.media[0].sha256
      )
        throw new Error("Evidence changed after upload completion");
      assessment = mediaAssessmentSchema.parse(
        await this.analysis.assess(image),
      );
    } catch {
      /* Model/schema failure preserves the private draft for manual classification. */
    }
    const next: Report = {
      ...report,
      status: "NEEDS_CONFIRMATION",
      analysisProvenance: this.analysis.provenance,
      ...(assessment ? { aiAssessment: assessment } : {}),
    };
    await this.repository.putReport(next, "ANALYZING");
  }
  async confirm(userId: string, id: string, input: unknown) {
    const observation = confirmReportSchema.parse(input);
    for (let attempt = 0; attempt < 5; attempt++) {
      const report = await this.ownedReport(userId, id, "ConfirmReport");
      if (report.mergedEventId)
        return { report, eventId: report.mergedEventId, replay: true };
      this.requireFreshCapture(report.capturedAt);
      if (report.status !== "NEEDS_CONFIRMATION")
        return fail(
          "REPORT_BAD_STATE",
          409,
          "Wait for analysis or manual fallback",
        );
      const evidence = report.media[0];
      if (
        !evidence?.sha256 ||
        createHash("sha256")
          .update(await this.evidence.read(evidence.s3Key))
          .digest("hex") !== evidence.sha256
      )
        return fail(
          "REPORT_BAD_STATE",
          409,
          "Evidence changed after upload. Capture a new private draft.",
        );
      if (distanceM(report.location, observation.location) > 1000)
        return fail(
          "VALIDATION_FAILED",
          400,
          "Corrected pin is too far from capture",
        );
      const now = this.clock();
      const candidates = await this.repository.nearby(
        observation.location,
        300,
      );
      const previous = observation.publicRoad
        ? fusionCandidate(candidates, observation, now)
        : undefined;
      if (previous && supporters(previous).includes(userId))
        return fail(
          "VALIDATION_FAILED",
          409,
          "You already contributed to this current incident",
        );
      const hash = report.media[0]?.sha256;
      if (
        hash &&
        candidates.some((e) =>
          z
            .array(z.string())
            .catch([])
            .parse(e.attributes.mediaHashes)
            .includes(hash),
        )
      )
        return fail(
          "VALIDATION_FAILED",
          409,
          "Duplicate evidence; capture a new observation",
        );
      const event = eventForObservation(id, observation, now, previous);
      const users = [...(previous ? supporters(previous) : []), userId];
      event.attributes = {
        ...event.attributes,
        revision: Number(previous?.attributes.revision ?? 0) + 1,
        supporterIds: users,
        mediaHashes: [
          ...z
            .array(z.string())
            .catch([])
            .parse(previous?.attributes.mediaHashes),
          ...(hash ? [hash] : []),
        ],
      };
      if (users.length >= 2) {
        event.status = "ACTIVE";
        event.verificationScore = 0.6;
        event.confidence = 0.7;
      }
      const ledger: LedgerEntry[] = [];
      const guards: { key: string; expected: number; value: number }[] = [];
      if (hash) {
        const key = `media:${hash}`;
        if ((await this.repository.counter(key)) > 0)
          return fail(
            "VALIDATION_FAILED",
            409,
            "This evidence was already submitted",
          );
        guards.push({ key, expected: 0, value: 1 });
      }
      const award = (
        owner: string,
        amount: number,
        reason: LedgerEntry["reason"],
        key: string,
      ) =>
        ledger.push({
          id: randomUUID(),
          userId: owner,
          reportId: id,
          eventId: event.id,
          amount,
          reason,
          createdAt: now,
          idempotencyKey: key,
        });
      if (observation.publicRoad) {
        const dailyKey = `daily:${userId}:${now.slice(0, 10)}`;
        const daily = await this.repository.counter(dailyKey);
        if (daily < 10) {
          award(userId, 2, "REPORT_SUBMITTED", `provisional:${id}`);
          guards.push({ key: dailyKey, expected: daily, value: daily + 2 });
        }
        if (users.length === 2 && previous) {
          const first = users[0];
          if (first) award(first, 8, "FIRST_VALID_REPORT", `first:${event.id}`);
          award(
            userId,
            5,
            "REPORT_CORROBORATED",
            `corroborated:${event.id}:${userId}`,
          );
        }
      }
      const updated: Report = {
        ...report,
        location: { ...observation.location, source: "USER_PIN" },
        status: previous ? "MERGED" : "ACCEPTED",
        submittedAt: now,
        observedAt: now,
        mergedEventId: event.id,
        userConfirmation: {
          category: observation.category,
          stillActive: true,
          ...(observation.note ? { note: observation.note } : {}),
        },
      };
      if (
        await this.repository.commit({
          report: updated,
          expectedReportStatus: "NEEDS_CONFIRMATION",
          event,
          expectedEventCount: previous?.reportCount ?? 0,
          expectedEventRevision: Number(previous?.attributes.revision ?? 0),
          ledger,
          guards,
        })
      )
        return { report: updated, eventId: event.id, replay: false };
    }
    return fail("RATE_LIMITED", 409, "Concurrent change; retry shortly");
  }
  async events(bbox: readonly [number, number, number, number], layer: string) {
    return (await this.repository.viewport(bbox))
      .filter(
        (e) =>
          isCurrent(e, this.clock()) &&
          e.attributes.publicRoad === true &&
          (layer === "LIVE" ||
            layer === "ROUTE_RISK" ||
            (layer === "FLOOD" && ["FLOOD", "WATERLOGGING"].includes(e.type)) ||
            (layer === "LEAKS" && e.type === "LEAK") ||
            (layer === "DRAINS" && e.type.startsWith("DRAIN_"))),
      )
      .sort(
        (a, b) =>
          b.severity * b.confidence - a.severity * a.confidence ||
          b.lastSeenAt.localeCompare(a.lastSeenAt),
      )
      .slice(0, 200)
      .map((event) => publicEvent(event, this.clock()));
  }
  async vote(userId: string, id: string, input: unknown) {
    const vote = z
      .strictObject({
        action: z.enum(["CONFIRM", "CLEARED", "NOT_SURE"]),
        location: coordinatesSchema,
        accuracyM: z.number().min(0).max(100),
        observedAt: z.iso.datetime(),
      })
      .parse(input);
    const now = this.clock();
    if (Math.abs(Date.parse(now) - Date.parse(vote.observedAt)) > 900_000)
      return fail(
        "VALIDATION_FAILED",
        400,
        "Confirmation must be a current observation",
      );
    for (let attempt = 0; attempt < 5; attempt++) {
      const event = await this.repository.getEvent(id);
      if (event?.attributes.publicRoad !== true || !isCurrent(event, now))
        return fail("FORBIDDEN", 404, "Current public incident not found");
      if (distanceM(event.location, vote.location) > 150)
        return fail(
          "FORBIDDEN",
          403,
          "Observe from within 150 m; never approach a hazard to verify it",
        );
      if (supporters(event).includes(userId))
        return fail(
          "FORBIDDEN",
          403,
          "You cannot verify your own incident contribution",
        );
      const votes = z
        .array(z.object({ userId: z.string(), action: z.string() }))
        .catch([])
        .parse(event.attributes.votes);
      if (votes.some((v) => v.userId === userId))
        return { event: publicEvent(event), replay: true };
      const revision = Number(event.attributes.revision ?? 0);
      votes.push({ userId, action: vote.action });
      const updated = {
        ...event,
        attributes: { ...event.attributes, revision: revision + 1, votes },
      };
      if (vote.action === "CLEARED") {
        updated.status =
          votes.filter((v) => v.action === "CLEARED").length >= 2
            ? "RESOLVED"
            : "MONITORING";
        if (updated.status === "RESOLVED") updated.resolvedAt = now;
      }
      // Votes alone do not earn points or produce independent-photo corroboration.
      if (
        await this.repository.commit({
          event: updated,
          expectedEventCount: event.reportCount,
          expectedEventRevision: revision,
          ledger: [],
          guards: [],
        })
      )
        return { event: publicEvent(updated), replay: false };
    }
    return fail("RATE_LIMITED", 409, "Concurrent confirmation; retry shortly");
  }
  async saveRoute(userId: string, input: unknown) {
    const request = savedRouteInputSchema.parse(input);
    if ((await this.repository.routes(userId)).length >= 5)
      return fail("RATE_LIMITED", 400, "At most five saved routes");
    const result = await this.previewRoute(userId, {
      origin: request.origin,
      destination: request.destination,
      travelMode: request.travelMode,
    });
    const xs = result.geometry.map((p) => p[0]);
    const ys = result.geometry.map((p) => p[1]);
    const route = {
      id: randomUUID(),
      userId,
      name: request.name,
      source: "MANUAL" as const,
      polyline: encodePolyline(result.geometry),
      bbox: [
        Math.min(...xs),
        Math.min(...ys),
        Math.max(...xs),
        Math.max(...ys),
      ] as [number, number, number, number],
      corridorWidthM: 30,
      activeAlerts: request.activeAlerts,
    };
    await this.repository.saveRoute(route);
    return { route, provenance: this.routeProvider.provenance };
  }
  async previewRoute(userId: string, input: unknown) {
    const request = routePreviewRequestSchema.parse(input);
    const cacheKey = JSON.stringify([userId, request]);
    const now = Date.parse(this.clock());
    const cached = this.routeCache.get(cacheKey);
    if (cached && cached.expires > now) return cached.result;
    const key = `route-calculations:${userId}:${this.clock().slice(0, 10)}`;
    let acquired = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      const count = await this.repository.counter(key);
      if (count >= 30)
        return fail(
          "RATE_LIMITED",
          429,
          "Daily route calculation limit reached",
        );
      if (
        await this.repository.commit({
          ledger: [],
          guards: [{ key, expected: count, value: count + 1 }],
        })
      ) {
        acquired = true;
        break;
      }
    }
    if (!acquired)
      return fail(
        "RATE_LIMITED",
        429,
        "Concurrent route request; retry shortly",
      );
    const result = await this.routeProvider.calculate(
      request.origin,
      request.destination,
      request.travelMode,
    );
    for (const [key, entry] of this.routeCache)
      if (entry.expires <= now) this.routeCache.delete(key);
    if (this.routeCache.size >= 200)
      this.routeCache.delete(this.routeCache.keys().next().value ?? "");
    this.routeCache.set(cacheKey, { expires: now + 300_000, result });
    return result;
  }
  async risks(userId: string) {
    return Promise.all(
      (await this.repository.routes(userId)).map(async (route) => {
        const [w, s, e, n] = route.bbox;
        const events = await this.repository.viewport([
          w - 0.005,
          s - 0.005,
          e + 0.005,
          n + 0.005,
        ]);
        return {
          route,
          risks: events
            .map((event) => routeRisk(route, event, this.clock()))
            .filter((risk) => risk.warning),
        };
      }),
    );
  }
  async profile(userId: string) {
    const ledger = await this.repository.ledger(userId);
    return {
      userId,
      droplets: ledger.reduce((n, e) => n + e.amount, 0),
      ledger,
    };
  }
}

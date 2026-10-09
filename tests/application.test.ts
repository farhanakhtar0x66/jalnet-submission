import { randomUUID } from "node:crypto";
import { encode } from "jpeg-js";
import { describe, expect, it, vi } from "vitest";
import {
  eventForObservation,
  fusionCandidate,
  isCurrent,
  routeRisk,
} from "../packages/domain/src/incidents.js";
import {
  decodePolyline,
  encodePolyline,
  routeDistanceM,
} from "../packages/geo/src/index.js";
import { Application, publicEvent } from "../services/core/application.js";
import type { EvidenceProvider } from "../services/core/ports.js";
import { dispatch, errorResponse } from "../services/core/http.js";
import { LocalAnalysis, LocalRoutes } from "../services/providers/local.js";
import { LocalRepository } from "../services/providers/local-repository.js";

const now = "2026-10-08T08:00:00.000Z";
const point = { lat: 28.6139, lon: 77.209 };
const observation = {
  category: "WATERLOGGING" as const,
  severity: 2 as const,
  stillActive: true as const,
  location: point,
  publicRoad: true,
};
const bbox = [77.2, 28.6, 77.22, 28.63] as const;
function fixture() {
  let currentTime = now;
  const repository = new LocalRepository();
  const files = new Map<string, Uint8Array>();
  const evidence: EvidenceProvider = {
    presign: async (key) => ({ url: key, expiresIn: 300 }),
    read: async (key) => {
      const bytes = files.get(key);
      if (!bytes) throw new Error("Missing evidence");
      return bytes;
    },
  };
  const app = new Application(
    repository,
    evidence,
    new LocalAnalysis(),
    new LocalRoutes(),
    () => currentTime,
  );
  async function ready(
    userId: string,
    unique: number,
    location = point,
    runAnalysis = true,
  ) {
    const draft = await app.createReport(userId, {
      action: "DRAFT",
      capturedAt: now,
      location: { ...location, source: "USER_PIN" },
    });
    const rgba = Buffer.alloc(8 * 8 * 4);
    for (let i = 0; i < rgba.length; i += 4) {
      rgba[i] = unique * 30;
      rgba[i + 1] = 50;
      rgba[i + 2] = 80;
      rgba[i + 3] = 255;
    }
    const bytes = encode({ data: rgba, width: 8, height: 8 }, 90).data;
    const url = await app.presign(userId, {
      reportId: draft.id,
      contentType: "image/jpeg",
      contentLength: bytes.length,
    });
    files.set(url.url, new Uint8Array(bytes));
    await app.completeUpload(userId, draft.id);
    if (runAnalysis) await app.analyze(draft.id);
    return draft.id;
  }
  return {
    app,
    repository,
    ready,
    files,
    advance: (time: string) => {
      currentTime = time;
    },
  };
}
describe("LOCAL P0 failure injection", () => {
  it("retains an interrupted upload for retry without publication or rewards", async () => {
    const { app, files } = fixture();
    const draft = await app.createReport("alice", {
      action: "DRAFT",
      capturedAt: now,
      location: { ...point, source: "USER_PIN" },
    });
    const bytes = encode(
      { data: Buffer.alloc(8 * 8 * 4, 100), width: 8, height: 8 },
      90,
    ).data;
    const grant = await app.presign("alice", {
      reportId: draft.id,
      contentType: "image/jpeg",
      contentLength: bytes.length,
    });
    files.set(grant.url, bytes.subarray(0, bytes.length / 2));
    await expect(app.completeUpload("alice", draft.id)).rejects.toMatchObject({
      code: "UPLOAD_TOO_LARGE",
    });
    expect((await app.ownedReport("alice", draft.id)).status).toBe("UPLOADING");
    expect(await app.events(bbox, "LIVE")).toEqual([]);
    expect((await app.profile("alice")).droplets).toBe(0);
    files.set(grant.url, bytes);
    expect((await app.completeUpload("alice", draft.id)).status).toBe(
      "ANALYZING",
    );
  });
  it("retries scheduling after a queue failure without recreating the report", async () => {
    const { app, ready } = fixture();
    const id = await ready("alice", 1, point, false);
    const onReady = vi
      .fn()
      .mockRejectedValueOnce(new Error("private-queue-diagnostic"))
      .mockResolvedValue(undefined);
    const request = {
      method: "POST",
      path: "/v1/reports",
      userId: "alice",
      query: {},
      body: { action: "UPLOAD_COMPLETE", reportId: id },
    };
    try {
      await dispatch(app, request, onReady);
    } catch (error) {
      expect(errorResponse(error).status).toBe(503);
      expect(JSON.stringify(errorResponse(error).body)).not.toContain(
        "private-queue",
      );
    }
    expect((await app.ownedReport("alice", id)).status).toBe("ANALYZING");
    expect(((await dispatch(app, request, onReady)) as { id: string }).id).toBe(
      id,
    );
    expect(onReady).toHaveBeenCalledTimes(2);
    await app.analyze(id);
    await dispatch(app, request, onReady);
    expect(onReady).toHaveBeenCalledTimes(2);
  });
  it("falls back privately after analysis timeout and never publishes or awards automatically", async () => {
    const { app, ready } = fixture(),
      id = await ready("alice", 1, point, false);
    vi.spyOn(app.analysis, "assess").mockRejectedValue(
      new Error("unit timeout"),
    );
    await app.analyze(id);
    const report = await app.ownedReport("alice", id);
    expect(report.status).toBe("NEEDS_CONFIRMATION");
    expect(report.aiAssessment).toBeUndefined();
    expect(report.analysisProvenance).toBe("LOCAL_DEMO");
    expect(await app.events(bbox, "LIVE")).toEqual([]);
    expect((await app.profile("alice")).droplets).toBe(0);
  });
  it("rejects captures from the future and drafts that become stale before confirmation", async () => {
    const { app, ready, advance } = fixture();
    await expect(
      app.createReport("alice", {
        action: "DRAFT",
        capturedAt: "2026-10-08T09:00:00.000Z",
        location: { ...point, source: "USER_PIN" },
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    const id = await ready("alice", 1);
    advance("2026-10-09T08:00:01.000Z");
    await expect(app.confirm("alice", id, observation)).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });
    expect(await app.events(bbox, "LIVE")).toEqual([]);
    expect((await app.profile("alice")).droplets).toBe(0);
  });
  it("denies stale upload/requeue but preserves replay of an already accepted report", async () => {
    const { app, ready, advance } = fixture();
    const accepted = await ready("alice", 1);
    await app.confirm("alice", accepted, observation);
    const pending = await ready("bob", 2, point, false);
    const draft = await app.createReport("carol", {
      action: "DRAFT",
      capturedAt: now,
      location: { ...point, source: "USER_PIN" },
    });
    advance("2026-10-09T08:00:01.000Z");
    await expect(app.completeUpload("bob", pending)).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });
    await expect(
      app.presign("carol", {
        reportId: draft.id,
        contentType: "image/jpeg",
        contentLength: 100,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    expect((await app.confirm("alice", accepted, observation)).replay).toBe(
      true,
    );
    expect((await app.profile("alice")).droplets).toBe(2);
  });
  it("saves no route or false risk result when its provider fails", async () => {
    const { app, repository } = fixture();
    vi.spyOn(app.routeProvider, "calculate").mockRejectedValue(
      new Error("private-route-diagnostic"),
    );
    await expect(
      app.saveRoute("alice", {
        name: "LOCAL failure",
        origin: point,
        destination: { ...point, lon: 77.215 },
        travelMode: "Car",
        activeAlerts: true,
      }),
    ).rejects.toThrow();
    expect(await repository.routes("alice")).toEqual([]);
    expect(await app.risks("alice")).toEqual([]);
  });
  it("excludes an expired incident from both map results and route warnings", async () => {
    const { app, ready, advance } = fixture();
    await app.saveRoute("bob", {
      name: "LOCAL expiry",
      origin: { ...point, lon: 77.205 },
      destination: { ...point, lon: 77.215 },
      travelMode: "Car",
      activeAlerts: true,
    });
    const id = await ready("alice", 1);
    const confirmed = await app.confirm("alice", id, observation);
    expect((await app.risks("bob"))[0]?.risks).toHaveLength(1);
    advance("2026-10-09T08:00:00.000Z");
    expect(await app.events(bbox, "LIVE")).toEqual([]);
    expect((await app.risks("bob"))[0]?.risks).toEqual([]);
    expect(await app.repository.getEvent(confirmed.eventId)).toBeDefined();
  });
});
describe("local report transaction", () => {
  it("leases concurrent analysis so duplicate workers do not invoke the model twice", async () => {
    const { app, ready } = fixture();
    const id = await ready("alice", 1, point, false);
    let release: (() => void) | undefined;
    let started: (() => void) | undefined;
    const running = new Promise<void>((resolve) => {
      started = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const assess = vi
      .spyOn(app.analysis, "assess")
      .mockImplementation(async (image) => {
        started?.();
        await gate;
        return new LocalAnalysis().assess(image);
      });
    const first = app.analyze(id);
    await running;
    await expect(app.analyze(id)).rejects.toMatchObject({
      code: "DEPENDENCY_UNAVAILABLE",
    });
    release?.();
    await first;
    await app.analyze(id);
    expect(assess).toHaveBeenCalledOnce();
    expect((await app.ownedReport("alice", id)).status).toBe(
      "NEEDS_CONFIRMATION",
    );
  });
  it("publishes nothing and awards nothing before human confirmation", async () => {
    const { app, ready } = fixture();
    const id = await ready("alice", 1);
    expect((await app.ownedReport("alice", id)).analysisProvenance).toBe(
      "LOCAL_DEMO",
    );
    expect(await app.events(bbox, "LIVE")).toEqual([]);
    expect((await app.profile("alice")).droplets).toBe(0);
  });
  it("double/concurrent submit produces one linked event and award", async () => {
    const { app, ready } = fixture();
    const id = await ready("alice", 1);
    const results = await Promise.all(
      Array.from({ length: 10 }, () => app.confirm("alice", id, observation)),
    );
    expect(new Set(results.map((r) => r.eventId)).size).toBe(1);
    expect(await app.events(bbox, "LIVE")).toHaveLength(1);
    expect((await app.profile("alice")).droplets).toBe(2);
  });
  it("isolates ownership and private-property observations", async () => {
    const { app, ready } = fixture();
    const id = await ready("alice", 1);
    await expect(app.ownedReport("bob", id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await app.confirm("alice", id, { ...observation, publicRoad: false });
    expect(await app.events(bbox, "LIVE")).toEqual([]);
    expect((await app.profile("alice")).droplets).toBe(0);
  });
  it("independent evidence fuses and awards once; same-user farming fails", async () => {
    const { app, ready } = fixture();
    await app.confirm("alice", await ready("alice", 1), observation);
    await expect(
      app.confirm("alice", await ready("alice", 2), observation),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    const id = await ready("bob", 3);
    await app.confirm("bob", id, observation);
    await app.confirm("bob", id, observation);
    const events = await app.events(bbox, "LIVE");
    expect(events).toHaveLength(1);
    expect(events[0]?.status).toBe("ACTIVE");
    expect((await app.profile("alice")).droplets).toBe(10);
    expect((await app.profile("bob")).droplets).toBe(7);
    expect(JSON.stringify(events)).not.toContain("supporterIds");
    expect(JSON.stringify(events)).not.toContain("mediaHashes");
  });
  it("rejects a copied evidence hash from a second identity", async () => {
    const { app, ready } = fixture();
    await app.confirm("alice", await ready("alice", 1), observation);
    await expect(
      app.confirm("bob", await ready("bob", 1), observation),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });
  it("rejects evidence replaced after upload completion without publishing or rewarding", async () => {
    const { app, ready, files } = fixture();
    const id = await ready("alice", 1);
    const key = (await app.ownedReport("alice", id)).media[0]?.s3Key;
    if (!key) throw new Error("Fixture evidence missing");
    files.set(key, new Uint8Array([1, 2, 3]));
    await expect(app.confirm("alice", id, observation)).rejects.toMatchObject({
      code: "REPORT_BAD_STATE",
    });
    expect(await app.events(bbox, "LIVE")).toEqual([]);
    expect((await app.profile("alice")).droplets).toBe(0);
  });
  it("intersects saved route and preserves owner boundaries", async () => {
    const { app, ready } = fixture();
    await app.saveRoute("bob", {
      name: "Local test",
      origin: { lat: point.lat, lon: 77.205 },
      destination: { lat: point.lat, lon: 77.215 },
      travelMode: "Car",
      activeAlerts: true,
    });
    await app.confirm("alice", await ready("alice", 1), observation);
    expect((await app.risks("bob"))[0]?.risks[0]?.warning).toBe(true);
    expect(await app.risks("alice")).toEqual([]);
  });
});
describe("conservative incident and geometry logic", () => {
  it("filters private incidents before the public response cap", async () => {
    const { app, repository } = fixture();
    for (let i = 0; i < 205; i++)
      await repository.commit({
        event: eventForObservation(
          randomUUID(),
          { ...observation, publicRoad: false },
          now,
        ),
        ledger: [],
        guards: [],
      });
    const event = eventForObservation(randomUUID(), observation, now);
    await repository.commit({ event, ledger: [], guards: [] });
    expect((await app.events(bbox, "LIVE")).map((e) => e.id)).toEqual([
      event.id,
    ]);
  });
  it("filters expiry without deleting history", () => {
    const event = eventForObservation(randomUUID(), observation, now);
    expect(isCurrent(event, now)).toBe(true);
    expect(isCurrent(event, "2026-10-09T08:00:00.000Z")).toBe(false);
    expect(event.status).toBe("UNVERIFIED");
  });
  it("requires type and time proximity; ambiguous candidates remain separate", () => {
    const first = eventForObservation(randomUUID(), observation, now);
    const second = eventForObservation(randomUUID(), observation, now);
    expect(fusionCandidate([first], observation, now)?.id).toBe(first.id);
    expect(fusionCandidate([first, second], observation, now)).toBeUndefined();
    expect(
      fusionCandidate([first], { ...observation, category: "LEAK" }, now),
    ).toBeUndefined();
  });
  it("matches the middle of a segment rather than only vertices", () => {
    const points = [
      [77.2, 28.6139],
      [77.22, 28.6139],
    ] as [number, number][];
    expect(routeDistanceM(point, points)).toBeLessThan(1);
    expect(decodePolyline(encodePolyline(points))).toEqual(points);
    const event = eventForObservation(randomUUID(), observation, now);
    const route = {
      id: randomUUID(),
      userId: "bob",
      name: "route",
      source: "MANUAL" as const,
      polyline: encodePolyline(points),
      bbox: [...bbox] as [number, number, number, number],
      activeAlerts: true,
      corridorWidthM: 30,
    };
    expect(routeRisk(route, event, now).warning).toBe(true);
    expect(
      routeRisk({ ...route, activeAlerts: false }, event, now).warning,
    ).toBe(false);
    expect(publicEvent(event).attributes).toEqual({ publicRoad: true });
  });
  it("rejects malformed polyline", () => {
    expect(() => decodePolyline("~")).toThrow();
  });
});

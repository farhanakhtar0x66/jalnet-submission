import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
  LedgerEntry,
  SavedRoute,
  WaterEvent,
} from "../../packages/contracts/src/events.js";
import type { Report } from "../../packages/contracts/src/index.js";
import { distanceM, type Point } from "../../packages/geo/src/index.js";
import type { Commit, Repository } from "../core/ports.js";

export interface LocalState {
  counters: Record<string, number>;
  reports: Report[];
  events: WaterEvent[];
  routes: SavedRoute[];
  ledger: LedgerEntry[];
}
export class LocalRepository implements Repository {
  private state: LocalState = {
    counters: {},
    reports: [],
    events: [],
    routes: [],
    ledger: [],
  };
  private tail: Promise<unknown> = Promise.resolve();
  constructor(private readonly path?: string) {}
  async load() {
    if (!this.path) return;
    try {
      this.state = JSON.parse(await readFile(this.path, "utf8")) as LocalState;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  private async mutate<T>(operation: (state: LocalState) => T): Promise<T> {
    const task = this.tail.then(async () => {
      const next = structuredClone(this.state);
      const result = operation(next);
      if (this.path) {
        await mkdir(dirname(this.path), { recursive: true });
        await writeFile(`${this.path}.tmp`, JSON.stringify(next));
        await rename(`${this.path}.tmp`, this.path);
      }
      this.state = next;
      return result;
    });
    this.tail = task.catch(() => undefined); // Caller still receives the failure; queue remains usable.
    return task;
  }
  async getReport(id: string) {
    await this.tail;
    return structuredClone(this.state.reports.find((r) => r.id === id));
  }
  async putReport(report: Report, expected?: Report["status"]) {
    return this.mutate((state) => {
      const current = state.reports.find((r) => r.id === report.id);
      if (expected ? current?.status !== expected : current !== undefined)
        return false;
      state.reports = state.reports
        .filter((r) => r.id !== report.id)
        .concat(report);
      return true;
    });
  }
  async getEvent(id: string) {
    await this.tail;
    return structuredClone(this.state.events.find((e) => e.id === id));
  }
  async nearby(point: Point, radiusM: number) {
    await this.tail;
    return structuredClone(
      this.state.events.filter((e) => distanceM(point, e.location) <= radiusM),
    );
  }
  async viewport([west, south, east, north]: readonly [
    number,
    number,
    number,
    number,
  ]) {
    await this.tail;
    return structuredClone(
      this.state.events.filter(
        (e) =>
          e.location.lon >= west &&
          e.location.lon <= east &&
          e.location.lat >= south &&
          e.location.lat <= north,
      ),
    );
  }
  async commit(change: Commit) {
    return this.mutate((state) => {
      if (
        change.report &&
        state.reports.find((r) => r.id === change.report?.id)?.status !==
          change.expectedReportStatus
      )
        return false;
      if (
        change.event &&
        (state.events.find((e) => e.id === change.event?.id)?.reportCount ??
          0) !== (change.expectedEventCount ?? 0)
      )
        return false;
      if (
        change.ledger.some((entry) =>
          state.ledger.some(
            (existing) => existing.idempotencyKey === entry.idempotencyKey,
          ),
        )
      )
        return false;
      if (
        change.guards.some((g) => (state.counters[g.key] ?? 0) !== g.expected)
      )
        return false;
      if (
        change.event &&
        (state.events.find((e) => e.id === change.event?.id)?.attributes
          .revision ?? 0) !== (change.expectedEventRevision ?? 0)
      )
        return false;
      if (change.report)
        state.reports = state.reports
          .filter((r) => r.id !== change.report?.id)
          .concat(change.report);
      if (change.event)
        state.events = state.events
          .filter((e) => e.id !== change.event?.id)
          .concat(change.event);
      for (const g of change.guards) state.counters[g.key] = g.value;
      state.ledger.push(...change.ledger);
      return true;
    });
  }
  async counter(key: string) {
    await this.tail;
    return this.state.counters[key] ?? 0;
  }
  async routes(userId: string) {
    await this.tail;
    return structuredClone(
      this.state.routes.filter((r) => r.userId === userId),
    );
  }
  async saveRoute(route: SavedRoute) {
    await this.mutate((s) => {
      s.routes = s.routes.filter((r) => r.id !== route.id).concat(route);
    });
  }
  async deleteRoute(userId: string, id: string) {
    await this.mutate((s) => {
      s.routes = s.routes.filter((r) => !(r.id === id && r.userId === userId));
    });
  }
  async ledger(userId: string) {
    await this.tail;
    return structuredClone(
      this.state.ledger.filter((e) => e.userId === userId),
    );
  }
}

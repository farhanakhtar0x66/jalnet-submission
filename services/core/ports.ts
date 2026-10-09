import type {
  LedgerEntry,
  SavedRoute,
  WaterEvent,
} from "../../packages/contracts/src/events.js";
import type {
  MediaAssessment,
  Report,
} from "../../packages/contracts/src/index.js";
import type { Point } from "../../packages/geo/src/index.js";

export const reportActions = [
  "ReadReport",
  "PresignReport",
  "CompleteUpload",
  "ConfirmReport",
] as const;
export type ReportAction = (typeof reportActions)[number];
export interface ReportAuthorizationRequest {
  readonly principalId: string;
  readonly action: ReportAction;
  readonly reportId: string;
  readonly ownerId: string;
}
export interface ReportAuthorizer {
  authorize(request: ReportAuthorizationRequest): Promise<"ALLOW" | "DENY">;
}

export interface Commit {
  report?: Report;
  expectedReportStatus?: Report["status"];
  event?: WaterEvent;
  expectedEventCount?: number;
  expectedEventRevision?: number;
  ledger: LedgerEntry[];
  guards: { key: string; expected: number; value: number }[];
}
export interface Repository {
  getReport(id: string): Promise<Report | undefined>;
  putReport(report: Report, expected?: Report["status"]): Promise<boolean>;
  getEvent(id: string): Promise<WaterEvent | undefined>;
  nearby(point: Point, radiusM: number): Promise<WaterEvent[]>;
  viewport(
    bbox: readonly [number, number, number, number],
  ): Promise<WaterEvent[]>;
  commit(change: Commit): Promise<boolean>;
  routes(userId: string): Promise<SavedRoute[]>;
  saveRoute(route: SavedRoute): Promise<void>;
  deleteRoute(userId: string, id: string): Promise<void>;
  ledger(userId: string): Promise<LedgerEntry[]>;
  counter(key: string): Promise<number>;
}
export interface EvidenceProvider {
  presign(
    key: string,
    size: number,
  ): Promise<{ url: string; expiresIn: number }>;
  read(key: string): Promise<Uint8Array>;
}
export interface AnalysisProvider {
  readonly provenance: "AWS_UNVERIFIED" | "LOCAL_DEMO";
  assess(image: Uint8Array): Promise<MediaAssessment>;
}
export interface RouteProvider {
  readonly provenance: "AWS_UNVERIFIED" | "LOCAL_DEMO";
  calculate(
    origin: Point,
    destination: Point,
    mode: "Car" | "Pedestrian" | "Scooter",
  ): Promise<{
    geometry: [number, number][];
    distanceM: number;
    durationSec: number;
  }>;
}

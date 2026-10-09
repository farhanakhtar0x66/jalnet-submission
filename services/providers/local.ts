import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { distanceM, type Point } from "../../packages/geo/src/index.js";
import type {
  AnalysisProvider,
  EvidenceProvider,
  RouteProvider,
} from "../core/ports.js";

export class LocalEvidence implements EvidenceProvider {
  private grants = new Map<
    string,
    { key: string; size: number; expires: number }
  >();
  constructor(
    private readonly directory: string,
    private readonly baseUrl: string,
  ) {}
  async presign(key: string, size: number) {
    const nonce = randomUUID();
    this.grants.set(nonce, { key, size, expires: Date.now() + 300_000 });
    return { url: `${this.baseUrl}/local/evidence/${nonce}`, expiresIn: 300 };
  }
  async upload(nonce: string, data: Uint8Array) {
    const grant = this.grants.get(nonce);
    if (!grant || grant.expires < Date.now() || data.length !== grant.size)
      throw new Error("Invalid or expired LOCAL/DEMO upload grant");
    await mkdir(this.directory, { recursive: true });
    await writeFile(join(this.directory, encodeURIComponent(grant.key)), data);
    this.grants.delete(nonce);
  }
  async read(key: string) {
    return new Uint8Array(
      await readFile(join(this.directory, encodeURIComponent(key))),
    );
  }
}
export class LocalAnalysis implements AnalysisProvider {
  readonly provenance = "LOCAL_DEMO" as const;
  async assess(_image: Uint8Array) {
    return {
      relevant: false,
      category: "UNCERTAIN" as const,
      visualSeverity: "UNKNOWN" as const,
      evidence: [],
      modelConfidence: 0,
      uncertaintyReasons: [
        "LOCAL/DEMO provider does not interpret images; use manual classification.",
      ],
      publicDraft:
        "Awaiting human classification. No AWS analysis has been performed.",
    };
  }
}
export class LocalRoutes implements RouteProvider {
  readonly provenance = "LOCAL_DEMO" as const;
  async calculate(origin: Point, destination: Point) {
    return {
      geometry: [
        [origin.lon, origin.lat],
        [destination.lon, destination.lat],
      ] as [number, number][],
      distanceM: distanceM(origin, destination),
      durationSec: 0,
    };
  }
}

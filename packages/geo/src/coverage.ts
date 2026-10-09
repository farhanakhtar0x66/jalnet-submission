import { getHexagonEdgeLengthAvg, gridDisk, latLngToCell } from "h3-js";
import type { Point } from "./index.js";

// Query all overlapping coarse cells including boundaries, then exact-filter points.
// Reject oversized requests instead of scanning the table or dropping candidate cells.
export function coveringCells(point: Point, radiusM: number): string[] {
  const rings = Math.ceil(radiusM / getHexagonEdgeLengthAvg(8, "m")) + 2;
  const cells = gridDisk(latLngToCell(point.lat, point.lon, 8), rings);
  if (cells.length > 512) throw new Error("Spatial request exceeds 512 cells");
  return cells;
}
export function viewportCells([w, s, e, n]: readonly [
  number,
  number,
  number,
  number,
]): string[] {
  if (w >= e || s >= n || (e - w) * (n - s) > 0.04)
    throw new Error("Viewport exceeds bounds");
  const cells = new Set<string>();
  // Dense sampling plus a neighboring ring covers small urban viewports (<= 0.04 deg²).
  for (let lat = s; lat <= n + 0.002; lat += 0.002)
    for (let lon = w; lon <= e + 0.002; lon += 0.002) {
      for (const cell of gridDisk(
        latLngToCell(Math.min(lat, n), Math.min(lon, e), 8),
        1,
      ))
        cells.add(cell);
      if (cells.size > 512)
        throw new Error("Viewport exceeds 512 spatial cells");
    }
  return [...cells];
}

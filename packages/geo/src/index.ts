export interface Point {
  lat: number;
  lon: number;
}
const earthRadiusM = 6_371_000;
const radians = (degrees: number) => (degrees * Math.PI) / 180;
export function radiusRing(point: Point, radiusM: number): [number, number][] {
  const lat = radians(point.lat),
    lon = radians(point.lon),
    angular = radiusM / earthRadiusM;
  const ring: [number, number][] = [];
  for (let i = 0; i < 32; i++) {
    const bearing = (2 * Math.PI * i) / 32;
    const y = Math.asin(
      Math.sin(lat) * Math.cos(angular) +
        Math.cos(lat) * Math.sin(angular) * Math.cos(bearing),
    );
    const x =
      lon +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angular) * Math.cos(lat),
        Math.cos(angular) - Math.sin(lat) * Math.sin(y),
      );
    ring.push([(((x * 180) / Math.PI + 540) % 360) - 180, (y * 180) / Math.PI]);
  }
  const first = ring[0];
  if (first) ring.push([...first]);
  return ring;
}
export function distanceM(a: Point, b: Point): number {
  const h =
    Math.sin(radians(b.lat - a.lat) / 2) ** 2 +
    Math.cos(radians(a.lat)) *
      Math.cos(radians(b.lat)) *
      Math.sin(radians(b.lon - a.lon) / 2) ** 2;
  return 2 * earthRadiusM * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function segmentDistanceM(point: Point, a: Point, b: Point): number {
  const scale = Math.cos(radians(point.lat));
  const project = (p: Point) =>
    [
      radians(p.lon - point.lon) * earthRadiusM * scale,
      radians(p.lat - point.lat) * earthRadiusM,
    ] as const;
  const [ax, ay] = project(a);
  const [bx, by] = project(b);
  const dx = bx - ax;
  const dy = by - ay;
  const denominator = dx * dx + dy * dy;
  const t =
    denominator === 0
      ? 0
      : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / denominator));
  return Math.hypot(ax + t * dx, ay + t * dy);
}
export function routeDistanceM(
  point: Point,
  geometry: readonly (readonly [number, number])[],
): number {
  if (geometry.length < 2) return Infinity;
  let result = Infinity;
  for (let i = 1; i < geometry.length; i++) {
    const a = geometry[i - 1];
    const b = geometry[i];
    if (!a || !b) continue;
    result = Math.min(
      result,
      segmentDistanceM(
        point,
        { lon: a[0], lat: a[1] },
        { lon: b[0], lat: b[1] },
      ),
    );
  }
  return result;
}
// SavedRoute §8.4 stores Google's encoded polyline. Convert provider LineString explicitly.
export function encodePolyline(
  points: readonly (readonly [number, number])[],
): string {
  let result = "";
  let lat = 0;
  let lon = 0;
  function encode(value: number) {
    let n = value < 0 ? ~(value << 1) : value << 1;
    let out = "";
    while (n >= 0x20) {
      out += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
      n >>= 5;
    }
    return out + String.fromCharCode(n + 63);
  }
  for (const [x, y] of points) {
    const nextLat = Math.round(y * 1e5);
    const nextLon = Math.round(x * 1e5);
    result += encode(nextLat - lat) + encode(nextLon - lon);
    lat = nextLat;
    lon = nextLon;
  }
  return result;
}
export function decodePolyline(value: string): [number, number][] {
  const points: [number, number][] = [];
  let offset = 0;
  let lat = 0;
  let lon = 0;
  function decode() {
    let n = 0;
    let shift = 0;
    let byte: number;
    do {
      if (offset >= value.length || shift > 30)
        throw new Error("Invalid polyline");
      byte = value.charCodeAt(offset++) - 63;
      if (byte < 0 || byte > 63) throw new Error("Invalid polyline");
      n |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32);
    return n & 1 ? ~(n >> 1) : n >> 1;
  }
  while (offset < value.length) {
    lat += decode();
    lon += decode();
    if (Math.abs(lat) > 85e5 || Math.abs(lon) > 180e5)
      throw new Error("Invalid polyline coordinate");
    points.push([lon / 1e5, lat / 1e5]);
    if (points.length > 50_000) throw new Error("Polyline too large");
  }
  return points;
}

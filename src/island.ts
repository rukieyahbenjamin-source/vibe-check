import type { Point } from "./types";

// The grass top of the island is drawn from these curves. The same curves are sampled into a
// polygon for placement checks, so what you see and what the game allows always agree.
// Each entry is a cubic Bezier: [start, control 1, control 2, end]. The shape is convex.
const GRASS_CURVES: [Point, Point, Point, Point][] = [
  [{ x: 70, y: 292 }, { x: 70, y: 222 }, { x: 170, y: 178 }, { x: 320, y: 178 }],
  [{ x: 320, y: 178 }, { x: 470, y: 178 }, { x: 570, y: 222 }, { x: 570, y: 292 }],
  [{ x: 570, y: 292 }, { x: 570, y: 318 }, { x: 450, y: 326 }, { x: 320, y: 326 }],
  [{ x: 320, y: 326 }, { x: 190, y: 326 }, { x: 70, y: 318 }, { x: 70, y: 292 }],
];

/** The SVG path for the grass top. IslandScene draws this, so the drawing uses the same curves. */
export const GRASS_PATH = [
  "M70 292",
  ...GRASS_CURVES.map(
    ([, c1, c2, end]) => `C${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`,
  ),
  "Z",
].join(" ");

const SAMPLES_PER_CURVE = 24;

function sampleCurve([p0, p1, p2, p3]: [Point, Point, Point, Point]): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < SAMPLES_PER_CURVE; i += 1) {
    const t = i / SAMPLES_PER_CURVE;
    const u = 1 - t;
    points.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return points;
}

/** The grass outline as a polygon (clockwise on screen). */
export const GRASS_POLYGON: Point[] = GRASS_CURVES.flatMap(sampleCurve);

/** Returns true when the point is inside or on the grass polygon. */
export function isPlaceable(point: Point): boolean {
  return containsPoint(GRASS_POLYGON, point);
}

/**
 * Point-in-polygon for a convex polygon: the point must be on the same side of every edge.
 * Points within a tiny tolerance of an edge count as inside.
 */
export function containsPoint(polygon: Point[], point: Point): boolean {
  const sign = Math.sign(signedArea(polygon)) || 1;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
    if (cross * sign < -1e-9) {
      return false;
    }
  }
  return true;
}

/** Shortest distance from a point to the boundary of a polygon. */
export function distanceToEdges(polygon: Point[], point: Point): number {
  let best = Infinity;
  for (let i = 0; i < polygon.length; i += 1) {
    best = Math.min(best, distanceToSegment(point, polygon[i], polygon[(i + 1) % polygon.length]));
  }
  return best;
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function signedArea(polygon: Point[]): number {
  let total = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    total += a.x * b.y - b.x * a.y;
  }
  return total / 2;
}

/** Fixed scenery that player objects must respect. Positions match the drawing in IslandScene. */
// blocksAll: nothing may overlap the cottage at all. Trees only block objects that would collide
// with them, so flowers and ground cover can still sit under a tree.
export const FIXED_OBSTACLES: { label: string; layer: "solid"; blocksAll: boolean; shape: FixedShape }[] = [
  { label: "cottage", layer: "solid", blocksAll: true, shape: { kind: "box", x0: 270, y0: 140, x1: 402, y1: 262 } },
  { label: "tree", layer: "solid", blocksAll: false, shape: { kind: "circle", cx: 168, cy: 258, r: 10 } },
  { label: "tree", layer: "solid", blocksAll: false, shape: { kind: "circle", cx: 486, cy: 254, r: 12 } },
];

export type FixedShape =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "box"; x0: number; y0: number; x1: number; y1: number };

import { DECORATIONS } from "./catalogue";
import { containsPoint, distanceToEdges, FIXED_OBSTACLES, GRASS_POLYGON } from "./island";
import type { FixedShape } from "./island";
import type { DecorationKind, Layer, Placement, Point } from "./types";

// Footprints decide where objects can go. Shapes are axis-aligned after rotation, which is exact
// for the 90 degree turns the game allows. Touching edges is allowed; only real overlap blocks.

export type Shape = FixedShape;

/** Rotates an offset by a whole number of 90 degree turns, matching SVG's rotate(). */
export function rotateOffset(dx: number, dy: number, rotation: number): [number, number] {
  const quarter = (((Math.round(rotation / 90) % 4) + 4) % 4);
  let turned: [number, number];
  switch (quarter) {
    case 1:
      turned = [-dy, dx];
      break;
    case 2:
      turned = [-dx, -dy];
      break;
    case 3:
      turned = [dy, -dx];
      break;
    default:
      turned = [dx, dy];
  }
  // Adding 0 turns -0 into 0, so results compare cleanly.
  return [turned[0] + 0, turned[1] + 0];
}

/** The absolute shape an object occupies when it is anchored at `point` with `rotation`. */
export function footprintShape(kind: DecorationKind, point: Point, rotation: number): Shape {
  const footprint = DECORATIONS[kind].footprint;
  const [dx, dy] = rotateOffset(footprint.dx, footprint.dy, rotation);
  const cx = point.x + dx;
  const cy = point.y + dy;
  if (footprint.shape === "circle") {
    return { kind: "circle", cx, cy, r: footprint.r };
  }
  const quarterTurn = Math.round(rotation / 90) % 2 !== 0;
  const w = quarterTurn ? footprint.h : footprint.w;
  const h = quarterTurn ? footprint.w : footprint.h;
  return { kind: "box", x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 };
}

export function boundsOf(shape: Shape): { x0: number; y0: number; x1: number; y1: number } {
  if (shape.kind === "circle") {
    return { x0: shape.cx - shape.r, y0: shape.cy - shape.r, x1: shape.cx + shape.r, y1: shape.cy + shape.r };
  }
  return shape;
}

export function overlaps(a: Shape, b: Shape): boolean {
  if (a.kind === "circle" && b.kind === "circle") {
    return Math.hypot(a.cx - b.cx, a.cy - b.cy) < a.r + b.r;
  }
  if (a.kind === "box" && b.kind === "box") {
    return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  }
  const circle = a.kind === "circle" ? a : (b as Extract<Shape, { kind: "circle" }>);
  const box = a.kind === "box" ? a : (b as Extract<Shape, { kind: "box" }>);
  const nearestX = Math.max(box.x0 - circle.cx, 0, circle.cx - box.x1);
  const nearestY = Math.max(box.y0 - circle.cy, 0, circle.cy - box.y1);
  return nearestX * nearestX + nearestY * nearestY < circle.r * circle.r;
}

/**
 * True when the whole shape lies inside the island's visible grass. The grass is convex, so a box
 * is inside exactly when its four corners are, and a circle is inside when its centre is inside and
 * it is at least its radius away from every edge.
 */
export function insideIsland(shape: Shape): boolean {
  if (shape.kind === "circle") {
    const centre = { x: shape.cx, y: shape.cy };
    return containsPoint(GRASS_POLYGON, centre) && distanceToEdges(GRASS_POLYGON, centre) >= shape.r;
  }
  const corners = [
    { x: shape.x0, y: shape.y0 },
    { x: shape.x1, y: shape.y0 },
    { x: shape.x1, y: shape.y1 },
    { x: shape.x0, y: shape.y1 },
  ];
  return corners.every((corner) => containsPoint(GRASS_POLYGON, corner));
}

// Which layers may overlap. Anything not listed here collides.
const ALLOWED_OVERLAPS: [Layer, Layer][] = [
  ["ground", "ground"],
  ["ground", "solid"],
  ["ground", "water-plant"],
  ["ground", "bridge"],
  ["water-plant", "water"],
  ["water-plant", "water-plant"],
  ["water-plant", "bridge"],
  ["bridge", "water"],
];

export function canOverlap(a: Layer, b: Layer): boolean {
  return ALLOWED_OVERLAPS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export type PlacementIssue =
  | { type: "off-island" }
  | { type: "collision"; with: string };

/**
 * Checks whether an object could sit at `point` with `rotation`. `ignoreId` skips the object
 * being moved or rotated, so it does not collide with its own old position.
 */
export function findIssue(
  placements: Placement[],
  kind: DecorationKind,
  point: Point,
  rotation: number,
  ignoreId?: number,
): PlacementIssue | null {
  const shape = footprintShape(kind, point, rotation);
  if (!insideIsland(shape)) {
    return { type: "off-island" };
  }
  const layer = DECORATIONS[kind].layer;

  for (const obstacle of FIXED_OBSTACLES) {
    if (overlaps(shape, obstacle.shape) && (obstacle.blocksAll || !canOverlap(layer, obstacle.layer))) {
      return { type: "collision", with: obstacle.label };
    }
  }

  for (const other of placements) {
    if (other.id === ignoreId) {
      continue;
    }
    const otherShape = footprintShape(other.kind, other, other.rotation);
    const otherLayer = DECORATIONS[other.kind].layer;
    if (overlaps(shape, otherShape) && !canOverlap(layer, otherLayer)) {
      return { type: "collision", with: DECORATIONS[other.kind].name.toLowerCase() };
    }
  }

  return null;
}

/** A short, friendly reason for a placement issue. */
export function issueMessage(issue: PlacementIssue): string {
  if (issue.type === "off-island") {
    return "it would not fit on the grass";
  }
  return `it would overlap the ${issue.with}`;
}

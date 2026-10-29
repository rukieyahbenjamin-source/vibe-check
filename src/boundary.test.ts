import { describe, expect, it } from "vitest";
import { findIssue, footprintShape, insideIsland, rotateOffset } from "./footprint";
import type { Shape } from "./footprint";
import { addPlacement, movePlacement, placementIssue, rotatePlacement } from "./decorating";
import { containsPoint, distanceToEdges, GRASS_PATH, GRASS_POLYGON, isPlaceable } from "./island";
import type { Point } from "./types";

const circle = (cx: number, cy: number, r: number): Shape => ({ kind: "circle", cx, cy, r });
const box = (x0: number, y0: number, x1: number, y1: number): Shape => ({ kind: "box", x0, y0, x1, y1 });
const CENTRE: Point = { x: 320, y: 252 };

describe("the visible grass is the playable area", () => {
  it("shares one outline between the drawing and the validator", () => {
    expect(GRASS_PATH.startsWith("M70 292")).toBe(true);
    expect(GRASS_POLYGON.length).toBeGreaterThan(50);
  });

  it("accepts points well inside the rounded grass", () => {
    expect(isPlaceable(CENTRE)).toBe(true);
    expect(isPlaceable({ x: 320, y: 200 })).toBe(true);
  });

  it("rejects points above the rounded top and outside the sides", () => {
    expect(isPlaceable({ x: 320, y: 170 })).toBe(false);
    expect(isPlaceable({ x: 60, y: 292 })).toBe(false);
    expect(isPlaceable({ x: 320, y: 340 })).toBe(false);
  });

  it("rejects the empty corners that the old rectangle wrongly allowed", () => {
    // These sit inside the old 90..550 x 190..318 rectangle but outside the rounded grass.
    expect(isPlaceable({ x: 96, y: 196 })).toBe(false);
    expect(isPlaceable({ x: 544, y: 196 })).toBe(false);
    expect(isPlaceable({ x: 96, y: 314 })).toBe(false);
  });

  it("treats a point on the outline as inside", () => {
    expect(containsPoint(GRASS_POLYGON, { x: 320, y: 178 })).toBe(true);
  });
});

describe("circles at the edge", () => {
  it("accepts a circle that stays inside every edge, and refuses one that crosses any edge", () => {
    for (const vertex of GRASS_POLYGON.filter((_, index) => index % 4 === 0)) {
      // Move a little inwards from the outline. A small circle there must fit.
      const inward = {
        x: vertex.x + (CENTRE.x - vertex.x) * 0.08,
        y: vertex.y + (CENTRE.y - vertex.y) * 0.08,
      };
      const clearance = distanceToEdges(GRASS_POLYGON, inward);
      if (clearance > 1.5) {
        expect(insideIsland(circle(inward.x, inward.y, 1.5)), `inward of ${vertex.x},${vertex.y}`).toBe(true);
      }

      // A circle that centres on the outline must be refused, whatever its size.
      expect(insideIsland(circle(vertex.x, vertex.y, 2)), `on ${vertex.x},${vertex.y}`).toBe(false);
    }
  });

  it("uses the exact distance to the curve, so a circle right at the limit fits and one slightly over does not", () => {
    const centre = { x: 320, y: 220 };
    const clearance = distanceToEdges(GRASS_POLYGON, centre);

    expect(insideIsland(circle(centre.x, centre.y, clearance - 0.5))).toBe(true);
    expect(insideIsland(circle(centre.x, centre.y, clearance + 0.5))).toBe(false);
  });

  it("refuses a circle in a rounded corner that a rectangle would have accepted", () => {
    expect(insideIsland(circle(100, 200, 6))).toBe(false);
  });
});

describe("boxes at the edge", () => {
  it("refuses a box whose corner reaches past the curve", () => {
    expect(insideIsland(box(90, 240, 130, 280))).toBe(false);
  });

  it("accepts a box whose four corners are all on the grass", () => {
    expect(insideIsland(box(200, 230, 260, 260))).toBe(true);
  });

  it("checks rotated boxes by their turned footprint", () => {
    // A box 60 wide and 26 high, near the bottom, fits flat but not turned upright.
    const flat = footprintShape("flower-meadow", { x: 320, y: 310 }, 0);
    const upright = footprintShape("flower-meadow", { x: 320, y: 310 }, 90);

    expect(insideIsland(flat)).toBe(true);
    expect(insideIsland(upright)).toBe(false);
  });
});

describe("larger objects near the edge", () => {
  it("refuses a large pond whose corner would reach a rounded corner", () => {
    expect(findIssue([], "pond-natural", { x: 130, y: 290 }, 0)).toEqual({ type: "off-island" });
  });

  it("accepts a pond placed well inside the grass", () => {
    expect(findIssue([], "pond-small", { x: 180, y: 290 }, 0)).toBeNull();
  });

  it("keeps the placement preview and the validator in agreement at many points", () => {
    for (let x = 60; x <= 580; x += 20) {
      for (let y = 170; y <= 340; y += 10) {
        const issue = findIssue([], "flower", { x, y }, 0);
        const offIsland = issue?.type === "off-island";
        const shape = footprintShape("flower", { x, y }, 0);
        expect(offIsland, `${x},${y}`).toBe(!insideIsland(shape));
      }
    }
  });

  it("refuses to move a pond to a spot where its footprint would leave the grass", () => {
    const placements = addPlacement([], "pond-small", { x: 180, y: 290 });
    expect(placements).not.toBeNull();

    expect(movePlacement(placements ?? [], 1, { x: 120, y: 300 })).toBeNull();
    expect(movePlacement(placements ?? [], 1, { x: 180, y: 290 })).not.toBeNull();
  });

  it("refuses a rotation that would leave the grass and keeps the original", () => {
    const meadow = addPlacement([], "flower-meadow", { x: 400, y: 300 }) ?? [];

    expect(rotatePlacement(meadow, 1)).toBeNull();
    expect(placementIssue(meadow, "flower-meadow", { x: 400, y: 300 }, 90, 1)).not.toBeNull();
  });
});

describe("rotation helpers", () => {
  it("turns offsets exactly by quarter turns", () => {
    expect(rotateOffset(3, 4, 90)).toEqual([-4, 3]);
  });
});

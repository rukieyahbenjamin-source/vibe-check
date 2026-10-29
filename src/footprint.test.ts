import { describe, expect, it } from "vitest";
import { DECORATIONS } from "./catalogue";
import {
  canOverlap,
  findIssue,
  footprintShape,
  insideIsland,
  overlaps,
  rotateOffset,
} from "./footprint";
import type { Shape } from "./footprint";
import { addPlacement, movePlacement, placementIssue, rotatePlacement } from "./decorating";
import type { DecorationKind, Placement } from "./types";

const circle = (cx: number, cy: number, r: number): Shape => ({ kind: "circle", cx, cy, r });
const box = (x0: number, y0: number, x1: number, y1: number): Shape => ({ kind: "box", x0, y0, x1, y1 });

/** Builds a placement with an id, so tests can refer to it. */
function place(id: number, kind: DecorationKind, x: number, y: number, rotation = 0): Placement {
  return { id, kind, x, y, rotation };
}

describe("rotating footprints", () => {
  it("turns an offset a quarter at a time, the same way the picture rotates", () => {
    expect(rotateOffset(0, -10, 0)).toEqual([0, -10]);
    expect(rotateOffset(0, -10, 90)).toEqual([10, 0]);
    expect(rotateOffset(0, -10, 180)).toEqual([0, 10]);
    expect(rotateOffset(0, -10, 270)).toEqual([-10, 0]);
    expect(rotateOffset(0, -10, 360)).toEqual([0, -10]);
  });

  it("swaps a box's width and height on a quarter turn", () => {
    const flat = footprintShape("stream-straight", { x: 400, y: 290 }, 0);
    const upright = footprintShape("stream-straight", { x: 400, y: 290 }, 90);

    expect(flat).toEqual(box(340, 279, 460, 301));
    expect(upright).toEqual(box(389, 230, 411, 350));
  });

  it("keeps a circle the same size when it turns", () => {
    expect(footprintShape("tree", { x: 200, y: 290 }, 90)).toEqual(circle(204, 290, 10));
  });
});

describe("overlap", () => {
  it("treats circles as overlapping only when they really overlap", () => {
    expect(overlaps(circle(0, 0, 10), circle(12, 0, 4))).toBe(true);
    expect(overlaps(circle(0, 0, 10), circle(20, 0, 10))).toBe(false);
  });

  it("treats boxes as overlapping only when they really overlap, and edges that touch are fine", () => {
    expect(overlaps(box(0, 0, 10, 10), box(5, 5, 15, 15))).toBe(true);
    expect(overlaps(box(0, 0, 10, 10), box(10, 0, 20, 10))).toBe(false);
  });

  it("checks a circle against a box by its nearest point", () => {
    expect(overlaps(circle(15, 5, 6), box(0, 0, 10, 10))).toBe(true);
    expect(overlaps(circle(20, 20, 6), box(0, 0, 10, 10))).toBe(false);
  });
});

describe("island boundary", () => {
  it("accepts a shape inside the grass", () => {
    expect(insideIsland(circle(200, 260, 10))).toBe(true);
  });

  it("rejects a shape that reaches past the grass edge", () => {
    expect(insideIsland(circle(200, 195, 10))).toBe(false);
    expect(insideIsland(circle(89, 250, 5))).toBe(false);
  });

  it("accepts a box that fits within the grass", () => {
    expect(insideIsland(box(120, 250, 170, 280))).toBe(true);
  });

  it("refuses a box that reaches into a rounded corner, even if it is inside the old rectangle", () => {
    expect(insideIsland(box(92, 200, 140, 240))).toBe(false);
  });
});

describe("layer rules", () => {
  it("lets ground decoration sit under solids, paths and water plants", () => {
    expect(canOverlap("ground", "solid")).toBe(true);
    expect(canOverlap("ground", "ground")).toBe(true);
    expect(canOverlap("ground", "water-plant")).toBe(true);
  });

  it("keeps solids out of water and off each other", () => {
    expect(canOverlap("solid", "water")).toBe(false);
    expect(canOverlap("solid", "solid")).toBe(false);
    expect(canOverlap("solid", "bridge")).toBe(false);
  });

  it("keeps ground decoration out of ponds, but lets water plants and bridges sit on water", () => {
    expect(canOverlap("ground", "water")).toBe(false);
    expect(canOverlap("water-plant", "water")).toBe(true);
    expect(canOverlap("bridge", "water")).toBe(true);
  });

  it("stops two ponds or streams from overlapping", () => {
    expect(canOverlap("water", "water")).toBe(false);
  });

  it("gives every catalogue entry a layer and a footprint", () => {
    for (const item of Object.values(DECORATIONS)) {
      expect(["ground", "solid", "water", "water-plant", "bridge"]).toContain(item.layer);
      expect(item.footprint.shape === "circle" ? item.footprint.r : item.footprint.w).toBeGreaterThan(0);
    }
  });
});

describe("placement collisions", () => {
  it("accepts a flower on open grass", () => {
    expect(findIssue([], "flower", { x: 200, y: 290 }, 0)).toBeNull();
  });

  it("refuses a tree that would sit on the cottage", () => {
    expect(findIssue([], "tree", { x: 300, y: 250 }, 0)).toEqual({ type: "collision", with: "cottage" });
  });

  it("refuses a pond placed over a fixed tree", () => {
    expect(findIssue([], "pond-small", { x: 200, y: 250 }, 0)).toEqual({ type: "collision", with: "tree" });
  });

  it("refuses a pond that reaches past the island edge", () => {
    expect(findIssue([], "pond-small", { x: 200, y: 310 }, 0)).toEqual({ type: "off-island" });
  });

  it("lets a pond sit next to a flower, but not on top of one", () => {
    const flowers = [place(1, "flower", 400, 290)];

    expect(findIssue(flowers, "pond-small", { x: 480, y: 290 }, 0)).toBeNull();
    expect(findIssue(flowers, "pond-small", { x: 410, y: 290 }, 0)).toEqual({ type: "collision", with: "flower" });
  });

  it("lets lily pads and bridges sit on a pond", () => {
    const ponds = [place(1, "pond-small", 400, 290)];

    expect(findIssue(ponds, "lily-pads", { x: 395, y: 292 }, 0)).toBeNull();
    expect(findIssue(ponds, "wood-bridge", { x: 400, y: 290 }, 0)).toBeNull();
  });

  it("refuses a bench or tree in a pond", () => {
    const ponds = [place(1, "pond-small", 400, 290)];

    expect(findIssue(ponds, "tree", { x: 400, y: 290 }, 0)).toEqual({ type: "collision", with: "small pond" });
  });

  it("refuses two ponds that overlap", () => {
    const ponds = [place(1, "pond-small", 400, 290)];

    expect(findIssue(ponds, "pond-natural", { x: 420, y: 290 }, 0)).toEqual({ type: "collision", with: "small pond" });
  });

  it("lets objects sit side by side without overlapping", () => {
    const trees = [place(1, "tree", 200, 290)];

    expect(findIssue(trees, "bench", { x: 240, y: 300 }, 0)).toBeNull();
  });

  it("ignores the object being moved, so it does not collide with its old position", () => {
    const trees = [place(1, "tree", 200, 290)];

    expect(findIssue(trees, "tree", { x: 206, y: 290 }, 0, 1)).toBeNull();
    expect(findIssue(trees, "tree", { x: 206, y: 290 }, 0)).toEqual({ type: "collision", with: "tree" });
  });

  it("keeps everything off the cottage, including ground decoration", () => {
    expect(findIssue([], "flower", { x: 300, y: 250 }, 0)).toEqual({ type: "collision", with: "cottage" });
  });

  it("lets ground decoration sit under a fixed tree", () => {
    expect(findIssue([], "flower", { x: 168, y: 262 }, 0)).toBeNull();
  });
});

describe("placing through the decorating actions", () => {
  it("adds a valid object and refuses an invalid one, saying why", () => {
    expect(addPlacement([], "flower", { x: 200, y: 290 })).toHaveLength(1);
    expect(addPlacement([], "tree", { x: 300, y: 250 })).toBeNull();
    expect(placementIssue([], "tree", { x: 300, y: 250 })).toEqual({ type: "collision", with: "cottage" });
  });

  it("moves an object to a valid position", () => {
    const placements = [place(1, "flower", 200, 290)];

    const moved = movePlacement(placements, 1, { x: 240, y: 290 });

    expect(moved?.[0]).toMatchObject({ id: 1, x: 240, y: 290 });
  });

  it("rejects an invalid move and leaves the original object where it was", () => {
    const placements = [place(1, "flower", 200, 290)];

    expect(movePlacement(placements, 1, { x: 400, y: 300 })).not.toBeNull();
    expect(movePlacement(placements, 1, { x: 300, y: 250 })).toBeNull();
    expect(movePlacement(placements, 1, { x: 200, y: 200 })).toBeNull();
    expect(placements[0]).toMatchObject({ x: 200, y: 290 });
  });

  it("rejects a move onto another object without losing the original", () => {
    const placements = [place(1, "tree", 200, 290), place(2, "tree", 260, 300)];

    expect(movePlacement(placements, 1, { x: 248, y: 296 })).toBeNull();
    expect(placements.map((item) => item.x)).toEqual([200, 260]);
  });

  it("refuses to turn an object into a spot where it does not fit", () => {
    const stream = [place(1, "stream-straight", 400, 290, 0)];

    expect(rotatePlacement(stream, 1)).toBeNull();
    expect(stream[0].rotation).toBe(0);
  });

  it("turns a rotated footprint into a valid spot when there is room", () => {
    // A flower meadow is wide and short, so it fits upright too.
    const meadow = [place(1, "flower-meadow", 450, 260, 0)];

    expect(rotatePlacement(meadow, 1)?.[0].rotation).toBe(90);
  });
});

import { describe, expect, it } from "vitest";
import { DECORATION_LIST, getDecoration, isDecorationKind, unlockHint } from "./catalogue";
import { MILESTONES } from "./milestones";
import { CATEGORIES } from "./types";
import { defaultHouse, effectiveColours, getHouseDesign, HOUSE_DESIGNS } from "./houses";

describe("decoration catalogue", () => {
  it("keeps the four starter decorations available from the start", () => {
    for (const id of ["flower", "tree", "mushroom", "bench"]) {
      expect(getDecoration(id)?.unlock).toEqual({ type: "starter" });
    }
  });

  it("gives every decoration a unique id and a category", () => {
    const ids = DECORATION_LIST.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const item of DECORATION_LIST) {
      expect(item.name.length).toBeGreaterThan(0);
      expect(CATEGORIES).toContain(item.category);
    }
  });

  it("rejects ids that are not in the catalogue", () => {
    expect(isDecorationKind("dragon")).toBe(false);
    expect(getDecoration("dragon")).toBeUndefined();
  });

  it("every milestone-based unlock refers to a real milestone", () => {
    const milestoneIds = MILESTONES.map((milestone) => milestone.id);
    for (const item of DECORATION_LIST) {
      if (item.unlock.type === "milestone") {
        expect(milestoneIds).toContain(item.unlock.milestoneId);
      }
    }
  });

  it("describes how each unlock works", () => {
    expect(unlockHint({ type: "points", amount: 25 })).toBe("Earn 25 petals");
    expect(unlockHint({ type: "starter" })).toBe("Available from the start");
    expect(unlockHint({ type: "milestone", milestoneId: "tree-lover" })).toContain("Tree Lover");
  });
});

describe("house designs", () => {
  it("the default house uses the original cottage colours from the theme", () => {
    expect(defaultHouse().roof.style).toBe("shingles");
    expect(defaultHouse().roof.color).toBeNull();
    expect(effectiveColours(defaultHouse())).toEqual({
      roof: "var(--roof)",
      wall: "var(--wall)",
      door: "var(--trunk)",
      trim: "var(--wall)",
    });
  });

  it("a chosen swatch replaces the design's colour for that part only", () => {
    const colours = effectiveColours({ ...defaultHouse(), roof: { ...defaultHouse().roof, color: "rose" } });

    expect(colours.roof).toBe("#e58ca8");
    expect(colours.wall).toBe("var(--wall)");
  });

  it("gives each design a distinct id and a known unlock rule", () => {
    const ids = HOUSE_DESIGNS.map((design) => design.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getHouseDesign("classic")?.unlock.type).toBe("starter");
    expect(getHouseDesign("unknown")).toBeUndefined();
  });

  it("every house milestone-based unlock refers to a real milestone", () => {
    const milestoneIds = MILESTONES.map((milestone) => milestone.id);
    for (const design of HOUSE_DESIGNS) {
      if (design.unlock.type === "milestone") {
        expect(milestoneIds).toContain(design.unlock.milestoneId);
      }
    }
  });
});

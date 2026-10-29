import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DECORATIONS, DECORATION_LIST, getDecoration } from "./catalogue";
import { DecorationArt } from "./components/DecorationArt";
import { addPlacement, movePlacement, removePlacement, rotatePlacement } from "./decorating";
import { findIssue, footprintShape, insideIsland } from "./footprint";
import { appReducer, toGameState } from "./game";
import type { AppAction, AppState } from "./game";
import { DECORATION_KINDS, CATEGORIES } from "./types";
import type { Category, DecorationKind } from "./types";
import { collectionProgress, createProgression, ensureToday, isDecorationUnlocked, settle } from "./progression";
import { createDefaultGame, loadGame, saveGame, SAVE_VERSION } from "./persistence";
import { addDays } from "./dates";
import { createStorage, freshAppState, TODAY } from "./testing";

const NEW_KINDS: DecorationKind[] = [
  "daisy", "tulip", "rose", "bluebell", "lily", "foxglove", "cosmos", "glow-flower", "wildflowers",
  "willow", "pine", "mystic-tree",
  "fern", "ivy-patch", "flowering-bush", "giant-mushroom", "lucky-clover",
  "stone-bench", "garden-arch", "birdhouse", "wind-chimes", "trellis", "sign",
];

function run(state: AppState, ...actions: AppAction[]): AppState {
  return actions.reduce(appReducer, state);
}

function withPoints(points: number) {
  return settle({ ...createProgression(TODAY), points }).progression;
}

describe("the expanded catalogue", () => {
  it("has a catalogue entry, a layer and a footprint for every decoration kind", () => {
    expect(DECORATION_LIST).toHaveLength(DECORATION_KINDS.length);
    for (const kind of DECORATION_KINDS) {
      expect(getDecoration(kind), kind).toBeDefined();
    }
  });

  it("adds all 23 botanical and garden items", () => {
    for (const kind of NEW_KINDS) {
      expect(DECORATIONS[kind].name.length, kind).toBeGreaterThan(0);
    }
    expect(new Set(NEW_KINDS).size).toBe(23);
  });

  it("draws every decoration with some artwork", () => {
    for (const kind of DECORATION_KINDS) {
      const markup = renderToStaticMarkup(createElement(DecorationArt, { kind }));
      expect(markup, kind).toMatch(/<(g|path|circle|ellipse|rect)/);
    }
  });

  it("keeps footprints a sensible size, so nothing is so large it blocks the island", () => {
    for (const item of DECORATION_LIST) {
      const footprint = item.footprint;
      if (footprint.shape === "circle") {
        expect(footprint.r, item.id).toBeLessThanOrEqual(16);
      } else {
        expect(footprint.w, item.id).toBeLessThanOrEqual(130);
        expect(footprint.h, item.id).toBeLessThanOrEqual(60);
      }
    }
  });

  it("gives solid objects solid layers and ground cover ground layers", () => {
    expect(DECORATIONS.willow.layer).toBe("solid");
    expect(DECORATIONS["garden-arch"].layer).toBe("solid");
    expect(DECORATIONS.fern.layer).toBe("ground");
    expect(DECORATIONS.rose.layer).toBe("ground");
  });

  it("uses only known categories", () => {
    for (const item of DECORATION_LIST) {
      expect(CATEGORIES).toContain(item.category);
    }
  });
});

describe("category counts", () => {
  const countsByCategory = (): Record<Category, number> => {
    const counts = Object.fromEntries(CATEGORIES.map((category) => [category, 0])) as Record<Category, number>;
    for (const item of DECORATION_LIST) {
      counts[item.category] += 1;
    }
    return counts;
  };

  it("groups the items into the categories the brief asks for", () => {
    expect(countsByCategory()).toEqual({
      flowers: 13,
      trees: 6,
      plants: 7,
      furniture: 9,
      water: 10,
      landscape: 5,
      special: 1,
    });
  });

  it("counts the unlocked items per category, and updates as things are earned", () => {
    const fresh = collectionProgress(createProgression(TODAY));
    expect(fresh.flowers).toEqual({ unlocked: 3, total: 13 });
    expect(fresh.plants.unlocked).toBe(2);

    const later = collectionProgress(withPoints(30));
    expect(later.flowers.unlocked).toBeGreaterThan(fresh.flowers.unlocked);
    expect(later.flowers.total).toBe(13);
  });
});

describe("unlock rules for the new items", () => {
  it("starts a handful of new items available from the start", () => {
    const starters = NEW_KINDS.filter((kind) => DECORATIONS[kind].unlock.type === "starter");

    expect(starters.sort()).toEqual(["daisy", "fern", "sign", "wildflowers"]);
    expect(isDecorationUnlocked(createProgression(TODAY), "daisy")).toBe(true);
    expect(isDecorationUnlocked(createProgression(TODAY), "rose")).toBe(false);
  });

  it("unlocks petal-priced items once the petals are earned", () => {
    expect(isDecorationUnlocked(withPoints(30), "rose")).toBe(true);
    expect(isDecorationUnlocked(withPoints(29), "rose")).toBe(false);
  });

  it("unlocks milestone-priced items through the existing milestones", () => {
    let progression = createProgression(TODAY);
    for (let i = 0; i < 3; i += 1) {
      progression = settle({ ...progression, lifetime: { ...progression.lifetime, byCategory: { ...progression.lifetime.byCategory, flowers: progression.lifetime.byCategory.flowers + 1 } } }).progression;
    }
    const withFlowers = {
      ...progression,
      lifetime: { ...progression.lifetime, byCategory: { ...progression.lifetime.byCategory, flowers: 3 } },
    };

    expect(isDecorationUnlocked(settle(withFlowers).progression, "foxglove")).toBe(true);
  });

  it("keeps earned items when a day is missed", () => {
    const earned = withPoints(60);

    const missedDays = ensureToday(earned, addDays(TODAY, 12));

    expect(missedDays.unlockedDecorations).toEqual(earned.unlockedDecorations);
    expect(missedDays.points).toBe(60);
  });

  it("refuses to place a locked new item, and says how to unlock it", () => {
    const state = run(freshAppState(), { type: "select-kind", kind: "rose" }, { type: "tap-grass", point: { x: 200, y: 260 }, dateKey: TODAY });

    expect(state.world.placements).toHaveLength(0);
    expect(state.message).toContain("Earn 30 petals");
  });
});

describe("footprints and placement for representative new items", () => {
  it("places a rose beside a pond, but not in it", () => {
    const pond = addPlacement([], "pond-small", { x: 400, y: 290 }) ?? [];

    expect(findIssue(pond, "rose", { x: 480, y: 290 }, 0)).toBeNull();
    expect(findIssue(pond, "rose", { x: 400, y: 290 }, 0)).not.toBeNull();
  });

  it("lets ferns and clover sit under a willow", () => {
    const willow = addPlacement([], "willow", { x: 250, y: 300 }) ?? [];

    expect(findIssue(willow, "fern", { x: 250, y: 300 }, 0)).toBeNull();
    expect(findIssue(willow, "lucky-clover", { x: 252, y: 298 }, 0)).toBeNull();
  });

  it("keeps a willow, sign or bench off the cottage", () => {
    expect(findIssue([], "willow", { x: 320, y: 230 }, 0)).toEqual({ type: "collision", with: "cottage" });
    expect(findIssue([], "sign", { x: 330, y: 250 }, 0)).toEqual({ type: "collision", with: "cottage" });
  });

  it("refuses a sign or bench inside a pond", () => {
    const pond = addPlacement([], "pond-small", { x: 400, y: 290 }) ?? [];

    expect(findIssue(pond, "sign", { x: 400, y: 290 }, 0)).toEqual({ type: "collision", with: "small pond" });
  });

  it("lets reeds sit beside a stream, and lily pads sit on a pond", () => {
    const stream = addPlacement([], "stream-straight", { x: 300, y: 300 }) ?? [];
    expect(findIssue(stream, "reeds", { x: 300, y: 300 }, 0)).toBeNull();

    const pond = addPlacement([], "pond-small", { x: 400, y: 290 }) ?? [];
    expect(findIssue(pond, "lily", { x: 400, y: 290 }, 0)).not.toBeNull();
  });

  it("rotates a garden arch that fits either way, and moves it validly", () => {
    const arch = addPlacement([], "garden-arch", { x: 250, y: 280 }) ?? [];
    const turned = rotatePlacement(arch, 1);

    expect(turned?.[0].rotation).toBe(90);
    expect(movePlacement(turned ?? [], 1, { x: 240, y: 270 })).not.toBeNull();
  });

  it("removes a placed trellis without touching anything else", () => {
    const placements = addPlacement([], "trellis", { x: 200, y: 300 }) ?? [];
    const withSecond = addPlacement(placements, "rose", { x: 240, y: 300 }) ?? [];

    expect(removePlacement(withSecond, 1)?.map((item) => item.kind)).toEqual(["rose"]);
  });

  it("gives every new item a footprint that is inside the island at its own starting spot", () => {
    for (const kind of NEW_KINDS) {
      const shape = footprintShape(kind, { x: 320, y: 280 }, 0);
      expect(insideIsland(shape) || findIssue([], kind, { x: 320, y: 280 }, 0)?.type === "collision", kind).toBe(true);
    }
  });
});

describe("undo, redo and saving the new items", () => {
  it("undoes and redoes a placement, a move and a rotation of a new item", () => {
    let state = run(freshAppState(withPoints(100)), { type: "select-kind", kind: "rose" }, { type: "tap-grass", point: { x: 200, y: 262 }, dateKey: TODAY });
    state = run(state, { type: "select-placement", id: 1 }, { type: "move", id: 1, point: { x: 230, y: 262 } }, { type: "rotate" });
    const finished = state.world.placements;

    state = run(state, { type: "undo" }, { type: "undo" }, { type: "undo" });
    expect(state.world.placements).toEqual([]);

    state = run(state, { type: "redo" }, { type: "redo" }, { type: "redo" });
    expect(state.world.placements).toEqual(finished);
  });

  it("saves and restores placed new items with their rotation", () => {
    let state = run(freshAppState(withPoints(100)), { type: "select-kind", kind: "birdhouse" }, { type: "tap-grass", point: { x: 420, y: 270 }, dateKey: TODAY });
    state = run(state, { type: "select-kind", kind: "willow" }, { type: "tap-grass", point: { x: 200, y: 300 }, dateKey: TODAY });
    const storage = createStorage();

    saveGame(storage, toGameState(state));
    const loaded = loadGame(storage, TODAY);

    expect(loaded.status).toBe("loaded");
    expect(loaded.game.world.placements.map((item) => item.kind)).toEqual(["birdhouse", "willow"]);
    expect(JSON.parse(storage.data.get("little-world:save") ?? "{}").version).toBe(SAVE_VERSION);
  });

  it("loads a version 3 save that already had decorations, without changing them", () => {
    const save = JSON.stringify({
      version: 3,
      themeId: "spring",
      placements: [{ id: 1, kind: "flower", x: 200, y: 260, rotation: 0 }],
    });

    const loaded = loadGame(createStorage(save), TODAY);

    expect(loaded.game.world.placements).toEqual([{ id: 1, kind: "flower", x: 200, y: 260, rotation: 0 }]);
    expect(loaded.game.progression.unlockedDecorations).toEqual([]);
  });

  it("keeps earned unlocks and the cottage when new items are placed", () => {
    const earned = withPoints(100);
    const game = createDefaultGame(TODAY);
    const state = run(freshAppState(earned), { type: "select-kind", kind: "fern" }, { type: "tap-grass", point: { x: 210, y: 270 }, dateKey: TODAY });
    const storage = createStorage();

    saveGame(storage, { ...toGameState(state), house: game.house });
    const reloaded = loadGame(storage, TODAY).game;

    expect(reloaded.progression.unlockedDecorations).toEqual(earned.unlockedDecorations);
    expect(reloaded.house).toEqual(game.house);
  });

  it("refuses an unknown item in a save, falling back safely", () => {
    const save = JSON.stringify({ version: SAVE_VERSION, themeId: "spring", placements: [{ id: 1, kind: "dragon-tree", x: 200, y: 260, rotation: 0 }] });

    expect(loadGame(createStorage(save), TODAY).status).toBe("recovered");
  });

  it("is still unaffected by the day rollover for placed items", () => {
    const state = run(freshAppState(withPoints(100)), { type: "select-kind", kind: "daisy" }, { type: "tap-grass", point: { x: 200, y: 262 }, dateKey: TODAY });

    expect(run(state, { type: "refresh-date", dateKey: addDays(TODAY, 1) }).world.placements).toEqual(state.world.placements);
  });
});

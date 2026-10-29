import { describe, expect, it } from "vitest";
import { appReducer, toGameState } from "./game";
import type { AppAction, AppState } from "./game";
import { createDefaultGame, loadGame, saveGame, SAVE_VERSION } from "./persistence";
import { createProgression, settle } from "./progression";
import { createStorage, freshAppState, TODAY } from "./testing";
import { DECORATIONS } from "./catalogue";

function run(state: AppState, ...actions: AppAction[]): AppState {
  return actions.reduce(appReducer, state);
}

/** Progress with enough petals for every water feature used in these tests. */
function earned() {
  return settle({ ...createProgression(TODAY), points: 100 }).progression;
}

/** Selects a decoration and taps the grass at a point. */
function tap(state: AppState, kind: AppState["selectedKind"], point: { x: number; y: number }): AppState {
  return run(state, { type: "select-kind", kind }, { type: "tap-grass", point, dateKey: TODAY });
}

describe("water and landscape placement", () => {
  it("places a starter pond on open grass and counts it as water", () => {
    const state = tap(freshAppState(), "pond-small", { x: 400, y: 290 });

    expect(state.world.placements).toEqual([{ id: 1, kind: "pond-small", x: 400, y: 290, rotation: 0 }]);
    expect(state.progression.lifetime.byCategory.water).toBe(1);
  });

  it("refuses a pond that would run past the island edge, and says why", () => {
    const state = tap(freshAppState(), "pond-small", { x: 400, y: 305 });

    expect(state.world.placements).toHaveLength(0);
    expect(state.message).toContain("would not fit");
  });

  it("refuses to put a flower in a pond, and explains the overlap", () => {
    const pond = tap(freshAppState(), "pond-small", { x: 400, y: 290 });

    const state = tap(pond, "flower", { x: 400, y: 290 });

    expect(state.world.placements).toHaveLength(1);
    expect(state.message).toContain("overlap");
  });

  it("refuses a locked water feature and explains how to unlock it", () => {
    const state = tap(freshAppState(), "pond-natural", { x: 400, y: 290 });

    expect(state.world.placements).toHaveLength(0);
    expect(state.message).toContain("still locked");
    expect(state.message).toContain("Earn 40 petals");
  });

  it("lets the player place a water feature once it is earned", () => {
    const earned = settle({ ...createProgression(TODAY), points: 40 }).progression;

    const state = tap(freshAppState(earned), "pond-natural", { x: 400, y: 290 });

    expect(state.world.placements.map((placement) => placement.kind)).toEqual(["pond-natural"]);
  });
});

describe("moving and rotating water features", () => {
  it("moves a pond to a valid spot", () => {
    const pond = tap(freshAppState(), "pond-small", { x: 400, y: 290 });

    const moved = run(pond, { type: "select-placement", id: 1 }, { type: "move", id: 1, point: { x: 180, y: 290 } });

    expect(moved.world.placements[0]).toMatchObject({ x: 180, y: 290 });
  });

  it("rejects a pond move that does not fit, keeping the pond where it was", () => {
    const pond = tap(freshAppState(), "pond-small", { x: 400, y: 290 });

    const refused = run(pond, { type: "move", id: 1, point: { x: 400, y: 200 } });

    expect(refused.world.placements[0]).toMatchObject({ x: 400, y: 290 });
    expect(refused.message).toContain("went back to where it was");
  });

  it("refuses to turn a stream where it would leave the grass", () => {
    const stream = tap(freshAppState(earned()), "stream-straight", { x: 400, y: 290 });

    const refused = run(stream, { type: "select-placement", id: 1 }, { type: "rotate" });

    expect(refused.world.placements[0].rotation).toBe(0);
    expect(refused.message).toContain("room");
  });
});

describe("undo and redo", () => {
  it("redoes a placement that was undone", () => {
    const placed = tap(freshAppState(), "flower", { x: 200, y: 260 });

    const undone = run(placed, { type: "undo" });
    expect(undone.world.placements).toEqual([]);

    const redone = run(undone, { type: "redo" });
    expect(redone.world.placements).toEqual(placed.world.placements);
  });

  it("clears the redo history as soon as a new change is made", () => {
    const placed = tap(freshAppState(), "flower", { x: 200, y: 260 });
    const undone = run(placed, { type: "undo" });

    const changed = tap(undone, "tree", { x: 200, y: 300 });

    expect(changed.future).toEqual([]);
    expect(run(changed, { type: "redo" }).world.placements).toEqual(changed.world.placements);
  });

  it("does nothing when there is nothing to redo", () => {
    const state = freshAppState();

    expect(appReducer(state, { type: "redo" })).toBe(state);
  });

  it("undoing a placement does not take back the progress it earned", () => {
    const placed = tap(freshAppState(), "flower", { x: 200, y: 260 });
    const before = toGameState(placed).progression;

    const undone = run(placed, { type: "undo" });

    expect(undone.progression).toBe(before);
  });

  it("resetting the island clears the redo history too", () => {
    const placed = tap(freshAppState(), "flower", { x: 200, y: 260 });
    const undone = run(placed, { type: "undo" });

    expect(run(undone, { type: "reset-world" }).future).toEqual([]);
  });
});

describe("saving water features", () => {
  it("restores a pond, a bridge and a rotated meadow after a reload", () => {
    let state = tap(freshAppState(earned()), "pond-small", { x: 400, y: 290 });
    state = tap(state, "wood-bridge", { x: 400, y: 290 });
    state = tap(state, "flower-meadow", { x: 470, y: 270 });
    state = run(state, { type: "select-placement", id: 3 }, { type: "rotate" });
    const storage = createStorage();

    saveGame(storage, toGameState(state));
    const restored = loadGame(storage, TODAY).game.world.placements;

    expect(restored.map((placement) => placement.kind)).toEqual(["pond-small", "wood-bridge", "flower-meadow"]);
    expect(restored[2].rotation).toBe(90);
  });

  it("stores only the position, rotation and type of each object, not its footprint", () => {
    const state = tap(freshAppState(), "pond-small", { x: 400, y: 290 });
    const storage = createStorage();
    saveGame(storage, toGameState(state));

    const saved = JSON.parse(storage.data.get("little-world:save") ?? "{}");

    expect(saved.version).toBe(SAVE_VERSION);
    expect(Object.keys(saved.placements[0]).sort()).toEqual(["id", "kind", "rotation", "x", "y"]);
  });

  it("loads an older save with no water categories, giving them zero", () => {
    const save = JSON.stringify({
      version: SAVE_VERSION,
      themeId: "spring",
      placements: [{ id: 1, kind: "flower", x: 200, y: 260, rotation: 0 }],
      progression: { lifetime: { byCategory: { flowers: 1, trees: 0, plants: 0, furniture: 0, special: 0 }, categories: ["flowers"] } },
    });

    const { progression } = loadGame(createStorage(save), TODAY).game;

    expect(progression.lifetime.byCategory.flowers).toBe(1);
    expect(progression.lifetime.byCategory.water).toBe(0);
    expect(progression.lifetime.byCategory.landscape).toBe(0);
  });

  it("refuses a save with an object that is not in the catalogue, falling back safely", () => {
    const save = JSON.stringify({
      version: SAVE_VERSION,
      themeId: "spring",
      placements: [{ id: 1, kind: "lake", x: 200, y: 260, rotation: 0 }],
    });

    const result = loadGame(createStorage(save), TODAY);

    expect(result.status).toBe("recovered");
    expect(result.game.world.placements).toEqual([]);
  });

  it("keeps earned unlocks and the cottage when water features are placed and saved", () => {
    const earnedProgress = earned();
    const base = { ...freshAppState(earnedProgress), house: { ...createDefaultGame(TODAY).house, walls: { finish: "stone" as const, color: "cream" } } };
    const state = tap(base, "pond-natural", { x: 400, y: 290 });
    const storage = createStorage();

    saveGame(storage, toGameState(state));
    const loaded = loadGame(storage, TODAY).game;

    expect(loaded.progression.unlockedDecorations).toEqual(earnedProgress.unlockedDecorations);
    expect(loaded.house.walls.finish).toBe("stone");
  });
});

describe("the water catalogue", () => {
  it("starts the basic pond, stepping stones and clover available, and locks the rest", () => {
    expect(DECORATIONS["pond-small"].unlock.type).toBe("starter");
    expect(DECORATIONS["stepping-stones"].unlock.type).toBe("starter");
    expect(DECORATIONS["clover-patch"].unlock.type).toBe("starter");
    expect(DECORATIONS["waterfall"].unlock.type).not.toBe("starter");
  });
});

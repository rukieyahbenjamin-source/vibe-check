import { describe, expect, it } from "vitest";
import { appReducer, toGameState } from "./game";
import type { AppAction, AppState } from "./game";
import { pickDailyGoals } from "./daily";
import { addDays } from "./dates";
import { createDefaultWorld } from "./persistence";
import { createProgression, recordPlacement, settle } from "./progression";
import { completeGoal, freshAppState, kindForCategory, spot, TODAY } from "./testing";
import type { DecorationKind } from "./types";

function run(state: AppState, ...actions: AppAction[]): AppState {
  return actions.reduce(appReducer, state);
}

/** Selects a decoration and taps the grass to place it at a spot. */
function placeAt(state: AppState, kind: DecorationKind, index: number): AppState {
  return run(
    state,
    { type: "select-kind", kind },
    { type: "tap-grass", point: spot(index), dateKey: TODAY },
  );
}

describe("placing decorations", () => {
  it("places a starter decoration and counts it toward today's goals", () => {
    const state = placeAt(freshAppState(), "flower", 0);

    expect(state.world.placements).toHaveLength(1);
    expect(state.progression.daily.byCategory.flowers).toBe(1);
    expect(state.progression.lifetime.byCategory.flowers).toBe(1);
  });

  it("refuses to place a locked decoration, even though the request is made directly", () => {
    const state = placeAt(freshAppState(), "pink-blossom", 0);

    expect(state.world.placements).toHaveLength(0);
    expect(state.progression.lifetime.byCategory.flowers).toBe(0);
    expect(state.message).toContain("still locked");
  });

  it("lets the player place a decoration once they have earned it", () => {
    const earned = settle({ ...createProgression(TODAY), points: 25 }).progression;

    const state = placeAt(freshAppState(earned), "pink-blossom", 0);

    expect(state.world.placements).toHaveLength(1);
    expect(state.world.placements[0].kind).toBe("pink-blossom");
  });

  it("refuses to place anything off the grass", () => {
    const state = run(freshAppState(), { type: "select-kind", kind: "flower" }, { type: "tap-grass", point: { x: 10, y: 10 }, dateKey: TODAY });

    expect(state.world.placements).toHaveLength(0);
    expect(state.message).toContain("grass");
  });

  it("shows the reward when a placement completes a daily goal", () => {
    const goal = pickDailyGoals(TODAY).find((item) => item.metric.type === "category");
    if (!goal || goal.metric.type !== "category") {
      throw new Error("expected a category daily goal for TODAY");
    }
    const kind = kindForCategory(goal.metric.category);
    // Progress to one short of the goal, then place the final decoration through the UI.
    let progression = createProgression(TODAY);
    for (let i = 0; i < goal.target - 1; i += 1) {
      progression = recordPlacement(progression, kind).progression;
    }
    const state = placeAt(freshAppState(progression), kind, 3);

    expect(state.rewards.some((reward) => reward.type === "daily-goal" && reward.title === goal.title)).toBe(true);
    expect(state.message).toContain("Daily goal complete");
  });
});

describe("moving, rotating, undoing and deleting", () => {
  it("never changes progression", () => {
    let state = placeAt(freshAppState(), "tree", 0);
    const before = toGameState(state).progression;

    state = run(
      state,
      { type: "select-placement", id: 1 },
      { type: "move", id: 1, point: spot(5) },
      { type: "rotate" },
      { type: "delete" },
      { type: "undo" },
    );

    expect(state.progression).toBe(before);
    expect(state.world.placements).toHaveLength(1);
  });

  it("keeps the earned goal when a counted decoration is deleted", () => {
    const goal = pickDailyGoals(TODAY)[0];
    const earned = completeGoal(createProgression(TODAY), goal).progression;
    let state = freshAppState(earned);
    state = run(state, { type: "select-kind", kind: "flower" }, { type: "tap-grass", point: spot(7), dateKey: TODAY });
    state = run(state, { type: "select-placement", id: 1 }, { type: "delete" });

    expect(state.progression.daily.claimed).toEqual(earned.daily.claimed);
    expect(state.progression.points).toBe(earned.points);
  });

  it("undo brings back a deleted decoration and restores its position and rotation", () => {
    let state = placeAt(freshAppState(), "bench", 2);
    state = run(state, { type: "select-placement", id: 1 }, { type: "rotate" });
    const rotated = state.world.placements[0];

    state = run(state, { type: "delete" }, { type: "undo" });

    expect(state.world.placements).toEqual([rotated]);
  });

  it("undo steps back through placement, move, rotate and delete in order", () => {
    let state = placeAt(freshAppState(), "flower", 0);
    const afterPlace = state.world.placements;
    state = run(state, { type: "select-placement", id: 1 }, { type: "move", id: 1, point: spot(4) });
    const afterMove = state.world.placements;
    state = run(state, { type: "rotate" });
    const afterRotate = state.world.placements;
    state = run(state, { type: "delete" });

    state = run(state, { type: "undo" });
    expect(state.world.placements).toEqual(afterRotate);
    state = run(state, { type: "undo" });
    expect(state.world.placements).toEqual(afterMove);
    state = run(state, { type: "undo" });
    expect(state.world.placements).toEqual(afterPlace);
    state = run(state, { type: "undo" });
    expect(state.world.placements).toEqual([]);
  });

  it("rotation turns the decoration by 90 degrees each time", () => {
    // A tree turns about its base, so it needs open grass clear of the fixed trees.
    let state = run(freshAppState(), { type: "select-kind", kind: "tree" }, { type: "tap-grass", point: { x: 220, y: 285 }, dateKey: TODAY });
    state = run(state, { type: "select-placement", id: 1 });

    state = run(state, { type: "rotate" }, { type: "rotate" });

    expect(state.world.placements[0].rotation).toBe(180);
  });

  it("a refused move leaves the decoration where it was", () => {
    let state = placeAt(freshAppState(), "flower", 0);
    const before = state.world.placements[0];

    state = run(state, { type: "move", id: 1, point: { x: 5, y: 5 } });

    expect(state.world.placements[0]).toEqual(before);
  });
});

describe("resetting the world", () => {
  it("clears the island and theme but keeps petals, milestones, unlocks and the house", () => {
    const earned = settle({ ...createProgression(TODAY), points: 30 }).progression;
    let state = freshAppState(earned);
    state = run(state, { type: "set-house", designId: "lavender" }, { type: "set-theme", themeId: "sunset" });
    state = placeAt(state, "flower", 0);
    const progressionBefore = state.progression;

    state = run(state, { type: "reset-world" });

    expect(state.world.placements).toEqual([]);
    expect(state.world.themeId).toBe(createDefaultWorld().themeId);
    expect(state.progression).toBe(progressionBefore);
    expect(state.progression.points).toBeGreaterThanOrEqual(30);
    expect(state.progression.unlockedHouses).toContain("lavender");
    expect(state.house.roof.style).toBe("tiles");
    expect(state.history).toEqual([]);
  });
});

describe("house customisation", () => {
  it("does not let the player pick a locked house design", () => {
    const state = run(freshAppState(), { type: "set-house", designId: "lavender" });

    expect(state.house.roof.style).toBe("shingles");
    expect(state.message).toContain("still locked");
  });

  it("lets the player switch to any unlocked design and back", () => {
    const earned = settle({ ...createProgression(TODAY), points: 60 }).progression;
    let state = run(freshAppState(earned), { type: "set-house", designId: "blossom" });
    expect(state.house.roof.color).toBe("petal-pink");

    state = run(state, { type: "set-house", designId: "classic" });
    expect(state.house.roof.color).toBeNull();
  });

  it("applies and clears colour swatches, and ignores unknown colours", () => {
    let state = run(freshAppState(), { type: "set-house-colour", part: "roof", swatchId: "rose" });
    expect(state.house.roof.color).toBe("rose");

    state = run(state, { type: "set-house-colour", part: "roof", swatchId: "neon-unknown" });
    expect(state.house.roof.color).toBe("rose");

    state = run(state, { type: "set-house-colour", part: "roof", swatchId: null });
    expect(state.house.roof.color).toBeNull();
  });

  it("changing the house never moves or removes island decorations", () => {
    const earned = settle({ ...createProgression(TODAY), points: 60 }).progression;
    let state = placeAt(freshAppState(earned), "tree", 0);
    state = placeAt(state, "bench", 1);
    const before = state.world.placements;

    state = run(
      state,
      { type: "set-house", designId: "blossom" },
      { type: "set-house-colour", part: "wall", swatchId: "sky" },
    );

    expect(state.world.placements).toEqual(before);
  });
});

describe("dates", () => {
  it("does nothing when the date has not changed", () => {
    const state = freshAppState();

    expect(appReducer(state, { type: "refresh-date", dateKey: TODAY })).toBe(state);
  });

  it("starts fresh goals on a new day and keeps petals", () => {
    const state = run(placeAt(freshAppState(), "flower", 0), { type: "refresh-date", dateKey: addDays(TODAY, 1) });

    expect(state.progression.daily.date).toBe(addDays(TODAY, 1));
    expect(state.progression.daily.byCategory.flowers).toBe(0);
    expect(state.progression.lifetime.byCategory.flowers).toBe(1);
  });
});

describe("notifications", () => {
  it("clears reward notifications when dismissed", () => {
    const state = run(
      { ...freshAppState(), rewards: [{ type: "daily-goal", title: "Place 3 flowers", points: 10 }] },
      { type: "dismiss-rewards" },
    );

    expect(state.rewards).toEqual([]);
  });

  it("records whether the last save worked", () => {
    expect(run(freshAppState(), { type: "save-result", ok: false }).saveStatus).toBe("failed");
    expect(run(freshAppState(), { type: "save-result", ok: true }).saveStatus).toBe("saved");
  });
});

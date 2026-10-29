import { describe, expect, it } from "vitest";
import {
  addPlacement,
  findPlacement,
  movePlacement,
  nextPlacementId,
  removePlacement,
  rotatePlacement,
} from "./decorating";
import { getGoalProgress } from "./goals";
import { popHistory, pushHistory } from "./history";
import type { HistoryEntry } from "./history";
import { SAVE_KEY, loadWorld, saveWorld } from "./persistence";
import type { StorageLike } from "./persistence";
import type { Placement, Point } from "./types";

const onGrass: Point = { x: 200, y: 260 };
const otherGrass: Point = { x: 330, y: 300 };
const offIsland: Point = { x: 20, y: 20 };
const openGrass: Point = { x: 200, y: 290 };

function createStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

/** Adds a flower, then returns the result with its id, for tests that need a starting list. */
function withFlower(): Placement[] {
  const placements = addPlacement([], "flower", onGrass);
  if (!placements) {
    throw new Error("test setup: flower should be placeable");
  }
  return placements;
}

describe("placing decorations", () => {
  it("adds a decoration on the grass with no rotation", () => {
    // (300, 250) is under the cottage now, so a tree goes on open grass instead.
    const placements = addPlacement([], "tree", openGrass);

    expect(placements).toEqual([{ id: 1, kind: "tree", x: 200, y: 290, rotation: 0 }]);
  });

  it("refuses to place a decoration outside the island", () => {
    expect(addPlacement([], "tree", offIsland)).toBeNull();
  });

  it("gives each new decoration a new id", () => {
    const first = withFlower();
    const second = addPlacement(first, "bench", otherGrass);

    expect(second?.map((placement) => placement.id)).toEqual([1, 2]);
    expect(nextPlacementId(second ?? [])).toBe(3);
  });
});

describe("moving decorations", () => {
  it("moves a decoration to a new spot on the grass", () => {
    const moved = movePlacement(withFlower(), 1, otherGrass);

    expect(moved?.[0]).toMatchObject({ id: 1, x: 330, y: 300 });
  });

  it("refuses a move that would take the decoration off the island", () => {
    expect(movePlacement(withFlower(), 1, offIsland)).toBeNull();
  });

  it("does not change the original list when a move is refused", () => {
    const original = withFlower();
    movePlacement(original, 1, offIsland);

    expect(original[0]).toMatchObject({ x: 200, y: 260 });
  });

  it("keeps the rotation when a decoration moves", () => {
    const rotated = rotatePlacement(withFlower(), 1) ?? [];
    const moved = movePlacement(rotated, 1, otherGrass);

    expect(moved?.[0].rotation).toBe(90);
  });

  it("returns null when moving a decoration that does not exist", () => {
    expect(movePlacement(withFlower(), 99, otherGrass)).toBeNull();
  });
});

describe("rotating decorations", () => {
  it("turns a decoration 90 degrees each time and wraps back to 0", () => {
    let placements = withFlower();
    const angles: number[] = [];
    for (let step = 0; step < 5; step += 1) {
      placements = rotatePlacement(placements, 1) ?? [];
      angles.push(placements[0].rotation);
    }

    expect(angles).toEqual([90, 180, 270, 0, 90]);
  });

  it("returns null for a decoration that does not exist", () => {
    expect(rotatePlacement(withFlower(), 99)).toBeNull();
  });
});

describe("deleting decorations", () => {
  it("removes only the chosen decoration", () => {
    const placements = addPlacement(withFlower(), "tree", otherGrass) ?? [];

    const remaining = removePlacement(placements, 1);

    expect(remaining?.map((placement) => placement.kind)).toEqual(["tree"]);
  });

  it("lowers goal progress when a counted decoration is deleted", () => {
    const flowers = [
      { id: 1, kind: "flower" as const, x: 200, y: 260, rotation: 0 },
      { id: 2, kind: "flower" as const, x: 240, y: 270, rotation: 0 },
      { id: 3, kind: "flower" as const, x: 280, y: 280, rotation: 0 },
    ];
    expect(getGoalProgress(flowers)[0].done).toBe(true);

    const remaining = removePlacement(flowers, 2) ?? [];

    const flowerGoal = getGoalProgress(remaining)[0];
    expect(flowerGoal.count).toBe(2);
    expect(flowerGoal.done).toBe(false);
  });

  it("returns null for a decoration that does not exist", () => {
    expect(removePlacement(withFlower(), 99)).toBeNull();
  });
});

describe("finding decorations", () => {
  it("finds a decoration by id and returns null when there is no selection", () => {
    const placements = withFlower();

    expect(findPlacement(placements, 1)?.kind).toBe("flower");
    expect(findPlacement(placements, null)).toBeNull();
  });
});

describe("undo history", () => {
  /** Mirrors how the app records each change: store the state before, then apply. */
  function change(
    history: HistoryEntry[],
    placements: Placement[],
    label: string,
    next: Placement[] | null,
  ): { history: HistoryEntry[]; placements: Placement[] } {
    if (!next) {
      throw new Error(`test setup: ${label} should succeed`);
    }
    return { history: pushHistory(history, { placements, label }), placements: next };
  }

  it("undoes placement, move, rotation and deletion in reverse order", () => {
    let history: HistoryEntry[] = [];
    let placements: Placement[] = [];

    ({ history, placements } = change(history, placements, "placing", addPlacement(placements, "flower", onGrass)));
    const afterPlace = placements;
    ({ history, placements } = change(history, placements, "moving", movePlacement(placements, 1, otherGrass)));
    const afterMove = placements;
    ({ history, placements } = change(history, placements, "rotating", rotatePlacement(placements, 1)));
    const afterRotate = placements;
    ({ history, placements } = change(history, placements, "deleting", removePlacement(placements, 1)));
    expect(placements).toEqual([]);

    const undoDelete = popHistory(history);
    expect(undoDelete.entry?.label).toBe("deleting");
    expect(undoDelete.entry?.placements).toEqual(afterRotate);

    const undoRotate = popHistory(undoDelete.history);
    expect(undoRotate.entry?.placements).toEqual(afterMove);

    const undoMove = popHistory(undoRotate.history);
    expect(undoMove.entry?.placements).toEqual(afterPlace);

    const undoPlace = popHistory(undoMove.history);
    expect(undoPlace.entry?.placements).toEqual([]);
    expect(popHistory(undoPlace.history).entry).toBeNull();
  });

  it("keeps only the most recent changes", () => {
    let history: HistoryEntry[] = [];
    for (let step = 0; step < 60; step += 1) {
      history = pushHistory(history, { placements: [], label: `change ${step}` });
    }

    expect(history).toHaveLength(50);
    expect(history[0].label).toBe("change 10");
  });
});

describe("saving changes", () => {
  it("restores a moved and rotated decoration after a restart", () => {
    const storage = createStorage();
    const moved = movePlacement(rotatePlacement(withFlower(), 1) ?? [], 1, otherGrass) ?? [];
    saveWorld(storage, { themeId: "moonlit", placements: moved });

    const restarted = loadWorld(storage);

    expect(restarted.status).toBe("loaded");
    expect(restarted.world.placements).toEqual([
      { id: 1, kind: "flower", x: 330, y: 300, rotation: 90 },
    ]);
    expect(restarted.world.themeId).toBe("moonlit");
  });

  it("restores a world in which a decoration was deleted", () => {
    const storage = createStorage();
    const remaining = removePlacement(withFlower(), 1) ?? [];
    saveWorld(storage, { themeId: "spring", placements: remaining });

    expect(loadWorld(storage).world.placements).toEqual([]);
    expect(storage.getItem(SAVE_KEY)).toContain('"placements":[]');
  });
});

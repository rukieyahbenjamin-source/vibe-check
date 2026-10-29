import { describe, expect, it } from "vitest";
import { pickDailyGoals } from "./daily";
import { addDays } from "./dates";
import { defaultHouse } from "./houses";
import {
  backupInvalidSave,
  createDefaultGame,
  INVALID_BACKUP_KEY,
  loadGame,
  loadWorld,
  saveGame,
  saveWorld,
  SAVE_KEY,
  SAVE_VERSION,
} from "./persistence";
import { createProgression, recordPlacement } from "./progression";
import { completeGoal, createStorage, TODAY } from "./testing";
import type { StorageLike } from "./persistence";

const legacySave = JSON.stringify({
  version: 1,
  themeId: "sunset",
  placements: [
    { id: 1, kind: "flower", x: 300, y: 250, rotation: 0 },
    { id: 2, kind: "tree", x: 170, y: 262, rotation: 90 },
  ],
});

function savedJson(storage: { data: Map<string, string> }) {
  return JSON.parse(storage.data.get(SAVE_KEY) ?? "null");
}

describe("version 1 saves", () => {
  it("loads an existing save and keeps its theme and decorations", () => {
    const result = loadGame(createStorage(legacySave), TODAY);

    expect(result.status).toBe("loaded");
    expect(result.migrated).toBe(true);
    expect(result.game.world.themeId).toBe("sunset");
    expect(result.game.world.placements).toEqual([
      { id: 1, kind: "flower", x: 300, y: 250, rotation: 0 },
      { id: 2, kind: "tree", x: 170, y: 262, rotation: 90 },
    ]);
  });

  it("counts existing decorations toward lifetime totals, so milestones are not lost", () => {
    const threeFlowers = JSON.stringify({
      version: 1,
      themeId: "spring",
      placements: [1, 2, 3].map((id) => ({ id, kind: "flower", x: 150 + id * 40, y: 250, rotation: 0 })),
    });

    const result = loadGame(createStorage(threeFlowers), TODAY);

    expect(result.game.progression.lifetime.byCategory.flowers).toBe(3);
    expect(result.game.progression.completedMilestones).toContain("first-blooms");
    expect(result.game.progression.points).toBe(10);
  });

  it("does not write to storage while loading, so an old save is safe until migration succeeds", () => {
    const storage = createStorage(legacySave);

    loadGame(storage, TODAY);

    expect(storage.writes).toBe(0);
  });

  it("is written back in the current version the next time the game saves", () => {
    const storage = createStorage(legacySave);
    const loaded = loadGame(storage, TODAY);

    saveGame(storage, loaded.game);

    expect(savedJson(storage).version).toBe(SAVE_VERSION);
    expect(savedJson(storage).progression).toBeDefined();
    expect(savedJson(storage).placements).toHaveLength(2);
  });
});

describe("version 2 saves", () => {
  it("treats missing new fields as their defaults", () => {
    const minimal = JSON.stringify({ version: SAVE_VERSION, themeId: "moonlit", placements: [] });

    const result = loadGame(createStorage(minimal), TODAY);

    expect(result.status).toBe("loaded");
    expect(result.game.progression.points).toBe(0);
    expect(result.game.progression.daily.date).toBe(TODAY);
    expect(result.game.house).toEqual(defaultHouse());
  });

  it("restores progression exactly when the game is reopened on the same day", () => {
    const earned = completeGoal(createProgression(TODAY), pickDailyGoals(TODAY)[0]).progression;
    const storage = createStorage();
    saveGame(storage, { ...createDefaultGame(TODAY), progression: earned });

    const reopened = loadGame(storage, TODAY);

    expect(reopened.status).toBe("loaded");
    expect(reopened.game.progression).toEqual(earned);
  });

  it("starts fresh goals on load after a new day, but keeps petals and milestones", () => {
    const storage = createStorage();
    const earned = recordPlacement(createProgression(TODAY), "flower").progression;
    saveGame(storage, { ...createDefaultGame(TODAY), progression: { ...earned, points: 20 } });

    const later = loadGame(storage, addDays(TODAY, 3));

    expect(later.game.progression.daily.date).toBe(addDays(TODAY, 3));
    expect(later.game.progression.daily.claimed).toEqual([]);
    expect(later.game.progression.points).toBe(20);
    expect(later.game.progression.lifetime.byCategory.flowers).toBe(1);
  });

  it("drops unknown unlock ids but keeps valid ones", () => {
    const save = JSON.stringify({
      version: SAVE_VERSION,
      themeId: "spring",
      placements: [],
      progression: { unlockedDecorations: ["not-real", "pink-blossom"], unlockedHouses: ["neon"] },
    });

    const { progression } = loadGame(createStorage(save), TODAY).game;

    expect(progression.unlockedDecorations).toEqual(["pink-blossom"]);
    expect(progression.unlockedHouses).toEqual([]);
  });

  it("unlocks any placed decoration that is missing from the unlock list", () => {
    const save = JSON.stringify({
      version: SAVE_VERSION,
      themeId: "spring",
      placements: [{ id: 1, kind: "lavender", x: 300, y: 250, rotation: 0 }],
    });

    expect(loadGame(createStorage(save), TODAY).game.progression.unlockedDecorations).toContain("lavender");
  });

  it("falls back to the original value for a part whose saved style is unknown or still locked", () => {
    const unknown = JSON.stringify({ version: SAVE_VERSION, themeId: "spring", placements: [], house: { roof: { style: "neon" } } });
    const locked = JSON.stringify({ version: SAVE_VERSION, themeId: "spring", placements: [], house: { roof: { style: "celestial" } } });

    expect(loadGame(createStorage(unknown), TODAY).game.house.roof.style).toBe("shingles");
    expect(loadGame(createStorage(locked), TODAY).game.house.roof.style).toBe("shingles");
  });

  it("drops invalid colour ids and keeps valid ones", () => {
    const save = JSON.stringify({
      version: SAVE_VERSION,
      themeId: "spring",
      placements: [],
      house: { roof: { color: "neon" }, walls: { color: "rose" } },
    });

    const house = loadGame(createStorage(save), TODAY).game.house;
    expect(house.roof.color).toBeNull();
    expect(house.walls.color).toBe("rose");
  });

  it("keeps house colours across a reload", () => {
    const storage = createStorage();
    const house = { ...createDefaultGame(TODAY).house, door: { ...createDefaultGame(TODAY).house.door, color: "lilac" } };
    saveGame(storage, { ...createDefaultGame(TODAY), house });

    expect(loadGame(storage, TODAY).game.house.door.color).toBe("lilac");
  });

  it("keeps progression when the world is saved on its own", () => {
    const storage = createStorage();
    saveGame(storage, { ...createDefaultGame(TODAY), progression: { ...createProgression(TODAY), points: 20 } });

    saveWorld(storage, { themeId: "moonlit", placements: [] });

    const loaded = loadGame(storage, TODAY).game;
    expect(loaded.world.themeId).toBe("moonlit");
    expect(loaded.progression.points).toBe(20);
  });
});

describe("invalid progression data", () => {
  it("rejects negative petals and falls back to a default world with a reason", () => {
    const save = JSON.stringify({ version: SAVE_VERSION, themeId: "spring", placements: [], progression: { points: -5 } });

    const result = loadGame(createStorage(save), TODAY);

    expect(result.status).toBe("recovered");
    expect(result.reason).toMatch(/petals/);
    expect(result.game.progression.points).toBe(0);
  });

  it("rejects an impossible calendar date", () => {
    const save = JSON.stringify({
      version: SAVE_VERSION,
      themeId: "spring",
      placements: [],
      progression: { daily: { date: "2026-02-30", byCategory: {}, categories: [], claimed: [] } },
    });

    expect(loadGame(createStorage(save), TODAY).status).toBe("recovered");
  });

  it("does not pay the same daily reward twice after a reload", () => {
    const earned = completeGoal(createProgression(TODAY), pickDailyGoals(TODAY)[0]).progression;
    const storage = createStorage();
    saveGame(storage, { ...createDefaultGame(TODAY), progression: earned });

    const once = loadGame(storage, TODAY).game.progression;
    const twice = loadGame(storage, TODAY).game.progression;

    expect(once.points).toBe(earned.points);
    expect(twice.points).toBe(earned.points);
  });
});

describe("storage problems", () => {
  it("does not crash when storage cannot be read", () => {
    const storage: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {},
    };

    const result = loadGame(storage, TODAY);

    expect(result.status).toBe("recovered");
    expect(result.game.world.placements).toEqual([]);
    expect(loadWorld(storage).status).toBe("recovered");
  });

  it("reports a failed save instead of throwing", () => {
    const storage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
    };

    expect(saveGame(storage, createDefaultGame(TODAY))).toBe(false);
  });

  it("keeps a copy of an unreadable save before it is replaced", () => {
    const storage = createStorage("{broken");

    backupInvalidSave(storage);

    expect(storage.data.get(INVALID_BACKUP_KEY)).toBe("{broken");
  });

  it("starts from a fresh game when nothing is saved and storage is missing", () => {
    expect(loadGame(null, TODAY).status).toBe("empty");
    expect(loadGame(null, TODAY).game.house).toEqual(defaultHouse());
  });
});

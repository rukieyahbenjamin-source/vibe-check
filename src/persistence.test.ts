import { describe, expect, it } from "vitest";
import {
  SAVE_KEY,
  SAVE_VERSION,
  createDefaultWorld,
  loadWorld,
  saveWorld,
  serializeWorld,
} from "./persistence";
import type { StorageLike, WorldState } from "./persistence";
import { getGoalProgress } from "./goals";
import type { Placement } from "./types";

/** A minimal in-memory stand-in for localStorage. */
function createStorage(seed?: string) {
  const data = new Map<string, string>();
  if (seed !== undefined) {
    data.set(SAVE_KEY, seed);
  }
  const storage: StorageLike & { data: Map<string, string> } = {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
  return storage;
}

const flower: Placement = { id: 1, kind: "flower", x: 300, y: 250, rotation: 0 };
const tree: Placement = { id: 2, kind: "tree", x: 170, y: 262, rotation: 90 };

const savedWorld: WorldState = { themeId: "sunset", placements: [flower, tree] };

/** Builds a save file as a plain object so tests can break one field at a time. */
function saveFile(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    version: SAVE_VERSION,
    themeId: "spring",
    placements: [flower],
    ...overrides,
  });
}

describe("saving", () => {
  it("writes the theme and decorations under the versioned key", () => {
    const storage = createStorage();

    expect(saveWorld(storage, savedWorld)).toBe(true);

    const stored = JSON.parse(storage.data.get(SAVE_KEY) ?? "null");
    expect(stored).toEqual({
      version: SAVE_VERSION,
      themeId: "sunset",
      placements: [flower, tree],
    });
  });

  it("includes the save version in the serialized output", () => {
    const parsed = JSON.parse(serializeWorld(savedWorld));

    expect(parsed.version).toBe(SAVE_VERSION);
  });

  it("returns false instead of throwing when storage rejects the write", () => {
    const storage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
    };

    expect(saveWorld(storage, savedWorld)).toBe(false);
  });

  it("returns false when no storage is available", () => {
    expect(saveWorld(null, savedWorld)).toBe(false);
  });
});

describe("loading", () => {
  it("restores the saved theme and decorations", () => {
    const storage = createStorage();
    saveWorld(storage, savedWorld);

    const result = loadWorld(storage);

    expect(result).toEqual({ status: "loaded", world: savedWorld });
  });

  it("keeps each decoration's rotation through a save and load", () => {
    const storage = createStorage();
    saveWorld(storage, savedWorld);

    const result = loadWorld(storage);

    expect(result.status).toBe("loaded");
    expect(result.world.placements[1].rotation).toBe(90);
  });

  it("starts from the default world when nothing has been saved", () => {
    const result = loadWorld(createStorage());

    expect(result).toEqual({ status: "empty", world: createDefaultWorld() });
  });

  it("starts from the default world when no storage is available", () => {
    expect(loadWorld(null)).toEqual({ status: "empty", world: createDefaultWorld() });
  });

  it("restored decorations still count toward the goals", () => {
    const placements: Placement[] = [
      { id: 1, kind: "flower", x: 200, y: 260, rotation: 0 },
      { id: 2, kind: "flower", x: 240, y: 270, rotation: 0 },
      { id: 3, kind: "flower", x: 280, y: 280, rotation: 0 },
      { id: 4, kind: "tree", x: 400, y: 250, rotation: 0 },
      { id: 5, kind: "bench", x: 330, y: 300, rotation: 0 },
    ];
    const storage = createStorage();
    saveWorld(storage, { themeId: "moonlit", placements });

    const { world } = loadWorld(storage);

    expect(world.themeId).toBe("moonlit");
    expect(getGoalProgress(world.placements).every((goal) => goal.done)).toBe(true);
  });
});

describe("invalid saved data", () => {
  function expectRecovered(raw: string, reasonPattern: RegExp) {
    const result = loadWorld(createStorage(raw));

    expect(result.status).toBe("recovered");
    expect(result.world).toEqual(createDefaultWorld());
    if (result.status === "recovered") {
      expect(result.reason).toMatch(reasonPattern);
    }
  }

  it("recovers from text that is not JSON", () => {
    expectRecovered("{not json", /not valid JSON/);
  });

  it("recovers from JSON that is not an object", () => {
    expectRecovered("[1, 2, 3]", /not an object/);
  });

  it("rejects a save from an unsupported version", () => {
    expectRecovered(saveFile({ version: SAVE_VERSION + 1 }), /Unsupported save version/);
  });

  it("rejects a save with no version", () => {
    expectRecovered(saveFile({ version: undefined }), /Unsupported save version/);
  });

  it("rejects an unknown theme", () => {
    expectRecovered(saveFile({ themeId: "neon" }), /theme/);
  });

  it("rejects decorations that are not a list", () => {
    expectRecovered(saveFile({ placements: "flowers" }), /missing/);
  });

  it("rejects a decoration with an unknown kind", () => {
    const bad = [{ ...flower, kind: "dragon" }];
    expectRecovered(saveFile({ placements: bad }), /decoration is invalid/);
  });

  it("rejects a decoration placed outside the island", () => {
    const bad = [{ ...flower, x: 5 }];
    expectRecovered(saveFile({ placements: bad }), /decoration is invalid/);
  });

  it("rejects a decoration with a non-numeric position", () => {
    const bad = [{ ...flower, y: "250" }];
    expectRecovered(saveFile({ placements: bad }), /decoration is invalid/);
  });

  it("rejects a decoration with a rotation outside 0 to 359", () => {
    const bad = [{ ...flower, rotation: 360 }];
    expectRecovered(saveFile({ placements: bad }), /decoration is invalid/);
  });

  it("rejects a decoration with a rotation that is not a number", () => {
    const bad = [{ ...flower, rotation: "90" }];
    expectRecovered(saveFile({ placements: bad }), /decoration is invalid/);
  });

  it("rejects two decorations that share an id", () => {
    const bad = [flower, { ...tree, id: flower.id }];
    expectRecovered(saveFile({ placements: bad }), /share an id/);
  });

  it("recovers when storage cannot be read", () => {
    const storage: StorageLike = {
      getItem: () => {
        throw new Error("access denied");
      },
      setItem: () => {},
    };

    const result = loadWorld(storage);

    expect(result.status).toBe("recovered");
    expect(result.world).toEqual(createDefaultWorld());
  });
});

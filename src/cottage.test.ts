import { describe, expect, it } from "vitest";
import { COTTAGE_OPTIONS, COTTAGE_SLOTS, COTTAGE_TABS, getOption, getSlot, lockedSlots, optionsFor, setSlot } from "./cottage";
import { appReducer } from "./game";
import { defaultHouse, HOUSE_DESIGNS, presetHouse, setColour } from "./houses";
import { createDefaultGame, loadGame, saveGame, SAVE_VERSION } from "./persistence";
import { createProgression, isCottageOptionUnlocked, settle } from "./progression";
import { createStorage, freshAppState, TODAY } from "./testing";

function unlockedWith(points: number) {
  return settle({ ...createProgression(TODAY), points }).progression;
}

describe("combining cottage parts", () => {
  it("changes one part without disturbing the others", () => {
    const base = defaultHouse();
    const changed = setSlot(base, "roof.style", "fishscale");

    expect(changed.roof.style).toBe("fishscale");
    expect(changed.windows).toEqual(base.windows);
    expect(changed.door).toEqual(base.door);
    expect(changed.extras).toEqual(base.extras);
  });

  it("combines several parts at once, and each one reads back as chosen", () => {
    let house = defaultHouse();
    house = setSlot(house, "windows.style", "round");
    house = setSlot(house, "door.style", "double");
    house = setSlot(house, "windows.shutters", "on");
    house = setSlot(house, "extras.chimney", "brick");

    expect(getSlot(house, "windows.style")).toBe("round");
    expect(getSlot(house, "door.style")).toBe("double");
    expect(getSlot(house, "windows.shutters")).toBe("on");
    expect(getSlot(house, "extras.chimney")).toBe("brick");
  });

  it("switches yes/no options off again", () => {
    const on = setSlot(defaultHouse(), "extras.steps", "on");

    expect(getSlot(setSlot(on, "extras.steps", "off"), "extras.steps")).toBe("off");
  });

  it("every option belongs to a slot and every slot is shown in exactly one builder tab", () => {
    const shown = COTTAGE_TABS.flatMap((tab) => tab.slots);

    expect(new Set(shown).size).toBe(shown.length);
    expect([...shown].sort()).toEqual([...COTTAGE_SLOTS].sort());
    expect(new Set(COTTAGE_OPTIONS.map((option) => option.key)).size).toBe(COTTAGE_OPTIONS.length);
  });

  it("every design preset uses only starter styles, so it can always be applied", () => {
    for (const design of HOUSE_DESIGNS) {
      expect(lockedSlots(presetHouse(design), (slot, value) => getOption(slot, value)?.unlock.type === "starter"), design.id).toEqual([]);
    }
  });
});

describe("colour customisation", () => {
  it("changes only the chosen part's colour", () => {
    const house = setColour(defaultHouse(), "roof", "rose");

    expect(house.roof.color).toBe("rose");
    expect(house.walls.color).toBeNull();
    expect(house.roof.style).toBe("shingles");
  });

  it("applies colours through the reducer without any unlock", () => {
    const state = appReducer(freshAppState(), { type: "set-house-colour", part: "trim", swatchId: "gold" });

    expect(state.house.trim.color).toBe("gold");
  });

  it("ignores an unknown colour", () => {
    const state = appReducer(freshAppState(), { type: "set-house-colour", part: "trim", swatchId: "neon" });

    expect(state.house.trim.color).toBeNull();
  });
});

describe("locked and unlocked options", () => {
  it("starter options are always unlocked, and nothing else is on a fresh start", () => {
    const fresh = createProgression(TODAY);

    expect(isCottageOptionUnlocked(fresh, "roof.style", "shingles")).toBe(true);
    expect(isCottageOptionUnlocked(fresh, "roof.style", "fishscale")).toBe(false);
    expect(lockedSlots(defaultHouse(), (slot, value) => isCottageOptionUnlocked(fresh, slot, value))).toEqual([]);
  });

  it("refuses to apply a locked style", () => {
    const house = setSlot(defaultHouse(), "roof.style", "celestial");
    const state = appReducer(freshAppState(), { type: "set-cottage", house });

    expect(state.house.roof.style).toBe("shingles");
    expect(state.message).toContain("still locked");
  });

  it("applies the style once it is earned, and the earned style stays earned", () => {
    const earned = unlockedWith(60);
    const house = setSlot(defaultHouse(), "roof.style", "fishscale");

    const applied = appReducer({ ...freshAppState(earned), house }, { type: "set-cottage", house });

    expect(applied.house.roof.style).toBe("fishscale");
    expect(earned.unlockedCottageOptions).toContain("roof.style:fishscale");
  });

  it("unlocks options from the same petal total as other rewards, and only once", () => {
    const result = settle({ ...createProgression(TODAY), points: 30 });

    expect(result.progression.unlockedCottageOptions).toContain("roof.style:fishscale");
    expect(result.progression.unlockedCottageOptions).not.toContain("roof.style:thatch");
    expect(settle(result.progression).events.filter((event) => event.type === "unlock" && event.item === "cottage")).toEqual([]);
  });

  it("lists every option for a slot, so the builder can show locked ones too", () => {
    expect(optionsFor("roof.style").map((option) => option.value)).toEqual(
      ["shingles", "tiles", "fishscale", "thatch", "moss", "celestial"],
    );
  });
});

describe("saving and restoring the cottage", () => {
  it("restores every chosen part and colour after a reload", () => {
    const earned = unlockedWith(100);
    let house = setSlot(defaultHouse(), "windows.style", "arched");
    house = setSlot(house, "extras.lanterns", "on");
    house = setColour(house, "roof", "plum");
    const storage = createStorage();

    saveGame(storage, { ...createDefaultGame(TODAY), progression: earned, house });
    const restored = loadGame(storage, TODAY).game.house;

    expect(restored).toEqual(house);
    expect(loadGame(storage, TODAY).status).toBe("loaded");
  });

  it("writes the cottage under the current save version", () => {
    const storage = createStorage();
    saveGame(storage, createDefaultGame(TODAY));

    expect(JSON.parse(storage.data.get("little-world:save") ?? "{}").version).toBe(SAVE_VERSION);
  });

  it("loads a version 2 save and upgrades its design to the part-based cottage", () => {
    const save = JSON.stringify({
      version: 2,
      themeId: "spring",
      placements: [],
      progression: {},
      house: { designId: "lavender", colors: { roof: "orchid", wall: "pearl" } },
    });

    const result = loadGame(createStorage(save), TODAY);

    expect(result.status).toBe("loaded");
    expect(result.migrated).toBe(true);
    expect(result.game.house.roof.style).toBe("tiles");
    expect(result.game.house.roof.color).toBe("orchid");
    expect(result.game.house.walls.color).toBe("pearl");
  });

  it("loads an older save with no cottage fields, giving the original cottage", () => {
    const save = JSON.stringify({ version: 2, themeId: "spring", placements: [] });

    const result = loadGame(createStorage(save), TODAY);

    expect(result.game.house).toEqual(defaultHouse());
  });

  it("keeps a version 2 save's earned unlocks while upgrading it", () => {
    const save = JSON.stringify({
      version: 2,
      themeId: "spring",
      placements: [],
      progression: { points: 45, unlockedDecorations: ["pink-blossom"], unlockedHouses: ["lavender"] },
      house: { designId: "classic", colors: {} },
    });

    const { progression } = loadGame(createStorage(save), TODAY).game;

    expect(progression.points).toBe(45);
    expect(progression.unlockedDecorations).toContain("pink-blossom");
    expect(progression.unlockedHouses).toContain("lavender");
  });

  it("drops a saved option the player has not earned, and a saved colour that does not exist", () => {
    const save = JSON.stringify({
      version: SAVE_VERSION,
      themeId: "spring",
      placements: [],
      house: {
        roof: { style: "celestial", color: "neon" },
        windows: { shutters: true, style: "multipane" },
        extras: { balcony: true },
      },
    });

    const house = loadGame(createStorage(save), TODAY).game.house;

    expect(house.roof.style).toBe("shingles");
    expect(house.roof.color).toBeNull();
    expect(house.windows.shutters).toBe(false);
    expect(house.extras.balcony).toBe(false);
    expect(house.windows.style).toBe("multipane");
  });

  it("falls back to the original cottage when the saved house is not an object", () => {
    const save = JSON.stringify({ version: SAVE_VERSION, themeId: "spring", placements: [], house: "round" });

    expect(loadGame(createStorage(save), TODAY).game.house).toEqual(defaultHouse());
  });
});

describe("unlocks survive palette changes and world resets", () => {
  it("keeps earned cottage options and the cottage when the palette changes", () => {
    const earned = unlockedWith(100);
    const house = setSlot(defaultHouse(), "extras.steps", "on");
    const state = appReducer({ ...freshAppState(earned), house }, { type: "set-theme", themeId: "moonlit" });

    expect(state.progression.unlockedCottageOptions).toEqual(earned.unlockedCottageOptions);
    expect(state.house).toEqual(house);
  });

  it("keeps earned cottage options and the cottage through a world reset", () => {
    const earned = unlockedWith(100);
    const house = setSlot(defaultHouse(), "roof.style", "fishscale");
    const state = appReducer({ ...freshAppState(earned), house }, { type: "reset-world" });

    expect(state.progression.unlockedCottageOptions).toEqual(earned.unlockedCottageOptions);
    expect(state.house).toEqual(house);
  });
});

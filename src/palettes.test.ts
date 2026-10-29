import { describe, expect, it } from "vitest";
import { THEME_IDS } from "./types";
import type { ThemeId } from "./types";
import { THEMES, getTheme } from "./themes";
import type { Palette } from "./themes";
import { appReducer } from "./game";
import { createDefaultGame, loadGame, saveGame, SAVE_VERSION } from "./persistence";
import { isPaletteUnlocked, settle, createProgression } from "./progression";
import { createStorage, freshAppState, spot, TODAY } from "./testing";

const PALETTE_KEYS: (keyof Palette)[] = [
  "sky", "cloud", "grass", "grassDeep", "path", "wall", "roof", "rock", "rockDeep", "trunk",
  "leaf", "petal", "sun", "panel", "ink", "muted", "accent",
];

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe("palette catalogue", () => {
  it("lists every palette id once and matches the theme list", () => {
    expect(new Set(THEME_IDS).size).toBe(THEME_IDS.length);
    expect(THEMES.map((theme) => theme.id).sort()).toEqual([...THEME_IDS].sort());
  });

  it("keeps the original three themes with their original names", () => {
    expect(getTheme("spring").label).toBe("Spring Meadow");
    expect(getTheme("sunset").label).toBe("Sunset Garden");
    expect(getTheme("moonlit").label).toBe("Moonlit Grove");
    expect(getTheme("spring").palette.sky).toBe("#bfe6f5");
  });

  it("has twelve pastel and eight dark palettes, as designed", () => {
    expect(THEMES.filter((theme) => theme.group === "pastel")).toHaveLength(12);
    expect(THEMES.filter((theme) => theme.group === "dark")).toHaveLength(8);
  });

  it("gives every palette a complete set of colours", () => {
    for (const theme of THEMES) {
      for (const key of PALETTE_KEYS) {
        expect(theme.palette[key], `${theme.id}.${key}`).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it("keeps text readable on panels and cards in every palette", () => {
    for (const theme of THEMES) {
      expect(contrast(theme.palette.ink, theme.palette.panel), `${theme.id} panel`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.palette.ink, theme.palette.cloud), `${theme.id} cloud`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("palette unlocks", () => {
  it("starts with the classic and starter pastel palettes, and locks the rest", () => {
    const progression = createProgression(TODAY);

    expect(isPaletteUnlocked(progression, "spring")).toBe(true);
    expect(isPaletteUnlocked(progression, "lavender-dream")).toBe(true);
    expect(isPaletteUnlocked(progression, "midnight-enchantment")).toBe(false);
    expect(isPaletteUnlocked(progression, "not-a-palette")).toBe(false);
  });

  it("unlocks a palette once its petal requirement is met, and never twice", () => {
    const first = settle({ ...createProgression(TODAY), points: 100 });

    expect(first.progression.unlockedPalettes).toContain("midnight-enchantment");
    expect(first.events.some((event) => event.type === "unlock" && event.item === "palette")).toBe(true);
    expect(settle(first.progression).events).toEqual([]);
  });

  it("refuses to apply a locked palette, and applies an unlocked one without touching the island", () => {
    let state = freshAppState();
    state = appReducer(state, { type: "select-kind", kind: "flower" });
    state = appReducer(state, { type: "tap-grass", point: spot(0), dateKey: TODAY });
    const placements = state.world.placements;

    const refused = appReducer(state, { type: "set-theme", themeId: "midnight-enchantment" });
    expect(refused.world.themeId).toBe("spring");
    expect(refused.message).toContain("still locked");

    const earned = { ...state, progression: settle({ ...state.progression, points: 100 }).progression };
    const applied = appReducer(earned, { type: "set-theme", themeId: "midnight-enchantment" });
    expect(applied.world.themeId).toBe("midnight-enchantment");
    expect(applied.world.placements).toBe(placements);
  });

  it("restores the default palette at any time", () => {
    const state = appReducer(freshAppState(), { type: "set-theme", themeId: "sunset" });

    expect(appReducer(state, { type: "set-theme", themeId: "spring" }).world.themeId).toBe("spring");
  });
});

describe("saving palettes", () => {
  it("saves the applied palette and restores it on reload", () => {
    const storage = createStorage();
    const game = createDefaultGame(TODAY);
    saveGame(storage, { ...game, world: { ...game.world, themeId: "fae-forest" } });

    expect(loadGame(storage, TODAY).game.world.themeId).toBe("fae-forest");
  });

  it("falls back to Spring Meadow when a saved palette is not unlocked", () => {
    const save = JSON.stringify({ version: SAVE_VERSION, themeId: "gothic-fairytale", placements: [] });

    const result = loadGame(createStorage(save), TODAY);

    expect(result.status).toBe("loaded");
    expect(result.game.world.themeId).toBe("spring");
  });

  it("keeps saved palettes that were earned", () => {
    const save = JSON.stringify({
      version: SAVE_VERSION,
      themeId: "gothic-fairytale",
      placements: [],
      progression: { unlockedPalettes: ["gothic-fairytale", "not-real"] },
    });

    const result = loadGame(createStorage(save), TODAY);

    expect(result.game.world.themeId).toBe("gothic-fairytale");
    expect(result.game.progression.unlockedPalettes).toEqual(["gothic-fairytale"] satisfies ThemeId[]);
  });

  it("loads older saves that have no palette list, treating it as empty", () => {
    const save = JSON.stringify({ version: SAVE_VERSION, themeId: "moonlit", placements: [] });

    const result = loadGame(createStorage(save), TODAY);

    expect(result.game.progression.unlockedPalettes).toEqual([]);
    expect(result.game.world.themeId).toBe("moonlit");
  });
});

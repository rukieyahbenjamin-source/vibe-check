import type { CSSProperties } from "react";
import type { ThemeId, UnlockRule } from "./types";

export type Palette = Record<
  | "sky"
  | "cloud"
  | "grass"
  | "grassDeep"
  | "path"
  | "wall"
  | "roof"
  | "rock"
  | "rockDeep"
  | "trunk"
  | "leaf"
  | "petal"
  | "sun"
  | "panel"
  | "ink"
  | "muted"
  | "accent",
  string
>;

export type PaletteGroup = "classic" | "pastel" | "dark";

/**
 * A subtle ambience for the scene. Each palette picks one, so palettes feel distinct without
 * a separate theme system. "none" keeps the scene quiet.
 */
export type Atmosphere = "pollen" | "warm" | "stars" | "cool" | "mist" | "sparkle" | "none";

export const ATMOSPHERES: Atmosphere[] = ["pollen", "warm", "stars", "cool", "mist", "sparkle", "none"];
/** Each palette's ambience. Restrained on purpose: a palette adds a mood, not clutter. */
const ATMOSPHERE_BY_ID: Record<ThemeId, Atmosphere> = {
  "spring": "pollen",
  "sunset": "warm",
  "moonlit": "cool",
  "lavender-dream": "stars",
  "celestial-moon": "stars",
  "rosewater-fairy": "warm",
  "fae-forest": "mist",
  "cotton-candy-skies": "sparkle",
  "opal-enchantment": "sparkle",
  "sakura-twilight": "sparkle",
  "dreamy-aurora": "cool",
  "sunlit-fairy-meadow": "pollen",
  "crystal-frost": "cool",
  "starlit-amethyst": "stars",
  "misty-enchanted-garden": "mist",
  "midnight-enchantment": "stars",
  "twilight-forest": "mist",
  "dark-academia-cottage": "warm",
  "gothic-fairytale": "none",
  "moonlit-ocean": "cool",
  "black-cherry-garden": "none",
  "enchanted-autumn": "warm",
  "mystic-amethyst": "stars",
};


interface PaletteDef {
  id: ThemeId;
  label: string;
  palette: Palette;
}

export interface ThemeInfo extends PaletteDef {
  group: PaletteGroup;
  atmosphere: Atmosphere;
  /** How the palette is obtained. Starter palettes are always available. */
  unlock: UnlockRule;
  description: string;
}

const CLASSIC_PALETTES: PaletteDef[] = [
  {
    id: "spring",
    label: "Spring Meadow",
    palette: {
      sky: "#bfe6f5",
      cloud: "#fffaf2",
      grass: "#a8d5a2",
      grassDeep: "#8cc084",
      path: "#f3e3c3",
      wall: "#fff6e6",
      roof: "#e8a6b5",
      rock: "#c4ad92",
      rockDeep: "#a88f74",
      trunk: "#8b6b4e",
      leaf: "#7fb77e",
      petal: "#f7c6d2",
      sun: "#ffe08a",
      panel: "#fffaf2",
      ink: "#5a4636",
      muted: "#8a7663",
      accent: "#e8a6b5",
    },
  },
  {
    id: "sunset",
    label: "Sunset Garden",
    palette: {
      sky: "#f9c7a8",
      cloud: "#ffe9d6",
      grass: "#c5c58f",
      grassDeep: "#aeb077",
      path: "#f7e1bf",
      wall: "#fff3e3",
      roof: "#d9826f",
      rock: "#b99c87",
      rockDeep: "#9a7f6c",
      trunk: "#7a5538",
      leaf: "#9fb36e",
      petal: "#f5a7a0",
      sun: "#ffd166",
      panel: "#fff5ea",
      ink: "#5a3f32",
      muted: "#8d6d5c",
      accent: "#d9826f",
    },
  },
  {
    id: "moonlit",
    label: "Moonlit Grove",
    palette: {
      sky: "#2e3f5c",
      cloud: "#50607f",
      grass: "#5f8a7a",
      grassDeep: "#4b7266",
      path: "#c9c4d8",
      wall: "#efe9f5",
      roof: "#7d6fa8",
      rock: "#6c6a7d",
      rockDeep: "#55536a",
      trunk: "#5a4a48",
      leaf: "#4f7f6c",
      petal: "#d7b8e8",
      sun: "#fff1b8",
      panel: "#27354f",
      ink: "#f2ecf8",
      muted: "#b9b3cc",
      accent: "#9d8cc7",
    },
  },
];

/** Palettes that start available: the classic three plus six pastels. */
const STARTER: UnlockRule = { type: "starter" };

// Pastel and dark palettes. Each one is curated, not a brightness change of another palette.
const NEW_PALETTES: ThemeInfo[] = [
  {
    id: "lavender-dream",
    label: "Lavender Dream",
    group: "pastel",
    atmosphere: "stars",
    unlock: STARTER,
    description: "Lilac, wisteria and misty blue.",
    palette: {
      sky: "#d9d2f5", cloud: "#f7f3ff", grass: "#c3d6d0", grassDeep: "#a6c3bc", path: "#eee4f7",
      wall: "#fbf7ff", roof: "#b9a2e0", rock: "#b7aed0", rockDeep: "#9a91b8", trunk: "#7d6b96",
      leaf: "#9fc2b5", petal: "#d4c2f0", sun: "#fff0b8", panel: "#faf7ff", ink: "#4f4268",
      muted: "#8a7fa6", accent: "#b9a2e0",
    },
  },
  {
    id: "celestial-moon",
    label: "Celestial Moon",
    group: "pastel",
    atmosphere: "stars",
    unlock: STARTER,
    description: "Moon blue, silver-lavender and starlight cream.",
    palette: {
      sky: "#c7d8f0", cloud: "#f4f8ff", grass: "#b8d6dc", grassDeep: "#9ec5cc", path: "#e6eef7",
      wall: "#f7fbff", roof: "#8fa3d4", rock: "#aab6cf", rockDeep: "#8b99b6", trunk: "#6b7896",
      leaf: "#9ccbc4", petal: "#dcd3f2", sun: "#fff7d6", panel: "#f6f9ff", ink: "#3f4a6b",
      muted: "#7f8bab", accent: "#8fa3d4",
    },
  },
  {
    id: "rosewater-fairy",
    label: "Rosewater Fairy",
    group: "pastel",
    atmosphere: "warm",
    unlock: STARTER,
    description: "Blush pink, rose and botanical green.",
    palette: {
      sky: "#fbd9e0", cloud: "#fff5f7", grass: "#c4dcb8", grassDeep: "#a7c99c", path: "#fbe9dd",
      wall: "#fff8f4", roof: "#e58ca8", rock: "#d7b7a8", rockDeep: "#b99786", trunk: "#8c6556",
      leaf: "#8fbf8a", petal: "#f2a7bd", sun: "#ffe3a3", panel: "#fff7f8", ink: "#6a4450",
      muted: "#a07f88", accent: "#e58ca8",
    },
  },
  {
    id: "fae-forest",
    label: "Fae Forest",
    group: "pastel",
    atmosphere: "mist",
    unlock: STARTER,
    description: "Mint, seafoam and turquoise.",
    palette: {
      sky: "#cdeee6", cloud: "#f2fbf8", grass: "#a6dccb", grassDeep: "#86c9b3", path: "#e7f4ec",
      wall: "#f7fcf9", roof: "#6fbfae", rock: "#a9c4bb", rockDeep: "#89a79d", trunk: "#6c8478",
      leaf: "#5fb39c", petal: "#bfe9dc", sun: "#fff3c4", panel: "#f4fbf8", ink: "#2f5b52",
      muted: "#6f9a90", accent: "#6fbfae",
    },
  },
  {
    id: "cotton-candy-skies",
    label: "Cotton Candy Skies",
    group: "pastel",
    atmosphere: "sparkle",
    unlock: STARTER,
    description: "Pastel pink, cloud blue and peach.",
    palette: {
      sky: "#f7d6ef", cloud: "#fff3fb", grass: "#c9e3e6", grassDeep: "#afd3d8", path: "#fbe8f3",
      wall: "#fff9fd", roof: "#f2a8d1", rock: "#c9bde0", rockDeep: "#aa9bc8", trunk: "#8f7aa6",
      leaf: "#a9d8e0", petal: "#f7c2e0", sun: "#fff1c9", panel: "#fff8fc", ink: "#5b4470",
      muted: "#9582ac", accent: "#9fd0e6",
    },
  },
  {
    id: "sunlit-fairy-meadow",
    label: "Sunlit Fairy Meadow",
    group: "pastel",
    atmosphere: "pollen",
    unlock: STARTER,
    description: "Buttercream, peach and fresh mint.",
    palette: {
      sky: "#fff0c9", cloud: "#fffaed", grass: "#c9e8ae", grassDeep: "#aed68e", path: "#fbeed3",
      wall: "#fffaf0", roof: "#f5a3a0", rock: "#d9c09e", rockDeep: "#bca07b", trunk: "#9a7452",
      leaf: "#9fd48a", petal: "#ffc0cb", sun: "#ffe27a", panel: "#fffbf1", ink: "#6b4d32",
      muted: "#a58a68", accent: "#f5a3a0",
    },
  },
  {
    id: "opal-enchantment",
    label: "Opal Enchantment",
    group: "pastel",
    atmosphere: "sparkle",
    unlock: { type: "points", amount: 40 },
    description: "Pearlescent pink, icy aqua and pearl.",
    palette: {
      sky: "#e6f4f6", cloud: "#fbfeff", grass: "#d4eee9", grassDeep: "#b7e0da", path: "#f5f0fa",
      wall: "#fdfcff", roof: "#f5c7dc", rock: "#cfd9ea", rockDeep: "#b0bfd6", trunk: "#8e8aa8",
      leaf: "#a8e0d6", petal: "#f9d3e6", sun: "#fff4d1", panel: "#fbfdff", ink: "#4a5170",
      muted: "#8c93b0", accent: "#a8e0ea",
    },
  },
  {
    id: "sakura-twilight",
    label: "Sakura Twilight",
    group: "pastel",
    atmosphere: "sparkle",
    unlock: { type: "points", amount: 40 },
    description: "Cherry blossom pink, dusty rose and misty blue.",
    palette: {
      sky: "#f1d0dc", cloud: "#fdf1f5", grass: "#d9c9dc", grassDeep: "#c4b0cc", path: "#f8e6ee",
      wall: "#fff7fa", roof: "#d98aa6", rock: "#c8b2c4", rockDeep: "#a895aa", trunk: "#7d6076",
      leaf: "#e0a9bf", petal: "#f8c2d4", sun: "#ffe6b8", panel: "#fff6fa", ink: "#5f3f57",
      muted: "#9a7d94", accent: "#c69ab4",
    },
  },
  {
    id: "dreamy-aurora",
    label: "Dreamy Aurora",
    group: "pastel",
    atmosphere: "cool",
    unlock: { type: "points", amount: 60 },
    description: "Pastel aqua, mint and soft violet.",
    palette: {
      sky: "#c9f0ea", cloud: "#f3fffc", grass: "#b6eadb", grassDeep: "#96dac6", path: "#e8f7f5",
      wall: "#f8fffe", roof: "#a9a2ea", rock: "#b4d3d9", rockDeep: "#93b7bf", trunk: "#637a8a",
      leaf: "#8fe0cf", petal: "#d2c8f7", sun: "#fff9d6", panel: "#f5fffd", ink: "#34506a",
      muted: "#6e8ea6", accent: "#a9a2ea",
    },
  },
  {
    id: "crystal-frost",
    label: "Crystal Frost",
    group: "pastel",
    atmosphere: "cool",
    unlock: { type: "points", amount: 60 },
    description: "Icy blue, frosted lavender and pale turquoise.",
    palette: {
      sky: "#dcecf8", cloud: "#f7fbff", grass: "#d2e9f0", grassDeep: "#b9dce6", path: "#eef6fb",
      wall: "#fbfdff", roof: "#9ec8e6", rock: "#c0cfe0", rockDeep: "#a0b2c8", trunk: "#6f8398",
      leaf: "#b4e0e6", petal: "#cfe4f5", sun: "#fdf8d6", panel: "#f8fbff", ink: "#3c5068",
      muted: "#7f93aa", accent: "#9ec8e6",
    },
  },
  {
    id: "starlit-amethyst",
    label: "Starlit Amethyst",
    group: "pastel",
    atmosphere: "stars",
    unlock: { type: "points", amount: 80 },
    description: "Lilac, soft violet and dusty blue.",
    palette: {
      sky: "#d8c8ef", cloud: "#f5f0fc", grass: "#c9bfe4", grassDeep: "#b3a7d6", path: "#ece4f7",
      wall: "#faf7ff", roof: "#9a7fcc", rock: "#b8acd4", rockDeep: "#9b8ebf", trunk: "#6e5c8e",
      leaf: "#b0a4da", petal: "#f0c6e4", sun: "#fff1c4", panel: "#f9f6ff", ink: "#4a3a6b",
      muted: "#8a7ca6", accent: "#9a7fcc",
    },
  },
  {
    id: "misty-enchanted-garden",
    label: "Misty Enchanted Garden",
    group: "pastel",
    atmosphere: "mist",
    unlock: { type: "points", amount: 80 },
    description: "Eucalyptus, sage, mauve and cream.",
    palette: {
      sky: "#e4ebe1", cloud: "#f8faf5", grass: "#c6d6c0", grassDeep: "#adc4a6", path: "#eee8dc",
      wall: "#faf6ee", roof: "#9db4a0", rock: "#bfb8aa", rockDeep: "#a09a8b", trunk: "#7a6f66",
      leaf: "#a4bfa2", petal: "#e3c3d0", sun: "#f7ecc0", panel: "#f9faf5", ink: "#43503f",
      muted: "#7d8a76", accent: "#b49aae",
    },
  },
  {
    id: "midnight-enchantment",
    label: "Midnight Enchantment",
    group: "dark",
    atmosphere: "stars",
    unlock: { type: "points", amount: 100 },
    description: "Midnight blue, violet and luminous lavender.",
    palette: {
      sky: "#1d2550", cloud: "#34407a", grass: "#3d5a7a", grassDeep: "#2f4a69", path: "#8c95c4",
      wall: "#dfe3f5", roof: "#6b5bb0", rock: "#4a4f78", rockDeep: "#363b60", trunk: "#3b3557",
      leaf: "#4f7aa5", petal: "#b9a8e8", sun: "#ffe9a6", panel: "#202a57", ink: "#eef0ff",
      muted: "#aab2dc", accent: "#9d8fe0",
    },
  },
  {
    id: "twilight-forest",
    label: "Twilight Forest",
    group: "dark",
    atmosphere: "mist",
    unlock: { type: "points", amount: 100 },
    description: "Deep pine, muted teal and misty aqua.",
    palette: {
      sky: "#17302f", cloud: "#2a4a46", grass: "#2e5a50", grassDeep: "#244a42", path: "#6f8f86",
      wall: "#d7e6df", roof: "#3d6e66", rock: "#4d5f58", rockDeep: "#3a4a44", trunk: "#5a4a3a",
      leaf: "#3f7a66", petal: "#a8d8c8", sun: "#f2e7a0", panel: "#1d3a36", ink: "#e2f2ec",
      muted: "#9dbfb4", accent: "#6fb3a0",
    },
  },
  {
    id: "dark-academia-cottage",
    label: "Dark Academia Cottage",
    group: "dark",
    atmosphere: "warm",
    unlock: { type: "points", amount: 120 },
    description: "Espresso, burgundy, antique cream and olive.",
    palette: {
      sky: "#2b1d18", cloud: "#4a3228", grass: "#5a5a3a", grassDeep: "#4a4a2e", path: "#8a7258",
      wall: "#e8dcc4", roof: "#6e2a35", rock: "#6b5b4c", rockDeep: "#50433a", trunk: "#4a3024",
      leaf: "#6b7340", petal: "#c98a8f", sun: "#f0cf86", panel: "#33231d", ink: "#f3e7d2",
      muted: "#bba48a", accent: "#8c3b48",
    },
  },
  {
    id: "gothic-fairytale",
    label: "Gothic Fairytale",
    group: "dark",
    atmosphere: "none",
    unlock: { type: "points", amount: 120 },
    description: "Plum, charcoal, dusty rose and antique silver.",
    palette: {
      sky: "#2a2630", cloud: "#3d3645", grass: "#4f5b4f", grassDeep: "#3f4a40", path: "#7d7585",
      wall: "#d9d2da", roof: "#5f2d4a", rock: "#5a5660", rockDeep: "#45424c", trunk: "#3e3340",
      leaf: "#4e6b5a", petal: "#d7a2b4", sun: "#e8dcb0", panel: "#241f29", ink: "#ece6ee",
      muted: "#aaa0b0", accent: "#c08a9e",
    },
  },
  {
    id: "moonlit-ocean",
    label: "Moonlit Ocean",
    group: "dark",
    atmosphere: "cool",
    unlock: { type: "points", amount: 140 },
    description: "Deep navy, petrol teal and moonstone blue.",
    palette: {
      sky: "#0f2238", cloud: "#1d3650", grass: "#2c5a62", grassDeep: "#214a52", path: "#7fa3ad",
      wall: "#e0eef2", roof: "#2e6f7d", rock: "#4b6878", rockDeep: "#37505f", trunk: "#3e4f5b",
      leaf: "#3b7f86", petal: "#a6dbe3", sun: "#f8f2c8", panel: "#142c44", ink: "#e6f5f8",
      muted: "#9ac3cc", accent: "#4fb0bf",
    },
  },
  {
    id: "black-cherry-garden",
    label: "Black Cherry Garden",
    group: "dark",
    atmosphere: "none",
    unlock: { type: "points", amount: 140 },
    description: "Deep berry, wine, mauve and blush.",
    palette: {
      sky: "#2a0f1f", cloud: "#43192f", grass: "#3f4a35", grassDeep: "#34402c", path: "#8a6070",
      wall: "#eedbe0", roof: "#7a1f3c", rock: "#5d4550", rockDeep: "#47333c", trunk: "#4a2b30",
      leaf: "#4e5e3c", petal: "#d88ea8", sun: "#f3d9a4", panel: "#33152a", ink: "#f7e6ec",
      muted: "#c49aaa", accent: "#b04b72",
    },
  },
  {
    id: "enchanted-autumn",
    label: "Enchanted Autumn",
    group: "dark",
    atmosphere: "warm",
    unlock: { type: "points", amount: 160 },
    description: "Burnt rose, aubergine, forest green and warm amber.",
    palette: {
      sky: "#3a2117", cloud: "#55322a", grass: "#5b6b33", grassDeep: "#4a5a2a", path: "#9a7450",
      wall: "#f2e2c4", roof: "#8f3f3a", rock: "#6e5a46", rockDeep: "#54443a", trunk: "#5b3a24",
      leaf: "#3f6b3a", petal: "#d9826b", sun: "#f7b95a", panel: "#452a20", ink: "#fbeedd",
      muted: "#d2b08c", accent: "#e09050",
    },
  },
  {
    id: "mystic-amethyst",
    label: "Mystic Amethyst",
    group: "dark",
    atmosphere: "stars",
    unlock: { type: "points", amount: 160 },
    description: "Dark purple, smoky lavender, indigo and crystal pink.",
    palette: {
      sky: "#1f1435", cloud: "#33234f", grass: "#3b3a66", grassDeep: "#302f55", path: "#7d6aa3",
      wall: "#e6dcf5", roof: "#5a3d8a", rock: "#554a72", rockDeep: "#433a5c", trunk: "#40305e",
      leaf: "#4f5f9a", petal: "#e7a6d4", sun: "#fbe9a6", panel: "#2a1c44", ink: "#f2e9ff",
      muted: "#b7a6d6", accent: "#a06ad6",
    },
  },
];

/** Every palette, in display order: classic first, then pastel, then dark. */
export const THEMES: ThemeInfo[] = [
  ...CLASSIC_PALETTES.map(
    (base): ThemeInfo => ({
      ...base,
      group: "classic",
      atmosphere: ATMOSPHERE_BY_ID[base.id],
      unlock: STARTER,
      description: "The original Little World look.",
    }),
  ),
  ...NEW_PALETTES,
];

export function getTheme(id: ThemeId): ThemeInfo {
  const theme = THEMES.find((t) => t.id === id);
  if (!theme) {
    throw new Error(`Unknown theme: ${id}`);
  }
  return theme;
}

/** Turns a palette into CSS custom properties, e.g. sky -> --sky. */
export function paletteToStyle(palette: Palette): CSSProperties {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(palette)) {
    vars[`--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`] = value;
  }
  return vars as CSSProperties;
}

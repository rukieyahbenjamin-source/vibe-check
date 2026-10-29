/** Every world palette. The first three are the original themes. */
export const THEME_IDS = [
  "spring",
  "sunset",
  "moonlit",
  "lavender-dream",
  "celestial-moon",
  "rosewater-fairy",
  "fae-forest",
  "cotton-candy-skies",
  "opal-enchantment",
  "sakura-twilight",
  "dreamy-aurora",
  "sunlit-fairy-meadow",
  "crystal-frost",
  "starlit-amethyst",
  "misty-enchanted-garden",
  "midnight-enchantment",
  "twilight-forest",
  "dark-academia-cottage",
  "gothic-fairytale",
  "moonlit-ocean",
  "black-cherry-garden",
  "enchanted-autumn",
  "mystic-amethyst",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

/** Every decoration in the catalogue. The first four are the starter decorations. */
export const DECORATION_KINDS = [
  "flower",
  "tree",
  "mushroom",
  "bench",
  "pink-blossom",
  "lavender",
  "sunflower",
  "cherry-tree",
  "autumn-tree",
  "glowing-mushroom",
  "garden-lantern",
  "birdbath",
  "fountain",
  "pond-small",
  "pond-natural",
  "stream-straight",
  "stream-bend",
  "waterfall",
  "lily-pads",
  "reeds",
  "wood-bridge",
  "stone-bridge",
  "stepping-stones",
  "clover-patch",
  "rock-cluster",
  "moss-patch",
  "flower-meadow",
  "pebble-path",
  "daisy",
  "tulip",
  "rose",
  "bluebell",
  "lily",
  "foxglove",
  "cosmos",
  "glow-flower",
  "wildflowers",
  "willow",
  "pine",
  "mystic-tree",
  "fern",
  "ivy-patch",
  "flowering-bush",
  "giant-mushroom",
  "lucky-clover",
  "stone-bench",
  "garden-arch",
  "birdhouse",
  "wind-chimes",
  "trellis",
  "sign",
] as const;

export type DecorationKind = (typeof DECORATION_KINDS)[number];

/** Catalogue categories used for the Decorate panel tabs and for progress counting. */
export const CATEGORIES = ["flowers", "trees", "plants", "furniture", "water", "landscape", "special"] as const;

/**
 * What an object does to its neighbours. Solids block other solids and water. Water blocks
 * solids and bridges. Ground decoration can sit under almost anything.
 */
export type Layer = "ground" | "solid" | "water" | "water-plant" | "bridge";

/**
 * The area an object takes up, relative to its anchor point (the placement x and y).
 * dx and dy move the shape's centre away from the anchor. Rotation turns the offset too.
 */
export type Footprint =
  | { shape: "circle"; r: number; dx: number; dy: number }
  | { shape: "box"; w: number; h: number; dx: number; dy: number };

export type Category = (typeof CATEGORIES)[number];

export interface Point {
  x: number;
  y: number;
}

export interface Placement extends Point {
  id: number;
  kind: DecorationKind;
  /** Rotation in degrees, from 0 up to (but not including) 360. */
  rotation: number;
}

/** Original fixed goal used by goals.ts (counts what is on the island right now). */
export interface Goal {
  id: string;
  label: string;
  kind: DecorationKind;
  target: number;
}

/** How a daily goal or milestone measures progress. */
export type Metric =
  | { type: "category"; category: Category }
  | { type: "total" }
  | { type: "categories" }
  | { type: "dailyGoals" };

/** Placement counts. Counts only ever go up, so moving, rotating, undoing or deleting never reduce them. */
export interface Counts {
  byCategory: Record<Category, number>;
  /** Distinct categories placed so far. */
  categories: Category[];
}

export type UnlockRule =
  | { type: "starter" }
  | { type: "points"; amount: number }
  | { type: "milestone"; milestoneId: string };

export interface DailyState extends Counts {
  /** The local calendar day this state belongs to, as YYYY-MM-DD. */
  date: string;
  /** Ids of daily goals whose reward has already been paid today. */
  claimed: string[];
}

export interface Lifetime extends Counts {
  dailyGoalsCompleted: number;
}

export interface Progression {
  daily: DailyState;
  lifetime: Lifetime;
  /** Petals, earned from daily goals and milestones. Never goes down. */
  points: number;
  unlockedDecorations: DecorationKind[];
  unlockedHouses: string[];
  /** Palettes earned through progression. Starter palettes are always available. */
  unlockedPalettes: ThemeId[];
  /** Cottage options earned through progression, as "slot:value" keys (see cottage.ts). */
  unlockedCottageOptions: string[];
  completedMilestones: string[];
}

export type RewardEvent =
  | { type: "daily-goal"; title: string; points: number }
  | { type: "milestone"; title: string; points: number }
  | { type: "unlock"; item: "decoration" | "house" | "palette" | "cottage"; name: string };

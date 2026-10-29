import type { UnlockRule } from "./types";

// The cottage is made of independent parts. Each part has a style (unlockable, see cottage.ts)
// and optional colours (always free). Colours are stored as swatch ids, never raw colour values.

export const HOUSE_PARTS = ["roof", "wall", "door", "trim"] as const;
export type HousePart = (typeof HOUSE_PARTS)[number];

export const HOUSE_PART_LABELS: Record<HousePart, string> = {
  roof: "Roof",
  wall: "Walls",
  door: "Door",
  trim: "Window trim",
};

/** A curated colour. Saves store the id, never the raw colour. */
export interface Swatch {
  id: string;
  label: string;
  value: string;
}

export const SWATCHES: Swatch[] = [
  { id: "cream", label: "Cream", value: "#fff6e6" },
  { id: "blush", label: "Blush pink", value: "#f4b6c8" },
  { id: "rose", label: "Rose", value: "#e58ca8" },
  { id: "lilac", label: "Lilac", value: "#cdb8ea" },
  { id: "lavender", label: "Lavender", value: "#9d86c9" },
  { id: "sky", label: "Sky blue", value: "#b8dcef" },
  { id: "slate", label: "Slate blue", value: "#8a97b3" },
  { id: "sage", label: "Sage green", value: "#b5cfa8" },
  { id: "moss", label: "Moss green", value: "#7f9f73" },
  { id: "butter", label: "Butter yellow", value: "#f7e3a1" },
  { id: "peach", label: "Peach", value: "#f6c3a5" },
  { id: "wood", label: "Natural wood", value: "#c9a27a" },
  { id: "orchid", label: "Orchid", value: "#b9a2e0" },
  { id: "pearl", label: "Pearl", value: "#f7f0fb" },
  { id: "petal-pink", label: "Petal pink", value: "#f4a7c0" },
  { id: "periwinkle", label: "Periwinkle", value: "#6f86b8" },
  { id: "espresso", label: "Espresso", value: "#4a3228" },
  { id: "burgundy", label: "Burgundy", value: "#6e2a35" },
  { id: "plum", label: "Plum", value: "#5f2d4a" },
  { id: "charcoal", label: "Charcoal", value: "#3d3645" },
  { id: "silver", label: "Antique silver", value: "#c9ccd8" },
  { id: "pine", label: "Deep pine", value: "#2e5a50" },
  { id: "navy", label: "Midnight navy", value: "#1d3650" },
  { id: "gold", label: "Warm gold", value: "#e8c770" },
];

// Style options. Each list is the set of values the builder offers for that part.
export const ROOF_STYLES = ["shingles", "tiles", "fishscale", "thatch", "moss", "celestial"] as const;
export const ROOF_DETAILS = ["none", "stars", "vines", "glow"] as const;
export const WALL_FINISHES = ["painted", "plaster", "timber", "stone", "ivy"] as const;
export const WINDOW_STYLES = ["square", "multipane", "round", "arched", "ornate"] as const;
export const DOOR_STYLES = ["classic", "rounded", "arched", "double", "rustic", "ornate"] as const;
export const DOOR_DETAILS = ["none", "vines", "glow"] as const;
export const CHIMNEY_STYLES = ["stone", "brick", "none"] as const;
export const ROOF_ORNAMENTS = ["none", "weathervane", "crystal"] as const;

export type RoofStyle = (typeof ROOF_STYLES)[number];
export type RoofDetail = (typeof ROOF_DETAILS)[number];
export type WallFinish = (typeof WALL_FINISHES)[number];
export type WindowStyle = (typeof WINDOW_STYLES)[number];
export type DoorStyle = (typeof DOOR_STYLES)[number];
export type DoorDetail = (typeof DOOR_DETAILS)[number];
export type ChimneyStyle = (typeof CHIMNEY_STYLES)[number];
export type RoofOrnament = (typeof ROOF_ORNAMENTS)[number];

/** Colour fields hold a swatch id, or null for the default (theme or design colour). */
export type ColourChoice = string | null;

/** The whole cottage. Every field is independent, so parts can be mixed and matched. */
export interface HouseState {
  roof: { style: RoofStyle; color: ColourChoice; detail: RoofDetail };
  walls: { finish: WallFinish; color: ColourChoice };
  trim: { color: ColourChoice; corners: boolean; beams: boolean };
  windows: {
    style: WindowStyle;
    frame: ColourChoice;
    glow: ColourChoice;
    shutters: boolean;
    shutterColor: ColourChoice;
    flowerBoxes: boolean;
  };
  door: { style: DoorStyle; color: ColourChoice; hardware: ColourChoice; detail: DoorDetail };
  extras: {
    chimney: ChimneyStyle;
    balcony: boolean;
    ivy: boolean;
    roofOrnament: RoofOrnament;
    lanterns: boolean;
    steps: boolean;
  };
}

/** The original cottage. Everything here matches how the cottage looked before Phase 2. */
export function defaultHouse(): HouseState {
  return {
    roof: { style: "shingles", color: null, detail: "none" },
    walls: { finish: "painted", color: null },
    trim: { color: null, corners: false, beams: false },
    windows: {
      style: "square",
      frame: null,
      glow: null,
      shutters: false,
      shutterColor: null,
      flowerBoxes: false,
    },
    door: { style: "classic", color: null, hardware: null, detail: "none" },
    extras: {
      chimney: "stone",
      balcony: false,
      ivy: false,
      roofOrnament: "none",
      lanterns: false,
      steps: false,
    },
  };
}

export function getSwatch(id: unknown): Swatch | undefined {
  return SWATCHES.find((swatch) => swatch.id === id);
}

/** A named starting look. Presets only use starter styles, so they are always applicable. */
export type HouseDesignId = "classic" | "lavender" | "blossom" | "woodland" | "moonlight";

export interface HouseDesign {
  id: HouseDesignId;
  name: string;
  description: string;
  unlock: UnlockRule;
  /** Colours and starter styles that differ from the original cottage. */
  apply: Partial<{
    roof: Partial<HouseState["roof"]>;
    walls: Partial<HouseState["walls"]>;
    trim: Partial<HouseState["trim"]>;
    windows: Partial<HouseState["windows"]>;
    door: Partial<HouseState["door"]>;
  }>;
}

export const HOUSE_DESIGNS: HouseDesign[] = [
  {
    id: "classic",
    name: "Classic Cottage",
    description: "The original cosy cottage. Its colours follow your world palette.",
    unlock: { type: "starter" },
    apply: {},
  },
  {
    id: "lavender",
    name: "Lavender Cottage",
    description: "Orchid tiles, pearl walls and soft purple details.",
    unlock: { type: "points", amount: 30 },
    apply: {
      roof: { style: "tiles", color: "orchid" },
      walls: { color: "pearl" },
      trim: { color: "lilac" },
      windows: { frame: "lilac" },
      door: { color: "lavender" },
    },
  },
  {
    id: "blossom",
    name: "Blossom Cottage",
    description: "Petal-pink roof, flower boxes and rose details.",
    unlock: { type: "points", amount: 50 },
    apply: {
      roof: { color: "petal-pink" },
      walls: { color: "pearl" },
      trim: { color: "blush" },
      windows: { flowerBoxes: true },
      door: { color: "rose" },
    },
  },
  {
    id: "woodland",
    name: "Woodland Cottage",
    description: "Sage roof, warm wood trim and a moss door.",
    unlock: { type: "milestone", milestoneId: "tree-lover" },
    apply: {
      roof: { color: "sage" },
      walls: { color: "cream" },
      trim: { color: "wood" },
      door: { color: "moss" },
    },
  },
  {
    id: "moonlight",
    name: "Moonlight Cottage",
    description: "Periwinkle roof, slate door and a cool glow in the windows.",
    unlock: { type: "milestone", milestoneId: "grand-garden" },
    apply: {
      roof: { color: "periwinkle" },
      walls: { color: "pearl" },
      trim: { color: "sky" },
      windows: { glow: "sky" },
      door: { color: "slate" },
    },
  },
];

export function getHouseDesign(id: unknown): HouseDesign | undefined {
  return HOUSE_DESIGNS.find((design) => design.id === id);
}

/** The full cottage that a preset describes. */
export function presetHouse(design: HouseDesign): HouseState {
  const base = defaultHouse();
  return {
    roof: { ...base.roof, ...design.apply.roof },
    walls: { ...base.walls, ...design.apply.walls },
    trim: { ...base.trim, ...design.apply.trim },
    windows: { ...base.windows, ...design.apply.windows },
    door: { ...base.door, ...design.apply.door },
    extras: base.extras,
  };
}

/** Returns the house with one colour part changed. Colours never need unlocking. */
export function setColour(house: HouseState, part: HousePart, swatchId: string | null): HouseState {
  switch (part) {
    case "roof":
      return { ...house, roof: { ...house.roof, color: swatchId } };
    case "wall":
      return { ...house, walls: { ...house.walls, color: swatchId } };
    case "door":
      return { ...house, door: { ...house.door, color: swatchId } };
    case "trim":
      return { ...house, trim: { ...house.trim, color: swatchId } };
  }
}

/**
 * The colour each colour-part should be drawn in: the chosen swatch, or the default.
 * Defaults are theme CSS variables for the original cottage.
 */
export function effectiveColours(house: HouseState): Record<HousePart, string> {
  return {
    roof: getSwatch(house.roof.color)?.value ?? "var(--roof)",
    wall: getSwatch(house.walls.color)?.value ?? "var(--wall)",
    door: getSwatch(house.door.color)?.value ?? "var(--trunk)",
    trim: getSwatch(house.trim.color)?.value ?? "var(--wall)",
  };
}

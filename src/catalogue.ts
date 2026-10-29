import { MILESTONES } from "./milestones";
import { DECORATION_KINDS } from "./types";
import type { Category, DecorationKind, Footprint, Layer, UnlockRule } from "./types";

export type ArtShape =
  | "flower"
  | "tree"
  | "mushroom"
  | "bench"
  | "lantern"
  | "birdbath"
  | "fountain"
  | "pond-small"
  | "pond-natural"
  | "stream"
  | "stream-bend"
  | "waterfall"
  | "lily-pads"
  | "reeds"
  | "wood-bridge"
  | "stone-bridge"
  | "stepping"
  | "clover"
  | "rocks"
  | "moss"
  | "meadow"
  | "pebbles"
  | "daisy"
  | "tulip"
  | "rose"
  | "bluebell"
  | "lily"
  | "foxglove"
  | "cosmos"
  | "glow-flower"
  | "wildflowers"
  | "willow"
  | "pine"
  | "mystic-tree"
  | "fern"
  | "ivy-patch"
  | "flowering-bush"
  | "giant-mushroom"
  | "lucky-clover"
  | "stone-bench"
  | "garden-arch"
  | "birdhouse"
  | "wind-chimes"
  | "trellis"
  | "sign";

export interface ArtSpec {
  shape: ArtShape;
  /** Main colour: petals, leaves, mushroom cap or lantern glow. Defaults to a theme colour. */
  primary?: string;
  /** Second colour: flower centre or tree shade. */
  secondary?: string;
  glow?: boolean;
}

export interface DecorationDef {
  id: DecorationKind;
  name: string;
  category: Category;
  unlock: UnlockRule;
  /** Collision behaviour. See footprint.ts for the rules. */
  layer: Layer;
  /** The area the object occupies. Derived from here, never stored in saves. */
  footprint: Footprint;
  art: ArtSpec;
}

const STARTER: UnlockRule = { type: "starter" };
const points = (amount: number): UnlockRule => ({ type: "points", amount });
const milestone = (milestoneId: string): UnlockRule => ({ type: "milestone", milestoneId });

/**
 * The decoration catalogue. To add a decoration, add its id to DECORATION_KINDS in types.ts
 * and add an entry here. The unlock rule decides how the player earns it, and the footprint
 * decides where it can go.
 */
export const DECORATIONS: Record<DecorationKind, DecorationDef> = {
  flower: {
    id: "flower", name: "Flower", category: "flowers", unlock: STARTER, layer: "ground",
    footprint: { shape: "circle", r: 6, dx: 0, dy: -18 }, art: { shape: "flower" },
  },
  tree: {
    id: "tree", name: "Tree", category: "trees", unlock: STARTER, layer: "solid",
    footprint: { shape: "circle", r: 10, dx: 0, dy: -4 }, art: { shape: "tree" },
  },
  mushroom: {
    id: "mushroom", name: "Mushroom", category: "plants", unlock: STARTER, layer: "ground",
    footprint: { shape: "circle", r: 5, dx: 0, dy: -4 }, art: { shape: "mushroom" },
  },
  bench: {
    id: "bench", name: "Bench", category: "furniture", unlock: STARTER, layer: "solid",
    footprint: { shape: "box", w: 34, h: 12, dx: 0, dy: -6 }, art: { shape: "bench" },
  },
  "pink-blossom": {
    id: "pink-blossom", name: "Pink Blossom", category: "flowers", unlock: points(25), layer: "ground",
    footprint: { shape: "circle", r: 6, dx: 0, dy: -18 },
    art: { shape: "flower", primary: "#f4b6d0", secondary: "#ffe08a" },
  },
  lavender: {
    id: "lavender", name: "Lavender", category: "flowers", unlock: points(45), layer: "ground",
    footprint: { shape: "circle", r: 6, dx: 0, dy: -18 },
    art: { shape: "flower", primary: "#b9a2e0", secondary: "#8f78c2" },
  },
  sunflower: {
    id: "sunflower", name: "Sunflower", category: "flowers", unlock: milestone("bloom-collector"), layer: "ground",
    footprint: { shape: "circle", r: 6, dx: 0, dy: -18 },
    art: { shape: "flower", primary: "#ffc94a", secondary: "#7a4e2d" },
  },
  "cherry-tree": {
    id: "cherry-tree", name: "Cherry Blossom Tree", category: "trees", unlock: points(60), layer: "solid",
    footprint: { shape: "circle", r: 10, dx: 0, dy: -4 },
    art: { shape: "tree", primary: "#f7b6cc", secondary: "#e89ab5" },
  },
  "autumn-tree": {
    id: "autumn-tree", name: "Autumn Tree", category: "trees", unlock: milestone("tree-lover"), layer: "solid",
    footprint: { shape: "circle", r: 10, dx: 0, dy: -4 },
    art: { shape: "tree", primary: "#e0884a", secondary: "#c96a2e" },
  },
  "glowing-mushroom": {
    id: "glowing-mushroom", name: "Glowing Mushroom", category: "plants", unlock: milestone("five-days"), layer: "ground",
    footprint: { shape: "circle", r: 6, dx: 0, dy: -6 },
    art: { shape: "mushroom", primary: "#9fe3d4", glow: true },
  },
  "garden-lantern": {
    id: "garden-lantern", name: "Garden Lantern", category: "furniture", unlock: points(35), layer: "solid",
    footprint: { shape: "circle", r: 4, dx: 0, dy: -4 }, art: { shape: "lantern" },
  },
  birdbath: {
    id: "birdbath", name: "Birdbath", category: "furniture", unlock: points(80), layer: "solid",
    footprint: { shape: "circle", r: 8, dx: 0, dy: -6 }, art: { shape: "birdbath" },
  },
  fountain: {
    id: "fountain", name: "Fountain", category: "special", unlock: milestone("grand-garden"), layer: "solid",
    footprint: { shape: "circle", r: 16, dx: 0, dy: -4 }, art: { shape: "fountain" },
  },

  // Water features. Ponds and streams take up more room, and nothing solid can sit in them.
  "pond-small": {
    id: "pond-small", name: "Small Pond", category: "water", unlock: STARTER, layer: "water",
    footprint: { shape: "box", w: 76, h: 40, dx: 0, dy: 0 }, art: { shape: "pond-small" },
  },
  "pond-natural": {
    id: "pond-natural", name: "Natural Pond", category: "water", unlock: points(40), layer: "water",
    footprint: { shape: "box", w: 106, h: 56, dx: 0, dy: 0 }, art: { shape: "pond-natural" },
  },
  "stream-straight": {
    id: "stream-straight", name: "Stream", category: "water", unlock: points(30), layer: "water",
    footprint: { shape: "box", w: 120, h: 22, dx: 0, dy: 0 }, art: { shape: "stream" },
  },
  "stream-bend": {
    id: "stream-bend", name: "Curved Stream", category: "water", unlock: milestone("green-thumb"), layer: "water",
    footprint: { shape: "box", w: 66, h: 50, dx: 0, dy: 0 }, art: { shape: "stream-bend" },
  },
  waterfall: {
    id: "waterfall", name: "Waterfall", category: "water", unlock: milestone("ten-days"), layer: "water",
    footprint: { shape: "box", w: 36, h: 56, dx: 0, dy: -28 }, art: { shape: "waterfall" },
  },
  "lily-pads": {
    id: "lily-pads", name: "Lily Pads", category: "water", unlock: points(20), layer: "water-plant",
    footprint: { shape: "circle", r: 9, dx: 0, dy: 0 }, art: { shape: "lily-pads" },
  },
  reeds: {
    id: "reeds", name: "Reeds & Cattails", category: "water", unlock: points(25), layer: "water-plant",
    footprint: { shape: "circle", r: 6, dx: 0, dy: -6 }, art: { shape: "reeds" },
  },
  "wood-bridge": {
    id: "wood-bridge", name: "Wooden Bridge", category: "water", unlock: points(50), layer: "bridge",
    footprint: { shape: "box", w: 70, h: 22, dx: 0, dy: 0 }, art: { shape: "wood-bridge" },
  },
  "stone-bridge": {
    id: "stone-bridge", name: "Stone Bridge", category: "water", unlock: points(70), layer: "bridge",
    footprint: { shape: "box", w: 70, h: 22, dx: 0, dy: 0 }, art: { shape: "stone-bridge" },
  },
  "stepping-stones": {
    id: "stepping-stones", name: "Stepping Stones", category: "water", unlock: STARTER, layer: "bridge",
    footprint: { shape: "box", w: 50, h: 14, dx: 0, dy: 0 }, art: { shape: "stepping" },
  },

  // Ground and landscape details. These sit under other things, so they are easy to place.
  "clover-patch": {
    id: "clover-patch", name: "Clover Patch", category: "landscape", unlock: STARTER, layer: "ground",
    footprint: { shape: "circle", r: 9, dx: 0, dy: 0 }, art: { shape: "clover" },
  },
  "rock-cluster": {
    id: "rock-cluster", name: "Rock Cluster", category: "landscape", unlock: STARTER, layer: "solid",
    footprint: { shape: "circle", r: 9, dx: 0, dy: -2 }, art: { shape: "rocks" },
  },
  "moss-patch": {
    id: "moss-patch", name: "Moss Patch", category: "landscape", unlock: milestone("daily-habit"), layer: "ground",
    footprint: { shape: "circle", r: 10, dx: 0, dy: 0 }, art: { shape: "moss" },
  },
  "flower-meadow": {
    id: "flower-meadow", name: "Flower Meadow", category: "landscape", unlock: points(15), layer: "ground",
    footprint: { shape: "box", w: 60, h: 26, dx: 0, dy: 0 }, art: { shape: "meadow" },
  },
  "pebble-path": {
    id: "pebble-path", name: "Pebble Path", category: "landscape", unlock: points(15), layer: "ground",
    footprint: { shape: "box", w: 56, h: 12, dx: 0, dy: 0 }, art: { shape: "pebbles" },
  },

  // Botanical expansion: flowers
  daisy: {
    id: "daisy", name: "Daisies", category: "flowers", unlock: STARTER, layer: "ground",
    footprint: { shape: "circle", r: 6, dx: 0, dy: -10 }, art: { shape: "daisy" },
  },
  tulip: {
    id: "tulip", name: "Tulips", category: "flowers", unlock: points(15), layer: "ground",
    footprint: { shape: "circle", r: 5, dx: 0, dy: -8 }, art: { shape: "tulip", primary: "#f49bb5" },
  },
  rose: {
    id: "rose", name: "Roses", category: "flowers", unlock: points(30), layer: "ground",
    footprint: { shape: "circle", r: 7, dx: 0, dy: -10 }, art: { shape: "rose" },
  },
  bluebell: {
    id: "bluebell", name: "Bluebells", category: "flowers", unlock: points(20), layer: "ground",
    footprint: { shape: "circle", r: 6, dx: 0, dy: -8 }, art: { shape: "bluebell" },
  },
  lily: {
    id: "lily", name: "Lilies", category: "flowers", unlock: points(35), layer: "ground",
    footprint: { shape: "circle", r: 7, dx: 0, dy: -8 }, art: { shape: "lily" },
  },
  foxglove: {
    id: "foxglove", name: "Foxgloves", category: "flowers", unlock: milestone("first-blooms"), layer: "ground",
    footprint: { shape: "circle", r: 5, dx: 0, dy: -16 }, art: { shape: "foxglove" },
  },
  cosmos: {
    id: "cosmos", name: "Cosmos", category: "flowers", unlock: points(25), layer: "ground",
    footprint: { shape: "circle", r: 6, dx: 0, dy: -12 }, art: { shape: "cosmos" },
  },
  "glow-flower": {
    id: "glow-flower", name: "Glowing Blooms", category: "flowers", unlock: milestone("bloom-collector"), layer: "ground",
    footprint: { shape: "circle", r: 6, dx: 0, dy: -12 }, art: { shape: "glow-flower", glow: true },
  },
  wildflowers: {
    id: "wildflowers", name: "Wildflower Cluster", category: "flowers", unlock: STARTER, layer: "ground",
    footprint: { shape: "box", w: 30, h: 12, dx: 0, dy: 0 }, art: { shape: "wildflowers" },
  },

  // Botanical expansion: trees
  willow: {
    id: "willow", name: "Weeping Willow", category: "trees", unlock: points(70), layer: "solid",
    footprint: { shape: "circle", r: 12, dx: 0, dy: -4 }, art: { shape: "willow" },
  },
  pine: {
    id: "pine", name: "Pine Tree", category: "trees", unlock: points(20), layer: "solid",
    footprint: { shape: "circle", r: 9, dx: 0, dy: -4 }, art: { shape: "pine" },
  },
  "mystic-tree": {
    id: "mystic-tree", name: "Mystic Tree", category: "trees", unlock: milestone("ten-days"), layer: "solid",
    footprint: { shape: "circle", r: 12, dx: 0, dy: -4 }, art: { shape: "mystic-tree", glow: true },
  },

  // Botanical expansion: plants and ground cover
  fern: {
    id: "fern", name: "Fern", category: "plants", unlock: STARTER, layer: "ground",
    footprint: { shape: "circle", r: 8, dx: 0, dy: -2 }, art: { shape: "fern" },
  },
  "ivy-patch": {
    id: "ivy-patch", name: "Ivy Patch", category: "plants", unlock: points(15), layer: "ground",
    footprint: { shape: "box", w: 36, h: 10, dx: 0, dy: -2 }, art: { shape: "ivy-patch" },
  },
  "flowering-bush": {
    id: "flowering-bush", name: "Flowering Bush", category: "plants", unlock: points(45), layer: "solid",
    footprint: { shape: "circle", r: 11, dx: 0, dy: -4 }, art: { shape: "flowering-bush" },
  },
  "giant-mushroom": {
    id: "giant-mushroom", name: "Giant Mushroom", category: "plants", unlock: points(60), layer: "solid",
    footprint: { shape: "circle", r: 8, dx: 0, dy: -6 }, art: { shape: "giant-mushroom" },
  },
  "lucky-clover": {
    id: "lucky-clover", name: "Lucky Clover", category: "plants", unlock: milestone("five-days"), layer: "ground",
    footprint: { shape: "circle", r: 6, dx: 0, dy: 0 }, art: { shape: "lucky-clover", glow: true },
  },

  // Botanical expansion: garden furniture and decorations
  "stone-bench": {
    id: "stone-bench", name: "Stone Bench", category: "furniture", unlock: points(30), layer: "solid",
    footprint: { shape: "box", w: 34, h: 12, dx: 0, dy: -6 }, art: { shape: "stone-bench" },
  },
  "garden-arch": {
    id: "garden-arch", name: "Garden Arch", category: "furniture", unlock: points(40), layer: "solid",
    footprint: { shape: "box", w: 44, h: 8, dx: 0, dy: -4 }, art: { shape: "garden-arch" },
  },
  birdhouse: {
    id: "birdhouse", name: "Birdhouse", category: "furniture", unlock: points(25), layer: "solid",
    footprint: { shape: "circle", r: 5, dx: 0, dy: -8 }, art: { shape: "birdhouse" },
  },
  "wind-chimes": {
    id: "wind-chimes", name: "Wind Chimes", category: "furniture", unlock: points(30), layer: "solid",
    footprint: { shape: "circle", r: 4, dx: 0, dy: -4 }, art: { shape: "wind-chimes" },
  },
  trellis: {
    id: "trellis", name: "Trellis", category: "furniture", unlock: points(35), layer: "solid",
    footprint: { shape: "box", w: 28, h: 6, dx: 0, dy: -4 }, art: { shape: "trellis" },
  },
  sign: {
    id: "sign", name: "Garden Sign", category: "furniture", unlock: STARTER, layer: "solid",
    footprint: { shape: "box", w: 12, h: 14, dx: 0, dy: -7 }, art: { shape: "sign" },
  },
};

export const DECORATION_LIST: DecorationDef[] = DECORATION_KINDS.map((kind) => DECORATIONS[kind]);

export function isDecorationKind(value: unknown): value is DecorationKind {
  return typeof value === "string" && (DECORATION_KINDS as readonly string[]).includes(value);
}

export function getDecoration(value: unknown): DecorationDef | undefined {
  return isDecorationKind(value) ? DECORATIONS[value] : undefined;
}

/** Player-facing text explaining how to unlock something. */
export function unlockHint(rule: UnlockRule): string {
  switch (rule.type) {
    case "starter":
      return "Available from the start";
    case "points":
      return `Earn ${rule.amount} petals`;
    case "milestone": {
      const milestone = MILESTONES.find((item) => item.id === rule.milestoneId);
      return milestone ? `Complete "${milestone.title}"` : "Keep playing to unlock";
    }
  }
}

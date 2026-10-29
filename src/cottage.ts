import { defaultHouse } from "./houses";
import type { HouseState } from "./houses";
import type { UnlockRule } from "./types";

// Every cottage option that can be unlocked. The slot names the part of the house, and the
// value is the option. Yes/no options use the value "on". Starter options are always available.

export const COTTAGE_SLOTS = [
  "roof.style",
  "roof.detail",
  "walls.finish",
  "windows.style",
  "windows.shutters",
  "windows.flowerBoxes",
  "trim.corners",
  "trim.beams",
  "door.style",
  "door.detail",
  "extras.chimney",
  "extras.balcony",
  "extras.ivy",
  "extras.roofOrnament",
  "extras.lanterns",
  "extras.steps",
] as const;

export type CottageSlot = (typeof COTTAGE_SLOTS)[number];

export type CottageCategory = "Roof" | "Walls" | "Windows" | "Door" | "Trim" | "Extras";

export interface CottageOption {
  key: string;
  slot: CottageSlot;
  value: string;
  label: string;
  category: CottageCategory;
  unlock: UnlockRule;
}

const STARTER: UnlockRule = { type: "starter" };
const points = (amount: number): UnlockRule => ({ type: "points", amount });
const milestone = (milestoneId: string): UnlockRule => ({ type: "milestone", milestoneId });

const OPTION_TABLE: [CottageSlot, string, string, UnlockRule][] = [
  ["roof.style", "shingles", "Classic shingles", STARTER],
  ["roof.style", "tiles", "Traditional tiles", STARTER],
  ["roof.style", "fishscale", "Fish-scale shingles", points(30)],
  ["roof.style", "thatch", "Rustic thatch", points(50)],
  ["roof.style", "moss", "Moss-covered roofing", milestone("five-days")],
  ["roof.style", "celestial", "Celestial roofing", milestone("grand-garden")],
  ["roof.detail", "none", "No roof detail", STARTER],
  ["roof.detail", "stars", "Tiny stars", points(60)],
  ["roof.detail", "vines", "Climbing vines", milestone("five-days")],
  ["roof.detail", "glow", "Magical glow", milestone("grand-garden")],
  ["walls.finish", "painted", "Painted walls", STARTER],
  ["walls.finish", "plaster", "Textured plaster", points(25)],
  ["walls.finish", "timber", "Timber framing", points(45)],
  ["walls.finish", "stone", "Cottage stone", points(45)],
  ["walls.finish", "ivy", "Ivy-covered walls", milestone("bloom-collector")],
  ["windows.style", "square", "Square windows", STARTER],
  ["windows.style", "multipane", "Multi-pane windows", STARTER],
  ["windows.style", "round", "Round windows", points(20)],
  ["windows.style", "arched", "Tall arched windows", points(35)],
  ["windows.style", "ornate", "Ornate fantasy windows", milestone("tree-lover")],
  ["windows.shutters", "on", "Shutters", points(25)],
  ["windows.flowerBoxes", "on", "Flower boxes", STARTER],
  ["trim.corners", "on", "Corner pillars", points(30)],
  ["trim.beams", "on", "Decorative beams", points(50)],
  ["door.style", "classic", "Classic cottage door", STARTER],
  ["door.style", "rounded", "Rounded door", points(20)],
  ["door.style", "arched", "Arched wooden door", points(40)],
  ["door.style", "double", "Double doors", points(60)],
  ["door.style", "rustic", "Rustic plank door", milestone("tree-lover")],
  ["door.style", "ornate", "Ornate fantasy door", milestone("grand-garden")],
  ["door.detail", "none", "No door detail", STARTER],
  ["door.detail", "vines", "Vine-covered door", points(45)],
  ["door.detail", "glow", "Glowing door", milestone("grand-garden")],
  ["extras.chimney", "stone", "Stone chimney", STARTER],
  ["extras.chimney", "brick", "Brick chimney", points(25)],
  ["extras.chimney", "none", "No chimney", STARTER],
  ["extras.balcony", "on", "Balcony", points(70)],
  ["extras.ivy", "on", "Climbing ivy", milestone("bloom-collector")],
  ["extras.roofOrnament", "none", "No roof ornament", STARTER],
  ["extras.roofOrnament", "weathervane", "Weathervane", points(40)],
  ["extras.roofOrnament", "crystal", "Crystal finial", milestone("grand-garden")],
  ["extras.lanterns", "on", "Exterior lanterns", points(35)],
  ["extras.steps", "on", "Entrance steps", STARTER],
];

const CATEGORY_BY_SLOT: Record<CottageSlot, CottageCategory> = {
  "roof.style": "Roof",
  "roof.detail": "Roof",
  "walls.finish": "Walls",
  "windows.style": "Windows",
  "windows.shutters": "Windows",
  "windows.flowerBoxes": "Windows",
  "trim.corners": "Trim",
  "trim.beams": "Trim",
  "door.style": "Door",
  "door.detail": "Door",
  "extras.chimney": "Extras",
  "extras.balcony": "Extras",
  "extras.ivy": "Extras",
  "extras.roofOrnament": "Extras",
  "extras.lanterns": "Extras",
  "extras.steps": "Extras",
};

export function optionKey(slot: CottageSlot, value: string): string {
  return `${slot}:${value}`;
}

export const COTTAGE_OPTIONS: CottageOption[] = OPTION_TABLE.map(([slot, value, label, unlock]) => ({
  key: optionKey(slot, value),
  slot,
  value,
  label,
  category: CATEGORY_BY_SLOT[slot],
  unlock,
}));

export function optionsFor(slot: CottageSlot): CottageOption[] {
  return COTTAGE_OPTIONS.filter((option) => option.slot === slot);
}

export function getOption(slot: CottageSlot, value: string): CottageOption | undefined {
  return COTTAGE_OPTIONS.find((option) => option.slot === slot && option.value === value);
}

/** Reads the current value of a slot as a string ("on" or "off" for yes/no options). */
export function getSlot(house: HouseState, slot: CottageSlot): string {
  const flag = (value: boolean) => (value ? "on" : "off");
  switch (slot) {
    case "roof.style":
      return house.roof.style;
    case "roof.detail":
      return house.roof.detail;
    case "walls.finish":
      return house.walls.finish;
    case "windows.style":
      return house.windows.style;
    case "windows.shutters":
      return flag(house.windows.shutters);
    case "windows.flowerBoxes":
      return flag(house.windows.flowerBoxes);
    case "trim.corners":
      return flag(house.trim.corners);
    case "trim.beams":
      return flag(house.trim.beams);
    case "door.style":
      return house.door.style;
    case "door.detail":
      return house.door.detail;
    case "extras.chimney":
      return house.extras.chimney;
    case "extras.balcony":
      return flag(house.extras.balcony);
    case "extras.ivy":
      return flag(house.extras.ivy);
    case "extras.roofOrnament":
      return house.extras.roofOrnament;
    case "extras.lanterns":
      return flag(house.extras.lanterns);
    case "extras.steps":
      return flag(house.extras.steps);
  }
}

/** Returns a copy of the house with one slot changed. Nothing else is touched. */
export function setSlot(house: HouseState, slot: CottageSlot, value: string): HouseState {
  const on = value === "on";
  switch (slot) {
    case "roof.style":
      return { ...house, roof: { ...house.roof, style: value as HouseState["roof"]["style"] } };
    case "roof.detail":
      return { ...house, roof: { ...house.roof, detail: value as HouseState["roof"]["detail"] } };
    case "walls.finish":
      return { ...house, walls: { ...house.walls, finish: value as HouseState["walls"]["finish"] } };
    case "windows.style":
      return { ...house, windows: { ...house.windows, style: value as HouseState["windows"]["style"] } };
    case "windows.shutters":
      return { ...house, windows: { ...house.windows, shutters: on } };
    case "windows.flowerBoxes":
      return { ...house, windows: { ...house.windows, flowerBoxes: on } };
    case "trim.corners":
      return { ...house, trim: { ...house.trim, corners: on } };
    case "trim.beams":
      return { ...house, trim: { ...house.trim, beams: on } };
    case "door.style":
      return { ...house, door: { ...house.door, style: value as HouseState["door"]["style"] } };
    case "door.detail":
      return { ...house, door: { ...house.door, detail: value as HouseState["door"]["detail"] } };
    case "extras.chimney":
      return { ...house, extras: { ...house.extras, chimney: value as HouseState["extras"]["chimney"] } };
    case "extras.balcony":
      return { ...house, extras: { ...house.extras, balcony: on } };
    case "extras.ivy":
      return { ...house, extras: { ...house.extras, ivy: on } };
    case "extras.roofOrnament":
      return {
        ...house,
        extras: { ...house.extras, roofOrnament: value as HouseState["extras"]["roofOrnament"] },
      };
    case "extras.lanterns":
      return { ...house, extras: { ...house.extras, lanterns: on } };
    case "extras.steps":
      return { ...house, extras: { ...house.extras, steps: on } };
  }
}

/**
 * Lists the slots whose chosen value is not unlocked yet. A slot at its original value is
 * always fine, because the original cottage needs no unlock.
 */
export function lockedSlots(house: HouseState, isUnlocked: (slot: CottageSlot, value: string) => boolean): CottageSlot[] {
  const original = defaultHouse();
  return COTTAGE_SLOTS.filter((slot) => {
    const value = getSlot(house, slot);
    return value !== getSlot(original, slot) && !isUnlocked(slot, value);
  });
}

/** The builder's tabs, in the order they are shown. */
export const COTTAGE_TABS: { id: CottageCategory; slots: CottageSlot[] }[] = [
  { id: "Roof", slots: ["roof.style", "roof.detail"] },
  { id: "Walls", slots: ["walls.finish"] },
  { id: "Windows", slots: ["windows.style", "windows.shutters", "windows.flowerBoxes"] },
  { id: "Door", slots: ["door.style", "door.detail"] },
  { id: "Trim", slots: ["trim.corners", "trim.beams"] },
  { id: "Extras", slots: ["extras.chimney", "extras.roofOrnament", "extras.balcony", "extras.ivy", "extras.lanterns", "extras.steps"] },
];

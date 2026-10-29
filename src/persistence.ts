import { DECORATIONS, isDecorationKind } from "./catalogue";
import { DAILY_GOAL_POOL } from "./daily";
import { isPlaceable } from "./island";
import {
  CHIMNEY_STYLES,
  DOOR_DETAILS,
  DOOR_STYLES,
  HOUSE_DESIGNS,
  ROOF_DETAILS,
  ROOF_ORNAMENTS,
  ROOF_STYLES,
  WALL_FINISHES,
  WINDOW_STYLES,
  defaultHouse,
  getHouseDesign,
  getSwatch,
  presetHouse,
} from "./houses";
import type { HouseState } from "./houses";
import { COTTAGE_OPTIONS, getSlot, lockedSlots, setSlot } from "./cottage";
import type { CottageSlot } from "./cottage";
import { MILESTONES } from "./milestones";
import { addToCounts, zeroCategoryCounts } from "./metrics";
import { CATEGORIES } from "./types";
import type { Category, Counts, Placement, Progression, ThemeId } from "./types";
import { THEMES } from "./themes";
import {
  createDailyState,
  createLifetime,
  createProgression,
  ensureToday,
  isCottageOptionUnlocked,
  isPaletteUnlocked,
  settle,
} from "./progression";
import { isDateKey } from "./dates";

export const SAVE_KEY = "little-world:save";
/** Copy of an unreadable save, kept so a damaged file is never silently lost. */
export const INVALID_BACKUP_KEY = "little-world:save-invalid-backup";
/**
 * Version 3 stores the cottage as independent parts. Version 2 stored a design and four colours,
 * and version 1 had no progression. Both older versions are migrated on load.
 */
export const SAVE_VERSION = 3;
const LEGACY_VERSION = 1;
const PREVIOUS_VERSION = 2;

/** The world part of the save: the theme and the decorations on the island. */
export interface WorldState {
  themeId: ThemeId;
  placements: Placement[];
}

/** Everything the game saves. */
export interface GameState {
  world: WorldState;
  progression: Progression;
  house: HouseState;
}

/** The subset of the Web Storage API this module needs. Easy to fake in tests. */
export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type LoadWorldResult =
  | { status: "empty"; world: WorldState }
  | { status: "loaded"; world: WorldState }
  | { status: "recovered"; world: WorldState; reason: string };

export interface LoadGameResult {
  status: "empty" | "loaded" | "recovered";
  game: GameState;
  /** Why the save was replaced with a default, when status is "recovered". */
  reason?: string;
  /** True when a version 1 save was upgraded to version 2. */
  migrated: boolean;
}

type Result<T> = { ok: true; value: T } | { ok: false; reason: string };

function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

function fail<T = never>(reason: string): Result<T> {
  return { ok: false, reason };
}

export function createDefaultWorld(): WorldState {
  return { themeId: "spring", placements: [] };
}

export function createDefaultGame(dateKey: string): GameState {
  return { world: createDefaultWorld(), progression: createProgression(dateKey), house: defaultHouse() };
}

/** Returns localStorage, or null when it is blocked or unavailable. */
export function getBrowserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Writes only the world, keeping any progression and house already saved. */
export function serializeWorld(world: WorldState): string {
  return JSON.stringify({ version: SAVE_VERSION, themeId: world.themeId, placements: world.placements });
}

export function serializeGame(game: GameState): string {
  return JSON.stringify({
    version: SAVE_VERSION,
    themeId: game.world.themeId,
    placements: game.world.placements,
    progression: game.progression,
    house: game.house,
  });
}

/** Writes the whole game. Returns false instead of throwing if storage rejects the write. */
export function saveGame(storage: StorageLike | null, game: GameState): boolean {
  if (!storage) {
    return false;
  }
  try {
    storage.setItem(SAVE_KEY, serializeGame(game));
    return true;
  } catch {
    return false;
  }
}

/** Writes the world. Keeps progression and house if they are already saved. */
export function saveWorld(storage: StorageLike | null, world: WorldState): boolean {
  if (!storage) {
    return false;
  }
  try {
    const existing = readSavedSections(storage);
    storage.setItem(SAVE_KEY, JSON.stringify({ ...JSON.parse(serializeWorld(world)), ...existing }));
    return true;
  } catch {
    return false;
  }
}

function readSavedSections(storage: StorageLike): { progression?: unknown; house?: unknown } {
  try {
    const raw = storage.getItem(SAVE_KEY);
    const data: unknown = raw === null ? null : JSON.parse(raw);
    if (!isRecord(data)) {
      return {};
    }
    return {
      ...(data.progression !== undefined ? { progression: data.progression } : {}),
      ...(data.house !== undefined ? { house: data.house } : {}),
    };
  } catch {
    return {};
  }
}

/** Loads the world only. Used by callers that do not need progression. */
export function loadWorld(storage: StorageLike | null, dateKey: string = "1970-01-01"): LoadWorldResult {
  const result = loadGame(storage, dateKey);
  if (result.status === "recovered") {
    return { status: "recovered", world: result.game.world, reason: result.reason ?? "" };
  }
  return { status: result.status, world: result.game.world };
}

/**
 * Reads the whole game. Never throws. Missing data gives a fresh game, damaged data gives a
 * fresh game with a reason, and version 1 data is migrated to version 2.
 */
export function loadGame(storage: StorageLike | null, dateKey: string): LoadGameResult {
  if (!storage) {
    return { status: "empty", game: createDefaultGame(dateKey), migrated: false };
  }

  let raw: string | null;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch {
    return recovered("Saved data could not be read.", dateKey);
  }

  if (raw === null) {
    return { status: "empty", game: createDefaultGame(dateKey), migrated: false };
  }

  const parsed = parseSaveText(raw, dateKey);
  if (!parsed.ok) {
    return recovered(parsed.reason, dateKey);
  }
  return { status: "loaded", game: finishLoad(parsed.value.game, dateKey), migrated: parsed.value.migrated };
}

/** Saves a copy of an unreadable save before it is replaced, so nothing is lost silently. */
export function backupInvalidSave(storage: StorageLike | null): void {
  if (!storage) {
    return;
  }
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (raw !== null) {
      storage.setItem(INVALID_BACKUP_KEY, raw);
    }
  } catch {
    // If the backup cannot be written there is nothing more to do.
  }
}

function recovered(reason: string, dateKey: string): LoadGameResult {
  return { status: "recovered", game: createDefaultGame(dateKey), reason, migrated: false };
}

/** Brings a just-parsed game up to date: new day, rewards for anything already earned, and unlocks for placed items. */
function finishLoad(game: GameState, dateKey: string): GameState {
  let progression = settle(ensureToday(game.progression, dateKey)).progression;

  const placedKinds = [...new Set(game.world.placements.map((placement) => placement.kind))];
  const missing = placedKinds.filter((kind) => !progression.unlockedDecorations.includes(kind) && DECORATIONS[kind].unlock.type !== "starter");
  if (missing.length > 0) {
    progression = { ...progression, unlockedDecorations: [...progression.unlockedDecorations, ...missing] };
  }

  // Any saved cottage part the player has not unlocked goes back to its original value.
  const house = lockedSlots(game.house, (slot, value) => isCottageOptionUnlocked(progression, slot, value)).reduce(
    (current, slot) => setSlot(current, slot, getSlot(defaultHouse(), slot)),
    game.house,
  );
  // A saved palette the player has not earned falls back to the default, so the world still loads.
  const world = isPaletteUnlocked(progression, game.world.themeId)
    ? game.world
    : { ...game.world, themeId: createDefaultWorld().themeId };
  return { ...game, world, progression, house };
}

interface ParsedSave {
  game: GameState;
  migrated: boolean;
}

function parseSaveText(text: string, dateKey: string): Result<ParsedSave> {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return fail("Saved data is not valid JSON.");
  }

  if (!isRecord(data)) {
    return fail("Saved data is not an object.");
  }
  if (data.version !== LEGACY_VERSION && data.version !== PREVIOUS_VERSION && data.version !== SAVE_VERSION) {
    return fail(`Unsupported save version: ${String(data.version)}.`);
  }

  const world = parseWorld(data);
  if (!world.ok) {
    return fail(world.reason);
  }

  if (data.version === LEGACY_VERSION) {
    return ok({
      game: { world: world.value, progression: migrateProgression(world.value.placements, dateKey), house: defaultHouse() },
      migrated: true,
    });
  }

  const progression = parseProgression(data.progression, dateKey);
  if (!progression.ok) {
    return fail(progression.reason);
  }

  if (data.version === PREVIOUS_VERSION) {
    // Version 2 houses are upgraded to the part-based cottage. Earned progress is kept as it is.
    return ok({
      game: { world: world.value, progression: progression.value, house: migrateLegacyHouse(data.house) },
      migrated: true,
    });
  }

  const house = parseCottage(data.house, progression.value);
  return ok({ game: { world: world.value, progression: progression.value, house }, migrated: false });
}

/** Version 1 had no progression. Existing decorations count toward lifetime totals, so milestones are not lost. */
function migrateProgression(placements: Placement[], dateKey: string): Progression {
  const lifetime = placements.reduce(
    (counts, placement) => addToCounts(counts, DECORATIONS[placement.kind].category),
    createLifetime(),
  );
  return { ...createProgression(dateKey), lifetime };
}

function parseWorld(data: Record<string, unknown>): Result<WorldState> {
  if (!isThemeId(data.themeId)) {
    return fail("Saved theme is not recognised.");
  }
  if (!Array.isArray(data.placements)) {
    return fail("Saved decorations are missing.");
  }

  const placements: Placement[] = [];
  const seenIds = new Set<number>();
  for (const item of data.placements) {
    const placement = parsePlacement(item);
    if (!placement) {
      return fail("A saved decoration is invalid.");
    }
    if (seenIds.has(placement.id)) {
      return fail("Saved decorations share an id.");
    }
    seenIds.add(placement.id);
    placements.push(placement);
  }

  return ok({ themeId: data.themeId, placements });
}

function parsePlacement(value: unknown): Placement | null {
  if (!isRecord(value)) {
    return null;
  }
  const { id, kind, x, y, rotation } = value;

  if (typeof id !== "number" || !Number.isInteger(id) || id < 1) {
    return null;
  }
  if (!isDecorationKind(kind)) {
    return null;
  }
  if (typeof x !== "number" || typeof y !== "number" || !isPlaceable({ x, y })) {
    return null;
  }
  if (typeof rotation !== "number" || !Number.isFinite(rotation) || rotation < 0 || rotation >= 360) {
    return null;
  }

  return { id, kind, x, y, rotation };
}

/** Validates progression. Missing fields get defaults. Unknown ids are dropped, not rejected. */
function parseProgression(raw: unknown, dateKey: string): Result<Progression> {
  if (raw === undefined) {
    return ok(createProgression(dateKey));
  }
  if (!isRecord(raw)) {
    return fail("Saved progress is invalid.");
  }

  const daily = parseDaily(raw.daily, dateKey);
  if (!daily.ok) {
    return fail(daily.reason);
  }
  const lifetime = parseLifetime(raw.lifetime);
  if (!lifetime.ok) {
    return fail(lifetime.reason);
  }
  const points = parseCount(raw.points, 0);
  if (!points.ok) {
    return fail("Saved petals are invalid.");
  }

  return ok({
    daily: daily.value,
    lifetime: lifetime.value,
    points: points.value,
    unlockedDecorations: knownIds(raw.unlockedDecorations, (id) => isDecorationKind(id)),
    unlockedHouses: knownIds(raw.unlockedHouses, (id) => HOUSE_DESIGNS.some((design) => design.id === id)),
    unlockedPalettes: knownIds(raw.unlockedPalettes, (id) => isThemeId(id)),
    unlockedCottageOptions: knownIds(raw.unlockedCottageOptions, (key) =>
      COTTAGE_OPTIONS.some((option) => option.key === key),
    ),
    completedMilestones: knownIds(raw.completedMilestones, (id) => MILESTONES.some((milestone) => milestone.id === id)),
  } as Progression);
}

function parseDaily(raw: unknown, dateKey: string): Result<Progression["daily"]> {
  if (raw === undefined) {
    return ok(createDailyState(dateKey));
  }
  if (!isRecord(raw) || !isDateKey(raw.date)) {
    return fail("Saved daily goals are invalid.");
  }
  const counts = parseCounts(raw);
  if (!counts.ok) {
    return fail(counts.reason);
  }
  return ok({
    ...counts.value,
    date: raw.date,
    claimed: knownIds(raw.claimed, (id) => DAILY_GOAL_POOL.some((goal) => goal.id === id)),
  });
}

function parseLifetime(raw: unknown): Result<Progression["lifetime"]> {
  if (raw === undefined) {
    return ok(createLifetime());
  }
  if (!isRecord(raw)) {
    return fail("Saved lifetime progress is invalid.");
  }
  const counts = parseCounts(raw);
  if (!counts.ok) {
    return fail(counts.reason);
  }
  const completed = parseCount(raw.dailyGoalsCompleted, 0);
  if (!completed.ok) {
    return fail("Saved lifetime progress is invalid.");
  }
  return ok({ ...counts.value, dailyGoalsCompleted: completed.value });
}

function parseCounts(raw: Record<string, unknown>): Result<Counts> {
  const byCategory = zeroCategoryCounts();
  if (raw.byCategory !== undefined) {
    if (!isRecord(raw.byCategory)) {
      return fail("Saved decoration counts are invalid.");
    }
    for (const category of CATEGORIES) {
      const count = parseCount(raw.byCategory[category], 0);
      if (!count.ok) {
        return fail("Saved decoration counts are invalid.");
      }
      byCategory[category] = count.value;
    }
  }
  const categories = knownIds(raw.categories, (id) => CATEGORIES.some((category) => category === id)) as Category[];
  return ok({ byCategory, categories });
}

function parseCount(value: unknown, fallback: number): Result<number> {
  if (value === undefined) {
    return ok(fallback);
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return fail("Invalid count.");
  }
  return ok(value);
}

/**
 * Version 2 houses were a design plus four colours. The design becomes its preset (which uses
 * only starter styles), and the saved colours are kept where they are still valid.
 */
function migrateLegacyHouse(raw: unknown): HouseState {
  if (!isRecord(raw)) {
    return defaultHouse();
  }
  const design = getHouseDesign(raw.designId) ?? HOUSE_DESIGNS[0];
  const house = presetHouse(design);
  const colours = isRecord(raw.colors) ? raw.colors : {};
  const colour = (part: string): string | null =>
    typeof colours[part] === "string" && getSwatch(colours[part]) ? (colours[part] as string) : null;

  const roof = colour("roof");
  const wall = colour("wall");
  const door = colour("door");
  const trim = colour("trim");
  return {
    ...house,
    roof: roof ? { ...house.roof, color: roof } : house.roof,
    walls: wall ? { ...house.walls, color: wall } : house.walls,
    door: door ? { ...house.door, color: door } : house.door,
    trim: trim ? { ...house.trim, color: trim } : house.trim,
  };
}

/** Cleans up a cottage the UI wants to apply, using the same rules as loading a save. */
export function sanitizeCottage(house: HouseState, progression: Progression): HouseState {
  return parseCottage(house, progression);
}

/**
 * Validates a saved cottage. Each part is checked on its own: an unknown or locked value falls
 * back to the original, and a bad colour is dropped. One bad part never loses the others.
 */
function parseCottage(raw: unknown, progression: Progression): HouseState {
  const base = defaultHouse();
  if (!isRecord(raw)) {
    return base;
  }
  const choice = <T extends string>(section: unknown, key: string, options: readonly T[], slot: CottageSlot, fallback: T): T => {
    const value = isRecord(section) ? section[key] : undefined;
    return typeof value === "string" && (options as readonly string[]).includes(value) && isCottageOptionUnlocked(progression, slot, value)
      ? (value as T)
      : fallback;
  };
  const flag = (section: unknown, key: string, slot: CottageSlot): boolean => {
    const value = isRecord(section) ? section[key] : undefined;
    return value === true && isCottageOptionUnlocked(progression, slot, "on");
  };
  const colour = (section: unknown, key: string): string | null => {
    const value = isRecord(section) ? section[key] : undefined;
    return typeof value === "string" && getSwatch(value) ? value : null;
  };

  const roof = raw.roof;
  const walls = raw.walls;
  const trim = raw.trim;
  const windows = raw.windows;
  const door = raw.door;
  const extras = raw.extras;

  return {
    roof: {
      style: choice(roof, "style", ROOF_STYLES, "roof.style", base.roof.style),
      color: colour(roof, "color"),
      detail: choice(roof, "detail", ROOF_DETAILS, "roof.detail", base.roof.detail),
    },
    walls: {
      finish: choice(walls, "finish", WALL_FINISHES, "walls.finish", base.walls.finish),
      color: colour(walls, "color"),
    },
    trim: {
      color: colour(trim, "color"),
      corners: flag(trim, "corners", "trim.corners"),
      beams: flag(trim, "beams", "trim.beams"),
    },
    windows: {
      style: choice(windows, "style", WINDOW_STYLES, "windows.style", base.windows.style),
      frame: colour(windows, "frame"),
      glow: colour(windows, "glow"),
      shutters: flag(windows, "shutters", "windows.shutters"),
      shutterColor: colour(windows, "shutterColor"),
      flowerBoxes: flag(windows, "flowerBoxes", "windows.flowerBoxes"),
    },
    door: {
      style: choice(door, "style", DOOR_STYLES, "door.style", base.door.style),
      color: colour(door, "color"),
      hardware: colour(door, "hardware"),
      detail: choice(door, "detail", DOOR_DETAILS, "door.detail", base.door.detail),
    },
    extras: {
      chimney: choice(extras, "chimney", CHIMNEY_STYLES, "extras.chimney", base.extras.chimney),
      balcony: flag(extras, "balcony", "extras.balcony"),
      ivy: flag(extras, "ivy", "extras.ivy"),
      roofOrnament: choice(extras, "roofOrnament", ROOF_ORNAMENTS, "extras.roofOrnament", base.extras.roofOrnament),
      lanterns: flag(extras, "lanterns", "extras.lanterns"),
      steps: flag(extras, "steps", "extras.steps"),
    },
  };
}

function knownIds<T extends string>(value: unknown, isKnown: (id: unknown) => boolean): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const unique = new Set<T>();
  for (const id of value) {
    if (typeof id === "string" && isKnown(id)) {
      unique.add(id as T);
    }
  }
  return [...unique];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

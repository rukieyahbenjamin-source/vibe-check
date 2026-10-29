// Shared helpers for the test files. Nothing here is used by the game itself.
import { DECORATION_LIST } from "./catalogue";
import type { DailyGoalDef } from "./daily";
import { createAppState } from "./game";
import type { AppState } from "./game";
import { defaultHouse } from "./houses";
import { createDefaultWorld, SAVE_KEY } from "./persistence";
import type { StorageLike } from "./persistence";
import { createProgression, recordPlacement } from "./progression";
import type { Settled } from "./progression";
import { CATEGORIES } from "./types";
import type { Category, DecorationKind, Progression, RewardEvent } from "./types";

/** A fixed local date, so tests never depend on the real clock. */
export const TODAY = "2026-05-09";

/** A spot on the grass. `index` spreads spots out so each placement has its own position. */
export function spot(index: number): { x: number; y: number } {
  return { x: 150 + (index % 10) * 40, y: 300 };
}

export function kindForCategory(category: Category): DecorationKind {
  const item = DECORATION_LIST.find((decoration) => decoration.category === category);
  if (!item) {
    throw new Error(`No decoration in category ${category}`);
  }
  return item.id;
}

/** A fake of localStorage. `writes` counts how often the app wrote to it. */
export function createStorage(seed?: string) {
  const data = new Map<string, string>();
  if (seed !== undefined) {
    data.set(SAVE_KEY, seed);
  }
  const storage: StorageLike & { data: Map<string, string>; writes: number } = {
    data,
    writes: 0,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      storage.writes += 1;
      data.set(key, value);
    },
  };
  return storage;
}

/** A fresh app state with the default world, progression for TODAY and the classic house. */
export function freshAppState(progression: Progression = createProgression(TODAY)): AppState {
  return createAppState({ world: createDefaultWorld(), progression, house: defaultHouse() }, null);
}

/**
 * Places the decorations that complete a goal, ignoring locks (progression rules only).
 * Returns the reward events that were produced.
 */
export function completeGoal(progression: Progression, goal: DailyGoalDef): Settled {
  const kinds: DecorationKind[] = [];
  switch (goal.metric.type) {
    case "category": {
      const category = goal.metric.category;
      for (let i = 0; i < goal.target; i += 1) {
        kinds.push(kindForCategory(category));
      }
      break;
    }
    case "categories":
      for (const category of CATEGORIES.slice(0, goal.target)) {
        kinds.push(kindForCategory(category));
      }
      break;
    default:
      for (let i = 0; i < goal.target; i += 1) {
        kinds.push("flower");
      }
  }

  let current: Settled = { progression, events: [] };
  for (const kind of kinds) {
    const next = recordPlacement(current.progression, kind);
    current = { progression: next.progression, events: [...current.events, ...next.events] };
  }
  return current;
}

export function rewardTitles(events: RewardEvent[], type: RewardEvent["type"]): string[] {
  return events.filter((event) => event.type === type).map((event) => ("title" in event ? event.title : event.name));
}

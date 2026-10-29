import { metricValue } from "./metrics";
import type { DailyState, Metric } from "./types";

export interface DailyGoalDef {
  id: string;
  title: string;
  metric: Metric;
  target: number;
}

export const DAILY_GOAL_COUNT = 3;
/** Petals awarded when a daily goal is completed (once per goal per day). */
export const DAILY_GOAL_REWARD = 10;

// Each goal counts decorations placed today. Moving, rotating, undoing or deleting never lowers progress.
export const DAILY_GOAL_POOL: DailyGoalDef[] = [
  { id: "flowers-3", title: "Place 3 flowers", metric: { type: "category", category: "flowers" }, target: 3 },
  { id: "trees-2", title: "Place 2 trees", metric: { type: "category", category: "trees" }, target: 2 },
  { id: "plants-1", title: "Place a mushroom or plant", metric: { type: "category", category: "plants" }, target: 1 },
  { id: "plants-2", title: "Place 2 mushrooms or plants", metric: { type: "category", category: "plants" }, target: 2 },
  { id: "furniture-1", title: "Place a bench or other furniture", metric: { type: "category", category: "furniture" }, target: 1 },
  { id: "decorations-2", title: "Add 2 decorations", metric: { type: "total" }, target: 2 },
  { id: "mix-2", title: "Place decorations from 2 categories", metric: { type: "categories" }, target: 2 },
];

/** FNV-1a hash of a string, as an unsigned 32-bit number. */
export function hashText(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** A small seeded random number generator (mulberry32). Same seed, same sequence. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Picks today's goals. The choice depends only on the date, so it is the same every time
 * the app opens on that day and never rerolls during rendering.
 */
export function pickDailyGoals(dateKey: string): DailyGoalDef[] {
  const random = seededRandom(hashText(dateKey));
  const pool = [...DAILY_GOAL_POOL];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, DAILY_GOAL_COUNT);
}

export function dailyGoalValue(goal: DailyGoalDef, daily: DailyState): number {
  return Math.min(metricValue(goal.metric, daily), goal.target);
}

export function isDailyGoalComplete(goal: DailyGoalDef, daily: DailyState): boolean {
  return metricValue(goal.metric, daily) >= goal.target;
}

import { metricValue } from "./metrics";
import type { Lifetime, Metric } from "./types";

export interface MilestoneDef {
  id: string;
  /** Matches an id in MILESTONE_STAGES. */
  stage: number;
  title: string;
  description: string;
  metric: Metric;
  target: number;
  /** Petals awarded once, when the milestone is first completed. */
  reward: number;
}

export const MILESTONE_STAGES = [
  { id: 1, title: "First Steps" },
  { id: 2, title: "Growing Garden" },
  { id: 3, title: "Storybook Island" },
];

// Milestones read lifetime counts, which never go down. Completing one is permanent.
export const MILESTONES: MilestoneDef[] = [
  {
    id: "first-blooms",
    stage: 1,
    title: "First Blooms",
    description: "Plant 3 flowers.",
    metric: { type: "category", category: "flowers" },
    target: 3,
    reward: 10,
  },
  {
    id: "green-thumb",
    stage: 1,
    title: "Green Thumb",
    description: "Place 10 decorations.",
    metric: { type: "total" },
    target: 10,
    reward: 15,
  },
  {
    id: "daily-habit",
    stage: 1,
    title: "Daily Habit",
    description: "Complete 3 daily goals.",
    metric: { type: "dailyGoals" },
    target: 3,
    reward: 20,
  },
  {
    id: "bloom-collector",
    stage: 2,
    title: "Bloom Collector",
    description: "Plant 15 flowers.",
    metric: { type: "category", category: "flowers" },
    target: 15,
    reward: 30,
  },
  {
    id: "tree-lover",
    stage: 2,
    title: "Tree Lover",
    description: "Plant 10 trees.",
    metric: { type: "category", category: "trees" },
    target: 10,
    reward: 30,
  },
  {
    id: "five-days",
    stage: 2,
    title: "Five Good Days",
    description: "Complete 5 daily goals.",
    metric: { type: "dailyGoals" },
    target: 5,
    reward: 25,
  },
  {
    id: "mixed-garden",
    stage: 3,
    title: "Mixed Garden",
    description: "Place decorations from 4 different categories.",
    metric: { type: "categories" },
    target: 4,
    reward: 40,
  },
  {
    id: "ten-days",
    stage: 3,
    title: "Ten Good Days",
    description: "Complete 10 daily goals.",
    metric: { type: "dailyGoals" },
    target: 10,
    reward: 50,
  },
  {
    id: "grand-garden",
    stage: 3,
    title: "Grand Garden",
    description: "Place 40 decorations.",
    metric: { type: "total" },
    target: 40,
    reward: 60,
  },
];

export type MilestoneStatus = "locked" | "in-progress" | "completed";

export function milestoneProgress(milestone: MilestoneDef, lifetime: Lifetime): number {
  return Math.min(metricValue(milestone.metric, lifetime), milestone.target);
}

export function milestoneStatus(
  milestone: MilestoneDef,
  lifetime: Lifetime,
  completedIds: string[],
): MilestoneStatus {
  if (completedIds.includes(milestone.id)) {
    return "completed";
  }
  return milestoneProgress(milestone, lifetime) > 0 ? "in-progress" : "locked";
}

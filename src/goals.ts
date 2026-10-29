import { DECORATION_KINDS } from "./types";
import type { DecorationKind, Goal, Placement } from "./types";

// The original three goals. They count what is on the island right now, so deleting a
// decoration lowers their progress. The game's daily goals and milestones are in
// daily.ts and milestones.ts. This file is kept for compatibility and its tests.

export const GOALS: Goal[] = [
  { id: "flowers", label: "Plant 3 flowers", kind: "flower", target: 3 },
  { id: "tree", label: "Add a tree", kind: "tree", target: 1 },
  { id: "bench", label: "Place a bench", kind: "bench", target: 1 },
];

export interface GoalProgress extends Goal {
  count: number;
  done: boolean;
}

export function countByKind(placements: Placement[]): Record<DecorationKind, number> {
  const counts = Object.fromEntries(DECORATION_KINDS.map((kind) => [kind, 0])) as Record<
    DecorationKind,
    number
  >;
  for (const placement of placements) {
    counts[placement.kind] += 1;
  }
  return counts;
}

export function getGoalProgress(placements: Placement[]): GoalProgress[] {
  const counts = countByKind(placements);
  return GOALS.map((goal) => {
    const count = Math.min(counts[goal.kind], goal.target);
    return { ...goal, count, done: counts[goal.kind] >= goal.target };
  });
}

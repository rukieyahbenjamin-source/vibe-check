import { CATEGORIES } from "./types";
import type { Category, Counts, Metric } from "./types";

export function zeroCategoryCounts(): Record<Category, number> {
  return Object.fromEntries(CATEGORIES.map((category) => [category, 0])) as Record<Category, number>;
}

export function emptyCounts(): Counts {
  return { byCategory: zeroCategoryCounts(), categories: [] };
}

/** Returns a copy of the counts with one more placement in the given category. */
export function addToCounts<T extends Counts>(counts: T, category: Category): T {
  return {
    ...counts,
    byCategory: { ...counts.byCategory, [category]: counts.byCategory[category] + 1 },
    categories: counts.categories.includes(category)
      ? counts.categories
      : [...counts.categories, category],
  };
}

/** The single place where a goal or milestone turns counts into a number. */
export function metricValue(metric: Metric, counts: Counts & { dailyGoalsCompleted?: number }): number {
  switch (metric.type) {
    case "category":
      return counts.byCategory[metric.category];
    case "total":
      return CATEGORIES.reduce((sum, category) => sum + counts.byCategory[category], 0);
    case "categories":
      return counts.categories.length;
    case "dailyGoals":
      return counts.dailyGoalsCompleted ?? 0;
  }
}

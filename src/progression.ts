import { DECORATIONS, DECORATION_LIST } from "./catalogue";
import { DAILY_GOAL_REWARD, pickDailyGoals, isDailyGoalComplete } from "./daily";
import { HOUSE_DESIGNS } from "./houses";
import { MILESTONES } from "./milestones";
import { THEMES } from "./themes";
import { COTTAGE_OPTIONS, getOption } from "./cottage";
import type { CottageSlot } from "./cottage";

const UNLOCK_NOUNS = {
  decoration: "decoration",
  house: "house design",
  palette: "palette",
  cottage: "cottage part",
} as const;
import { addToCounts, emptyCounts, metricValue } from "./metrics";
import { CATEGORIES } from "./types";
import type { Category, DailyState, DecorationKind, Lifetime, Progression, RewardEvent, UnlockRule } from "./types";

// Progression rules, all pure:
// - Placing a decoration counts toward today's daily goals and toward lifetime totals.
// - Moving, rotating, undoing and deleting never change progression.
// - Each daily goal pays out once per day. Each milestone pays out once, ever.
// - Unlocks are permanent and only ever added, never removed.

export function createDailyState(dateKey: string): DailyState {
  return { ...emptyCounts(), date: dateKey, claimed: [] };
}

export function createLifetime(): Lifetime {
  return { ...emptyCounts(), dailyGoalsCompleted: 0 };
}

export function createProgression(dateKey: string): Progression {
  return {
    daily: createDailyState(dateKey),
    lifetime: createLifetime(),
    points: 0,
    unlockedDecorations: [],
    unlockedHouses: [],
    unlockedPalettes: [],
    unlockedCottageOptions: [],
    completedMilestones: [],
  };
}

export function isCottageOptionUnlocked(progression: Progression, slot: CottageSlot, value: string): boolean {
  const option = getOption(slot, value);
  if (!option) {
    return false;
  }
  return option.unlock.type === "starter" || progression.unlockedCottageOptions.includes(option.key);
}

export function isPaletteUnlocked(progression: Progression, themeId: string): boolean {
  const theme = THEMES.find((item) => item.id === themeId);
  if (!theme) {
    return false;
  }
  return theme.unlock.type === "starter" || progression.unlockedPalettes.includes(theme.id);
}

/**
 * Starts a fresh day's goals when the local date has changed. Returns the same object when
 * it is still the same day. Missed days are not penalised: the new day simply starts fresh.
 */
export function ensureToday(progression: Progression, dateKey: string): Progression {
  if (progression.daily.date === dateKey) {
    return progression;
  }
  return { ...progression, daily: createDailyState(dateKey) };
}

export function isDecorationUnlocked(progression: Progression, kind: DecorationKind): boolean {
  return DECORATIONS[kind].unlock.type === "starter" || progression.unlockedDecorations.includes(kind);
}

export function isHouseUnlocked(progression: Progression, designId: string): boolean {
  const design = HOUSE_DESIGNS.find((item) => item.id === designId);
  if (!design) {
    return false;
  }
  return design.unlock.type === "starter" || progression.unlockedHouses.includes(designId);
}

function isRuleMet(rule: UnlockRule, progression: Progression): boolean {
  switch (rule.type) {
    case "starter":
      return true;
    case "points":
      return progression.points >= rule.amount;
    case "milestone":
      return progression.completedMilestones.includes(rule.milestoneId);
  }
}

export interface Settled {
  progression: Progression;
  events: RewardEvent[];
}

/**
 * Pays out every reward that is now earned but not yet given, and unlocks every item whose
 * rule is met. Repeats until nothing changes, since one reward can lead to another (for
 * example a milestone that adds petals, which then unlock a decoration).
 */
export function settle(input: Progression): Settled {
  let progression = input;
  const events: RewardEvent[] = [];
  let changed = true;

  while (changed) {
    changed = false;

    for (const goal of pickDailyGoals(progression.daily.date)) {
      if (progression.daily.claimed.includes(goal.id) || !isDailyGoalComplete(goal, progression.daily)) {
        continue;
      }
      progression = {
        ...progression,
        daily: { ...progression.daily, claimed: [...progression.daily.claimed, goal.id] },
        lifetime: { ...progression.lifetime, dailyGoalsCompleted: progression.lifetime.dailyGoalsCompleted + 1 },
        points: progression.points + DAILY_GOAL_REWARD,
      };
      events.push({ type: "daily-goal", title: goal.title, points: DAILY_GOAL_REWARD });
      changed = true;
    }

    for (const milestone of MILESTONES) {
      if (progression.completedMilestones.includes(milestone.id)) {
        continue;
      }
      if (metricValue(milestone.metric, progression.lifetime) < milestone.target) {
        continue;
      }
      progression = {
        ...progression,
        completedMilestones: [...progression.completedMilestones, milestone.id],
        points: progression.points + milestone.reward,
      };
      events.push({ type: "milestone", title: milestone.title, points: milestone.reward });
      changed = true;
    }

    for (const decoration of DECORATION_LIST) {
      if (decoration.unlock.type === "starter" || progression.unlockedDecorations.includes(decoration.id)) {
        continue;
      }
      if (!isRuleMet(decoration.unlock, progression)) {
        continue;
      }
      progression = {
        ...progression,
        unlockedDecorations: [...progression.unlockedDecorations, decoration.id],
      };
      events.push({ type: "unlock", item: "decoration", name: decoration.name });
      changed = true;
    }

    for (const design of HOUSE_DESIGNS) {
      if (design.unlock.type === "starter" || progression.unlockedHouses.includes(design.id)) {
        continue;
      }
      if (!isRuleMet(design.unlock, progression)) {
        continue;
      }
      progression = { ...progression, unlockedHouses: [...progression.unlockedHouses, design.id] };
      events.push({ type: "unlock", item: "house", name: design.name });
      changed = true;
    }

    for (const option of COTTAGE_OPTIONS) {
      if (option.unlock.type === "starter" || progression.unlockedCottageOptions.includes(option.key)) {
        continue;
      }
      if (!isRuleMet(option.unlock, progression)) {
        continue;
      }
      progression = { ...progression, unlockedCottageOptions: [...progression.unlockedCottageOptions, option.key] };
      events.push({ type: "unlock", item: "cottage", name: option.label });
      changed = true;
    }

    for (const theme of THEMES) {
      if (theme.unlock.type === "starter" || progression.unlockedPalettes.includes(theme.id)) {
        continue;
      }
      if (!isRuleMet(theme.unlock, progression)) {
        continue;
      }
      progression = { ...progression, unlockedPalettes: [...progression.unlockedPalettes, theme.id] };
      events.push({ type: "unlock", item: "palette", name: theme.label });
      changed = true;
    }
  }

  return { progression, events };
}

/** Counts one new placement toward progress, then pays out anything it completed. */
export function recordPlacement(input: Progression, kind: DecorationKind): Settled {
  const category = DECORATIONS[kind].category;
  return settle({
    ...input,
    daily: addToCounts(input.daily, category),
    lifetime: addToCounts(input.lifetime, category),
  });
}

export function describeReward(event: RewardEvent): string {
  switch (event.type) {
    case "daily-goal":
      return `Daily goal complete: ${event.title}. +${event.points} petals!`;
    case "milestone":
      return `Milestone reached: ${event.title}. +${event.points} petals!`;
    case "unlock":
      return `New ${UNLOCK_NOUNS[event.item]} unlocked: ${event.name}!`;
  }
}

/** Unlocked and total counts for each catalogue category. Starter items count as unlocked. */
export function collectionProgress(progression: Progression): Record<Category, { unlocked: number; total: number }> {
  const result = Object.fromEntries(CATEGORIES.map((category) => [category, { unlocked: 0, total: 0 }])) as Record<
    Category,
    { unlocked: number; total: number }
  >;
  for (const item of DECORATION_LIST) {
    result[item.category].total += 1;
    if (isDecorationUnlocked(progression, item.id)) {
      result[item.category].unlocked += 1;
    }
  }
  return result;
}

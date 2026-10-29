import { describe, expect, it } from "vitest";
import { DECORATIONS } from "./catalogue";
import { DAILY_GOAL_REWARD, pickDailyGoals } from "./daily";
import { addDays } from "./dates";
import { milestoneProgress, milestoneStatus, MILESTONES } from "./milestones";
import {
  createDailyState,
  createProgression,
  describeReward,
  ensureToday,
  isDecorationUnlocked,
  isHouseUnlocked,
  recordPlacement,
  settle,
} from "./progression";
import { completeGoal, kindForCategory, rewardTitles, TODAY } from "./testing";
import type { Progression } from "./types";

function milestone(id: string) {
  const found = MILESTONES.find((item) => item.id === id);
  if (!found) {
    throw new Error(`unknown milestone ${id}`);
  }
  return found;
}

describe("daily goal rewards", () => {
  it("pays a completed daily goal once, even if more of the same is placed", () => {
    const goal = pickDailyGoals(TODAY)[0];
    const first = completeGoal(createProgression(TODAY), goal);

    expect(first.progression.daily.claimed).toContain(goal.id);
    expect(rewardTitles(first.events, "daily-goal")).toContain(goal.title);

    const category = "category" in goal.metric ? goal.metric.category : undefined;
    const extra = recordPlacement(first.progression, category ? kindForCategory(category) : "flower");

    expect(rewardTitles(extra.events, "daily-goal")).not.toContain(goal.title);
    expect(extra.progression.daily.claimed.filter((id) => id === goal.id)).toHaveLength(1);
  });

  it("adds the daily goal reward to petals and to the completed-goal count", () => {
    const goal = pickDailyGoals(TODAY)[0];
    const result = completeGoal(createProgression(TODAY), goal);

    expect(result.progression.lifetime.dailyGoalsCompleted).toBeGreaterThanOrEqual(1);
    expect(result.progression.points).toBeGreaterThanOrEqual(DAILY_GOAL_REWARD);
  });

  it("does not pay again when the same state is settled a second time", () => {
    const goal = pickDailyGoals(TODAY)[0];
    const once = completeGoal(createProgression(TODAY), goal).progression;

    const again = settle(once);

    expect(again.events).toEqual([]);
    expect(again.progression).toEqual(once);
  });
});

describe("daily refresh", () => {
  it("keeps the same progression object when the day has not changed", () => {
    const progression = createProgression(TODAY);

    expect(ensureToday(progression, TODAY)).toBe(progression);
  });

  it("starts fresh goals on the next day and keeps petals, milestones and unlocks", () => {
    const earned = completeGoal(createProgression(TODAY), pickDailyGoals(TODAY)[0]).progression;
    const nextDay = addDays(TODAY, 1);

    const refreshed = ensureToday(earned, nextDay);

    expect(refreshed.daily).toEqual(createDailyState(nextDay));
    expect(refreshed.points).toBe(earned.points);
    expect(refreshed.lifetime).toEqual(earned.lifetime);
    expect(refreshed.completedMilestones).toEqual(earned.completedMilestones);
    expect(refreshed.unlockedDecorations).toEqual(earned.unlockedDecorations);
  });

  it("does not penalise missed days", () => {
    const earned = completeGoal(createProgression(TODAY), pickDailyGoals(TODAY)[0]).progression;

    const afterAbsence = ensureToday(earned, addDays(TODAY, 9));

    expect(afterAbsence.daily.date).toBe("2026-05-18");
    expect(afterAbsence.daily.claimed).toEqual([]);
    expect(afterAbsence.points).toBe(earned.points);
  });
});

describe("milestones", () => {
  it("tracks progress and completes a milestone at its target", () => {
    let progression = createProgression(TODAY);
    const firstBlooms = milestone("first-blooms");

    progression = recordPlacement(progression, "flower").progression;
    progression = recordPlacement(progression, "flower").progression;
    expect(milestoneProgress(firstBlooms, progression.lifetime)).toBe(2);
    expect(milestoneStatus(firstBlooms, progression.lifetime, progression.completedMilestones)).toBe("in-progress");

    progression = recordPlacement(progression, "flower").progression;
    expect(progression.completedMilestones).toContain("first-blooms");
    expect(milestoneStatus(firstBlooms, progression.lifetime, progression.completedMilestones)).toBe("completed");
  });

  it("grants a milestone reward only once", () => {
    let progression = createProgression(TODAY);
    const events = [];
    for (let i = 0; i < 6; i += 1) {
      const result = recordPlacement(progression, "flower");
      progression = result.progression;
      events.push(...result.events);
    }

    expect(rewardTitles(events, "milestone").filter((title) => title === "First Blooms")).toHaveLength(1);
  });

  it("keeps completed milestones after the daily goals refresh", () => {
    const { progression } = [1, 2, 3].reduce(
      (state) => ({ progression: recordPlacement(state.progression, "flower").progression }),
      { progression: createProgression(TODAY) },
    );
    expect(progression.completedMilestones).toContain("first-blooms");

    const nextDay = ensureToday(progression, addDays(TODAY, 1));

    expect(nextDay.completedMilestones).toContain("first-blooms");
    expect(nextDay.lifetime.byCategory.flowers).toBe(3);
  });

  it("counts placements in lifetime totals, so a daily reset does not lower them", () => {
    const progression = recordPlacement(createProgression(TODAY), "tree").progression;

    expect(ensureToday(progression, addDays(TODAY, 2)).lifetime.byCategory.trees).toBe(1);
  });
});

describe("unlocks", () => {
  it("starter decorations are always available", () => {
    const progression = createProgression(TODAY);

    expect(isDecorationUnlocked(progression, "flower")).toBe(true);
    expect(isDecorationUnlocked(progression, "tree")).toBe(true);
    expect(isDecorationUnlocked(progression, "mushroom")).toBe(true);
    expect(isDecorationUnlocked(progression, "bench")).toBe(true);
    expect(isDecorationUnlocked(progression, "pink-blossom")).toBe(false);
  });

  it("unlocks items whose petal requirement is met", () => {
    const result = settle({ ...createProgression(TODAY), points: 30 });

    expect(result.progression.unlockedDecorations).toContain("pink-blossom");
    expect(result.progression.unlockedDecorations).not.toContain("lavender");
    expect(result.progression.unlockedHouses).toContain("lavender");
    expect(rewardTitles(result.events, "unlock")).toContain("Pink Blossom");
  });

  it("unlocks items tied to a milestone when that milestone is completed", () => {
    let progression: Progression = createProgression(TODAY);
    for (let i = 0; i < 15; i += 1) {
      progression = recordPlacement(progression, "flower").progression;
    }

    expect(progression.completedMilestones).toContain("bloom-collector");
    expect(isDecorationUnlocked(progression, "sunflower")).toBe(true);
  });

  it("never grants the same unlock twice", () => {
    const first = settle({ ...createProgression(TODAY), points: 80 });
    const second = settle(first.progression);

    expect(second.events).toEqual([]);
    expect(new Set(first.progression.unlockedDecorations).size).toBe(first.progression.unlockedDecorations.length);
    expect(new Set(first.progression.unlockedHouses).size).toBe(first.progression.unlockedHouses.length);
  });

  it("requires a house design's own condition", () => {
    const progression = createProgression(TODAY);

    expect(isHouseUnlocked(progression, "classic")).toBe(true);
    expect(isHouseUnlocked(progression, "lavender")).toBe(false);
    expect(isHouseUnlocked(progression, "not-a-house")).toBe(false);
  });

  it("describes unlocks and milestones in friendly wording", () => {
    expect(describeReward({ type: "unlock", item: "decoration", name: "Birdbath" })).toContain("Birdbath");
    expect(describeReward({ type: "milestone", title: "First Blooms", points: 10 })).toContain("+10 petals");
  });

  it("every decoration's unlock rule refers to a real milestone when it uses one", () => {
    for (const item of Object.values(DECORATIONS)) {
      if (item.unlock.type === "milestone") {
        expect(MILESTONES.map((m) => m.id)).toContain(item.unlock.milestoneId);
      }
    }
  });
});

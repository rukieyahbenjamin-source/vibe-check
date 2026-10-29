import { describe, expect, it } from "vitest";
import { DAILY_GOAL_COUNT, DAILY_GOAL_POOL, dailyGoalValue, hashText, isDailyGoalComplete, pickDailyGoals } from "./daily";
import { addDays } from "./dates";
import { createDailyState } from "./progression";
import { zeroCategoryCounts } from "./metrics";
import { TODAY } from "./testing";

describe("daily goal selection", () => {
  it("gives the same goals for the same date every time", () => {
    expect(pickDailyGoals(TODAY)).toEqual(pickDailyGoals(TODAY));
    expect(hashText(TODAY)).toBe(hashText(TODAY));
  });

  it("gives three different goals from the pool", () => {
    const goals = pickDailyGoals(TODAY);
    const ids = goals.map((goal) => goal.id);

    expect(goals).toHaveLength(DAILY_GOAL_COUNT);
    expect(new Set(ids).size).toBe(DAILY_GOAL_COUNT);
    for (const goal of goals) {
      expect(DAILY_GOAL_POOL).toContainEqual(goal);
    }
  });

  it("varies from day to day rather than repeating one set", () => {
    const sets = new Set<string>();
    for (let day = 0; day < 30; day += 1) {
      sets.add(pickDailyGoals(addDays(TODAY, day)).map((goal) => goal.id).join(","));
    }

    expect(sets.size).toBeGreaterThan(1);
  });

  it("gives stable goals on a leap day", () => {
    expect(pickDailyGoals("2028-02-29")).toEqual(pickDailyGoals("2028-02-29"));
  });
});

describe("goal progress", () => {
  it("caps the shown value at the target and detects completion", () => {
    const goal = DAILY_GOAL_POOL.find((item) => item.metric.type === "total");
    if (!goal) {
      throw new Error("expected a total-count daily goal in the pool");
    }
    const daily = { ...createDailyState(TODAY), byCategory: { ...zeroCategoryCounts(), flowers: 5 } };

    expect(dailyGoalValue(goal, daily)).toBe(goal.target);
    expect(isDailyGoalComplete(goal, daily)).toBe(true);
  });

  it("reports an unfinished goal as incomplete", () => {
    const goal = DAILY_GOAL_POOL[0];
    expect(isDailyGoalComplete(goal, createDailyState(TODAY))).toBe(false);
  });
});

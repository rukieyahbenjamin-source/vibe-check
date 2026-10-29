import { DAILY_GOAL_REWARD, dailyGoalValue, isDailyGoalComplete, pickDailyGoals } from "../daily";
import type { Progression } from "../types";
import { ProgressBar } from "./ProgressBar";

interface DailyGoalsPanelProps {
  progression: Progression;
}

export function DailyGoalsPanel({ progression }: DailyGoalsPanelProps) {
  const goals = pickDailyGoals(progression.daily.date);
  const completed = goals.filter((goal) => isDailyGoalComplete(goal, progression.daily)).length;

  return (
    <section className="panel" aria-labelledby="daily-title">
      <h2 id="daily-title">Today&apos;s goals</h2>
      <p className="muted">
        {completed} of {goals.length} complete. Each goal pays {DAILY_GOAL_REWARD} petals, once a day.
      </p>

      <ul className="goal-list">
        {goals.map((goal) => {
          const value = dailyGoalValue(goal, progression.daily);
          const done = isDailyGoalComplete(goal, progression.daily);
          const paid = progression.daily.claimed.includes(goal.id);
          return (
            <li key={goal.id} className={done ? "goal-card is-done" : "goal-card"}>
              <div className="goal-card-head">
                <span className="goal-check" aria-hidden="true">{done ? "✓" : ""}</span>
                <span className="goal-title">{goal.title}</span>
                <span className="goal-count">
                  {value} / {goal.target}
                </span>
              </div>
              <ProgressBar value={value} max={goal.target} label={goal.title} />
              <p className="goal-status">
                {done
                  ? paid
                    ? `Done! +${DAILY_GOAL_REWARD} petals earned.`
                    : "Done!"
                  : `${goal.target - value} to go`}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="muted goal-footnote">
        Each decoration you place counts once. Moving, rotating, undoing or deleting never lowers
        progress. New goals arrive each day, and missed days cost nothing.
      </p>
    </section>
  );
}

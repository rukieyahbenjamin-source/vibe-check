import { HOUSE_DESIGNS } from "../houses";
import { unlockHint } from "../catalogue";
import { MILESTONES, MILESTONE_STAGES, milestoneProgress, milestoneStatus } from "../milestones";
import type { MilestoneStatus } from "../milestones";
import type { Progression } from "../types";
import { ProgressBar } from "./ProgressBar";

const STATUS_LABELS: Record<MilestoneStatus, string> = {
  locked: "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

interface MilestonesPanelProps {
  progression: Progression;
}

export function MilestonesPanel({ progression }: MilestonesPanelProps) {
  const nextHouse = HOUSE_DESIGNS.find(
    (design) => design.unlock.type !== "starter" && !progression.unlockedHouses.includes(design.id),
  );

  return (
    <section className="panel" aria-labelledby="milestones-title">
      <h2 id="milestones-title">Milestones</h2>
      <p className="muted">
        {progression.completedMilestones.length} of {MILESTONES.length} reached. Milestones are
        permanent, even when daily goals refresh.
      </p>

      {MILESTONE_STAGES.map((stage) => (
        <div key={stage.id} className="milestone-stage">
          <h3>{stage.title}</h3>
          {MILESTONES.filter((milestone) => milestone.stage === stage.id).map((milestone) => {
            const status = milestoneStatus(milestone, progression.lifetime, progression.completedMilestones);
            const value = milestoneProgress(milestone, progression.lifetime);
            return (
              <article key={milestone.id} className={`milestone-card is-${status}`}>
                <div className="milestone-head">
                  <span className="milestone-title">{milestone.title}</span>
                  <span className="milestone-status">{STATUS_LABELS[status]}</span>
                </div>
                <p className="muted">{milestone.description}</p>
                <ProgressBar value={value} max={milestone.target} label={milestone.title} />
                <p className="milestone-reward">
                  {value} / {milestone.target} · Reward: {milestone.reward} petals
                  {status === "completed" ? " (earned)" : ""}
                </p>
              </article>
            );
          })}
        </div>
      ))}

      <p className="muted goal-footnote">
        Milestones count everything you have ever placed, so they keep going even when you clear
        your island.
      </p>
      <p className="muted goal-footnote">
        {nextHouse
          ? `Next house design: ${nextHouse.name}. ${unlockHint(nextHouse.unlock)}.`
          : "Every house design is unlocked!"}
      </p>
    </section>
  );
}

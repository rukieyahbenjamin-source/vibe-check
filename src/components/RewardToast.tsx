import { describeReward } from "../progression";
import type { RewardEvent } from "../types";

interface RewardToastProps {
  rewards: RewardEvent[];
  onDismiss: () => void;
}

/** A small, gentle card for new rewards. It stays until the player dismisses it. */
export function RewardToast({ rewards, onDismiss }: RewardToastProps) {
  if (rewards.length === 0) {
    return null;
  }

  return (
    <div className="reward-toast" role="status" aria-live="polite">
      <span className="reward-sparkle" aria-hidden="true">✨</span>
      <div className="reward-text">
        {rewards.map((reward, index) => (
          <p key={index}>{describeReward(reward)}</p>
        ))}
      </div>
      <button type="button" className="secondary reward-dismiss" onClick={onDismiss}>
        Lovely!
      </button>
    </div>
  );
}

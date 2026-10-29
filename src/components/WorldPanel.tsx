interface WorldPanelProps {
  placedCount: number;
  petals: number;
  saved: boolean;
}

export function WorldPanel({ placedCount, petals, saved }: WorldPanelProps) {
  return (
    <section className="panel" aria-labelledby="world-title">
      <h2 id="world-title">Your World</h2>
      <p>
        Welcome home! This little island is all yours. Make it cosy one flower at a time.
      </p>
      <p className="muted">
        {placedCount === 0
          ? "Nothing placed yet. Your island is waiting."
          : `${placedCount} decoration${placedCount === 1 ? "" : "s"} on the island.`}
      </p>

      <div className="petal-badge" aria-label={`${petals} petals`}>
        <span aria-hidden="true">🌸</span> {petals} petals
      </div>

      <p className={saved ? "save-status is-saved" : "save-status is-failed"} role="status">
        {saved ? "✓ Progress saved on this device" : "Couldn't save on this device. Keep playing and try again."}
      </p>
    </section>
  );
}

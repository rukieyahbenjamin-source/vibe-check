interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
}

/** A soft pastel progress bar that screen readers announce as a progressbar. */
export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

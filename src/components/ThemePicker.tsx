import { unlockHint } from "../catalogue";
import { THEMES, getTheme } from "../themes";
import type { PaletteGroup, ThemeInfo } from "../themes";
import type { ThemeId } from "../types";

const GROUP_LABELS: Record<PaletteGroup, string> = {
  classic: "Classic",
  pastel: "Pastel dreams",
  dark: "Moody & mystic",
};

const GROUP_ORDER: PaletteGroup[] = ["classic", "pastel", "dark"];

interface ThemePickerProps {
  /** The palette the world is saved with. */
  applied: ThemeId;
  /** A palette being previewed. It is only saved when the player confirms it. */
  preview: ThemeId | null;
  isUnlocked: (id: ThemeId) => boolean;
  onPreview: (id: ThemeId | null) => void;
  onApply: (id: ThemeId) => void;
}

export function ThemePicker({ applied, preview, isUnlocked, onPreview, onApply }: ThemePickerProps) {
  const pending = preview !== null && preview !== applied ? preview : null;

  return (
    <section className="palette-picker" aria-labelledby="palette-title">
      <div className="palette-head">
        <div>
          <h2 id="palette-title">Palettes</h2>
          <p className="muted">
            {pending
              ? `Previewing ${getTheme(pending).label}. Apply it to keep it.`
              : `Current: ${getTheme(applied).label}. Tap a palette to preview it.`}
          </p>
        </div>
        <div className="palette-actions">
          {pending ? (
            <>
              <button type="button" className="secondary" onClick={() => onPreview(null)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={() => onApply(pending)}>
                Apply palette
              </button>
            </>
          ) : (
            <button
              type="button"
              className="secondary"
              onClick={() => onApply("spring")}
              disabled={applied === "spring"}
            >
              Restore default colours
            </button>
          )}
        </div>
      </div>

      {GROUP_ORDER.map((group) => (
        <div key={group} className="palette-group">
          <h3>{GROUP_LABELS[group]}</h3>
          <div className="palette-grid">
            {THEMES.filter((theme) => theme.group === group).map((theme) => (
              <PaletteCard
                key={theme.id}
                theme={theme}
                isApplied={applied === theme.id}
                isPreviewing={preview === theme.id}
                unlocked={isUnlocked(theme.id)}
                onPreview={onPreview}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

interface PaletteCardProps {
  theme: ThemeInfo;
  isApplied: boolean;
  isPreviewing: boolean;
  unlocked: boolean;
  onPreview: (id: ThemeId | null) => void;
}

function PaletteCard({ theme, isApplied, isPreviewing, unlocked, onPreview }: PaletteCardProps) {
  const { palette } = theme;
  const label = unlocked ? theme.label : `${theme.label}, locked. ${unlockHint(theme.unlock)}.`;

  return (
    <button
      type="button"
      className={`palette-card${isPreviewing ? " is-previewing" : ""}`}
      aria-pressed={isApplied}
      aria-label={label}
      title={unlocked ? theme.description : unlockHint(theme.unlock)}
      disabled={!unlocked}
      onClick={() => onPreview(theme.id)}
    >
      <span className="palette-strip" aria-hidden="true">
        <span style={{ background: palette.sky }} />
        <span style={{ background: palette.grass }} />
        <span style={{ background: palette.roof }} />
        <span style={{ background: palette.panel }} />
      </span>
      <span className="palette-name">
        {!unlocked && <span aria-hidden="true">🔒 </span>}
        {theme.label}
      </span>
      <span className="palette-note">{unlocked ? (isApplied ? "Current" : theme.description) : unlockHint(theme.unlock)}</span>
    </button>
  );
}

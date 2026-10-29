import { useEffect, useReducer, useState } from "react";
import "./App.css";
import type { DecorationKind, Point, ThemeId } from "./types";
import { getTheme, paletteToStyle } from "./themes";
import { IslandScene } from "./components/IslandScene";
import { ThemePicker } from "./components/ThemePicker";
import { WorldPanel } from "./components/WorldPanel";
import { DailyGoalsPanel } from "./components/DailyGoalsPanel";
import { MilestonesPanel } from "./components/MilestonesPanel";
import { DecoratePanel } from "./components/DecoratePanel";
import { HousePanel } from "./components/HousePanel";
import { RewardToast } from "./components/RewardToast";
import {
  backupInvalidSave,
  createDefaultWorld,
  getBrowserStorage,
  loadGame,
  saveGame,
} from "./persistence";
import { currentDateKey } from "./dates";
import { findPlacement } from "./decorating";
import { isCottageOptionUnlocked, isDecorationUnlocked, isHouseUnlocked, isPaletteUnlocked } from "./progression";
import type { HouseState } from "./houses";
import type { CottageSlot } from "./cottage";
import { appReducer, createAppState, toGameState } from "./game";
import type { AppState } from "./game";
import { DECORATIONS } from "./catalogue";

const RECOVERED_MESSAGE = "Your saved world could not be read, so a fresh island has been started.";
const UPGRADED_MESSAGE = "Your save was upgraded to the newest version. Welcome back!";

/** Loads the saved game once, when the app starts. A damaged save is kept as a backup first. */
function initialState(): AppState {
  const storage = getBrowserStorage();
  const loaded = loadGame(storage, currentDateKey());
  if (loaded.status === "recovered") {
    backupInvalidSave(storage);
  }
  const notice =
    loaded.status === "recovered" ? RECOVERED_MESSAGE : loaded.migrated ? UPGRADED_MESSAGE : null;
  return createAppState(loaded.game, notice);
}

function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, initialState);
  // UI-only: the palette picker is open, and which palette (if any) is being previewed. Neither is saved.
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<ThemeId | null>(null);
  // The cottage being edited. It previews on the island until Apply saves it.
  const [draftHouse, setDraftHouse] = useState<HouseState>(state.house);

  // When the saved cottage changes (after Apply, or on load), the draft follows it.
  useEffect(() => {
    setDraftHouse(state.house);
  }, [state.house]);

  // Save automatically whenever the world, progression or house changes.
  useEffect(() => {
    const saved = saveGame(getBrowserStorage(), toGameState(state));
    dispatch({ type: "save-result", ok: saved });
  }, [state.world, state.progression, state.house]);

  // Start a new day's goals when the player returns to the app after midnight.
  useEffect(() => {
    function checkDate() {
      dispatch({ type: "refresh-date", dateKey: currentDateKey() });
    }
    window.addEventListener("focus", checkDate);
    document.addEventListener("visibilitychange", checkDate);
    return () => {
      window.removeEventListener("focus", checkDate);
      document.removeEventListener("visibilitychange", checkDate);
    };
  }, []);

  // The preview changes how the whole app looks. Only the applied palette is saved.
  const displayedThemeId = previewTheme ?? state.world.themeId;
  const theme = getTheme(displayedThemeId);
  const selectedPlacement = findPlacement(state.world.placements, state.selectedPlacementId);
  const canReset =
    state.world.placements.length > 0 || state.world.themeId !== createDefaultWorld().themeId;

  const hint = selectedPlacement
    ? `${DECORATIONS[selectedPlacement.kind].name} selected. Drag it to move, or rotate or delete it.`
    : state.selectedKind
      ? "Tap the grass to place it."
      : "Pick something from Decorate to begin, or tap a decoration to edit it.";

  function applyPalette(themeId: ThemeId) {
    dispatch({ type: "set-theme", themeId });
    setPreviewTheme(null);
  }

  function togglePalettes() {
    setPaletteOpen((open) => !open);
    setPreviewTheme(null);
  }

  return (
    <div
      className="app"
      style={paletteToStyle(theme.palette)}
      data-theme={displayedThemeId}
      data-atmosphere={theme.atmosphere}
    >
      <header className="app-header">
        <div>
          <h1>Little World</h1>
          <p className="subtitle">A little space that&apos;s all yours.</p>
        </div>
        <button
          type="button"
          className="palette-toggle"
          aria-expanded={paletteOpen}
          onClick={togglePalettes}
        >
          <span className="swatches" aria-hidden="true">
            <span style={{ background: theme.palette.sky }} />
            <span style={{ background: theme.palette.grass }} />
            <span style={{ background: theme.palette.roof }} />
          </span>
          Palette: {getTheme(state.world.themeId).label}
        </button>
      </header>

      {paletteOpen && (
        <ThemePicker
          applied={state.world.themeId}
          preview={previewTheme}
          isUnlocked={(id) => isPaletteUnlocked(state.progression, id)}
          onPreview={setPreviewTheme}
          onApply={applyPalette}
        />
      )}

      <main className="layout">
        <aside className="side left">
          <WorldPanel
            placedCount={state.world.placements.length}
            petals={state.progression.points}
            saved={state.saveStatus === "saved"}
          />
          <DailyGoalsPanel progression={state.progression} />
          <MilestonesPanel progression={state.progression} />
        </aside>

        <section className="island-card" aria-label="Your island">
          <IslandScene
            placements={state.world.placements}
            house={draftHouse}
            selected={state.selectedKind}
            selectedPlacementId={state.selectedPlacementId}
            onTapGrass={(point: Point) =>
              dispatch({ type: "tap-grass", point, dateKey: currentDateKey() })
            }
            onSelectPlacement={(id) => dispatch({ type: "select-placement", id })}
            onMove={(id, point) => dispatch({ type: "move", id, point })}
          />
        </section>

        <aside className="side right">
          <DecoratePanel
            selectedKind={state.selectedKind}
            isUnlocked={(kind: DecorationKind) => isDecorationUnlocked(state.progression, kind)}
            canUndo={state.history.length > 0}
            canRedo={state.future.length > 0}
            onRedo={() => dispatch({ type: "redo" })}
            canReset={canReset}
            statusMessage={state.message ?? hint}
            onSelect={(kind) => dispatch({ type: "select-kind", kind })}
            onUndo={() => dispatch({ type: "undo" })}
            onReset={() => dispatch({ type: "reset-world" })}
            selectedPlacement={selectedPlacement}
            onRotate={() => dispatch({ type: "rotate" })}
            onDelete={() => dispatch({ type: "delete" })}
            onDone={() => dispatch({ type: "deselect" })}
          />
          <HousePanel
            applied={state.house}
            draft={draftHouse}
            onDraft={setDraftHouse}
            onApply={() => dispatch({ type: "set-cottage", house: draftHouse })}
            isOptionUnlocked={(slot: CottageSlot, value: string) =>
              isCottageOptionUnlocked(state.progression, slot, value)
            }
            isDesignUnlocked={(designId) => isHouseUnlocked(state.progression, designId)}
          />
        </aside>
      </main>

      <RewardToast rewards={state.rewards} onDismiss={() => dispatch({ type: "dismiss-rewards" })} />
    </div>
  );
}

export default App;

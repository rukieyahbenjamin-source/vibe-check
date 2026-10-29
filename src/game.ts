import { DECORATIONS, unlockHint } from "./catalogue";
import { addPlacement, findPlacement, movePlacement, placementIssue, removePlacement, rotatePlacement } from "./decorating";
import { getHouseDesign, getSwatch, HOUSE_PARTS, presetHouse, setColour } from "./houses";
import type { HouseState, HousePart } from "./houses";
import { getOption, getSlot, lockedSlots } from "./cottage";
import { isCottageOptionUnlocked } from "./progression";
import { sanitizeCottage } from "./persistence";
import { popHistory, pushHistory } from "./history";
import { issueMessage } from "./footprint";
import type { HistoryEntry } from "./history";
import { createDefaultWorld } from "./persistence";
import type { GameState, WorldState } from "./persistence";
import {
  describeReward,
  ensureToday,
  isDecorationUnlocked,
  isHouseUnlocked,
  isPaletteUnlocked,
  recordPlacement,
} from "./progression";
import type { DecorationKind, Placement, Point, RewardEvent, ThemeId, Progression } from "./types";
import { getTheme } from "./themes";

/** Everything the UI needs. The game part (world, progression, house) is what gets saved. */
export interface AppState {
  world: WorldState;
  progression: Progression;
  house: HouseState;
  history: HistoryEntry[];
  /** Changes undone and available to redo. Any new change clears it. */
  future: HistoryEntry[];
  selectedKind: DecorationKind | null;
  selectedPlacementId: number | null;
  /** Reward notifications waiting to be dismissed. */
  rewards: RewardEvent[];
  message: string | null;
  saveStatus: "saved" | "failed";
}

export type AppAction =
  | { type: "select-kind"; kind: DecorationKind | null }
  | { type: "select-placement"; id: number }
  | { type: "deselect" }
  | { type: "tap-grass"; point: Point; dateKey: string }
  | { type: "move"; id: number; point: Point }
  | { type: "move-rejected" }
  | { type: "rotate" }
  | { type: "delete" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset-world" }
  | { type: "set-theme"; themeId: ThemeId }
  | { type: "set-house"; designId: string }
  | { type: "set-cottage"; house: HouseState }
  | { type: "set-house-colour"; part: HousePart; swatchId: string | null }
  | { type: "refresh-date"; dateKey: string }
  | { type: "dismiss-rewards" }
  | { type: "save-result"; ok: boolean }
  | { type: "notice"; message: string };

export function createAppState(game: GameState, notice: string | null): AppState {
  return {
    world: game.world,
    progression: game.progression,
    house: game.house,
    history: [],
    future: [],
    selectedKind: null,
    selectedPlacementId: null,
    rewards: [],
    message: notice,
    saveStatus: "saved",
  };
}

/** The part of the state that is saved. */
export function toGameState(state: AppState): GameState {
  return { world: state.world, progression: state.progression, house: state.house };
}

const OFF_GRASS_MESSAGE = "Decorations must stay on the grass.";
const OFF_GRASS_RETURNED_MESSAGE = "Decorations must stay on the grass, so it went back to where it was.";

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "select-kind":
      return {
        ...state,
        selectedKind: action.kind,
        selectedPlacementId: null,
        message: action.kind
          ? `${DECORATIONS[action.kind].name} selected. Tap the grass to place it.`
          : "Selection cleared. Pick something to decorate with.",
      };

    case "select-placement": {
      const placement = findPlacement(state.world.placements, action.id);
      if (!placement) {
        return state;
      }
      return {
        ...state,
        selectedKind: null,
        selectedPlacementId: action.id,
        message: `${DECORATIONS[placement.kind].name} selected. Drag it to move it, or use the controls.`,
      };
    }

    case "deselect":
      return { ...state, selectedPlacementId: null, message: "Deselected." };

    case "tap-grass":
      if (state.selectedKind) {
        return placeDecoration(state, state.selectedKind, action.point, action.dateKey);
      }
      if (state.selectedPlacementId !== null) {
        return { ...state, selectedPlacementId: null, message: "Deselected." };
      }
      return { ...state, message: "Pick a decoration first, then tap the grass." };

    case "move": {
      const placement = findPlacement(state.world.placements, action.id);
      const next = movePlacement(state.world.placements, action.id, action.point);
      if (!placement || !next) {
        const issue = placement ? placementIssue(state.world.placements, placement.kind, action.point, placement.rotation, action.id) : null;
        const reason = issue ? issueMessage(issue) : "it would not fit there";
        return { ...state, message: `Can't move it there: ${reason}. It went back to where it was.` };
      }
      const name = DECORATIONS[placement.kind].name;
      return commitPlacements(state, next, `moving a ${name}`, `Moved the ${name}.`);
    }

    case "move-rejected":
      return { ...state, message: OFF_GRASS_RETURNED_MESSAGE };

    case "rotate": {
      const placement = findPlacement(state.world.placements, state.selectedPlacementId);
      if (!placement) {
        return state;
      }
      const next = rotatePlacement(state.world.placements, placement.id);
      if (!next) {
        return { ...state, message: "There isn't room to turn it that way." };
      }
      const name = DECORATIONS[placement.kind].name;
      const degrees = (placement.rotation + 90) % 360;
      return commitPlacements(state, next, `rotating a ${name}`, `Rotated the ${name} to ${degrees}°.`);
    }

    case "delete": {
      const placement = findPlacement(state.world.placements, state.selectedPlacementId);
      if (!placement) {
        return state;
      }
      const next = removePlacement(state.world.placements, placement.id);
      if (!next) {
        return state;
      }
      const name = DECORATIONS[placement.kind].name;
      return {
        ...commitPlacements(state, next, `deleting a ${name}`, `Deleted the ${name}. Use Undo last to bring it back.`),
        selectedPlacementId: null,
      };
    }

    case "undo": {
      const { history, entry } = popHistory(state.history);
      if (!entry) {
        return state;
      }
      const restored: Placement[] = entry.placements;
      const stillExists = findPlacement(restored, state.selectedPlacementId) !== null;
      return {
        ...state,
        history,
        future: [...state.future, { placements: state.world.placements, label: entry.label }],
        world: { ...state.world, placements: restored },
        selectedPlacementId: stillExists ? state.selectedPlacementId : null,
        message: `Undid ${entry.label}.`,
      };
    }

    case "redo": {
      const next = state.future[state.future.length - 1];
      if (!next) {
        return state;
      }
      const stillExists = findPlacement(next.placements, state.selectedPlacementId) !== null;
      return {
        ...state,
        future: state.future.slice(0, -1),
        history: pushHistory(state.history, { placements: state.world.placements, label: next.label }),
        world: { ...state.world, placements: next.placements },
        selectedPlacementId: stillExists ? state.selectedPlacementId : null,
        message: `Redid ${next.label}.`,
      };
    }

    case "reset-world":
      // Resets the island and theme only. Progression (petals, milestones, unlocks) and the house stay.
      return {
        ...state,
        world: createDefaultWorld(),
        history: [],
        future: [],
        selectedKind: null,
        selectedPlacementId: null,
        message: "Your island has been cleared. Your petals, milestones and unlocks are safe.",
      };

    case "set-theme": {
      const theme = getTheme(action.themeId);
      if (!isPaletteUnlocked(state.progression, theme.id)) {
        return { ...state, message: `${theme.label} is still locked. ${unlockHint(theme.unlock)}.` };
      }
      return {
        ...state,
        world: { ...state.world, themeId: theme.id },
        message: `${theme.label} is now showing.`,
      };
    }

    case "set-house": {
      // Starts from a named preset. This replaces the whole cottage with the preset's look.
      const design = getHouseDesign(action.designId);
      if (!design || !isHouseUnlocked(state.progression, design.id)) {
        return { ...state, message: `That house is still locked. ${design ? unlockHint(design.unlock) : ""}.` };
      }
      return { ...state, house: presetHouse(design), message: `${design.name} is now your home.` };
    }

    case "set-cottage": {
      // Applies a whole builder draft. Refused if any changed part is still locked.
      const locked = lockedSlots(action.house, (slot, value) => isCottageOptionUnlocked(state.progression, slot, value));
      if (locked.length > 0) {
        const option = getOption(locked[0], getSlot(action.house, locked[0]));
        return { ...state, message: `${option?.label ?? "That option"} is still locked. ${option ? unlockHint(option.unlock) : ""}.` };
      }
      return { ...state, house: sanitizeCottage(action.house, state.progression), message: "Your cottage is updated." };
    }

    case "set-house-colour": {
      if (!(HOUSE_PARTS as readonly string[]).includes(action.part)) {
        return state;
      }
      if (action.swatchId !== null && !getSwatch(action.swatchId)) {
        return state;
      }
      return {
        ...state,
        house: setColour(state.house, action.part, action.swatchId),
        message: action.swatchId === null ? "Colour reset to the design's default." : `${getSwatch(action.swatchId)?.label} applied.`,
      };
    }

    case "refresh-date": {
      const progression = ensureToday(state.progression, action.dateKey);
      if (progression === state.progression) {
        return state;
      }
      return { ...state, progression, message: "A new day! Fresh goals are ready." };
    }

    case "dismiss-rewards":
      return { ...state, rewards: [] };

    case "save-result":
      return { ...state, saveStatus: action.ok ? "saved" : "failed" };

    case "notice":
      return { ...state, message: action.message };
  }
}

/** Replaces the island's decorations, keeping the previous state in history so the change can be undone. */
function commitPlacements(state: AppState, next: Placement[], label: string, message: string): AppState {
  return {
    ...state,
    history: pushHistory(state.history, { placements: state.world.placements, label }),
    future: [],
    world: { ...state.world, placements: next },
    message,
  };
}

function placeDecoration(state: AppState, kind: DecorationKind, point: Point, dateKey: string): AppState {
  const progression = ensureToday(state.progression, dateKey);
  const def = DECORATIONS[kind];

  if (!isDecorationUnlocked(progression, kind)) {
    return { ...state, progression, message: `${def.name} is still locked. ${unlockHint(def.unlock)}.` };
  }

  const next = addPlacement(state.world.placements, kind, point);
  if (!next) {
    const issue = placementIssue(state.world.placements, kind, point);
    return { ...state, message: issue ? `Can't place the ${def.name} there: ${issueMessage(issue)}.` : OFF_GRASS_MESSAGE };
  }

  const settled = recordPlacement(progression, kind);
  const base = commitPlacements(state, next, `placing a ${def.name}`, "");
  const [firstReward] = settled.events;
  return {
    ...base,
    progression: settled.progression,
    rewards: [...state.rewards, ...settled.events],
    message: firstReward
      ? `Placed a ${def.name}! ${describeReward(firstReward)}`
      : `Placed a ${def.name}! Pick another, or keep tapping to add more.`,
  };
}

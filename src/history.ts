import type { Placement } from "./types";

/** A snapshot of the decorations from just before an action, plus a label for undo messages. */
export interface HistoryEntry {
  placements: Placement[];
  label: string;
}

export const MAX_HISTORY = 50;

/** Adds an entry to the end of the history, dropping the oldest when it gets too long. */
export function pushHistory(history: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  return [...history, entry].slice(-MAX_HISTORY);
}

/** Removes the latest entry. Returns the remaining history and the entry removed, if any. */
export function popHistory(history: HistoryEntry[]): {
  history: HistoryEntry[];
  entry: HistoryEntry | null;
} {
  const entry = history[history.length - 1] ?? null;
  return { history: history.slice(0, -1), entry };
}

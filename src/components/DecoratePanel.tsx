import { useState } from "react";
import { DECORATION_LIST, unlockHint } from "../catalogue";
import type { DecorationDef } from "../catalogue";
import { CATEGORIES } from "../types";
import type { Category, DecorationKind, Placement } from "../types";
import { DecorationIcon, DECORATION_NAMES } from "./DecorationArt";

const CATEGORY_LABELS: Record<Category, string> = {
  flowers: "Flowers",
  trees: "Trees",
  plants: "Plants",
  furniture: "Furniture",
  water: "Water",
  landscape: "Landscape",
  special: "Special",
};

interface DecoratePanelProps {
  selectedKind: DecorationKind | null;
  isUnlocked: (kind: DecorationKind) => boolean;
  canUndo: boolean;
  canRedo: boolean;
  onRedo: () => void;
  canReset: boolean;
  statusMessage: string;
  onSelect: (kind: DecorationKind | null) => void;
  onUndo: () => void;
  onReset: () => void;
  selectedPlacement: Placement | null;
  onRotate: () => void;
  onDelete: () => void;
  onDone: () => void;
}

export function DecoratePanel({
  selectedKind,
  isUnlocked,
  canUndo,
  canRedo,
  onRedo,
  canReset,
  statusMessage,
  onSelect,
  onUndo,
  onReset,
  selectedPlacement,
  onRotate,
  onDelete,
  onDone,
}: DecoratePanelProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("flowers");
  const [confirmingReset, setConfirmingReset] = useState(false);
  const items = DECORATION_LIST.filter((item) => item.category === activeCategory);
  const unlockedTotal = DECORATION_LIST.filter((item) => isUnlocked(item.id)).length;
  const countIn = (category: Category) => {
    const all = DECORATION_LIST.filter((item) => item.category === category);
    return { unlocked: all.filter((item) => isUnlocked(item.id)).length, total: all.length };
  };

  function handleConfirmReset() {
    setConfirmingReset(false);
    onReset();
  }

  return (
    <section className="panel" aria-labelledby="decorate-title">
      <h2 id="decorate-title">Decorate</h2>
      <p className="muted">
        Choose an item, then tap the grass to place it. {unlockedTotal} of {DECORATION_LIST.length} unlocked.
      </p>

      <div className="category-tabs" role="tablist" aria-label="Decoration categories">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            className="category-tab"
            aria-selected={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          >
            {CATEGORY_LABELS[category]}
            <span className="tab-count">
              {countIn(category).unlocked}/{countIn(category).total}
            </span>
          </button>
        ))}
      </div>

      <div className="decoration-list" role="tabpanel" aria-label={`${CATEGORY_LABELS[activeCategory]} decorations`}>
        <div className="decoration-grid">
        {items.map((item) => (
          <DecorationCard
            key={item.id}
            item={item}
            unlocked={isUnlocked(item.id)}
            selected={selectedKind === item.id}
            onSelect={onSelect}
          />
        ))}
        </div>
      </div>

      {selectedPlacement && (
        <div className="placement-controls" aria-label="Selected decoration">
          <p>
            <strong>{DECORATION_NAMES[selectedPlacement.kind]}</strong> is selected. Drag it on the
            island to move it.
          </p>
          <div className="decorate-actions">
            <button type="button" className="secondary" onClick={onRotate}>
              Rotate 90°
            </button>
            <button type="button" className="danger" onClick={onDelete}>
              Delete
            </button>
            <button type="button" className="secondary" onClick={onDone}>
              Done
            </button>
          </div>
        </div>
      )}

      <p className="status" role="status" aria-live="polite">
        {statusMessage}
      </p>

      <div className="decorate-actions">
        <button type="button" className="secondary" onClick={() => onSelect(null)} disabled={!selectedKind}>
          Clear selection
        </button>
        <button type="button" className="secondary" onClick={onUndo} disabled={!canUndo}>
          Undo last
        </button>
        <button type="button" className="secondary" onClick={onRedo} disabled={!canRedo}>
          Redo
        </button>
      </div>

      <div className="reset-zone">
        {confirmingReset ? (
          <div className="reset-confirm" role="alertdialog" aria-labelledby="reset-question">
            <p id="reset-question">
              Clear every decoration and go back to Spring Meadow? Your petals, milestones, unlocks
              and house stay safe.
            </p>
            <div className="decorate-actions">
              <button type="button" className="danger" onClick={handleConfirmReset}>
                Yes, clear my island
              </button>
              <button type="button" className="secondary" onClick={() => setConfirmingReset(false)}>
                Keep my island
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="reset-button"
            onClick={() => setConfirmingReset(true)}
            disabled={!canReset}
          >
            Reset world
          </button>
        )}
      </div>
    </section>
  );
}

interface DecorationCardProps {
  item: DecorationDef;
  unlocked: boolean;
  selected: boolean;
  onSelect: (kind: DecorationKind | null) => void;
}

function DecorationCard({ item, unlocked, selected, onSelect }: DecorationCardProps) {
  if (!unlocked) {
    return (
      <button
        type="button"
        className="decoration-button is-locked"
        disabled
        aria-label={`${item.name}, locked. ${unlockHint(item.unlock)}.`}
      >
        <span className="lock-badge" aria-hidden="true">🔒</span>
        <DecorationIcon kind={item.id} />
        <span className="decoration-name">{item.name}</span>
        <span className="decoration-note">{unlockHint(item.unlock)}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="decoration-button"
      aria-pressed={selected}
      onClick={() => onSelect(selected ? null : item.id)}
    >
      {selected && <span className="selected-badge">Selected</span>}
      <DecorationIcon kind={item.id} />
      <span className="decoration-name">{item.name}</span>
    </button>
  );
}

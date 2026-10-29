import { useState } from "react";
import { unlockHint } from "../catalogue";
import { COTTAGE_TABS, getSlot, optionsFor, setSlot } from "../cottage";
import type { CottageCategory, CottageSlot } from "../cottage";
import { defaultHouse, HOUSE_DESIGNS, presetHouse, SWATCHES, setColour } from "../houses";
import type { HouseDesign, HousePart, HouseState } from "../houses";
import { CottageArt } from "./CottageArt";

interface HousePanelProps {
  /** The cottage saved in the world. */
  applied: HouseState;
  /** The cottage being edited. The island previews it while the builder is open. */
  draft: HouseState;
  onDraft: (house: HouseState) => void;
  onApply: () => void;
  isOptionUnlocked: (slot: CottageSlot, value: string) => boolean;
  isDesignUnlocked: (designId: string) => boolean;
}

const SLOT_LABELS: Partial<Record<CottageSlot, string>> = {
  "roof.style": "Shape",
  "roof.detail": "Detail",
  "walls.finish": "Finish",
  "windows.style": "Window style",
  "windows.shutters": "Shutters",
  "windows.flowerBoxes": "Flower boxes",
  "trim.corners": "Corner pillars",
  "trim.beams": "Decorative beams",
  "door.style": "Door style",
  "door.detail": "Door detail",
  "extras.chimney": "Chimney",
  "extras.roofOrnament": "Roof ornament",
  "extras.balcony": "Balcony",
  "extras.ivy": "Climbing ivy",
  "extras.lanterns": "Exterior lanterns",
  "extras.steps": "Entrance steps",
};

/** Colour rows shown for each tab. Colours are always free, so these need no unlocking. */
const COLOUR_ROWS: Record<CottageCategory, { part: HousePart; label: string }[]> = {
  Roof: [{ part: "roof", label: "Roof colour" }],
  Walls: [{ part: "wall", label: "Wall colour" }],
  Windows: [],
  Door: [{ part: "door", label: "Door colour" }],
  Trim: [{ part: "trim", label: "Trim colour" }],
  Extras: [],
};

export function HousePanel({ applied, draft, onDraft, onApply, isOptionUnlocked, isDesignUnlocked }: HousePanelProps) {
  const [tab, setTab] = useState<CottageCategory>("Roof");
  const changed = JSON.stringify(draft) !== JSON.stringify(applied);
  const tabDef = COTTAGE_TABS.find((item) => item.id === tab);

  return (
    <section className="panel cottage-builder" aria-labelledby="house-title">
      <h2 id="house-title">Your Cottage</h2>
      <p className="muted">
        {changed ? "Previewing on your island. Apply to keep these changes." : "Your cottage is saved. Change any part to try a new look."}
      </p>

      <div className="builder-actions">
        <button type="button" className="primary" onClick={onApply} disabled={!changed}>
          Apply cottage
        </button>
        <button type="button" className="secondary" onClick={() => onDraft(applied)} disabled={!changed}>
          Cancel
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => onDraft(defaultHouse())}
          disabled={JSON.stringify(draft) === JSON.stringify(defaultHouse())}
        >
          Original cottage
        </button>
      </div>

      <h3 className="builder-heading">Start from a design</h3>
      <div className="preset-row">
        {HOUSE_DESIGNS.map((design) => (
          <PresetCard
            key={design.id}
            design={design}
            unlocked={isDesignUnlocked(design.id)}
            onPick={() => onDraft(presetHouse(design))}
          />
        ))}
      </div>

      <div className="category-tabs" role="tablist" aria-label="Cottage parts">
        {COTTAGE_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            className="category-tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.id}
          </button>
        ))}
      </div>

      {tabDef && (
        <div className="builder-body" role="tabpanel">
          {tabDef.slots.map((slot) => (
            <OptionGroup
              key={slot}
              slot={slot}
              draft={draft}
              isUnlocked={isOptionUnlocked}
              onPick={(value) => onDraft(setSlot(draft, slot, value))}
            />
          ))}

          {COLOUR_ROWS[tab].map((row) => (
            <ColourRow
              key={row.part}
              label={row.label}
              selectedId={currentColour(draft, row.part)}
              onPick={(swatchId) => onDraft(setColour(draft, row.part, swatchId))}
            />
          ))}

          {tab === "Windows" && (
            <>
              <ColourRow
                label="Window frame"
                selectedId={draft.windows.frame}
                onPick={(swatchId) => onDraft({ ...draft, windows: { ...draft.windows, frame: swatchId } })}
              />
              <ColourRow
                label="Window glow"
                selectedId={draft.windows.glow}
                onPick={(swatchId) => onDraft({ ...draft, windows: { ...draft.windows, glow: swatchId } })}
              />
              <ColourRow
                label="Shutters"
                selectedId={draft.windows.shutterColor}
                onPick={(swatchId) => onDraft({ ...draft, windows: { ...draft.windows, shutterColor: swatchId } })}
              />
            </>
          )}

          {tab === "Door" && (
            <ColourRow
              label="Door hardware"
              selectedId={draft.door.hardware}
              onPick={(swatchId) => onDraft({ ...draft, door: { ...draft.door, hardware: swatchId } })}
            />
          )}
        </div>
      )}
    </section>
  );
}

function currentColour(house: HouseState, part: HousePart): string | null {
  switch (part) {
    case "roof":
      return house.roof.color;
    case "wall":
      return house.walls.color;
    case "door":
      return house.door.color;
    case "trim":
      return house.trim.color;
  }
}

interface OptionGroupProps {
  slot: CottageSlot;
  draft: HouseState;
  isUnlocked: (slot: CottageSlot, value: string) => boolean;
  onPick: (value: string) => void;
}

/** One group of options for a slot. Each option shows a small preview of the whole cottage. */
function OptionGroup({ slot, draft, isUnlocked, onPick }: OptionGroupProps) {
  const selected = getSlot(draft, slot);
  return (
    <div className="option-group">
      <span className="colour-label">{SLOT_LABELS[slot] ?? slot}</span>
      <div className="option-grid">
        {optionsFor(slot).map((option) => {
          const unlocked = isUnlocked(slot, option.value);
          const isSelected = selected === option.value;
          const label = unlocked ? option.label : `${option.label}, locked. ${unlockHint(option.unlock)}.`;
          return (
            <button
              key={option.key}
              type="button"
              className={`option-card${unlocked ? "" : " is-locked"}`}
              aria-pressed={isSelected}
              aria-label={label}
              disabled={!unlocked}
              onClick={() => onPick(option.value)}
            >
              {isSelected && <span className="selected-badge">In use</span>}
              {!unlocked && <span className="lock-badge" aria-hidden="true">🔒</span>}
              <svg viewBox="262 128 150 134" className="option-preview" aria-hidden="true">
                <CottageArt house={setSlot(draft, slot, option.value)} />
              </svg>
              <span className="option-name">{option.label}</span>
              {!unlocked && <span className="decoration-note">{unlockHint(option.unlock)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface PresetCardProps {
  design: HouseDesign;
  unlocked: boolean;
  onPick: () => void;
}

function PresetCard({ design, unlocked, onPick }: PresetCardProps) {
  return (
    <button
      type="button"
      className={`preset-card${unlocked ? "" : " is-locked"}`}
      disabled={!unlocked}
      aria-label={unlocked ? design.name : `${design.name}, locked. ${unlockHint(design.unlock)}.`}
      title={unlocked ? design.description : unlockHint(design.unlock)}
      onClick={onPick}
    >
      <svg viewBox="262 128 150 134" className="option-preview" aria-hidden="true">
        <CottageArt house={presetHouse(design)} />
      </svg>
      <span className="house-name">
        {!unlocked && <span aria-hidden="true">🔒 </span>}
        {design.name}
      </span>
    </button>
  );
}

interface ColourRowProps {
  label: string;
  selectedId: string | null;
  onPick: (swatchId: string | null) => void;
}

function ColourRow({ label, selectedId, onPick }: ColourRowProps) {
  return (
    <div className="colour-row">
      <span className="colour-label">{label}</span>
      <div className="swatch-row" role="group" aria-label={label}>
        <button
          type="button"
          className="swatch swatch-default"
          aria-pressed={selectedId === null}
          aria-label={`${label}: default`}
          title="Default"
          onClick={() => onPick(null)}
        >
          ↺
        </button>
        {SWATCHES.map((swatch) => (
          <button
            key={swatch.id}
            type="button"
            className="swatch"
            aria-pressed={selectedId === swatch.id}
            aria-label={`${label}: ${swatch.label}`}
            title={swatch.label}
            style={{ background: swatch.value }}
            onClick={() => onPick(swatch.id)}
          />
        ))}
      </div>
    </div>
  );
}

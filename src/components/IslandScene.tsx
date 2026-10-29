import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { DecorationKind, Placement, Point } from "../types";
import type { HouseState } from "../houses";
import { DecorationArt, DECORATION_NAMES } from "./DecorationArt";
import { CottageArt } from "./CottageArt";
import { boundsOf, footprintShape } from "../footprint";
import { GRASS_PATH } from "../island";
import type { Shape } from "../footprint";
import { placementIssue } from "../decorating";

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 480;

// Movement (in island units) smaller than this still counts as a tap, not a drag.
const DRAG_THRESHOLD = 4;

// Fixed scenery positions, chosen to sit clear of the cottage, the trees and the path.
const CLOVERS: [number, number][] = [[128, 268], [246, 302], [420, 270], [470, 300], [96, 300]];
const STEPPING_STONES: [number, number][] = [[312, 306], [322, 286], [330, 266]];
// Ambience positions. Stars sit in the sky, pollen drifts over the grass, and fireflies gather
// near the existing flowers, trees and water so the scene feels lived in.
const STARS: [number, number][] = [[70, 56], [130, 34], [215, 66], [300, 30], [470, 48], [560, 26], [40, 130], [520, 150]];
const POLLEN: [number, number][] = [[120, 230], [190, 214], [260, 200], [380, 214], [450, 240], [520, 226], [160, 288], [400, 250]];
const FIREFLIES: [number, number][] = [[124, 282], [150, 276], [236, 296], [424, 296], [452, 306], [176, 250], [492, 246], [196, 300]];
const SPARKLES: [number, number][] = [[80, 150], [205, 118], [470, 92], [596, 196], [56, 330], [560, 330]];

interface IslandSceneProps {
  placements: Placement[];
  house: HouseState;
  selected: DecorationKind | null;
  selectedPlacementId: number | null;
  onTapGrass: (point: Point) => void;
  onSelectPlacement: (id: number) => void;
  onMove: (id: number, point: Point) => void;
}

/** A pointer gesture in progress. id is null when the gesture started on empty space. */
interface Gesture {
  id: number | null;
  start: Point;
  current: Point;
  moved: boolean;
}

/** Converts a pointer position from screen pixels into the SVG's own coordinates. */
function toIslandPoint(svg: SVGSVGElement, event: PointerEvent<SVGSVGElement>): Point {
  const matrix = svg.getScreenCTM();
  if (!matrix) {
    return { x: 0, y: 0 };
  }
  const screen = svg.createSVGPoint();
  screen.x = event.clientX;
  screen.y = event.clientY;
  const local = screen.matrixTransform(matrix.inverse());
  return { x: Math.round(local.x), y: Math.round(local.y) };
}

/** Finds which placed decoration, if any, the pointer went down on. */
function placementIdFrom(target: EventTarget): number | null {
  const element = target instanceof Element ? target.closest("[data-placement-id]") : null;
  if (!element) {
    return null;
  }
  const id = Number(element.getAttribute("data-placement-id"));
  return Number.isInteger(id) ? id : null;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function IslandScene({
  placements,
  house,
  selected,
  selectedPlacementId,
  onTapGrass,
  onSelectPlacement,
  onMove,
}: IslandSceneProps) {
  // The gesture is kept in a ref so pointer events always see the latest values.
  const gestureRef = useRef<Gesture | null>(null);
  // Where a dragged decoration is currently shown. Only set while dragging.
  const [preview, setPreview] = useState<{ id: number; point: Point } | null>(null);
  // Where the pointer is when a decoration is selected for placing. Drives the placement ghost.
  const [hover, setHover] = useState<Point | null>(null);

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    const svg = event.currentTarget;
    const start = toIslandPoint(svg, event);
    const id = placementIdFrom(event.target);
    svg.setPointerCapture(event.pointerId);
    gestureRef.current = { id, start, current: start, moved: false };
    if (id !== null) {
      onSelectPlacement(id);
    }
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const gesture = gestureRef.current;
    if (!gesture) {
      if (selected) {
        const point = toIslandPoint(event.currentTarget, event);
        setHover((previous) => (previous && previous.x === point.x && previous.y === point.y ? previous : point));
      }
      return;
    }
    const current = toIslandPoint(event.currentTarget, event);
    gesture.current = current;
    if (!gesture.moved && distance(gesture.start, current) > DRAG_THRESHOLD) {
      gesture.moved = true;
    }
    if (gesture.moved && gesture.id !== null) {
      setPreview({ id: gesture.id, point: current });
    }
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    setPreview(null);
    if (!gesture) {
      return;
    }
    // A quick drag can release far from the last move event, so check the release point too.
    gesture.current = toIslandPoint(event.currentTarget, event);
    if (distance(gesture.start, gesture.current) > DRAG_THRESHOLD) {
      gesture.moved = true;
    }

    if (gesture.id !== null) {
      if (!gesture.moved) {
        return;
      }
      // The reducer checks the footprint and explains any refusal, so the scene only reports the drop.
      onMove(gesture.id, gesture.current);
      return;
    }

    if (!gesture.moved) {
      onTapGrass(gesture.current);
    }
  }

  function handlePointerCancel() {
    gestureRef.current = null;
    setPreview(null);
    setHover(null);
  }

  function handlePointerLeave() {
    setHover(null);
  }

  const selectedPlacement = placements.find((placement) => placement.id === selectedPlacementId) ?? null;

  const label = selected
    ? `Island. Tap the grass to place a ${DECORATION_NAMES[selected]}.`
    : "Island. Tap a decoration to select it, or pick one to place.";

  return (
    <svg
      className={`island-scene ${selected ? "is-placing" : ""}`}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
    >
      <defs>
        <linearGradient id="island-underside" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--rock)" />
          <stop offset="100%" stopColor="var(--rock-deep)" />
        </linearGradient>
        <radialGradient id="warm-glow">
          <stop offset="0%" stopColor="var(--sun)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--sun)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="island-mist">
          <stop offset="0%" stopColor="var(--cloud)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="var(--cloud)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Scenery is decorative only. It ignores pointer events so it never blocks placing or moving. */}
      <g className="scenery">
        <ellipse className="mist mist-drift" cx="320" cy="458" rx="280" ry="36" fill="url(#island-mist)" />
        {SPARKLES.map(([x, y], index) => (
          <circle key={index} className="sparkle" cx={x} cy={y} r="2.2" fill="var(--sun)" />
        ))}
      </g>

      {/* Clouds */}
      <g className="cloud" fill="var(--cloud)">
        <ellipse cx="110" cy="92" rx="54" ry="20" />
        <ellipse cx="150" cy="82" rx="30" ry="22" />
        <ellipse cx="520" cy="130" rx="46" ry="16" />
        <ellipse cx="552" cy="122" rx="24" ry="18" />
      </g>

      {/* Palette ambience. Each layer is shown by CSS only for the palettes that use it. */}
      <g className="scenery atmosphere">
        <g className="atmo atmo-stars">
          {STARS.map(([x, y], index) => (
            <path
              key={index}
              className="twinkle"
              style={{ animationDelay: `${(index * 0.7) % 4}s` }}
              d={`M${x} ${y - 4} L${x + 1} ${y - 1} L${x + 4} ${y} L${x + 1} ${y + 1} L${x} ${y + 4} L${x - 1} ${y + 1} L${x - 4} ${y} L${x - 1} ${y - 1} Z`}
              fill="var(--sun)"
            />
          ))}
        </g>
        <g className="atmo atmo-cool">
          <circle cx="598" cy="72" r="13" fill="var(--cloud)" opacity="0.85" />
          <circle cx="604" cy="67" r="11" fill="var(--sky)" />
          <circle cx="90" cy="60" r="2" fill="var(--cloud)" opacity="0.7" />
        </g>
        <g className="atmo atmo-pollen">
          {POLLEN.map(([x, y], index) => (
            <circle
              key={index}
              className="pollen"
              style={{ animationDelay: `${(index * 1.1) % 9}s` }}
              cx={x}
              cy={y}
              r="1.6"
              fill="var(--sun)"
            />
          ))}
        </g>
        <g className="atmo atmo-warm">
          <ellipse cx="336" cy="200" rx="170" ry="120" fill="url(#warm-glow)" className="warm-glow" />
        </g>
        <g className="atmo atmo-mist">
          <ellipse className="mist-drift" cx="210" cy="262" rx="150" ry="22" fill="var(--cloud)" opacity="0.35" />
          <ellipse className="mist-drift mist-late" cx="430" cy="276" rx="150" ry="20" fill="var(--cloud)" opacity="0.3" />
        </g>
        <g className="fireflies">
          {FIREFLIES.map(([x, y], index) => (
            <circle
              key={index}
              className="firefly"
              style={{ animationDelay: `${(index * 0.9) % 3.5}s` }}
              cx={x}
              cy={y}
              r="1.5"
              fill="var(--sun)"
            />
          ))}
        </g>
      </g>

      {/* Floating island underside */}
      <path
        d="M96 292 C120 360, 230 430, 320 462 C410 430, 520 360, 544 292 Z"
        fill="url(#island-underside)"
      />
      <path d="M180 340 L196 392 L210 350 Z" fill="var(--rock-deep)" opacity="0.6" />
      <path d="M300 430 L312 458 L326 430 Z" fill="var(--rock-deep)" opacity="0.6" />
      <path d="M440 352 L452 392 L462 360 Z" fill="var(--rock-deep)" opacity="0.6" />

      {/* Grass top */}
      <path
        d={GRASS_PATH}
        fill="var(--grass)"
      />
      <path
        d="M120 300 C180 316, 260 322, 320 322 C390 322, 470 314, 520 300"
        fill="none"
        stroke="var(--grass-deep)"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Clover patches and ground details on the grass */}
      <g className="scenery" fill="var(--grass-deep)">
        {CLOVERS.map(([x, y], index) => (
          <g key={index} transform={`translate(${x} ${y})`}>
            <circle cx="-3" cy="0" r="2.5" />
            <circle cx="3" cy="0" r="2.5" />
            <circle cx="0" cy="-3" r="2.5" />
          </g>
        ))}
      </g>

      {/* Winding path from the front edge up to the cottage door */}
      <path
        d="M320 318 C296 300, 352 284, 330 262 C318 250, 344 240, 338 236"
        fill="none"
        stroke="var(--path)"
        strokeWidth="22"
        strokeLinecap="round"
      />

      {/* Stepping stones along the path */}
      <g className="scenery" fill="var(--rock)">
        {STEPPING_STONES.map(([x, y], index) => (
          <ellipse key={index} cx={x} cy={y} rx="7" ry="4.5" stroke="var(--rock-deep)" strokeWidth="1" />
        ))}
      </g>

      <CottageArt house={house} />

      {/* Trees, flowers and rocks (fixed scenery) */}
      <g transform="translate(168 262)">
        <DecorationArt kind="tree" />
      </g>
      <g transform="translate(486 258) scale(1.15)">
        <DecorationArt kind="tree" />
      </g>
      <g transform="translate(118 300) scale(0.9)">
        <DecorationArt kind="flower" />
      </g>
      <g transform="translate(140 292) scale(0.8)">
        <DecorationArt kind="flower" />
      </g>
      <g transform="translate(232 310) scale(0.85)">
        <DecorationArt kind="flower" />
      </g>
      <g transform="translate(420 304) scale(0.9)">
        <DecorationArt kind="flower" />
      </g>
      <g transform="translate(446 316) scale(0.75)">
        <DecorationArt kind="flower" />
      </g>
      <ellipse cx="206" cy="304" rx="12" ry="8" fill="var(--rock)" />
      <ellipse cx="204" cy="301" rx="5" ry="2.5" fill="var(--wall)" opacity="0.5" />
      <ellipse cx="500" cy="296" rx="9" ry="6" fill="var(--rock)" />

      {/* Placement ghost: shows what would be placed under the pointer, and whether it fits */}
      {selected && hover && <PlacementGhost kind={selected} point={hover} placements={placements} />}

      {/* Footprint of the selected decoration, or of the one being dragged */}
      {selectedPlacement && !preview && (
        <Footprint shape={footprintShape(selectedPlacement.kind, selectedPlacement, selectedPlacement.rotation)} tone="selected" />
      )}
      {preview && (
        <DragFootprint placements={placements} id={preview.id} point={preview.point} />
      )}

      {/* Player decorations */}
      {placements.map((placement) => {
        const at = preview && preview.id === placement.id ? preview.point : placement;
        const isInvalid = preview?.id === placement.id && placementIssue(placements, placement.kind, at, placement.rotation, placement.id) !== null;
        const isSelected = placement.id === selectedPlacementId;
        const classes = [
          "placed-decoration",
          isSelected ? "is-selected" : "",
          isInvalid ? "is-invalid" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <g
            key={placement.id}
            className={classes}
            data-placement-id={placement.id}
            transform={`translate(${at.x} ${at.y}) rotate(${placement.rotation})`}
          >
            {isSelected && <circle className="selection-ring" cx="0" cy="-16" r="28" />}
            <DecorationArt kind={placement.kind} />
          </g>
        );
      })}
    </svg>
  );
}

interface FootprintProps {
  shape: Shape;
  tone: "good" | "bad" | "selected";
  /** A text label, so valid and invalid spots are clear without relying on colour. */
  label?: string;
}

/** Draws an object's footprint. Purely visual: it never takes pointer input. */
function Footprint({ shape, tone, label }: FootprintProps) {
  const className = `footprint is-${tone}`;
  const bounds = boundsOf(shape);
  const figure =
    shape.kind === "circle" ? (
      <circle className={className} cx={shape.cx} cy={shape.cy} r={shape.r} />
    ) : (
      <rect className={className} x={shape.x0} y={shape.y0} width={shape.x1 - shape.x0} height={shape.y1 - shape.y0} rx="3" />
    );
  return (
    <g>
      {figure}
      {label && (
        <text className="placement-label" x={(bounds.x0 + bounds.x1) / 2} y={bounds.y0 - 4} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

interface PlacementGhostProps {
  kind: DecorationKind;
  point: Point;
  placements: Placement[];
}

/** The decoration as it would be placed, with its footprint coloured by whether it fits. */
function PlacementGhost({ kind, point, placements }: PlacementGhostProps) {
  const fits = placementIssue(placements, kind, point, 0) === null;
  const shape = footprintShape(kind, point, 0);
  return (
    <g className="fx">
      <g transform={`translate(${point.x} ${point.y})`} opacity="0.55">
        <DecorationArt kind={kind} />
      </g>
      <Footprint shape={shape} tone={fits ? "good" : "bad"} label={fits ? "✓ Fits" : "✕ Can't go here"} />
    </g>
  );
}

interface DragFootprintProps {
  placements: Placement[];
  id: number;
  point: Point;
}

/** The footprint of a decoration being dragged, red when it would not fit there. */
function DragFootprint({ placements, id, point }: DragFootprintProps) {
  const placement = placements.find((item) => item.id === id);
  if (!placement) {
    return null;
  }
  const fits = placementIssue(placements, placement.kind, point, placement.rotation, id) === null;
  return (
    <Footprint
      shape={footprintShape(placement.kind, point, placement.rotation)}
      tone={fits ? "good" : "bad"}
      label={fits ? "✓ Fits" : "✕ Won't fit"}
    />
  );
}

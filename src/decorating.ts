import { findIssue } from "./footprint";
import type { PlacementIssue } from "./footprint";
import type { DecorationKind, Placement, Point } from "./types";

// Each action returns a new placements list, or null when it is not allowed. Nothing is mutated,
// so the caller can keep the previous list for undo. The reason is available from placementIssue().

export function nextPlacementId(placements: Placement[]): number {
  return Math.max(0, ...placements.map((placement) => placement.id)) + 1;
}

export function findPlacement(placements: Placement[], id: number | null): Placement | null {
  if (id === null) {
    return null;
  }
  return placements.find((placement) => placement.id === id) ?? null;
}

/** Why a placement would be refused, or null when it is allowed. */
export function placementIssue(
  placements: Placement[],
  kind: DecorationKind,
  point: Point,
  rotation = 0,
  ignoreId?: number,
): PlacementIssue | null {
  return findIssue(placements, kind, point, rotation, ignoreId);
}

export function addPlacement(
  placements: Placement[],
  kind: DecorationKind,
  point: Point,
  rotation = 0,
): Placement[] | null {
  if (placementIssue(placements, kind, point, rotation)) {
    return null;
  }
  const placement: Placement = { id: nextPlacementId(placements), kind, x: point.x, y: point.y, rotation };
  return [...placements, placement];
}

export function movePlacement(
  placements: Placement[],
  id: number,
  point: Point,
): Placement[] | null {
  const placement = findPlacement(placements, id);
  if (!placement || placementIssue(placements, placement.kind, point, placement.rotation, id)) {
    return null;
  }
  return placements.map((item) => (item.id === id ? { ...item, x: point.x, y: point.y } : item));
}

export function rotatePlacement(placements: Placement[], id: number): Placement[] | null {
  const placement = findPlacement(placements, id);
  if (!placement) {
    return null;
  }
  const rotation = (placement.rotation + 90) % 360;
  if (placementIssue(placements, placement.kind, placement, rotation, id)) {
    return null;
  }
  return placements.map((item) => (item.id === id ? { ...item, rotation } : item));
}

export function removePlacement(placements: Placement[], id: number): Placement[] | null {
  if (!findPlacement(placements, id)) {
    return null;
  }
  return placements.filter((placement) => placement.id !== id);
}

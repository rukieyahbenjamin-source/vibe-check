import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ATMOSPHERES, THEMES, getTheme } from "./themes";
import { IslandScene } from "./components/IslandScene";
import { defaultHouse } from "./houses";
import { appReducer } from "./game";
import { createProgression, settle } from "./progression";
import { freshAppState, TODAY } from "./testing";

// The project does not install Node's type definitions. This test only reads one file, so the import is allowed.
// @ts-ignore
import { readFileSync } from "node:fs";

const css: string = readFileSync(new URL("./App.css", import.meta.url), "utf8");

/** The text of the reduced-motion block, so the tests can check what it switches off. */
function reducedMotionBlock(): string {
  const start = css.indexOf("@media (prefers-reduced-motion: reduce)", css.lastIndexOf("Reduced motion: every"));
  return css.slice(start);
}

describe("palette atmosphere", () => {
  it("gives every palette one of the known atmospheres", () => {
    for (const theme of THEMES) {
      expect(ATMOSPHERES, theme.id).toContain(theme.atmosphere);
    }
  });

  it("gives the palettes distinct moods rather than one shared atmosphere", () => {
    const moods = new Set(THEMES.map((theme) => theme.atmosphere));
    expect(moods.size).toBeGreaterThanOrEqual(5);
  });

  it("matches the moods the brief describes", () => {
    expect(getTheme("spring").atmosphere).toBe("pollen");
    expect(getTheme("celestial-moon").atmosphere).toBe("stars");
    expect(getTheme("sunset").atmosphere).toBe("warm");
    expect(getTheme("fae-forest").atmosphere).toBe("mist");
    expect(getTheme("moonlit").atmosphere).toBe("cool");
  });
});

describe("reduced motion", () => {
  it("switches off every nonessential animation", () => {
    const block = reducedMotionBlock();
    for (const name of ["twinkle", "pollen", "warm-glow", "mist-drift", "shimmer", "sway", "ripple", "bob", "flow", "firefly", "sparkle"]) {
      expect(block, name).toContain(`.${name}`);
    }
  });

  it("leaves static colours and shapes in place", () => {
    expect(reducedMotionBlock()).toMatch(/\.pollen \{\s*opacity: 0\.6;/);
  });
});

describe("decorative layers never take pointer input", () => {
  it("makes scenery and effects ignore pointer events in the stylesheet", () => {
    expect(css).toMatch(/\.scenery,\s*\.fx \{\s*pointer-events: none;/);
    expect(css).toMatch(/\.footprint \{[^}]*pointer-events: none;/);
    expect(css).toMatch(/\.placement-label \{[^}]*pointer-events: none;/);
  });

  it("marks the atmosphere layers as scenery in the island's markup", () => {
    const markup = renderToStaticMarkup(
      createElement(IslandScene, {
        placements: [],
        house: defaultHouse(),
        selected: null,
        selectedPlacementId: null,
        onTapGrass: () => {},
        onSelectPlacement: () => {},
        onMove: () => {},
      }),
    );

    expect(markup).toContain('class="scenery atmosphere"');
    expect(markup).toContain("atmo atmo-stars");
    expect(markup).toContain("fireflies");
  });
});

describe("palette changes keep the rest of the world", () => {
  it("keeps the cottage, progression and decorations when the palette changes", () => {
    const earned = settle({ ...createProgression(TODAY), points: 100 }).progression;
    const start = freshAppState(earned);
    const state = appReducer(start, { type: "set-theme", themeId: "midnight-enchantment" });

    expect(state.world.themeId).toBe("midnight-enchantment");
    expect(state.house).toEqual(start.house);
    expect(state.progression).toBe(earned);
    expect(state.world.placements).toEqual(start.world.placements);
  });
});

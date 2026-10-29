import { DECORATIONS, DECORATION_LIST } from "../catalogue";
import type { ArtShape as ArtShapeName, ArtSpec } from "../catalogue";
import type { DecorationKind } from "../types";

export const DECORATION_NAMES = Object.fromEntries(
  DECORATION_LIST.map((decoration) => [decoration.id, decoration.name]),
) as Record<DecorationKind, string>;

interface DecorationArtProps {
  kind: DecorationKind;
}

/**
 * Original SVG artwork for each decoration. Each piece is drawn around its anchor point (0, 0),
 * and its footprint (see catalogue.ts) describes the part that takes up space. Animated parts use
 * the "fx" class, which ignores pointer input and is switched off for reduced motion.
 */
export function DecorationArt({ kind }: DecorationArtProps) {
  return <ArtShape art={DECORATIONS[kind].art} />;
}

// Plants gently sway. The sway is on the artwork only, so placement, footprints and saves are unchanged.
const SWAYING: ArtShapeName[] = [
  "flower", "tree", "willow", "pine", "mystic-tree", "fern", "reeds", "flowering-bush",
  "daisy", "tulip", "rose", "bluebell", "lily", "foxglove", "cosmos", "glow-flower", "wildflowers",
];

function ArtShape({ art }: { art: ArtSpec }) {
  const body = <ArtBody art={art} />;
  return SWAYING.includes(art.shape) ? <g className="sway">{body}</g> : body;
}

function ArtBody({ art }: { art: ArtSpec }) {
  const primary = art.primary;
  const secondary = art.secondary;

  switch (art.shape) {
    case "flower":
      return (
        <g>
          <path d="M0 0 L0 -14" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="-4" cy="-18" r="4" fill={primary ?? "var(--petal)"} />
          <circle cx="4" cy="-18" r="4" fill={primary ?? "var(--petal)"} />
          <circle cx="0" cy="-22" r="4" fill={primary ?? "var(--petal)"} />
          <circle cx="0" cy="-14" r="3" fill={primary ?? "var(--petal)"} />
          <circle cx="0" cy="-18" r="2.5" fill={secondary ?? "var(--sun)"} />
        </g>
      );
    case "tree":
      return (
        <g>
          <rect x="-3" y="-16" width="6" height="16" rx="2" fill="var(--trunk)" />
          <circle cx="0" cy="-26" r="11" fill={primary ?? "var(--leaf)"} />
          <circle cx="-7" cy="-19" r="8" fill={primary ?? "var(--leaf)"} />
          <circle cx="7" cy="-19" r="8" fill={primary ?? "var(--leaf)"} />
          <circle cx="-3" cy="-28" r="3" fill={secondary ?? "var(--grass-deep)"} opacity="0.5" />
        </g>
      );
    case "mushroom":
      return (
        <g>
          {art.glow && <circle cx="0" cy="-10" r="16" fill="var(--sun)" opacity="0.35" />}
          <path d="M-3 0 L-3 -9 L3 -9 L3 0 Z" fill="var(--wall)" />
          <path d="M-11 -9 Q0 -22 11 -9 Z" fill={primary ?? "var(--accent)"} />
          <circle cx="-4" cy="-13" r="1.8" fill="var(--wall)" />
          <circle cx="4" cy="-15" r="1.4" fill="var(--wall)" />
        </g>
      );
    case "bench":
      return (
        <g>
          <rect x="-16" y="-10" width="32" height="4" rx="2" fill="var(--trunk)" />
          <rect x="-16" y="-18" width="32" height="3" rx="1.5" fill="var(--trunk)" />
          <rect x="-14" y="-16" width="3" height="16" fill="var(--trunk)" />
          <rect x="11" y="-16" width="3" height="16" fill="var(--trunk)" />
        </g>
      );
    case "lantern":
      return (
        <g>
          <circle cx="0" cy="-26" r="10" fill="var(--sun)" opacity="0.3" />
          <rect x="-1.5" y="-14" width="3" height="14" fill="var(--rock-deep)" />
          <rect x="-6" y="-26" width="12" height="12" rx="2" fill={primary ?? "var(--sun)"} stroke="var(--rock-deep)" strokeWidth="1.5" />
          <path d="M-8 -26 L0 -32 L8 -26 Z" fill="var(--rock-deep)" />
          <rect x="-6" y="-2" width="12" height="3" rx="1.5" fill="var(--rock-deep)" />
        </g>
      );
    case "birdbath":
      return (
        <g>
          <rect x="-2.5" y="-20" width="5" height="20" fill="var(--rock)" />
          <rect x="-7" y="-2" width="14" height="3" rx="1.5" fill="var(--rock-deep)" />
          <path d="M-12 -22 Q0 -18 12 -22 Q10 -14 0 -14 Q-10 -14 -12 -22 Z" fill="var(--rock)" />
          <ellipse cx="0" cy="-21" rx="9" ry="2" fill={primary ?? "var(--sky)"} />
        </g>
      );
    case "fountain":
      return (
        <g>
          <ellipse cx="0" cy="-2" rx="18" ry="4" fill="var(--rock)" />
          <ellipse cx="0" cy="-3" rx="14" ry="2.5" fill={primary ?? "var(--sky)"} />
          <rect x="-2" y="-18" width="4" height="14" fill="var(--rock)" />
          <ellipse cx="0" cy="-19" rx="7" ry="2" fill="var(--rock)" />
          <path d="M0 -20 Q-4 -28 -8 -24 M0 -20 Q4 -28 8 -24" stroke={primary ?? "var(--sky)"} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
      );

    case "pond-small":
      return (
        <g>
          <ellipse rx="38" ry="20" fill="var(--rock)" />
          <ellipse rx="33" ry="16" fill="var(--sky)" />
          <ellipse className="fx shimmer" cx="-10" cy="-6" rx="12" ry="4.5" fill="var(--cloud)" opacity="0.45" />
          <g className="fx ripple">
            <ellipse rx="14" ry="7" fill="none" stroke="var(--cloud)" strokeWidth="1" />
          </g>
          <g className="fx ripple ripple-late">
            <ellipse rx="14" ry="7" fill="none" stroke="var(--cloud)" strokeWidth="1" />
          </g>
          <g className="fx bob">
            <ellipse cx="-14" cy="4" rx="5" ry="3" fill="var(--leaf)" />
            <ellipse cx="12" cy="-4" rx="5" ry="3" fill="var(--leaf)" />
            <circle cx="12" cy="-6" r="2" fill="var(--petal)" />
          </g>
          {[[-30, 0], [0, -18], [28, 2], [-6, 16], [22, 14]].map(([x, y], index) => (
            <circle key={index} cx={x} cy={y} r="3.5" fill="var(--rock-deep)" />
          ))}
          <circle className="fx firefly" cx="26" cy="-14" r="1.4" fill="var(--sun)" />
        </g>
      );

    case "pond-natural":
      return (
        <g>
          <path d="M-46 0 C-46 -24 -12 -28 4 -24 C 28 -20 48 -10 46 4 C 44 24 18 28 -4 26 C -28 24 -46 16 -46 0 Z" fill="var(--rock)" />
          <path d="M-41 0 C-41 -20 -12 -23 4 -20 C 24 -16 42 -8 41 4 C 39 20 16 23 -4 21 C -24 19 -41 14 -41 0 Z" fill="var(--sky)" />
          <ellipse className="fx shimmer" cx="-14" cy="-8" rx="13" ry="4" fill="var(--cloud)" opacity="0.4" />
          <g className="fx ripple">
            <ellipse cx="10" cy="4" rx="16" ry="7" fill="none" stroke="var(--cloud)" strokeWidth="1" />
          </g>
          <g className="fx ripple ripple-late">
            <ellipse cx="-10" cy="8" rx="12" ry="5" fill="none" stroke="var(--cloud)" strokeWidth="1" />
          </g>
          {[[-44, -6, 4], [-30, -22, 4.5], [0, -26, 4], [30, -20, 5], [46, 2, 4.5], [40, 20, 4], [12, 26, 4.5], [-18, 24, 4]].map(([x, y, r], index) => (
            <circle key={index} cx={x} cy={y} r={r} fill={index % 2 ? "var(--rock-deep)" : "var(--rock)"} stroke="var(--rock-deep)" strokeWidth="0.6" />
          ))}
          <path d="M-40 -2 q-2 -8 -6 -12 M-36 -2 q0 -9 2 -14" stroke="var(--leaf)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
      );

    case "stream":
      return (
        <g>
          <path d="M-60 -11 Q0 -16 60 -11 L60 11 Q0 16 -60 11 Z" fill="var(--rock)" />
          <path d="M-58 -8 Q0 -12 58 -8 L58 8 Q0 12 -58 8 Z" fill="var(--sky)" />
          <path className="fx flow" d="M-50 -2 Q0 -5 50 -2" fill="none" stroke="var(--cloud)" strokeWidth="1.6" strokeLinecap="round" />
          {[-40, -12, 18, 46].map((x, index) => (
            <circle key={index} cx={x} cy={index % 2 ? 9 : -9} r="2.5" fill="var(--rock-deep)" />
          ))}
        </g>
      );

    case "stream-bend":
      return (
        <g>
          <path d="M-30 -22 C 0 -22 6 0 0 0 S -4 22 30 22" fill="none" stroke="var(--rock)" strokeWidth="18" strokeLinecap="round" />
          <path d="M-30 -22 C 0 -22 6 0 0 0 S -4 22 30 22" fill="none" stroke="var(--sky)" strokeWidth="12" strokeLinecap="round" />
          <path className="fx flow" d="M-26 -22 C 0 -22 6 0 0 0 S -4 20 26 20" fill="none" stroke="var(--cloud)" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );

    case "waterfall":
      return (
        <g>
          <path d="M-16 -52 L-12 -52 L-14 -4 L-18 -2 Z M16 -52 L12 -52 L14 -4 L18 -2 Z" fill="var(--rock-deep)" />
          <rect x="-16" y="-52" width="32" height="50" rx="4" fill="var(--rock)" />
          <rect x="-7" y="-50" width="14" height="46" rx="3" fill="var(--sky)" />
          <path className="fx flow" d="M-3 -48 V-6 M3 -48 V-6" stroke="var(--cloud)" strokeWidth="1.5" strokeDasharray="4 5" />
          <ellipse cx="0" cy="-2" rx="20" ry="6" fill="var(--rock)" />
          <ellipse className="fx ripple" cx="0" cy="-2" rx="12" ry="3" fill="none" stroke="var(--cloud)" strokeWidth="1" />
        </g>
      );

    case "lily-pads":
      return (
        <g className="fx bob">
          <ellipse cx="-3" cy="-2" rx="7" ry="4.5" fill="var(--leaf)" />
          <ellipse cx="5" cy="3" rx="6" ry="4" fill="var(--leaf)" />
          <ellipse cx="0" cy="-7" rx="5" ry="3.5" fill="var(--leaf)" />
          <path d="M-3 -2 L-1 -2" stroke="var(--grass-deep)" strokeWidth="0.8" />
          <circle cx="5" cy="-6" r="2.5" fill="var(--wall)" />
        </g>
      );

    case "reeds":
      return (
        <g>
          <path d="M-4 4 Q-6 -8 -6 -22 M0 4 Q1 -10 1 -26 M4 4 Q6 -6 6 -18" stroke="var(--leaf)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M-4 -4 Q-9 -6 -10 -2 M4 -2 Q9 -4 10 0" stroke="var(--leaf)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <ellipse cx="-6" cy="-14" rx="1.8" ry="4" fill="var(--trunk)" />
          <ellipse cx="1" cy="-18" rx="1.8" ry="4.5" fill="var(--trunk)" />
          <ellipse cx="6" cy="-11" rx="1.8" ry="4" fill="var(--trunk)" />
        </g>
      );

    case "wood-bridge":
      return (
        <g>
          <rect x="-35" y="-5" width="70" height="8" rx="2" fill="var(--trunk)" />
          <path d="M-28 -5 V3 M-14 -5 V3 M0 -5 V3 M14 -5 V3 M28 -5 V3" stroke="var(--rock-deep)" strokeWidth="0.8" opacity="0.6" />
          <path d="M-34 -12 H34" stroke="var(--trunk)" strokeWidth="2" strokeLinecap="round" />
          <rect x="-35" y="-14" width="3" height="10" fill="var(--trunk)" />
          <rect x="32" y="-14" width="3" height="10" fill="var(--trunk)" />
        </g>
      );

    case "stone-bridge":
      return (
        <g>
          <path d="M-35 6 Q0 -14 35 6 L35 10 L-35 10 Z" fill="var(--rock-deep)" />
          <rect x="-35" y="-3" width="70" height="5" rx="2" fill="var(--rock)" />
          <path d="M-22 -3 V2 M-8 -3 V2 M6 -3 V2 M20 -3 V2" stroke="var(--rock-deep)" strokeWidth="0.8" opacity="0.6" />
        </g>
      );

    case "stepping":
      return (
        <g fill="var(--rock)" stroke="var(--rock-deep)" strokeWidth="0.8">
          <ellipse cx="-18" cy="0" rx="7" ry="4.5" />
          <ellipse cx="-6" cy="3" rx="6.5" ry="4" />
          <ellipse cx="6" cy="-1" rx="6.5" ry="4" />
          <ellipse cx="18" cy="2" rx="7" ry="4.5" />
        </g>
      );

    case "clover":
      return (
        <g fill="var(--leaf)">
          <circle cx="-3" cy="0" r="3.2" />
          <circle cx="3" cy="0" r="3.2" />
          <circle cx="0" cy="-3.5" r="3.2" />
          <path d="M0 1 L0 6" stroke="var(--grass-deep)" strokeWidth="1" />
        </g>
      );

    case "rocks":
      return (
        <g stroke="var(--rock-deep)" strokeWidth="0.6">
          <ellipse cx="-4" cy="-2" rx="6" ry="4.5" fill="var(--rock)" />
          <ellipse cx="5" cy="0" rx="4.5" ry="3.5" fill="var(--rock)" />
          <ellipse cx="0" cy="-7" rx="3.5" ry="2.6" fill="var(--rock-deep)" />
        </g>
      );

    case "moss":
      return (
        <g>
          <ellipse cx="-4" cy="0" rx="7" ry="3.5" fill="var(--leaf)" opacity="0.8" />
          <ellipse cx="5" cy="2" rx="5" ry="3" fill="var(--leaf)" opacity="0.7" />
          <ellipse cx="0" cy="-2" rx="4" ry="2.5" fill="var(--leaf)" opacity="0.9" />
          <g fill="var(--grass-deep)">
            <circle cx="-6" cy="-1" r="0.8" />
            <circle cx="3" cy="1" r="0.8" />
            <circle cx="7" cy="-1" r="0.7" />
          </g>
        </g>
      );

    case "meadow":
      return (
        <g>
          <path d="M-26 10 q2 -6 0 -10 M-12 12 q2 -7 -1 -12 M2 11 q2 -6 0 -11 M16 12 q2 -7 -1 -12" stroke="var(--leaf)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {[[-22, -4, "var(--petal)"], [-8, 2, "var(--sun)"], [6, -5, "var(--petal)"], [20, 1, "var(--sun)"], [-14, -8, "var(--sun)"], [12, 7, "var(--petal)"]].map(([x, y, colour], index) => (
            <circle key={index} cx={x as number} cy={y as number} r="2.4" fill={colour as string} />
          ))}
        </g>
      );

    case "pebbles":
      return (
        <g fill="var(--rock)" stroke="var(--rock-deep)" strokeWidth="0.7">
          {[-24, -15, -6, 3, 12, 21].map((x, index) => (
            <ellipse key={x} cx={x} cy={index % 2 ? 1.5 : -1.5} rx="4" ry="2.6" />
          ))}
        </g>
      );
    case "daisy":
      return (
        <g>
          {stalk(14, "var(--leaf)")}
          {petalRing(0, -16, 8, 5, 4, "var(--wall)")}
          <circle cx="0" cy="-16" r="2.4" fill="var(--sun)" />
        </g>
      );
    case "tulip":
      return (
        <g>
          {stalk(12, "var(--leaf)")}
          <path d="M-5 -10 Q-6 -20 0 -22 Q6 -20 5 -10 Q2 -13 0 -12 Q-2 -13 -5 -10 Z" fill={primary ?? "var(--petal)"} />
          <path d="M0 -12 V-17" stroke="var(--rock-deep)" strokeWidth="0.6" opacity="0.5" />
        </g>
      );
    case "rose":
      return (
        <g>
          {stalk(14, "var(--leaf)")}
          {leaf(-4, -6, -30, "var(--leaf)")}
          {leaf(4, -4, 30, "var(--leaf)")}
          <circle cx="0" cy="-17" r="5.5" fill={primary ?? "var(--petal)"} />
          <circle cx="0" cy="-17" r="3.2" fill={secondary ?? "#c75a7e"} />
          <path d="M-3 -17 Q0 -20 3 -17 Q0 -14 -3 -17 Z" fill={primary ?? "var(--petal)"} />
          <circle cx="-4" cy="-19" r="2.5" fill={primary ?? "var(--petal)"} opacity="0.8" />
        </g>
      );
    case "bluebell":
      return (
        <g>
          <path d="M0 0 Q-2 -12 -6 -24" stroke="var(--leaf)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {[[-6, -22], [-3, -18], [-9, -16], [-7, -12]].map(([x, y], index) => (
            <path key={index} d={`M${x} ${y} q-2 2 -1 5 q2 1 1 -5 Z`} fill={primary ?? "#9db8ea"} />
          ))}
          <path d="M1 0 Q4 -10 8 -18" stroke="var(--leaf)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {[[8, -16], [5, -12], [11, -10]].map(([x, y], index) => (
            <path key={index} d={`M${x} ${y} q-2 2 -1 5 q2 1 1 -5 Z`} fill={primary ?? "#9db8ea"} />
          ))}
        </g>
      );
    case "lily":
      return (
        <g>
          {stalk(16, "var(--leaf)")}
          {petalRing(0, -18, 6, 6, 3, primary ?? "#f5ecf7")}
          <circle cx="0" cy="-18" r="2" fill={secondary ?? "#c9a0d8"} />
          <path d="M-1 -20 L0 -23 L1 -20" stroke={secondary ?? "#c9a0d8"} strokeWidth="0.7" fill="none" />
        </g>
      );
    case "foxglove":
      return (
        <g>
          <path d="M0 0 V-26" stroke="var(--leaf)" strokeWidth="1.5" strokeLinecap="round" />
          {[-24, -19, -14, -9].map((y, index) => (
            <ellipse key={y} cx={index % 2 ? 3 : -3} cy={y} rx="3.4" ry="2.6" fill={primary ?? "#c9a2e0"} />
          ))}
          <g fill={secondary ?? "#8a5aa8"} opacity="0.7">
            <circle cx="-3" cy="-24" r="0.7" />
            <circle cx="3" cy="-19" r="0.7" />
            <circle cx="-3" cy="-14" r="0.7" />
          </g>
        </g>
      );
    case "cosmos":
      return (
        <g>
          {stalk(12, "var(--leaf)")}
          {petalRing(0, -14, 7, 8, 3.2, primary ?? "#f49bbf")}
          <circle cx="0" cy="-14" r="2.2" fill={secondary ?? "var(--sun)"} />
        </g>
      );
    case "glow-flower":
      return (
        <g>
          <circle cx="0" cy="-12" r="13" fill="var(--sun)" opacity="0.28" />
          {stalk(12, "var(--leaf)")}
          {petalRing(0, -12, 6, 6, 3.4, primary ?? "#bfeee6")}
          <circle cx="0" cy="-12" r="2.6" fill={secondary ?? "var(--sun)"} />
          <circle className="fx firefly" cx="9" cy="-20" r="1.2" fill="var(--sun)" />
        </g>
      );
    case "wildflowers":
      return (
        <g>
          <path d="M-14 4 q2 -4 0 -7 M-2 4 q1 -5 -1 -9 M10 4 q2 -4 0 -7" stroke="var(--leaf)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <circle cx="-14" cy="-4" r="2.4" fill="var(--petal)" />
          <circle cx="-2" cy="-7" r="2.4" fill="var(--sun)" />
          <circle cx="10" cy="-4" r="2.4" fill="#b9a2e0" />
          <circle cx="4" cy="-1" r="2" fill="var(--wall)" />
          <circle cx="-8" cy="1" r="1.8" fill="var(--sun)" />
        </g>
      );
    case "willow":
      return (
        <g>
          <rect x="-3" y="-14" width="6" height="14" rx="2" fill="var(--trunk)" />
          <ellipse cx="0" cy="-24" rx="15" ry="10" fill={primary ?? "#9fcf9a"} />
          <g stroke={primary ?? "#9fcf9a"} strokeWidth="1.4" strokeLinecap="round" fill="none">
            {[-13, -8, -3, 2, 7, 12].map((x, index) => (
              <path key={index} d={`M${x} -20 Q${x * 1.1} -10 ${x * 1.2} ${-4 + (index % 2) * 2}`} />
            ))}
          </g>
        </g>
      );
    case "pine":
      return (
        <g>
          <rect x="-2" y="-8" width="4" height="8" fill="var(--trunk)" />
          <path d="M0 -30 L-10 -16 H10 Z" fill={primary ?? "#4f8a6e"} />
          <path d="M0 -22 L-12 -8 H12 Z" fill={primary ?? "#4f8a6e"} />
          <path d="M0 -14 L-13 -2 H13 Z" fill={primary ?? "#4f8a6e"} />
        </g>
      );
    case "mystic-tree":
      return (
        <g>
          <circle cx="0" cy="-24" r="16" fill="var(--sun)" opacity="0.18" />
          <rect x="-3" y="-14" width="6" height="14" rx="2" fill="var(--rock-deep)" />
          <path d="M0 -36 L-10 -26 L0 -14 L10 -26 Z" fill={primary ?? "#bfe6ff"} stroke="var(--cloud)" strokeWidth="0.8" />
          <path d="M-8 -20 L0 -24 L8 -20 L0 -14 Z" fill={secondary ?? "#e2d4ff"} opacity="0.9" />
          <circle className="fx firefly" cx="-11" cy="-30" r="1.3" fill="var(--sun)" />
          <circle className="fx firefly" cx="12" cy="-22" r="1.1" fill="var(--sun)" />
        </g>
      );
    case "fern":
      return (
        <g fill="none" stroke={primary ?? "var(--leaf)"} strokeWidth="1.2" strokeLinecap="round">
          <path d="M0 2 Q-8 -4 -12 -2" />
          <path d="M0 2 Q-3 -8 -8 -12" />
          <path d="M0 2 Q2 -10 0 -16" />
          <path d="M0 2 Q6 -8 9 -13" />
          <path d="M0 2 Q9 -2 13 -3" />
          <g fill={primary ?? "var(--leaf)"} stroke="none">
            {[[-6, -1], [-10, -4], [-4, -7], [5, -6], [9, -8], [4, -3], [10, -2], [-1, -12]].map(([x, y], index) => (
              <circle key={index} cx={x} cy={y} r="1.3" />
            ))}
          </g>
        </g>
      );
    case "ivy-patch":
      return (
        <g>
          <path d="M-18 4 Q-10 -2 -4 2 Q2 -4 8 1 Q14 -3 18 3" fill="none" stroke="var(--grass-deep)" strokeWidth="1.4" strokeLinecap="round" />
          <g fill={primary ?? "var(--leaf)"}>
            {[[-14, 0, 3], [-6, -1, 3.4], [2, -2, 3.2], [10, -1, 3.4], [16, 1, 2.6], [-2, 3, 2.8]].map(([x, y, r], index) => (
              <circle key={index} cx={x} cy={y} r={r} />
            ))}
          </g>
        </g>
      );
    case "flowering-bush":
      return (
        <g>
          <g fill={primary ?? "var(--leaf)"}>
            <circle cx="-6" cy="-6" r="6" />
            <circle cx="5" cy="-7" r="6.5" />
            <circle cx="0" cy="-12" r="6" />
            <circle cx="-9" cy="0" r="4.5" />
            <circle cx="9" cy="0" r="4.5" />
          </g>
          <g fill={secondary ?? "#f7b6cc"}>
            {[[-6, -10], [4, -12], [-1, -4], [8, -4], [-11, -4], [2, -17]].map(([x, y], index) => (
              <circle key={index} cx={x} cy={y} r="1.6" />
            ))}
          </g>
        </g>
      );
    case "giant-mushroom":
      return (
        <g>
          <path d="M-4 0 L-4 -12 L4 -12 L4 0 Z" fill="var(--wall)" />
          <path d="M-16 -12 Q0 -32 16 -12 Z" fill={primary ?? "#f4a7c0"} />
          <g fill="var(--wall)">
            <circle cx="-7" cy="-17" r="2" />
            <circle cx="3" cy="-21" r="2.4" />
            <circle cx="8" cy="-15" r="1.6" />
          </g>
        </g>
      );
    case "lucky-clover":
      return (
        <g>
          <path d="M0 2 Q1 6 0 9" stroke="var(--grass-deep)" strokeWidth="1" fill="none" />
          <g fill={primary ?? "var(--leaf)"}>
            <circle cx="-3" cy="-3" r="3.2" />
            <circle cx="3" cy="-3" r="3.2" />
            <circle cx="-3" cy="3" r="3.2" />
            <circle cx="3" cy="3" r="3.2" />
          </g>
          <path d="M0 -6 V6 M-6 0 H6" stroke="var(--grass-deep)" strokeWidth="0.5" opacity="0.6" />
          <circle className="fx ripple" cx="0" cy="0" r="6" fill="none" stroke="var(--sun)" strokeWidth="0.8" />
        </g>
      );
    case "stone-bench":
      return (
        <g>
          <rect x="-16" y="-9" width="32" height="5" rx="2" fill="var(--rock)" stroke="var(--rock-deep)" strokeWidth="0.6" />
          <rect x="-14" y="-4" width="4" height="6" fill="var(--rock-deep)" />
          <rect x="10" y="-4" width="4" height="6" fill="var(--rock-deep)" />
          <path d="M-12 -9 H12" stroke="var(--rock-deep)" strokeWidth="0.5" opacity="0.5" />
        </g>
      );
    case "garden-arch":
      return (
        <g>
          <path d="M-18 0 V-16 Q0 -32 18 -16 V0" fill="none" stroke={primary ?? "var(--wall)"} strokeWidth="3" strokeLinecap="round" />
          <path d="M-18 0 V-16 Q0 -32 18 -16 V0" fill="none" stroke="var(--leaf)" strokeWidth="1" strokeDasharray="2 3" />
          <g fill={secondary ?? "var(--petal)"}>
            {[[-16, -10], [-10, -22], [0, -28], [10, -22], [16, -10]].map(([x, y], index) => (
              <circle key={index} cx={x} cy={y} r="2.2" />
            ))}
          </g>
        </g>
      );
    case "birdhouse":
      return (
        <g>
          <rect x="-1.2" y="-8" width="2.4" height="8" fill="var(--trunk)" />
          <path d="M-7 -12 L0 -18 L7 -12 Z" fill="var(--roof)" />
          <rect x="-6" y="-12" width="12" height="9" rx="1.5" fill={primary ?? "var(--wall)"} stroke="var(--trunk)" strokeWidth="0.6" />
          <circle cx="0" cy="-8" r="1.6" fill="var(--trunk)" />
        </g>
      );
    case "wind-chimes":
      return (
        <g>
          <path d="M-8 -18 H8" stroke="var(--trunk)" strokeWidth="1.2" strokeLinecap="round" />
          <g className="fx bob" stroke="var(--rock-deep)" strokeWidth="0.5">
            {[-6, -2, 2, 6].map((x, index) => (
              <g key={x}>
                <path d={`M${x} -18 V${-14 + index % 2 * 2}`} />
                <rect x={x - 1.3} y={-14 + index % 2 * 2} width="2.6" height={8 + (index % 3) * 2} rx="1" fill={index % 2 ? "var(--sun)" : "var(--petal)"} />
              </g>
            ))}
          </g>
        </g>
      );
    case "trellis":
      return (
        <g>
          <rect x="-14" y="-10" width="28" height="10" fill="none" stroke="var(--trunk)" strokeWidth="1.5" />
          <path d="M-14 -10 L-4 0 M-4 -10 L6 0 M6 -10 L14 0 M-14 0 L-4 -10 M-4 0 L6 -10 M6 0 L14 -10" stroke="var(--trunk)" strokeWidth="0.7" opacity="0.7" />
          <g fill="var(--petal)">
            <circle cx="-8" cy="-6" r="2" />
            <circle cx="5" cy="-4" r="2.2" />
          </g>
          <path d="M-14 -4 Q-6 -2 2 -4" stroke="var(--leaf)" strokeWidth="1.2" fill="none" />
        </g>
      );
    case "sign":
      return (
        <g>
          <rect x="-1.2" y="-6" width="2.4" height="6" fill="var(--trunk)" />
          <rect x="-6" y="-14" width="12" height="9" rx="2" fill={primary ?? "var(--wall)"} stroke="var(--trunk)" strokeWidth="1" />
          <path d="M-3.5 -11 H3.5 M-3.5 -8.5 H2" stroke="var(--trunk)" strokeWidth="0.7" opacity="0.7" />
        </g>
      );
  }
}

/** A short stem from the base up to the given height. Shared by several flowers. */
function stalk(height: number, colour: string) {
  return <path d={`M0 0 L0 ${-height}`} stroke={colour} strokeWidth="1.6" strokeLinecap="round" />;
}

/** A ring of petals around a centre point. Shared by daisies, lilies, cosmos and roses. */
function petalRing(cx: number, cy: number, distance: number, count: number, radius: number, colour: string) {
  return (
    <g fill={colour}>
      {Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2;
        return <circle key={index} cx={cx + Math.cos(angle) * distance} cy={cy + Math.sin(angle) * distance} r={radius} />;
      })}
    </g>
  );
}

/** A single leaf on a stalk, angled away from the centre line. */
function leaf(x: number, y: number, angle: number, colour: string) {
  return <ellipse cx={x} cy={y} rx="4" ry="2" fill={colour} transform={`rotate(${angle} ${x} ${y})`} />;
}

interface DecorationIconProps {
  kind: DecorationKind;
}

/** A small framed icon used in the Decorate panel. */
export function DecorationIcon({ kind }: DecorationIconProps) {
  return (
    <svg viewBox="-22 -36 44 40" className="decoration-icon" aria-hidden="true">
      <DecorationArt kind={kind} />
    </svg>
  );
}

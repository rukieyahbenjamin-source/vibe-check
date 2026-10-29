import { effectiveColours, getSwatch } from "../houses";
import type { HouseState, RoofStyle, RoofDetail, WallFinish, WindowStyle, DoorStyle, DoorDetail, RoofOrnament } from "../houses";

// The cottage is drawn from small part renderers. Each one draws over the same original geometry,
// so the default cottage keeps its look and any mix of parts stays in proportion.

const ROOF = "M278 200 L336 146 L394 200 Z";
const WALL = { x: 290, y: 196, width: 92, height: 56 };
const WINDOW_X = [302, 358];
const WINDOW_Y = 212;
const DOOR = { x: 322, y: 220, width: 26, height: 32 };

interface CottageArtProps {
  house: HouseState;
}

/** The whole cottage, drawn back to front so each layer sits on the one behind it. */
export function CottageArt({ house }: CottageArtProps) {
  const colours = effectiveColours(house);
  const frame = getSwatch(house.windows.frame)?.value ?? "var(--wall)";
  const glow = getSwatch(house.windows.glow)?.value ?? "var(--sky)";
  const shutters = getSwatch(house.windows.shutterColor)?.value ?? "var(--leaf)";
  const hardware = getSwatch(house.door.hardware)?.value ?? "var(--sun)";
  const roofBase = getSwatch(house.roof.color)?.value;

  return (
    <g className="cottage">
      <defs>
        <radialGradient id="cottage-glow">
          <stop offset="0%" stopColor="var(--sun)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--sun)" stopOpacity="0" />
        </radialGradient>
        <clipPath id="cottage-roof-clip">
          <path d={ROOF} />
        </clipPath>
      </defs>

      <ellipse cx="336" cy="252" rx="66" ry="8" fill="var(--grass-deep)" opacity="0.6" />
      {house.extras.steps && <Steps />}
      <Chimney style={house.extras.chimney} />
      {house.extras.balcony && <Balcony trim={colours.trim} />}
      <Walls finish={house.walls.finish} colour={colours.wall} trim={colours.trim} corners={house.trim.corners} beams={house.trim.beams} />
      {house.extras.ivy && <Ivy />}
      {WINDOW_X.map((x) => (
        <Window key={x} x={x} style={house.windows.style} frame={frame} glow={house.windows.glow ? glow : null} trim={colours.trim} shutters={house.windows.shutters} shutterColour={shutters} flowerBoxes={house.windows.flowerBoxes} />
      ))}
      <Door style={house.door.style} detail={house.door.detail} colour={colours.door} hardware={hardware} />
      {house.extras.lanterns && <Lanterns />}
      {house.roof.detail === "glow" && <ellipse cx="336" cy="172" rx="78" ry="46" fill="url(#cottage-glow)" />}
      <Roof style={house.roof.style} detail={house.roof.detail} colour={colours.roof} base={roofBase} />
      <RoofOrnament kind={house.extras.roofOrnament} trim={colours.trim} />
    </g>
  );
}

function Steps() {
  return (
    <g>
      <rect x="316" y="252" width="38" height="4" rx="1" fill="var(--rock)" />
      <rect x="312" y="256" width="46" height="4" rx="1" fill="var(--rock-deep)" />
    </g>
  );
}

function Chimney({ style }: { style: HouseState["extras"]["chimney"] }) {
  if (style === "none") {
    return null;
  }
  if (style === "brick") {
    return (
      <g>
        <rect x="350" y="150" width="14" height="32" rx="2" fill="#c97c6a" />
        <path d="M350 158 H364 M350 166 H364 M350 174 H364" stroke="#a9604f" strokeWidth="1" opacity="0.6" />
      </g>
    );
  }
  return <rect x="350" y="150" width="14" height="32" rx="2" fill="var(--rock)" />;
}

function Balcony({ trim }: { trim: string }) {
  return (
    <g stroke={trim} strokeWidth="2" strokeLinecap="round">
      <rect x="296" y="246" width="80" height="3" rx="1" fill={trim} stroke="none" />
      <path d="M296 240 H376" fill="none" />
      <path d="M298 240 V246 M316 240 V246 M356 240 V246 M374 240 V246" fill="none" />
    </g>
  );
}

interface WallsProps {
  finish: WallFinish;
  colour: string;
  trim: string;
  corners: boolean;
  beams: boolean;
}

function Walls({ finish, colour, trim, corners, beams }: WallsProps) {
  return (
    <g>
      <rect x={WALL.x} y={WALL.y} width={WALL.width} height={WALL.height} rx="4" fill={colour} />
      {finish === "plaster" && <Plaster />}
      {finish === "timber" && <Timber />}
      {finish === "stone" && <Stone />}
      {beams && <rect x={WALL.x - 4} y={WALL.y} width={WALL.width + 8} height="4" rx="1" fill={trim} />}
      {corners && (
        <g fill={trim}>
          <rect x={WALL.x} y={WALL.y} width="5" height={WALL.height} />
          <rect x={WALL.x + WALL.width - 5} y={WALL.y} width="5" height={WALL.height} />
        </g>
      )}
    </g>
  );
}

function Plaster() {
  const specks: [number, number][] = [[300, 204], [324, 232], [344, 206], [370, 228], [312, 246], [364, 246], [336, 218]];
  return (
    <g fill="var(--rock)" opacity="0.22">
      {specks.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />
      ))}
    </g>
  );
}

function Timber() {
  return (
    <g>
      <rect x={WALL.x} y="212" width={WALL.width} height="3" fill="var(--rock-deep)" opacity="0.45" />
      <rect x={WALL.x} y="238" width={WALL.width} height="3" fill="var(--rock-deep)" opacity="0.45" />
      {[306, 322, 338, 354, 370].map((x) => (
        <rect key={x} x={x} y={WALL.y} width="2" height={WALL.height} fill="var(--rock-deep)" opacity="0.3" />
      ))}
    </g>
  );
}

function Stone() {
  const rows = [204, 218, 232, 246];
  return (
    <g stroke="var(--rock-deep)" strokeWidth="1" opacity="0.4" fill="none">
      {rows.map((y) => (
        <path key={y} d={`M${WALL.x} ${y} H${WALL.x + WALL.width}`} />
      ))}
      {rows.map((y, row) =>
        [0, 1, 2, 3].map((col) => (
          <path key={`${y}-${col}`} d={`M${WALL.x + 14 + col * 24 + (row % 2) * 12} ${y} V${y + 14}`} />
        )),
      )}
    </g>
  );
}

function Ivy() {
  const leaves: [number, number, number][] = [
    [292, 202, 5], [288, 214, 4], [293, 226, 5], [290, 240, 4], [296, 248, 3],
    [380, 204, 4], [384, 218, 5], [380, 232, 4], [383, 246, 4],
  ];
  return (
    <g fill="var(--leaf)">
      {leaves.map(([x, y, r], index) => (
        <circle key={index} cx={x} cy={y} r={r} opacity="0.9" />
      ))}
    </g>
  );
}

interface WindowProps {
  x: number;
  style: WindowStyle;
  frame: string;
  glow: string | null;
  trim: string;
  shutters: boolean;
  shutterColour: string;
  flowerBoxes: boolean;
}

function Window({ x, style, frame, glow, trim, shutters, shutterColour, flowerBoxes }: WindowProps) {
  const y = WINDOW_Y;
  const pane = glow ?? "var(--sky)";
  return (
    <g>
      {glow && <rect x={x - 2} y={y - 2} width="20" height="18" rx="5" fill={glow} opacity="0.35" />}
      {shutters && (
        <g fill={shutterColour}>
          <rect x={x - 5} y={y} width="4" height="14" rx="1" />
          <rect x={x + 17} y={y} width="4" height="14" rx="1" />
        </g>
      )}
      <WindowShape style={style} x={x} y={y} pane={pane} frame={frame} />
      <ellipse className="fx warm-glow-pane" cx={x + 8} cy={y + 7} rx="6" ry="5" fill="var(--sun)" opacity="0.4" />
      {flowerBoxes && (
        <g>
          <rect x={x - 1} y={y + 15} width="18" height="3" rx="1" fill={trim} />
          <g fill="var(--petal)">
            <circle cx={x + 2} cy={y + 14} r="2.2" />
            <circle cx={x + 8} cy={y + 13} r="2.2" />
            <circle cx={x + 14} cy={y + 14} r="2.2" />
          </g>
        </g>
      )}
    </g>
  );
}

function WindowShape({ style, x, y, pane, frame }: { style: WindowStyle; x: number; y: number; pane: string; frame: string }) {
  const stroke = { stroke: frame, strokeWidth: 1.5 };
  switch (style) {
    case "round":
      return (
        <g>
          <circle cx={x + 8} cy={y + 7} r="8" fill={pane} {...stroke} />
          <path d={`M${x + 8} ${y - 1} V${y + 15} M${x} ${y + 7} H${x + 16}`} stroke={frame} strokeWidth="1" />
        </g>
      );
    case "arched":
      return (
        <path
          d={`M${x} ${y + 14} V${y + 6} Q${x + 8} ${y - 4} ${x + 16} ${y + 6} V${y + 14} Z`}
          fill={pane}
          {...stroke}
        />
      );
    case "multipane":
      return (
        <g>
          <rect x={x} y={y} width="16" height="14" rx="2" fill={pane} {...stroke} />
          <path d={`M${x + 5.3} ${y} V${y + 14} M${x + 10.7} ${y} V${y + 14} M${x} ${y + 7} H${x + 16}`} stroke={frame} strokeWidth="1" />
        </g>
      );
    case "ornate":
      return (
        <g>
          <rect x={x} y={y} width="16" height="14" rx="6" fill={pane} {...stroke} />
          <circle cx={x + 8} cy={y + 7} r="2.4" fill="var(--sun)" />
          <path d={`M${x + 2} ${y + 3} Q${x + 8} ${y - 1} ${x + 14} ${y + 3}`} fill="none" stroke={frame} strokeWidth="1" />
        </g>
      );
    case "square":
      return (
        <g>
          <rect x={x} y={y} width="16" height="14" rx="2" fill={pane} {...stroke} />
          <path d={`M${x + 8} ${y} V${y + 14} M${x} ${y + 7} H${x + 16}`} stroke={frame} strokeWidth="1" />
        </g>
      );
  }
}

function Door({ style, detail, colour, hardware }: { style: DoorStyle; detail: DoorDetail; colour: string; hardware: string }) {
  const { x, y, width, height } = DOOR;
  const knob = (cx: number) => <circle cx={cx} cy="237" r="2" fill={hardware} />;
  return (
    <g>
      {detail === "glow" && <rect x={x - 4} y={y - 4} width={width + 8} height={height + 6} rx="14" fill="var(--sun)" opacity="0.3" />}
      {style === "classic" && <rect x={x} y={y} width={width} height={height} rx="13" fill={colour} />}
      {style === "rounded" && <rect x={x} y={y} width={width} height={height} rx="6" fill={colour} />}
      {style === "arched" && <path d={`M${x} 252 V226 Q335 212 ${x + width} 226 V252 Z`} fill={colour} />}
      {style === "double" && (
        <g fill={colour}>
          <rect x={x} y={y} width="12" height={height} rx="3" />
          <rect x={x + 14} y={y} width="12" height={height} rx="3" />
        </g>
      )}
      {style === "rustic" && (
        <g>
          <rect x={x} y={y} width={width} height={height} rx="2" fill={colour} />
          <path d={`M${x + 7} ${y} V252 M${x + 13} ${y} V252 M${x + 19} ${y} V252 M${x} ${y + 16} L${x + 26} ${y + 26}`} stroke="var(--rock-deep)" strokeWidth="1" opacity="0.5" />
        </g>
      )}
      {style === "ornate" && (
        <g>
          <path d={`M${x} 252 V226 Q335 212 ${x + width} 226 V252 Z`} fill={colour} stroke="var(--sun)" strokeWidth="1.5" />
          <circle cx="335" cy="232" r="3" fill="none" stroke="var(--sun)" strokeWidth="1" />
        </g>
      )}
      {style === "double" ? (
        <g>
          {knob(333)}
          {knob(339)}
        </g>
      ) : (
        knob(342)
      )}
      {detail === "vines" && (
        <path d={`M${x - 1} 252 Q${x - 4} 240 ${x} 230 Q${x - 3} 222 ${x + 2} 218`} fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" />
      )}
    </g>
  );
}

function Lanterns() {
  return (
    <g>
      {[316, 368].map((x) => (
        <g key={x}>
          <circle cx={x} cy="247" r="6" fill="var(--sun)" opacity="0.3" />
          <rect x={x - 2.5} y="244" width="5" height="7" rx="1" fill="var(--sun)" stroke="var(--rock-deep)" strokeWidth="0.8" />
        </g>
      ))}
    </g>
  );
}

interface RoofProps {
  style: RoofStyle;
  detail: RoofDetail;
  colour: string;
  base: string | undefined;
}

function Roof({ style, detail, colour, base }: RoofProps) {
  const fill = base ?? (style === "thatch" ? "#e2c58e" : style === "celestial" ? "#5b6496" : colour);
  return (
    <g>
      <path d={ROOF} fill={fill} />
      <g clipPath="url(#cottage-roof-clip)">
        <RoofPattern style={style} />
        {detail === "stars" && <Stars />}
        {detail === "vines" && <RoofVines />}
      </g>
      {detail === "glow" && <path d={ROOF} fill="none" stroke="var(--sun)" strokeWidth="1.5" opacity="0.7" />}
    </g>
  );
}

function RoofPattern({ style }: { style: RoofStyle }) {
  switch (style) {
    case "shingles":
      return (
        <g stroke="var(--rock-deep)" strokeWidth="1" opacity="0.35">
          {[162, 174, 186].map((y) => (
            <path key={y} d={`M270 ${y} H402`} />
          ))}
          {[162, 174, 186].map((y, row) =>
            [0, 1, 2, 3, 4, 5].map((col) => (
              <path key={`${y}-${col}`} d={`M${292 + col * 14 + (row % 2) * 7} ${y} V${y + 12}`} />
            )),
          )}
        </g>
      );
    case "tiles":
      return (
        <g fill="none" stroke="var(--rock-deep)" strokeWidth="1" opacity="0.4">
          {[166, 180, 194].map((y, row) =>
            [0, 1, 2, 3, 4, 5, 6].map((col) => (
              <path key={`${y}-${col}`} d={`M${282 + col * 14 + (row % 2) * 7} ${y} a7 6 0 0 0 14 0`} />
            )),
          )}
        </g>
      );
    case "fishscale":
      return (
        <g fill="none" stroke="var(--rock-deep)" strokeWidth="1" opacity="0.4">
          {[164, 178, 192].map((y, row) =>
            [0, 1, 2, 3, 4, 5, 6].map((col) => (
              <circle key={`${y}-${col}`} cx={284 + col * 14 + (row % 2) * 7} cy={y} r="6.5" />
            )),
          )}
        </g>
      );
    case "thatch":
      return (
        <g fill="none" stroke="#b8924f" strokeWidth="1.2" opacity="0.7" strokeLinecap="round">
          {[164, 176, 188].map((y) => (
            <path key={y} d={`M268 ${y} q9 -4 18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0`} />
          ))}
        </g>
      );
    case "moss":
      return (
        <g fill="var(--leaf)" opacity="0.85">
          {[[300, 198, 9], [322, 190, 8], [352, 188, 9], [374, 196, 8], [336, 204, 6]].map(([x, y, r], index) => (
            <circle key={index} cx={x} cy={y} r={r} />
          ))}
        </g>
      );
    case "celestial":
      return (
        <g fill="var(--sun)" opacity="0.8">
          {[[318, 176], [350, 168], [366, 188], [304, 192], [336, 186]].map(([x, y], index) => (
            <circle key={index} cx={x} cy={y} r="1.6" />
          ))}
        </g>
      );
  }
}

function Stars() {
  return (
    <g fill="var(--sun)">
      {[[312, 170], [344, 158], [360, 180], [290, 186]].map(([x, y], index) => (
        <path key={index} d={`M${x} ${y - 2.5} L${x + 0.8} ${y - 0.8} L${x + 2.5} ${y} L${x + 0.8} ${y + 0.8} L${x} ${y + 2.5} L${x - 0.8} ${y + 0.8} L${x - 2.5} ${y} L${x - 0.8} ${y - 0.8} Z`} />
      ))}
    </g>
  );
}

function RoofVines() {
  return (
    <g>
      <path d="M270 198 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" />
      {[[286, 197], [318, 197], [350, 197], [382, 197]].map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r="2.5" fill="var(--leaf)" />
      ))}
    </g>
  );
}

function RoofOrnament({ kind, trim }: { kind: RoofOrnament; trim: string }) {
  switch (kind) {
    case "none":
      return null;
    case "weathervane":
      return (
        <g stroke={trim} strokeWidth="1.5" fill={trim} strokeLinecap="round">
          <path d="M336 146 V130" fill="none" />
          <path d="M326 133 H346" fill="none" />
          <path d="M346 133 L342 130 M346 133 L342 136" fill="none" />
          <circle cx="336" cy="128" r="1.8" stroke="none" />
        </g>
      );
    case "crystal":
      return (
        <g>
          <path d="M336 124 L342 133 L336 142 L330 133 Z" fill="var(--sky)" stroke={trim} strokeWidth="1" />
          <circle cx="336" cy="133" r="7" fill="var(--sky)" opacity="0.25" />
        </g>
      );
  }
}

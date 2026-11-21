import type { Cell, Figure, PartsTemplate, PriSpec } from "./types";
import type { ShapeId } from "./vocab";

const INK = "#1e293b";
const PAPER = "#ffffff";
const CELL_BORDER = "#cbd5e1";
const GUIDE = "#d5dce6";

const CELL = 120;
const HALF = CELL / 2;
const GAP = 10;
const MARGIN = 14;

function n(x: number): string {
  return String(Math.round(x * 100) / 100);
}

function polygon(points: Array<[number, number]>): string {
  return `M ${points.map(([x, y]) => `${n(x)} ${n(y)}`).join(" L ")} Z`;
}

function regular(sides: number, radius: number, startDeg: number): Array<[number, number]> {
  return Array.from({ length: sides }, (_, i) => {
    const a = ((startDeg + (360 / sides) * i) * Math.PI) / 180;
    return [radius * Math.cos(a), radius * Math.sin(a)] as [number, number];
  });
}

function starPoints(): Array<[number, number]> {
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 1.05 : 0.45;
    const a = ((-90 + 36 * i) * Math.PI) / 180;
    return [r * Math.cos(a), r * Math.sin(a)] as [number, number];
  });
}

/** Shape outlines in a unit box (centre 0,0; reach about ±1; y points down). */
const SHAPE_PATH: Record<ShapeId, string> = {
  circle: "M -1 0 A 1 1 0 1 0 1 0 A 1 1 0 1 0 -1 0 Z",
  square: polygon([[-0.86, -0.86], [0.86, -0.86], [0.86, 0.86], [-0.86, 0.86]]),
  triangle: polygon([[0, -0.95], [0.98, 0.75], [-0.98, 0.75]]),
  diamond: polygon([[0, -1.05], [0.7, 0], [0, 1.05], [-0.7, 0]]),
  pentagon: polygon(regular(5, 1, -90)),
  hexagon: polygon(regular(6, 1, 0)),
  star: polygon(starPoints()),
  cross: polygon([
    [-0.32, -0.95], [0.32, -0.95], [0.32, -0.32], [0.95, -0.32], [0.95, 0.32], [0.32, 0.32],
    [0.32, 0.95], [-0.32, 0.95], [-0.32, 0.32], [-0.95, 0.32], [-0.95, -0.32], [-0.32, -0.32],
  ]),
  heart:
    "M 0 0.95 C -0.35 0.6 -1.05 0.15 -1.05 -0.35 C -1.05 -0.75 -0.75 -0.95 -0.5 -0.95 " +
    "C -0.25 -0.95 -0.08 -0.8 0 -0.6 C 0.08 -0.8 0.25 -0.95 0.5 -0.95 " +
    "C 0.75 -0.95 1.05 -0.75 1.05 -0.35 C 1.05 0.15 0.35 0.6 0 0.95 Z",
  moon: "M 0.53 -0.85 A 1 1 0 1 0 0.53 0.85 A 0.85 0.85 0 1 1 0.53 -0.85 Z",
  drop: "M 0 -1 C 0.25 -0.45 0.78 -0.05 0.78 0.3 A 0.78 0.7 0 0 1 -0.78 0.3 C -0.78 -0.05 -0.25 -0.45 0 -1 Z",
  house: polygon([[0, -1], [1, -0.1], [0.72, -0.1], [0.72, 0.92], [-0.72, 0.92], [-0.72, -0.1], [-1, -0.1]]),
  tree: polygon([[0, -1], [0.82, 0.38], [0.2, 0.38], [0.2, 0.96], [-0.2, 0.96], [-0.2, 0.38], [-0.82, 0.38]]),
  fish:
    "M -1 0 C -0.6 -0.62 0.15 -0.62 0.48 -0.12 L 1 -0.58 L 1 0.58 L 0.48 0.12 " +
    "C 0.15 0.62 -0.6 0.62 -1 0 Z",
  arrow: polygon([[0, -1], [0.78, -0.08], [0.3, -0.08], [0.3, 1], [-0.3, 1], [-0.3, -0.08], [-0.78, -0.08]]),
};

/** Per-document counter for clip-path ids. */
type Doc = { ids: number };

function shapeSvg(
  doc: Doc,
  shape: ShapeId,
  fill: string,
  cx: number,
  cy: number,
  r: number,
  rot: number,
): string {
  const d = SHAPE_PATH[shape];
  const transform = `translate(${n(cx)} ${n(cy)})${rot ? ` rotate(${rot})` : ""} scale(${n(r)})`;
  const strokeWidth = r >= 20 ? 3.5 : r >= 12 ? 3 : 2.5;
  const stroke = `stroke="${INK}" stroke-width="${(strokeWidth / r).toFixed(4)}" stroke-linejoin="round"`;
  if (fill === "solid") {
    return `<path d="${d}" transform="${transform}" fill="${INK}" ${stroke}/>`;
  }
  if (fill === "hollow") {
    return `<path d="${d}" transform="${transform}" fill="${PAPER}" ${stroke}/>`;
  }
  // striped: diagonal hatching clipped to the outline
  const id = `clip${(doc.ids += 1)}`;
  const spacing = r >= 20 ? 8 : r >= 12 ? 6 : 5;
  const reach = r * 1.2;
  let hatch = "";
  for (let o = -2 * reach; o <= 2 * reach; o += spacing) {
    hatch += `M ${n(cx - reach + o)} ${n(cy + reach)} L ${n(cx + reach + o)} ${n(cy - reach)} `;
  }
  return (
    `<clipPath id="${id}"><path d="${d}" transform="${transform}"/></clipPath>` +
    `<path d="${d}" transform="${transform}" fill="${PAPER}"/>` +
    `<path d="${hatch.trim()}" clip-path="url(#${id})" fill="none" stroke="${INK}" stroke-width="${r >= 20 ? 2.6 : 2}"/>` +
    `<path d="${d}" transform="${transform}" fill="none" ${stroke}/>`
  );
}

/** Where `count` shapes sit, as fractions of the content half-width. */
const COUNT_LAYOUT: Record<number, Array<[number, number]>> = {
  1: [[0, 0]],
  2: [[-0.5, 0], [0.5, 0]],
  3: [[0, -0.5], [-0.52, 0.42], [0.52, 0.42]],
  4: [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]],
  5: [[-0.62, -0.62], [0.62, -0.62], [0, 0], [-0.62, 0.62], [0.62, 0.62]],
  6: [[-0.66, -0.4], [0, -0.4], [0.66, -0.4], [-0.66, 0.4], [0, 0.4], [0.66, 0.4]],
};

const SIZE_RADIUS: Record<number, number> = { 1: 0.31, 2: 0.56, 3: 0.83 };

const POS_OFFSET = {
  corner4: [[-27, -27], [27, -27], [27, 27], [-27, 27]],
  ring8: [[-34, -34], [0, -34], [34, -34], [34, 0], [34, 34], [0, 34], [-34, 34], [-34, 0]],
} as const;

function frameSvg(frame: string, cx: number, cy: number): string {
  const common = `fill="${PAPER}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"`;
  if (frame === "circle") return `<circle cx="${n(cx)}" cy="${n(cy)}" r="51" ${common}/>`;
  if (frame === "square") {
    return `<rect x="${n(cx - 48)}" y="${n(cy - 48)}" width="96" height="96" ${common}/>`;
  }
  const pts = frame === "hexagon" ? regular(6, 55, 0) : regular(4, 56, -90);
  return `<path d="${polygon(pts.map(([x, y]) => [cx + x, cy + y]))}" ${common}/>`;
}

type Prim =
  | { kind: "line"; pts: Array<[number, number]>; closed?: boolean }
  | { kind: "circle"; c: [number, number]; r: number; filled?: boolean }
  | { kind: "curve"; from: [number, number]; ctrl: [number, number]; to: [number, number] };

const line = (...pts: Array<[number, number]>): Prim => ({ kind: "line", pts });
const SPOKE = 44;
const DIAG = SPOKE * Math.SQRT1_2;

/** Drawing instructions for each part, in cell units around the centre. */
const PART_PRIMS: Record<PartsTemplate, Record<string, Prim[]>> = {
  box: {
    t: [line([-40, -40], [40, -40])],
    r: [line([40, -40], [40, 40])],
    b: [line([-40, 40], [40, 40])],
    l: [line([-40, -40], [-40, 40])],
    d1: [line([-40, -40], [40, 40])],
    d2: [line([40, -40], [-40, 40])],
    h: [line([-40, 0], [40, 0])],
    v: [line([0, -40], [0, 40])],
  },
  spokes: {
    n: [line([0, 0], [0, -SPOKE])],
    ne: [line([0, 0], [DIAG, -DIAG])],
    e: [line([0, 0], [SPOKE, 0])],
    se: [line([0, 0], [DIAG, DIAG])],
    s: [line([0, 0], [0, SPOKE])],
    sw: [line([0, 0], [-DIAG, DIAG])],
    w: [line([0, 0], [-SPOKE, 0])],
    nw: [line([0, 0], [-DIAG, -DIAG])],
  },
  house: {
    walls: [{ kind: "line", pts: [[-30, 2], [-30, 44], [30, 44], [30, 2]], closed: true }],
    roof: [{ kind: "line", pts: [[-40, 2], [0, -36], [40, 2]], closed: true }],
    door: [line([-20, 44], [-20, 18], [-4, 18], [-4, 44])],
    window: [{ kind: "line", pts: [[8, 12], [22, 12], [22, 26], [8, 26]], closed: true }],
    chimney: [line([16, -20.8], [16, -40], [27, -40], [27, -10.4])],
  },
  face: {
    head: [{ kind: "circle", c: [0, 10], r: 33 }],
    eyes: [
      { kind: "circle", c: [-12, 2], r: 4.5, filled: true },
      { kind: "circle", c: [12, 2], r: 4.5, filled: true },
    ],
    mouth: [{ kind: "curve", from: [-13, 21], ctrl: [0, 33], to: [13, 21] }],
    hat: [{ kind: "line", pts: [[-24, -23], [0, -52], [24, -23]], closed: true }],
    ears: [
      { kind: "circle", c: [-39, 10], r: 6 },
      { kind: "circle", c: [39, 10], r: 6 },
    ],
  },
};

function partsSvg(
  template: PartsTemplate,
  parts: readonly string[],
  cx: number,
  cy: number,
  scale: number,
): string {
  const width = scale < 1 ? 4.5 : 5;
  const stroke = `fill="none" stroke="${INK}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;
  const at = ([x, y]: [number, number]) => `${n(cx + x * scale)} ${n(cy + y * scale)}`;
  let out = "";
  // The hub keeps a lone spoke readable as "a line from the centre".
  if (template === "spokes") out += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(5 * scale)}" fill="${INK}"/>`;
  for (const id of Object.keys(PART_PRIMS[template])) {
    if (!parts.includes(id)) continue;
    for (const p of PART_PRIMS[template][id]) {
      if (p.kind === "line") {
        out += `<path d="M ${p.pts.map(at).join(" L ")}${p.closed ? " Z" : ""}" ${stroke}/>`;
      } else if (p.kind === "circle") {
        const [x, y] = [cx + p.c[0] * scale, cy + p.c[1] * scale];
        out += p.filled
          ? `<circle cx="${n(x)}" cy="${n(y)}" r="${n(p.r * scale)}" fill="${INK}"/>`
          : `<circle cx="${n(x)}" cy="${n(y)}" r="${n(p.r * scale)}" ${stroke}/>`;
      } else {
        out += `<path d="M ${at(p.from)} Q ${at(p.ctrl)} ${at(p.to)}" ${stroke}/>`;
      }
    }
  }
  return out;
}

function gridSvg(on: readonly string[], cx: number, cy: number): string {
  const size = 30;
  const x0 = cx - 1.5 * size;
  const y0 = cy - 1.5 * size;
  let out = `<rect x="${n(x0)}" y="${n(y0)}" width="${3 * size}" height="${3 * size}" fill="${PAPER}"/>`;
  for (let i = 0; i < 9; i += 1) {
    if (!on.includes(String(i))) continue;
    out += `<rect x="${n(x0 + (i % 3) * size)}" y="${n(y0 + Math.floor(i / 3) * size)}" width="${size}" height="${size}" fill="${INK}"/>`;
  }
  let rules = "";
  for (let i = 0; i <= 3; i += 1) {
    rules += `M ${n(x0 + i * size)} ${n(y0)} V ${n(y0 + 3 * size)} M ${n(x0)} ${n(y0 + i * size)} H ${n(x0 + 3 * size)} `;
  }
  return `${out}<path d="${rules.trim()}" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="square"/>`;
}

function posGuides(layout: "corner4" | "ring8", cx: number, cy: number): string {
  const lines =
    layout === "corner4"
      ? `M ${n(cx)} ${n(cy - 52)} V ${n(cy + 52)} M ${n(cx - 52)} ${n(cy)} H ${n(cx + 52)}`
      : [-17, 17]
          .map(
            (o) =>
              `M ${n(cx + o)} ${n(cy - 51)} V ${n(cy + 51)} M ${n(cx - 51)} ${n(cy + o)} H ${n(cx + 51)}`,
          )
          .join(" ");
  return `<path d="${lines}" fill="none" stroke="${GUIDE}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
}

export type RenderContext = {
  figure: Figure;
  /** Shared glyph radius (fraction of content half-width) when counts vary. */
  countRadius?: number;
};

/** Sizing shared by the stem and all options of one item. */
export function renderContext(spec: PriSpec, optionCells: Cell[]): RenderContext {
  const counts = [...spec.grid.flat(), ...optionCells]
    .map((c) => c.count)
    .filter((v): v is number => typeof v === "number");
  const max = counts.length ? Math.max(...counts) : 1;
  return { figure: spec.figure, countRadius: max > 4 ? 0.25 : max > 1 ? 0.36 : undefined };
}

/** The figure inside one cell, centred on (cx, cy). */
function figureSvg(doc: Doc, ctx: RenderContext, cell: Cell, cx: number, cy: number): string {
  const figure = ctx.figure;
  let out = "";
  const framed = typeof cell.frame === "string";
  if (framed) out += frameSvg(cell.frame as string, cx, cy);

  if (figure.type === "grid") return out + gridSvg(cell.on as string[], cx, cy);
  if (figure.type === "parts") {
    return out + partsSvg(figure.template, cell.parts as string[], cx, cy, framed ? 0.74 : 1);
  }

  const shape = cell.shape as ShapeId;
  const fill = cell.fill as string;
  const rot = typeof cell.rot === "number" ? cell.rot : 0;

  if (typeof cell.pos === "number" && figure.posLayout) {
    const [dx, dy] = POS_OFFSET[figure.posLayout][cell.pos];
    const r = figure.posLayout === "corner4" ? 17 : 12;
    return out + posGuides(figure.posLayout, cx, cy) + shapeSvg(doc, shape, fill, cx + dx, cy + dy, r, rot);
  }

  const half = framed ? 28 : 48;
  const count = typeof cell.count === "number" ? cell.count : 1;
  let radius = 0.72;
  if (ctx.countRadius) radius = ctx.countRadius;
  else if (typeof cell.size === "number") radius = SIZE_RADIUS[cell.size];
  for (const [fx, fy] of COUNT_LAYOUT[count]) {
    out += shapeSvg(doc, shape, fill, cx + fx * half, cy + fy * half, radius * half, rot);
  }
  return out;
}

function cellBox(x: number, y: number): string {
  return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="10" fill="${PAPER}" stroke="${CELL_BORDER}" stroke-width="2"/>`;
}

function questionBox(x: number, y: number): string {
  return (
    `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="10" fill="#f1f5f9" stroke="#64748b" stroke-width="2.5" stroke-dasharray="8 6"/>` +
    `<text x="${x + HALF}" y="${y + HALF + 20}" text-anchor="middle" font-size="58" font-weight="700" font-family="system-ui, -apple-system, 'PingFang SC', 'Noto Sans SC', sans-serif" fill="#475569">?</text>`
  );
}

function svgDoc(width: number, height: number, displayWidth: number, body: string): string {
  const displayHeight = Math.round((displayWidth * height) / width);
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}" viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true">\n` +
    `<rect width="${width}" height="${height}" fill="${PAPER}"/>\n${body}\n</svg>\n`
  );
}

/** The stem: every cell of the grid, with the hidden one replaced by "?". */
export function renderStem(spec: PriSpec, ctx: RenderContext): string {
  const rows = spec.grid.length;
  const cols = spec.grid[0].length;
  const width = 2 * MARGIN + cols * CELL + (cols - 1) * GAP;
  const height = 2 * MARGIN + rows * CELL + (rows - 1) * GAP;
  const doc: Doc = { ids: 0 };
  const parts: string[] = [];
  spec.grid.forEach((row, r) =>
    row.forEach((cell, c) => {
      const x = MARGIN + c * (CELL + GAP);
      const y = MARGIN + r * (CELL + GAP);
      if (r === spec.missing[0] && c === spec.missing[1]) {
        parts.push(questionBox(x, y));
      } else {
        parts.push(cellBox(x, y) + figureSvg(doc, ctx, cell, x + HALF, y + HALF));
      }
    }),
  );
  // Matrices render a little above native size, long sequences a little below.
  const displayWidth = Math.round(spec.kind === "matrix" ? width * 1.1 : width * 0.95);
  return svgDoc(width, height, displayWidth, parts.join("\n"));
}

/** One answer option: a single cell drawn exactly like a stem cell. */
export function renderOption(ctx: RenderContext, cell: Cell): string {
  const pad = 6;
  const side = CELL + 2 * pad;
  const doc: Doc = { ids: 0 };
  const body = cellBox(pad, pad) + figureSvg(doc, ctx, cell, pad + HALF, pad + HALF);
  return svgDoc(side, side, side, body);
}

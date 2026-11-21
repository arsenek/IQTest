import type { AttrMeta, Cell, Figure, PartsTemplate, Value } from "./types";

/** Shapes a glyph cell can show. `turns` = may carry a rotation rule. */
export const SHAPES = {
  circle: { zh: "圆形", turns: false },
  square: { zh: "正方形", turns: false },
  triangle: { zh: "三角形", turns: false },
  diamond: { zh: "菱形", turns: false },
  pentagon: { zh: "五边形", turns: false },
  hexagon: { zh: "六边形", turns: false },
  star: { zh: "五角星", turns: false },
  cross: { zh: "十字", turns: false },
  heart: { zh: "爱心", turns: true },
  moon: { zh: "月亮", turns: false },
  drop: { zh: "水滴", turns: true },
  house: { zh: "房子", turns: false },
  tree: { zh: "小树", turns: false },
  fish: { zh: "小鱼", turns: false },
  arrow: { zh: "箭头", turns: true },
} as const;
export type ShapeId = keyof typeof SHAPES;

export const FILLS = {
  solid: "涂黑",
  hollow: "空心",
  striped: "斜线",
} as const;

export const FRAMES = {
  circle: "圆形",
  square: "方形",
  hexagon: "六边形",
  diamond: "菱形",
} as const;

export const SIZE_ZH: Record<number, string> = { 1: "小号", 2: "中号", 3: "大号" };

export const ROT_ZH: Record<number, string> = {
  0: "朝上",
  45: "朝右上",
  90: "朝右",
  135: "朝右下",
  180: "朝下",
  225: "朝左下",
  270: "朝左",
  315: "朝左上",
};

export const POS_ZH = {
  corner4: ["左上角", "右上角", "右下角", "左下角"],
  ring8: ["左上", "正上", "右上", "正右", "右下", "正下", "左下", "正左"],
} as const;

/** Ordered part ids per template, with their Chinese names. */
export const PARTS: Record<PartsTemplate, Record<string, string>> = {
  box: {
    t: "上边",
    r: "右边",
    b: "下边",
    l: "左边",
    d1: "左上—右下斜线",
    d2: "右上—左下斜线",
    h: "横中线",
    v: "竖中线",
  },
  spokes: {
    n: "朝上的线",
    ne: "朝右上的线",
    e: "朝右的线",
    se: "朝右下的线",
    s: "朝下的线",
    sw: "朝左下的线",
    w: "朝左的线",
    nw: "朝左上的线",
  },
  house: {
    walls: "墙",
    roof: "屋顶",
    door: "门",
    window: "窗",
    chimney: "烟囱",
  },
  face: {
    head: "脸",
    eyes: "眼睛",
    mouth: "嘴巴",
    hat: "帽子",
    ears: "耳朵",
  },
};

export const GRID_SQUARES = ["0", "1", "2", "3", "4", "5", "6", "7", "8"] as const;
export const GRID_ZH = ["左上", "上中", "右上", "左中", "正中", "右中", "左下", "下中", "右下"];

const GLYPH_ATTRS = ["frame", "shape", "fill", "count", "size", "rot", "pos"];

/** Attributes a figure type may use (render order is fixed by the renderer). */
export function allowedAttrs(figure: Figure): string[] {
  if (figure.type === "glyph") return GLYPH_ATTRS;
  if (figure.type === "parts") return ["frame", "parts"];
  return ["on"];
}

export function attrMeta(figure: Figure, attr: string): AttrMeta {
  switch (attr) {
    case "shape":
      return { kind: "cat", label: "图形", values: Object.keys(SHAPES) };
    case "fill":
      return { kind: "cat", label: "填充", values: Object.keys(FILLS) };
    case "frame":
      return { kind: "cat", label: "外框", values: Object.keys(FRAMES) };
    case "count":
      return { kind: "num", label: "数量", values: [1, 2, 3, 4, 5, 6] };
    case "size":
      return { kind: "num", label: "大小", values: [1, 2, 3] };
    case "rot":
      return {
        kind: "num",
        label: "朝向",
        values: [0, 45, 90, 135, 180, 225, 270, 315],
        mod: 360,
      };
    case "pos": {
      const n = figure.type === "glyph" && figure.posLayout === "ring8" ? 8 : 4;
      return {
        kind: "num",
        label: "位置",
        values: Array.from({ length: n }, (_, i) => i),
        mod: n,
      };
    }
    case "parts":
      if (figure.type !== "parts") throw new Error("`parts` needs a parts figure");
      return {
        kind: "set",
        label: figure.template === "box" || figure.template === "spokes" ? "线条" : "部件",
        universe: Object.keys(PARTS[figure.template]),
      };
    case "on":
      return { kind: "set", label: "涂黑的格子", universe: GRID_SQUARES };
    default:
      throw new Error(`Unknown attribute: ${attr}`);
  }
}

export function isSet(v: Value | undefined): v is readonly string[] {
  return Array.isArray(v);
}

/** Stable string identity of a value; sets compare regardless of order. */
export function valueKey(v: Value): string {
  return isSet(v) ? `{${[...v].sort().join(",")}}` : `${typeof v}:${String(v)}`;
}

export function sameValue(a: Value, b: Value): boolean {
  return valueKey(a) === valueKey(b);
}

export function cellKey(cell: Cell): string {
  return Object.keys(cell)
    .sort()
    .map((k) => `${k}=${valueKey(cell[k])}`)
    .join(";");
}

/** Sort a set value into its template order so equal sets serialize equally. */
export function canonicalSet(universe: readonly string[], v: readonly string[]): string[] {
  return universe.filter((u) => v.includes(u));
}

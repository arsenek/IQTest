import type { Cell, Dir, Figure, PriSpec, Rule, RuleType, Value } from "./types";
import { attrMeta, canonicalSet, isSet } from "./vocab";

type Triple<T> = readonly [T, T, T];

/** Each row holds one value: row 1 is all `a`, row 2 all `b`, row 3 all `c`. */
export function rowsConst<T>(v: Triple<T>): T[][] {
  return v.map((x) => [x, x, x]);
}

/** Every row reads `a, b, c` from left to right. */
export function colsConst<T>(v: Triple<T>): T[][] {
  return [0, 1, 2].map(() => [...v]);
}

/**
 * Latin square: each value once per row and once per column. Row r is the
 * first row shifted by r places (to the left for dir 1, right for dir -1).
 */
export function latin<T>(v: Triple<T>, dir: 1 | -1 = 1): T[][] {
  return [0, 1, 2].map((r) => [0, 1, 2].map((c) => v[(((c + dir * r) % 3) + 3) % 3]));
}

/** Row r starts at bases[r] and adds `step` per cell (wrapping at `mod`). */
export function steps(bases: Triple<number>, step: number, mod?: number): number[][] {
  return bases.map((b) =>
    [0, 1, 2].map((c) => (mod ? (((b + c * step) % mod) + mod) % mod : b + c * step)),
  );
}

export function rule(attr: string, type: RuleType, dir: Dir = "row"): Rule {
  return { attr, type, dir };
}

export function cycle(attr: string, period: 2 | 3): Rule {
  return { attr, type: "cycle", dir: "row", period };
}

type Override = Record<string, Value>;

/** One rule item: three other values of the same attribute. */
export function oneOf(attr: string, values: Triple<Value>): Override[] {
  return values.map((v) => ({ [attr]: v }));
}

/**
 * Two attributes, one wrong value each: wrong on the first, wrong on the
 * second, wrong on both. With the answer this forms a full 2×2 so no value
 * is in the majority.
 */
export function cross(wrong: Override): Override[] {
  const [a, b] = Object.keys(wrong);
  if (!a || !b || Object.keys(wrong).length !== 2) throw new Error("cross() takes two attributes");
  return [{ [a]: wrong[a] }, { [b]: wrong[b] }, { [a]: wrong[a], [b]: wrong[b] }];
}

/**
 * Three attributes, one wrong value each: every distractor is right on one
 * attribute and wrong on the other two, so each value appears exactly twice.
 */
export function pairs(wrong: Override): Override[] {
  const [a, b, c] = Object.keys(wrong);
  if (!a || !b || !c || Object.keys(wrong).length !== 3) throw new Error("pairs() takes three attributes");
  return [
    { [a]: wrong[a], [b]: wrong[b] },
    { [a]: wrong[a], [c]: wrong[c] },
    { [b]: wrong[b], [c]: wrong[c] },
  ];
}

const GLYPH: Figure = { type: "glyph" };

function normalize(figure: Figure, cell: Record<string, Value>): Cell {
  const out: Record<string, Value> = {};
  for (const [attr, v] of Object.entries(cell)) {
    const meta = attrMeta(figure, attr);
    out[attr] = meta.kind === "set" && isSet(v) ? canonicalSet(meta.universe, v) : v;
  }
  return out;
}

export function normalizeOverride(figure: Figure, o: Override): Override {
  return normalize(figure, o) as Override;
}

type Common = {
  id: string;
  figure?: Figure;
  rules: Rule[];
  distractors: Override[];
  ruleText: string;
};

/**
 * 3×3 matrix. Each attribute is either one value for the whole grid or a
 * 3×3 array of values (use rowsConst / colsConst / latin / steps).
 */
export function matrix(
  def: Common & {
    attrs: Record<string, Value | Value[][]>;
    missing?: readonly [number, number];
  },
): PriSpec {
  const figure = def.figure ?? GLYPH;
  const isGrid = (v: Value | Value[][]): v is Value[][] =>
    Array.isArray(v) && v.length === 3 && v.every((row) => Array.isArray(row) && row.length === 3);
  const grid = [0, 1, 2].map((r) =>
    [0, 1, 2].map((c) => {
      const cell: Record<string, Value> = {};
      for (const [attr, v] of Object.entries(def.attrs)) cell[attr] = isGrid(v) ? v[r][c] : v;
      return normalize(figure, cell);
    }),
  );
  return {
    id: def.id,
    kind: "matrix",
    figure,
    grid,
    missing: def.missing ?? [2, 2],
    rules: def.rules,
    distractors: def.distractors.map((o) => normalizeOverride(figure, o)),
    ruleText: def.ruleText,
  };
}

/**
 * One-row sequence. Each attribute is either one value for every cell or an
 * array with one value per cell. `missing` defaults to the last cell.
 */
export function sequence(
  def: Common & {
    length: 5 | 6;
    attrs: Record<string, Scalarish | Scalarish[]>;
    missing?: number;
  },
): PriSpec {
  const figure = def.figure ?? GLYPH;
  const row = Array.from({ length: def.length }, (_, i) => {
    const cell: Record<string, Value> = {};
    for (const [attr, v] of Object.entries(def.attrs)) {
      if (Array.isArray(v)) {
        if (v.length !== def.length) throw new Error(`${def.id}: "${attr}" needs ${def.length} values`);
        cell[attr] = v[i];
      } else {
        cell[attr] = v;
      }
    }
    return normalize(figure, cell);
  });
  return {
    id: def.id,
    kind: "sequence",
    figure,
    grid: [row],
    missing: [0, def.missing ?? def.length - 1],
    rules: def.rules,
    distractors: def.distractors.map((o) => normalizeOverride(figure, o)),
    ruleText: def.ruleText,
  };
}

type Scalarish = string | number;

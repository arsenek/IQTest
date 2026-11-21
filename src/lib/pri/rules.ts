import type { AttrMeta, Cell, LineDir, PriSpec, Rule, RuleType, Value } from "./types";
import { SHAPES, allowedAttrs, attrMeta, canonicalSet, isSet, sameValue, valueKey } from "./vocab";

type Getter = (r: number, c: number) => Value | undefined;

const SET_OPS = ["union", "xor", "difference", "intersection"] as const;
type SetOp = (typeof SET_OPS)[number];

function isSetOp(type: RuleType): type is SetOp {
  return (SET_OPS as readonly string[]).includes(type);
}

export function applySetOp(
  op: SetOp,
  universe: readonly string[],
  a: readonly string[],
  b: readonly string[],
): string[] {
  return universe.filter((u) => {
    const inA = a.includes(u);
    const inB = b.includes(u);
    if (op === "union") return inA || inB;
    if (op === "xor") return inA !== inB;
    if (op === "difference") return inA && !inB;
    return inA && inB;
  });
}

/** Attribute names of an item, in a stable order. */
export function attrsOf(spec: PriSpec): string[] {
  const present = Object.keys(spec.grid[0][0]);
  return allowedAttrs(spec.figure).filter((a) => present.includes(a));
}

export function allCells(spec: PriSpec): Cell[] {
  return spec.grid.flat();
}

/** True when the attribute has the same value in every cell of the item. */
export function isFixed(spec: PriSpec, attr: string): boolean {
  const cells = allCells(spec);
  return cells.every((c) => sameValue(c[attr], cells[0][attr]));
}

/** Explicit rules plus an implicit "never changes" rule per fixed attribute. */
export function effectiveRules(spec: PriSpec): Rule[] {
  const implicit: Rule[] = attrsOf(spec)
    .filter((attr) => !spec.rules.some((r) => r.attr === attr))
    .map((attr) => ({
      attr,
      type: "constant",
      dir: spec.kind === "matrix" ? "both" : "row",
    }));
  return [...spec.rules, ...implicit];
}

function dirsOf(rule: Rule): LineDir[] {
  return rule.dir === "both" ? ["row", "col"] : [rule.dir];
}

function lineCoords(spec: PriSpec, dir: LineDir): Array<Array<[number, number]>> {
  const rows = spec.grid.length;
  const cols = spec.grid[0].length;
  if (dir === "row") {
    return Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c): [number, number] => [r, c]),
    );
  }
  return Array.from({ length: cols }, (_, c) =>
    Array.from({ length: rows }, (_, r): [number, number] => [r, c]),
  );
}

function norm(meta: AttrMeta, x: number): number {
  if (meta.kind !== "num" || !meta.mod) return x;
  return ((x % meta.mod) + meta.mod) % meta.mod;
}

/** Step from a to b; modular attributes wrap around. */
function step(meta: AttrMeta, a: Value, b: Value): number {
  return norm(meta, (b as number) - (a as number));
}

export type Analysis = {
  /** The rule fits everything visible and pins down the hidden value. */
  ok: boolean;
  /** How many times the visible cells demonstrate the rule. */
  observations: number;
  prediction?: Value;
};

const FAIL: Analysis = { ok: false, observations: 0 };

/**
 * Does `type` along `dir` fit the visible cells of a matrix, and what does it
 * predict for the hidden cell? Observations = number of complete lines.
 */
function analyzeMatrix(
  spec: PriSpec,
  attr: string,
  type: RuleType,
  dir: LineDir,
  get: Getter,
): Analysis {
  const meta = attrMeta(spec.figure, attr);
  const lines = lineCoords(spec, dir).map((line) => line.map(([r, c]) => get(r, c)));
  const complete = lines.filter((l) => l.every((v) => v !== undefined)) as Value[][];
  const partial = lines.find((l) => l.some((v) => v === undefined));
  if (!partial || complete.length === 0) return FAIL;
  const k = partial.findIndex((v) => v === undefined);
  const known = partial
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: Value; i: number } => x.v !== undefined);
  const done = (prediction: Value): Analysis => ({
    ok: true,
    observations: complete.length,
    prediction,
  });

  if (type === "constant") {
    if (!complete.every((l) => l.every((v) => sameValue(v, l[0])))) return FAIL;
    if (!known.every((x) => sameValue(x.v, known[0].v))) return FAIL;
    return done(known[0].v);
  }

  if (type === "progression") {
    if (meta.kind !== "num") return FAIL;
    let d: number | undefined;
    for (const l of complete) {
      const d1 = step(meta, l[0], l[1]);
      if (d1 === 0 || d1 !== step(meta, l[1], l[2])) return FAIL;
      if (d === undefined) d = d1;
      else if (d !== d1) return FAIL;
    }
    if (d === undefined) return FAIL;
    const [a, b] = known;
    if (step(meta, a.v, b.v) !== norm(meta, (b.i - a.i) * d)) return FAIL;
    return done(norm(meta, (a.v as number) + (k - a.i) * d));
  }

  if (type === "distribution") {
    const keys = complete[0].map(valueKey);
    if (new Set(keys).size !== 3) return FAIL;
    for (const l of complete) {
      const lk = l.map(valueKey);
      if (new Set(lk).size !== 3 || !lk.every((x) => keys.includes(x))) return FAIL;
    }
    const knownKeys = known.map((x) => valueKey(x.v));
    if (new Set(knownKeys).size !== 2 || !knownKeys.every((x) => keys.includes(x))) return FAIL;
    return done(complete[0].find((v) => !knownKeys.includes(valueKey(v))) as Value);
  }

  if (isSetOp(type)) {
    if (meta.kind !== "set") return FAIL;
    const op = (a: Value, b: Value) =>
      applySetOp(type, meta.universe, a as string[], b as string[]);
    if (!complete.every((l) => sameValue(op(l[0], l[1]), l[2]))) return FAIL;
    if (k === 2) return done(op(partial[0] as Value, partial[1] as Value));
    // Only XOR can be run backwards to recover an operand.
    if (type === "xor") return done(op(known[0].v, known[1].v));
    return FAIL;
  }

  return FAIL;
}

/**
 * Same question for a sequence (one row). Observations = how many visible
 * pairs confirm the rule (neighbouring steps, or repeats one period apart).
 */
function analyzeSequence(
  spec: PriSpec,
  attr: string,
  type: RuleType,
  period: number | undefined,
  get: Getter,
): Analysis {
  const meta = attrMeta(spec.figure, attr);
  const n = spec.grid[0].length;
  const k = spec.missing[1];
  const known: Array<{ v: Value; i: number }> = [];
  for (let i = 0; i < n; i += 1) {
    const v = get(0, i);
    if (v !== undefined) known.push({ v, i });
  }
  if (known.length < 2) return FAIL;

  if (type === "constant") {
    if (!known.every((x) => sameValue(x.v, known[0].v))) return FAIL;
    return { ok: true, observations: known.length - 1, prediction: known[0].v };
  }

  if (type === "progression") {
    if (meta.kind !== "num") return FAIL;
    let d: number | undefined;
    for (let j = 1; j < known.length; j += 1) {
      if (known[j].i - known[j - 1].i !== 1) continue;
      const dj = step(meta, known[j - 1].v, known[j].v);
      if (dj === 0) return FAIL;
      if (d === undefined) d = dj;
      else if (d !== dj) return FAIL;
    }
    if (d === undefined) return FAIL;
    for (let j = 1; j < known.length; j += 1) {
      const gap = known[j].i - known[j - 1].i;
      if (step(meta, known[j - 1].v, known[j].v) !== norm(meta, gap * d)) return FAIL;
    }
    const anchor = known[0];
    return {
      ok: true,
      observations: known.length - 1,
      prediction: norm(meta, (anchor.v as number) + (k - anchor.i) * d),
    };
  }

  if (type === "cycle") {
    if (!period || period < 2 || period >= n) return FAIL;
    if (known.every((x) => sameValue(x.v, known[0].v))) return FAIL;
    let observations = 0;
    for (const a of known) {
      for (const b of known) {
        if (b.i <= a.i || (b.i - a.i) % period !== 0) continue;
        if (!sameValue(a.v, b.v)) return FAIL;
        if (b.i - a.i === period) observations += 1;
      }
    }
    const peer = known.find((x) => (x.i - k) % period === 0);
    if (!peer) return FAIL;
    return { ok: true, observations, prediction: peer.v };
  }

  return FAIL;
}

function hiddenGetter(spec: PriSpec, attr: string): Getter {
  const [mr, mc] = spec.missing;
  return (r, c) => (r === mr && c === mc ? undefined : spec.grid[r][c][attr]);
}

/** A rule only counts as shown when the stem demonstrates it at least twice. */
export const MIN_OBSERVATIONS = 2;

function analyze(spec: PriSpec, rule: Rule, dir: LineDir): Analysis {
  const get = hiddenGetter(spec, rule.attr);
  return spec.kind === "matrix"
    ? analyzeMatrix(spec, rule.attr, rule.type, dir, get)
    : analyzeSequence(spec, rule.attr, rule.type, rule.period, get);
}

/**
 * Deduce the hidden cell from the visible cells and the item's rules.
 * The hidden cell stored in the spec is never read.
 */
export function solve(spec: PriSpec): Cell {
  const answer: Record<string, Value> = {};
  for (const rule of effectiveRules(spec)) {
    let prediction: Value | undefined;
    for (const dir of dirsOf(rule)) {
      const a = analyze(spec, rule, dir);
      if (!a.ok || a.prediction === undefined) {
        throw new Error(
          `${spec.id}: rule ${rule.type}/${dir} on "${rule.attr}" does not fit the stem`,
        );
      }
      if (a.observations < MIN_OBSERVATIONS) {
        throw new Error(
          `${spec.id}: rule ${rule.type}/${dir} on "${rule.attr}" is shown only ${a.observations}× in the stem`,
        );
      }
      if (prediction !== undefined && !sameValue(prediction, a.prediction)) {
        throw new Error(
          `${spec.id}: row and column readings of "${rule.attr}" disagree`,
        );
      }
      prediction = a.prediction;
    }
    answer[rule.attr] = prediction as Value;
  }
  return answer;
}

function withCell(spec: PriSpec, cell: Cell): Cell[][] {
  const [mr, mc] = spec.missing;
  return spec.grid.map((row, r) => row.map((c, ci) => (r === mr && ci === mc ? cell : c)));
}

/**
 * Check one rule against a fully filled grid. Written independently of
 * `solve` so the two can cross-check each other.
 */
export function ruleHolds(spec: PriSpec, rule: Rule, grid: Cell[][]): boolean {
  const meta = attrMeta(spec.figure, rule.attr);

  if (spec.kind === "sequence") {
    const v = grid[0].map((c) => c[rule.attr]);
    if (rule.type === "constant") return v.every((x) => sameValue(x, v[0]));
    if (rule.type === "progression") {
      if (meta.kind !== "num") return false;
      const d = step(meta, v[0], v[1]);
      return d !== 0 && v.every((x, i) => i === 0 || step(meta, v[i - 1], x) === d);
    }
    if (rule.type === "cycle") {
      const p = rule.period ?? 0;
      if (p < 2) return false;
      if (v.every((x) => sameValue(x, v[0]))) return false;
      return v.every((x, i) => i < p || sameValue(x, v[i - p]));
    }
    return false;
  }

  for (const dir of dirsOf(rule)) {
    const lines = lineCoords(spec, dir).map((l) => l.map(([r, c]) => grid[r][c][rule.attr]));
    if (rule.type === "constant") {
      if (!lines.every((l) => l.every((x) => sameValue(x, l[0])))) return false;
    } else if (rule.type === "progression") {
      if (meta.kind !== "num") return false;
      const d = step(meta, lines[0][0], lines[0][1]);
      if (d === 0) return false;
      for (const l of lines) {
        if (step(meta, l[0], l[1]) !== d || step(meta, l[1], l[2]) !== d) return false;
      }
    } else if (rule.type === "distribution") {
      const first = lines[0].map(valueKey).sort().join("|");
      for (const l of lines) {
        const keys = l.map(valueKey);
        if (new Set(keys).size !== 3 || keys.sort().join("|") !== first) return false;
      }
    } else if (isSetOp(rule.type)) {
      if (meta.kind !== "set") return false;
      for (const l of lines) {
        const got = applySetOp(rule.type, meta.universe, l[0] as string[], l[1] as string[]);
        if (!sameValue(got, l[2])) return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

/** Rules broken when `cell` is placed in the hidden position. */
export function violatedRules(spec: PriSpec, cell: Cell): Rule[] {
  const grid = withCell(spec, cell);
  return effectiveRules(spec).filter((rule) => !ruleHolds(spec, rule, grid));
}

export type Alternative = {
  attr: string;
  type: RuleType;
  dir: LineDir;
  period?: number;
  prediction: Value;
};

/**
 * Every rule of the standard families that the visible cells support, per
 * attribute, with the value it predicts for the hidden cell. If two supported
 * rules predicted different values the item would be ambiguous.
 */
export function supportedAlternatives(spec: PriSpec): Alternative[] {
  const out: Alternative[] = [];
  for (const attr of attrsOf(spec)) {
    const meta = attrMeta(spec.figure, attr);
    const get = hiddenGetter(spec, attr);
    if (spec.kind === "matrix") {
      const types: RuleType[] = ["constant", "distribution"];
      if (meta.kind === "num") types.push("progression");
      if (meta.kind === "set") types.push(...SET_OPS);
      for (const dir of ["row", "col"] as const) {
        for (const type of types) {
          const a = analyzeMatrix(spec, attr, type, dir, get);
          if (a.ok && a.prediction !== undefined) {
            out.push({ attr, type, dir, prediction: a.prediction });
          }
        }
      }
    } else {
      const candidates: Array<{ type: RuleType; period?: number }> = [{ type: "constant" }];
      if (meta.kind === "num") candidates.push({ type: "progression" });
      for (let p = 2; p < spec.grid[0].length; p += 1) candidates.push({ type: "cycle", period: p });
      for (const cand of candidates) {
        const a = analyzeSequence(spec, attr, cand.type, cand.period, get);
        // One confirmation is enough to make a rival reading arguable.
        if (a.ok && a.prediction !== undefined && a.observations >= 1) {
          out.push({ attr, type: cand.type, dir: "row", period: cand.period, prediction: a.prediction });
        }
      }
    }
  }
  return out;
}

function subsets(universe: readonly string[]): string[][] {
  const out: string[][] = [];
  for (let mask = 1; mask < 1 << universe.length; mask += 1) {
    out.push(universe.filter((_, i) => mask & (1 << i)));
  }
  return out;
}

/** Every value an attribute could take in this figure type. */
export function attrDomain(spec: PriSpec, attr: string): Value[] {
  const meta = attrMeta(spec.figure, attr);
  if (meta.kind === "set") return subsets(meta.universe);
  return [...meta.values];
}

/**
 * Exhaustive search: every possible cell (all combinations of all attribute
 * values) that satisfies all rules when placed in the hidden position.
 * A sound item has exactly one.
 */
export function bruteForceSolutions(spec: PriSpec): Cell[] {
  const attrs = attrsOf(spec);
  let candidates: Array<Record<string, Value>> = [{}];
  for (const attr of attrs) {
    const domain = attrDomain(spec, attr);
    candidates = candidates.flatMap((c) => domain.map((v) => ({ ...c, [attr]: v })));
  }
  return candidates.filter((c) => violatedRules(spec, c).length === 0);
}

const RULE_WEIGHT: Record<RuleType, number> = {
  constant: 1,
  progression: 2,
  cycle: 2,
  distribution: 3,
  union: 4,
  difference: 5,
  intersection: 5,
  xor: 6,
};

/** True when every line along `dir` shows the identical run of values. */
function linesIdentical(spec: PriSpec, attr: string, dir: LineDir): boolean {
  const lines = lineCoords(spec, dir).map((l) =>
    l.map(([r, c]) => valueKey(spec.grid[r][c][attr])).join("|"),
  );
  return lines.every((l) => l === lines[0]);
}

export function ruleWeight(spec: PriSpec, rule: Rule): number {
  if (rule.type === "cycle") return rule.period === 2 ? 2 : 3;
  if (rule.type === "progression" && spec.kind === "matrix") {
    // Rows that all read the same can be solved by copying the cell above.
    const simple = rule.dir !== "both" && linesIdentical(spec, rule.attr, rule.dir);
    return simple ? 2 : 3;
  }
  return RULE_WEIGHT[rule.type];
}

/**
 * Difficulty = summed weight of the explicit rules, +1 when the hidden cell
 * is not the last one (the rule has to be run backwards).
 */
export function difficultyScore(spec: PriSpec): number {
  const [mr, mc] = spec.missing;
  const last = mr === spec.grid.length - 1 && mc === spec.grid[0].length - 1;
  return spec.rules.reduce((sum, r) => sum + ruleWeight(spec, r), 0) + (last ? 0 : 1);
}

export function levelOf(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score <= 2) return 1;
  if (score === 3) return 2;
  if (score <= 5) return 3;
  if (score <= 7) return 4;
  return 5;
}

function fail(spec: PriSpec, msg: string): never {
  throw new Error(`${spec.id}: ${msg}`);
}

/** Structural and legibility constraints every spec must meet. */
export function validateSpec(spec: PriSpec): void {
  const rows = spec.grid.length;
  const cols = spec.grid[0]?.length ?? 0;
  if (spec.kind === "matrix" && (rows !== 3 || cols !== 3)) fail(spec, "matrix must be 3×3");
  if (spec.kind === "sequence" && (rows !== 1 || cols < 5 || cols > 6)) {
    fail(spec, "sequence must be one row of 5–6 cells");
  }
  const [mr, mc] = spec.missing;
  if (!(mr >= 0 && mr < rows && mc >= 0 && mc < cols)) fail(spec, "missing cell out of range");

  const attrs = Object.keys(spec.grid[0][0]).sort();
  const allowed = allowedAttrs(spec.figure);
  const checkCell = (cell: Record<string, Value>, where: string) => {
    if (Object.keys(cell).sort().join(",") !== attrs.join(",")) {
      fail(spec, `${where}: cells must all carry the same attributes`);
    }
    for (const attr of attrs) {
      if (!allowed.includes(attr)) fail(spec, `${where}: attribute "${attr}" not allowed here`);
      const meta = attrMeta(spec.figure, attr);
      const v = cell[attr];
      if (meta.kind === "set") {
        if (!isSet(v) || v.length === 0) fail(spec, `${where}: "${attr}" must be a non-empty set`);
        if (!v.every((x) => meta.universe.includes(x))) fail(spec, `${where}: unknown part in "${attr}"`);
        if (canonicalSet(meta.universe, v).join() !== v.join()) {
          fail(spec, `${where}: "${attr}" is not in canonical order`);
        }
      } else if (!(meta.values as readonly Value[]).includes(v)) {
        fail(spec, `${where}: "${attr}" has out-of-range value ${String(v)}`);
      }
    }
  };
  spec.grid.forEach((row, r) => row.forEach((cell, c) => checkCell(cell, `cell ${r},${c}`)));

  if (spec.figure.type === "glyph") {
    for (const need of ["shape", "fill"]) {
      if (!attrs.includes(need)) fail(spec, `glyph cells need "${need}"`);
    }
  }
  if (spec.figure.type === "parts" && !attrs.includes("parts")) fail(spec, 'needs "parts"');
  if (spec.figure.type === "grid" && !attrs.includes("on")) fail(spec, 'needs "on"');

  for (const rule of spec.rules) {
    if (!attrs.includes(rule.attr)) fail(spec, `rule on unknown attribute "${rule.attr}"`);
    if (isFixed(spec, rule.attr)) fail(spec, `"${rule.attr}" never changes; drop its rule`);
    const seqOnly = rule.type === "cycle";
    const matrixOnly = rule.type === "distribution" || isSetOp(rule.type);
    if (spec.kind === "matrix" && seqOnly) fail(spec, "cycle is a sequence rule");
    if (spec.kind === "sequence" && (matrixOnly || rule.dir !== "row")) {
      fail(spec, `${rule.type}/${rule.dir} is not a sequence rule`);
    }
    if (rule.type === "cycle" && rule.period !== 2 && rule.period !== 3) {
      fail(spec, "cycle period must be 2 or 3");
    }
  }
  for (const attr of attrs) {
    const n = spec.rules.filter((r) => r.attr === attr).length;
    if (n > 1) fail(spec, `more than one rule on "${attr}"`);
    if (n === 0 && !isFixed(spec, attr)) fail(spec, `"${attr}" varies but has no rule`);
  }

  if (spec.distractors.length !== 3) fail(spec, "need exactly 3 distractors");

  // Legibility: keep attributes from masking one another.
  const everyCell = [...allCells(spec), ...spec.distractors];
  const seen = (attr: string) => everyCell.map((c) => c[attr]).filter((v) => v !== undefined);
  if (attrs.includes("size") && attrs.includes("count")) fail(spec, "size cannot combine with count");
  if (attrs.includes("pos")) {
    if (spec.figure.type !== "glyph" || !spec.figure.posLayout) fail(spec, "pos needs a posLayout");
    if (attrs.includes("count") || attrs.includes("size") || attrs.includes("frame")) {
      fail(spec, "pos cannot combine with count, size or frame");
    }
  }
  if (attrs.includes("rot")) {
    const turning = seen("rot").some((v) => v !== 0);
    const shapes = seen("shape") as string[];
    if (turning && !shapes.every((s) => SHAPES[s as keyof typeof SHAPES]?.turns)) {
      fail(spec, "rotation needs shapes with an unmistakable direction");
    }
  }
  if (attrs.includes("frame") && attrs.includes("count")) {
    if (Math.max(...(seen("count") as number[])) > 4) fail(spec, "framed cells hold at most 4 shapes");
  }
}

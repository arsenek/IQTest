/**
 * Rule-based PRI (figure reasoning) items.
 *
 * An item is a declarative spec: the attributes of every cell plus the rules
 * that govern them. Pictures, answer options and the answer key are all
 * derived from the spec — nothing is drawn or keyed by hand.
 */

export type Scalar = string | number;
/** Set-valued attribute (line segments, figure parts, shaded squares). */
export type SetValue = readonly string[];
export type Value = Scalar | SetValue;
export type Cell = Readonly<Record<string, Value>>;

export type PartsTemplate = "box" | "spokes" | "house" | "face";

export type Figure =
  /** Copies of one shape; optional frame, size, rotation or position. */
  | { type: "glyph"; posLayout?: "corner4" | "ring8" }
  /** A subset of a fixed template's parts (attribute `parts`). */
  | { type: "parts"; template: PartsTemplate }
  /** A 3×3 board with some squares shaded (attribute `on`). */
  | { type: "grid" };

export type RuleType =
  | "constant"
  | "progression"
  | "distribution"
  | "cycle"
  | "union"
  | "xor"
  | "difference"
  | "intersection";

/** `row`: along each row, left to right. `col`: down each column. */
export type LineDir = "row" | "col";
export type Dir = LineDir | "both";

export type Rule = {
  attr: string;
  type: RuleType;
  dir: Dir;
  /** Only for `cycle`: the pattern repeats every `period` cells. */
  period?: number;
};

export type PriSpec = {
  /** Manifest item id, e.g. `child-pri-3`. */
  id: string;
  /** `matrix` is always 3×3; `sequence` is a single row. */
  kind: "matrix" | "sequence";
  figure: Figure;
  /** Every cell, including the one hidden behind the question mark. */
  grid: Cell[][];
  missing: readonly [row: number, col: number];
  /**
   * One rule per attribute that varies. Attributes with the same value in
   * every cell need no entry; they are held constant implicitly.
   */
  rules: Rule[];
  /** Each distractor = the correct answer with these attributes replaced. */
  distractors: Array<Record<string, Value>>;
  /** The rule in one Chinese sentence, for reviewers. */
  ruleText: string;
};

export type AttrMeta =
  | { kind: "cat"; label: string; values: readonly string[] }
  | { kind: "num"; label: string; values: readonly number[]; mod?: number }
  | { kind: "set"; label: string; universe: readonly string[] };

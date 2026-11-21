import type { Cell, PriSpec, Value } from "./types";
import { attrDomain, attrsOf, solve } from "./rules";
import { attrMeta, cellKey, isSet, sameValue, valueKey } from "./vocab";

export const LETTERS = ["A", "B", "C", "D"] as const;
export type Letter = (typeof LETTERS)[number];

export function labelFor(letter: Letter): string {
  return `选项 ${letter}`;
}

export type BuiltOption = {
  letter: Letter;
  label: string;
  cell: Cell;
  /** True for the single option that came out of `solve`. */
  correct: boolean;
};

/** The solved answer plus the spec's distractors as full cells. */
export function optionCells(spec: PriSpec): { answer: Cell; distractors: Cell[] } {
  const answer = solve(spec);
  const attrs = attrsOf(spec);
  const distractors = spec.distractors.map((override, i) => {
    for (const [attr, v] of Object.entries(override)) {
      if (!attrs.includes(attr)) {
        throw new Error(`${spec.id}: distractor ${i + 1} sets unknown attribute "${attr}"`);
      }
      if (!attrDomain(spec, attr).some((d) => sameValue(d, v))) {
        throw new Error(`${spec.id}: distractor ${i + 1} has out-of-range "${attr}"`);
      }
    }
    return { ...answer, ...override } as Cell;
  });
  return { answer, distractors };
}

export type Placement = {
  /** Index 0–3 of the correct option. */
  key: number;
  /** Order in which the three distractors fill the remaining slots. */
  order: [number, number, number];
};

export function arrangeOptions(spec: PriSpec, placement: Placement): BuiltOption[] {
  const { answer, distractors } = optionCells(spec);
  const rest = placement.order.map((i) => distractors[i]);
  return LETTERS.map((letter, slot) => {
    const correct = slot === placement.key;
    return {
      letter,
      label: labelFor(letter),
      cell: correct ? answer : (rest.shift() as Cell),
      correct,
    };
  });
}

function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Decide where the correct option sits for `n` items in a row: each of A–D
 * is used as equally as n allows and never three times running. Seeded by
 * `seedLabel`, so regenerating gives the same key.
 */
export function planPlacements(n: number, seedLabel: string): Placement[] {
  const rng = mulberry32(hashSeed(seedLabel));
  let keys: number[] = [];
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const pool: number[] = [];
    while (pool.length < n) pool.push(...shuffled([0, 1, 2, 3], rng));
    keys = shuffled(pool.slice(0, n), rng);
    const run3 = keys.some((k, i) => i >= 2 && k === keys[i - 1] && k === keys[i - 2]);
    if (!run3) break;
  }
  return keys.map((key) => ({
    key,
    order: shuffled([0, 1, 2], rng) as [number, number, number],
  }));
}

/**
 * How "typical" each option is among the four: for every attribute, how many
 * other options share its value (for sets: agree on each part). If the
 * correct option were the single most typical one, a test-taker could pick
 * it without looking at the stem.
 */
export function typicality(spec: PriSpec, cells: Cell[]): number[] {
  const attrs = attrsOf(spec);
  return cells.map((cell, i) => {
    let score = 0;
    for (const attr of attrs) {
      const meta = attrMeta(spec.figure, attr);
      cells.forEach((other, j) => {
        if (i === j) return;
        const a: Value = cell[attr];
        const b: Value = other[attr];
        if (meta.kind === "set" && isSet(a) && isSet(b)) {
          score += meta.universe.filter((u) => a.includes(u) === b.includes(u)).length;
        } else if (valueKey(a) === valueKey(b)) {
          score += 1;
        }
      });
    }
    return score;
  });
}

export function distinctCells(cells: Cell[]): boolean {
  return new Set(cells.map(cellKey)).size === cells.length;
}

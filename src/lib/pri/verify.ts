import type { BuiltItem } from "./build";
import { distinctCells, typicality } from "./options";
import {
  bruteForceSolutions,
  effectiveRules,
  ruleHolds,
  solve,
  supportedAlternatives,
  violatedRules,
} from "./rules";
import { cellKey, sameValue } from "./vocab";

export type Check = { name: string; ok: boolean; detail: string };

/**
 * The soundness proof for one item. Each check is independent; an item ships
 * only when all of them pass.
 */
export function soundnessChecks(item: BuiltItem): Check[] {
  const { spec, options, manifest, files } = item;
  const [mr, mc] = spec.missing;
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, detail = "") => checks.push({ name, ok, detail });

  // 1. The full grid as written in the spec obeys every rule on every line.
  const broken = effectiveRules(spec).filter((r) => !ruleHolds(spec, r, spec.grid));
  add(
    "stem-obeys-rules",
    broken.length === 0,
    broken.map((r) => `${r.type}/${r.dir} on ${r.attr}`).join(", "),
  );

  // 2. Deduction from the visible cells alone lands on the hidden cell.
  let answerKey = "";
  try {
    const answer = solve(spec);
    answerKey = cellKey(answer);
    add("answer-deducible", answerKey === cellKey(spec.grid[mr][mc]), "solver disagrees with spec grid");
  } catch (err) {
    add("answer-deducible", false, (err as Error).message);
    return checks;
  }
  const answer = solve(spec);

  // 3. Exhaustive search over every possible cell finds exactly that one.
  const solutions = bruteForceSolutions(spec);
  add(
    "unique-by-exhaustive-search",
    solutions.length === 1 && cellKey(solutions[0]) === answerKey,
    `${solutions.length} cells satisfy all rules`,
  );

  // 4. No other standard rule that fits the stem predicts a different value.
  const rivals = supportedAlternatives(spec).filter((a) => !sameValue(a.prediction, answer[a.attr]));
  add(
    "no-rival-rule",
    rivals.length === 0,
    rivals.map((a) => `${a.type}${a.period ?? ""}/${a.dir} on ${a.attr}`).join(", "),
  );

  // 5. Exactly one option is the deduced answer, and it is the keyed one.
  const matching = options.filter((o) => cellKey(o.cell) === answerKey);
  add(
    "key-matches-deduction",
    matching.length === 1 && matching[0].correct && manifest.answer === matching[0].label,
    `keyed ${manifest.answer}, deduced ${matching.map((o) => o.label).join("/") || "none"}`,
  );

  // 6. Every other option breaks at least one rule when placed in the grid.
  const fitting = options.filter((o) => !o.correct && violatedRules(spec, o.cell).length === 0);
  add("distractors-break-rules", fitting.length === 0, fitting.map((o) => o.label).join(", "));
  const passing = options.filter((o) => violatedRules(spec, o.cell).length === 0);
  add("exactly-one-option-fits", passing.length === 1 && passing[0].correct, `${passing.length} options fit`);

  // 7. No two options are the same figure, in the spec or as drawn.
  const svgs = manifest.choices.map((c) => files[c.image.split("/").pop() as string]);
  add(
    "options-distinct",
    options.length === 4 && distinctCells(options.map((o) => o.cell)) && new Set(svgs).size === 4,
  );

  // 8. The answer cannot be picked from the options alone as "the most typical one".
  const scores = typicality(spec, options.map((o) => o.cell));
  const best = Math.max(...scores);
  const keyScore = scores[options.findIndex((o) => o.correct)];
  add(
    "no-odd-one-out-shortcut",
    !(keyScore === best && scores.filter((s) => s === best).length === 1),
    `typicality ${scores.join("/")}`,
  );

  return checks;
}

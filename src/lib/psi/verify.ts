import { parseSymbolPrompt } from "../items/symbolPrompt";
import { countTarget } from "./build";
import type { BuiltPsiItem } from "./types";

export type Check = { name: string; ok: boolean; detail: string };

function add(checks: Check[], name: string, ok: boolean, detail = "") {
  checks.push({ name, ok, detail });
}

export function soundnessChecks(item: BuiltPsiItem): Check[] {
  const { spec, targetCount, manifest } = item;
  const checks: Check[] = [];

  add(checks, "rule-text-zh", /[\u4e00-\u9fff]/.test(spec.ruleText));
  add(checks, "target-nonempty", spec.target.length >= 1);
  add(checks, "grid-nonempty", spec.grid.length >= 1);
  add(
    checks,
    "target-in-alphabet",
    spec.alphabet.includes(spec.target),
    `target=${spec.target}`,
  );
  const outside = spec.grid.filter((s) => !spec.alphabet.includes(s));
  add(checks, "grid-subset-alphabet", outside.length === 0, outside.join(""));

  const counted = countTarget(spec.grid, spec.target);
  add(checks, "count-matches-grid", counted === targetCount && counted === manifest.answer, `count=${counted}`);
  add(
    checks,
    "target-count-in-range",
    Number.isInteger(manifest.answer) && manifest.answer >= 0 && manifest.answer <= 9,
    `answer=${manifest.answer}`,
  );

  const parsed = parseSymbolPrompt(manifest.prompt);
  add(checks, "prompt-parseable-target", parsed.target === spec.target, `parsed=${parsed.target}`);
  add(
    checks,
    "prompt-sequence-equals-grid",
    parsed.sequence.join("") === spec.grid.join(""),
    `parsed=${parsed.sequence.join("")}`,
  );
  add(checks, "id-stable", manifest.id === spec.id);
  add(checks, "type-symbol-search", manifest.type === "symbol_search");

  return checks;
}

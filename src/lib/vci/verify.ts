import { completions, getCategory, isMember, related } from "./lexicon";
import type { BuiltVciItem, SequenceRule, VciSpec } from "./types";

export type Check = { name: string; ok: boolean; detail: string };

function add(checks: Check[], name: string, ok: boolean, detail = "") {
  checks.push({ name, ok, detail });
}

function parseNumericTerms(series: string[]): number[] {
  return series.map((s) => {
    const n = Number(s);
    if (!Number.isFinite(n)) throw new Error(`non-numeric term "${s}"`);
    return n;
  });
}

/** Deduce the unique next term for a sequence rule. */
export function deduceSequenceNext(series: string[], rule: SequenceRule): string {
  if (series.length < 2) throw new Error("sequence needs at least 2 stem terms");
  if (rule.type === "numeric") {
    const nums = parseNumericTerms(series);
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] - nums[i - 1] !== rule.step) {
        throw new Error(`stem breaks step ${rule.step}`);
      }
    }
    return String(nums[nums.length - 1] + rule.step);
  }
  if (rule.type === "geometric") {
    const { ratio } = rule;
    if (!Number.isInteger(ratio) || ratio === 0 || Math.abs(ratio) === 1) {
      throw new Error(`geometric ratio must be integer ≠0 with |ratio|≠1 (got ${ratio})`);
    }
    const nums = parseNumericTerms(series);
    for (let i = 1; i < nums.length; i++) {
      if (nums[i - 1] * ratio !== nums[i]) {
        throw new Error(`stem breaks ratio ${ratio}`);
      }
    }
    const next = nums[nums.length - 1] * ratio;
    if (!Number.isInteger(next)) throw new Error(`geometric next is not integer (${next})`);
    return String(next);
  }
  const { alphabet } = rule;
  if (alphabet.length < 2) throw new Error("cycle alphabet too short");
  const idxs = series.map((s) => {
    const i = alphabet.indexOf(s);
    if (i < 0) throw new Error(`"${s}" not in cycle alphabet`);
    return i;
  });
  for (let i = 1; i < idxs.length; i++) {
    const expected = (idxs[i - 1] + 1) % alphabet.length;
    if (idxs[i] !== expected) throw new Error("stem breaks cycle");
  }
  return alphabet[(idxs[idxs.length - 1] + 1) % alphabet.length];
}

function fittingLabels(spec: VciSpec): string[] {
  const pool = [spec.answer, ...spec.distractors];
  if (spec.kind === "classify") {
    return pool.filter((t) => isMember(spec.categoryId, t));
  }
  if (spec.kind === "sequence") {
    const next = deduceSequenceNext(spec.series, spec.rule);
    return pool.filter((t) => t === next);
  }
  return pool.filter((t) => related(spec.relationId, spec.c, t));
}

function deduceAnswer(spec: VciSpec): string {
  if (spec.kind === "classify") {
    const fits = fittingLabels(spec);
    if (fits.length !== 1) throw new Error(`classify has ${fits.length} fitting options`);
    return fits[0];
  }
  if (spec.kind === "sequence") {
    return deduceSequenceNext(spec.series, spec.rule);
  }
  const rights = completions(spec.relationId, spec.c);
  const inOptions = [spec.answer, ...spec.distractors].filter((t) => rights.includes(t));
  if (inOptions.length !== 1) {
    throw new Error(`analogy has ${inOptions.length} completions among options`);
  }
  return inOptions[0];
}

/**
 * Soundness proof for one VCI item. All checks must pass before shipping.
 */
export function soundnessChecks(item: BuiltVciItem): Check[] {
  const { spec, options, manifest } = item;
  const checks: Check[] = [];

  add(checks, "rule-text-zh", /[\u4e00-\u9fff]/.test(spec.ruleText));
  add(checks, "four-options", options.length === 4 && manifest.choices.length === 4);

  const labels = options.map((o) => o.label);
  add(checks, "options-distinct", new Set(labels).size === 4, labels.join("/"));

  const keyed = options.filter((o) => o.correct);
  add(checks, "exactly-one-keyed", keyed.length === 1);
  add(
    checks,
    "key-matches-manifest",
    keyed[0]?.label === manifest.answer && manifest.answer === spec.answer,
    `manifest=${manifest.answer} keyed=${keyed[0]?.label ?? "none"}`,
  );

  try {
    if (spec.kind === "classify") {
      const cat = getCategory(spec.categoryId);
      const missing = spec.exemplars.filter((e) => !isMember(spec.categoryId, e));
      add(checks, "exemplars-in-category", missing.length === 0, missing.join(",") || cat.label);
      add(checks, "answer-in-category", isMember(spec.categoryId, spec.answer));
      const bad = spec.distractors.filter((d) => isMember(spec.categoryId, d));
      add(checks, "distractors-break-rules", bad.length === 0, bad.join(","));
    } else if (spec.kind === "sequence") {
      const next = deduceSequenceNext(spec.series, spec.rule);
      add(checks, "answer-deducible", next === spec.answer, `deduced=${next}`);
      const bad = spec.distractors.filter((d) => d === next);
      add(checks, "distractors-break-rules", bad.length === 0, bad.join(","));
    } else {
      add(checks, "stem-pair-related", related(spec.relationId, spec.a, spec.b));
      add(checks, "answer-related", related(spec.relationId, spec.c, spec.answer));
      const bad = spec.distractors.filter((d) => related(spec.relationId, spec.c, d));
      add(checks, "distractors-break-rules", bad.length === 0, bad.join(","));
    }

    const deduced = deduceAnswer(spec);
    add(checks, "unique-option-fits", deduced === spec.answer, `deduced=${deduced}`);
    const fits = fittingLabels(spec);
    add(
      checks,
      "exactly-one-option-fits",
      fits.length === 1 && fits[0] === spec.answer,
      fits.join("/"),
    );
  } catch (err) {
    add(checks, "answer-deducible", false, (err as Error).message);
  }

  add(checks, "prompt-zh", /[\u4e00-\u9fff]/.test(manifest.prompt));
  add(checks, "id-stable", manifest.id === spec.id);

  return checks;
}

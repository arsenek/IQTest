import { expectedAnswer, formatStemDigits } from "./build";
import type { BuiltWmiItem, WmiSubtestPlan } from "./types";

export type Check = { name: string; ok: boolean; detail: string };

function add(checks: Check[], name: string, ok: boolean, detail = "") {
  checks.push({ name, ok, detail });
}

export function soundnessChecks(item: BuiltWmiItem, ladderLength?: number): Check[] {
  const { spec, manifest } = item;
  const checks: Check[] = [];

  add(checks, "rule-text-zh", /[\u4e00-\u9fff]/.test(spec.ruleText));
  add(
    checks,
    "digits-valid",
    spec.digits.length >= 2 &&
      spec.digits.every((d) => Number.isInteger(d) && d >= 0 && d <= 9),
    spec.digits.join(","),
  );

  const expected = expectedAnswer(spec.digits, spec.direction);
  add(checks, "answer-matches-direction", manifest.answer === expected, `got=${manifest.answer}`);

  const stem = formatStemDigits(spec.digits);
  add(checks, "prompt-contains-digits", manifest.prompt.includes(stem), stem);

  if (spec.direction === "reverse") {
    add(checks, "prompt-marks-reverse", /倒序/.test(manifest.prompt));
  } else {
    add(checks, "prompt-marks-forward", /按顺序/.test(manifest.prompt));
  }

  add(checks, "ordered-flag", manifest.ordered === true);
  add(checks, "mask-stem", manifest.maskStem === true);
  add(checks, "type-digit-span", manifest.type === "digit_span");
  add(checks, "id-stable", manifest.id === spec.id);

  if (ladderLength != null) {
    add(
      checks,
      "ladder-length",
      spec.digits.length === ladderLength,
      `len=${spec.digits.length} expected=${ladderLength}`,
    );
  }

  // encodeMs roughly scales with length (at least 500ms per digit, capped loosely)
  add(
    checks,
    "encode-scales-with-length",
    spec.encodeMs >= 3000 && spec.encodeMs <= 12_000,
    `encodeMs=${spec.encodeMs}`,
  );

  // Prefer no immediate adjacent duplicates (harder to chunk by accident)
  let adjacentDup = false;
  for (let i = 1; i < spec.digits.length; i++) {
    if (spec.digits[i] === spec.digits[i - 1]) adjacentDup = true;
  }
  add(checks, "no-adjacent-duplicate", !adjacentDup);

  return checks;
}

export function subtestLadderChecks(sub: WmiSubtestPlan, items: BuiltWmiItem[]): Check[] {
  const checks: Check[] = [];
  add(checks, "ladder-parallel", sub.lengthLadder.length === items.length);
  add(
    checks,
    "ladder-matches-specs",
    items.every((it, i) => it.spec.digits.length === sub.lengthLadder[i]),
    sub.lengthLadder.join(","),
  );
  return checks;
}

import type {
  BuiltWmiItem,
  WmiAudience,
  WmiDirection,
  WmiPackPlan,
  WmiSpec,
  WmiSubtestPlan,
} from "./types";

export function expectedAnswer(digits: number[], direction: WmiDirection): string {
  const seq = direction === "forward" ? digits : [...digits].reverse();
  return seq.join("-");
}

export function formatStemDigits(digits: number[]): string {
  return digits.join("、");
}

function promptFor(
  digits: number[],
  direction: WmiDirection,
  audience: WmiAudience,
  practice: boolean,
): string {
  const stem = formatStemDigits(digits);
  let text: string;
  if (direction === "forward") {
    text =
      audience === "child"
        ? `请按顺序复述这些数字：${stem}`
        : `请按顺序复述这些数字：${stem}`;
  } else {
    text =
      audience === "child"
        ? `请倒序复述：${stem}（从后往前说）`
        : `请倒序复述：${stem}（从后往前）`;
  }
  return practice ? `练习：${text}` : text;
}

export function buildItem(pack: WmiPackPlan, _sub: WmiSubtestPlan, spec: WmiSpec): BuiltWmiItem {
  return {
    spec,
    manifest: {
      id: spec.id,
      type: "digit_span",
      prompt: promptFor(spec.digits, spec.direction, pack.audience, pack.practice),
      answer: expectedAnswer(spec.digits, spec.direction),
      timeLimitMs: spec.timeLimitMs,
      encodeMs: spec.encodeMs,
      maskStem: true,
      ordered: true,
    },
  };
}

export function buildSubtest(pack: WmiPackPlan, sub: WmiSubtestPlan): BuiltWmiItem[] {
  return sub.specs.map((spec) => buildItem(pack, sub, spec));
}

import type { Item } from "@/lib/content/types";

function pickWrongChoice(item: Item, rng: () => number): string | number {
  const choices = item.choices ?? [];
  const wrong = choices
    .map((c) => c.label)
    .filter((label) => label !== String(item.answer));
  if (wrong.length > 0) {
    return wrong[Math.floor(rng() * wrong.length)]!;
  }
  // No choices (shouldn't happen for mcq) — perturb string answer
  return `wrong-${String(item.answer)}`;
}

function wrongDigitSpan(answer: string, rng: () => number): string {
  const parts = String(answer).split("-");
  if (parts.length === 0) return "0";
  const idx = Math.floor(rng() * parts.length);
  const digit = Number(parts[idx]);
  const alt = ((Number.isFinite(digit) ? digit : 0) + 1 + Math.floor(rng() * 8)) % 10;
  const next = [...parts];
  next[idx] = String(alt);
  // Ensure different
  if (next.join("-") === parts.join("-")) {
    next[idx] = String((alt + 1) % 10);
  }
  return next.join("-");
}

function wrongSymbolCount(answer: number, rng: () => number): number {
  const delta = rng() < 0.5 ? -1 : 1;
  const candidate = answer + delta;
  if (candidate >= 0) return candidate;
  return answer + 1;
}

/** Produce a graded-wrong response for the item type. */
export function wrongAnswerForItem(
  item: Item,
  rng: () => number,
): string | number | string[] {
  switch (item.type) {
    case "mcq":
      return pickWrongChoice(item, rng);
    case "digit_span":
      return wrongDigitSpan(String(item.answer), rng);
    case "symbol_search": {
      const n = typeof item.answer === "number" ? item.answer : Number(item.answer);
      return wrongSymbolCount(Number.isFinite(n) ? n : 0, rng);
    }
    default:
      return `wrong-${String(item.answer)}`;
  }
}

export function chooseAnswer(
  item: Item,
  correct: boolean,
  rng: () => number,
): string | number | string[] {
  if (correct) return item.answer;
  return wrongAnswerForItem(item, rng);
}

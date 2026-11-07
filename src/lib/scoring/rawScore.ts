import type { Item } from "@/lib/content/types";

export type ItemScore = {
  correct: boolean;
  rawScore: number;
};

function normalizeAnswer(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(String).join("-");
  }
  return String(value).trim();
}

function answersEqual(
  expected: Item["answer"],
  actual: string | number | string[],
): boolean {
  if (typeof expected === "number" && typeof actual === "number") {
    return expected === actual;
  }
  return normalizeAnswer(expected) === normalizeAnswer(actual);
}

/** Score a single item: correct → rawScore 1, else 0 (MVP unit scoring). */
export function scoreItem(
  item: Item,
  answer: string | number | string[],
): ItemScore {
  const correct = answersEqual(item.answer, answer);
  return { correct, rawScore: correct ? 1 : 0 };
}

/** Sum item raw scores for a subtest. */
export function sumRawScores(scores: ItemScore[]): number {
  return scores.reduce((acc, s) => acc + s.rawScore, 0);
}

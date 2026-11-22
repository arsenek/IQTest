import { describe, expect, it } from "vitest";
import {
  difficultyFromIndex,
  effectiveItemDifficulty,
  probabilityCorrect,
  sampleLatencyMs,
} from "@/lib/sim/ability";
import { chooseAnswer, wrongAnswerForItem } from "@/lib/sim/answers";
import { createSeededRng } from "@/lib/sim/rng";
import type { Item } from "@/lib/content/types";

describe("sim ability → probability", () => {
  it("higher ability beats lower ability at same difficulty", () => {
    expect(probabilityCorrect(0.9, 0.5)).toBeGreaterThan(
      probabilityCorrect(0.2, 0.5),
    );
  });

  it("harder items are less likely correct at fixed ability", () => {
    expect(probabilityCorrect(0.5, 0.1)).toBeGreaterThan(
      probabilityCorrect(0.5, 0.9),
    );
  });

  it("stays within floor/ceiling", () => {
    expect(probabilityCorrect(0, 1)).toBeGreaterThanOrEqual(0.05);
    expect(probabilityCorrect(1, 0)).toBeLessThanOrEqual(0.97);
  });

  it("steeper slope separates abilities more than a flat model", () => {
    const gap =
      probabilityCorrect(0.85, 0.5) - probabilityCorrect(0.25, 0.5);
    expect(gap).toBeGreaterThan(0.55);
  });

  it("difficultyFromIndex spans 0..1", () => {
    expect(difficultyFromIndex(0, 5)).toBe(0);
    expect(difficultyFromIndex(4, 5)).toBe(1);
  });

  it("digit_span effective difficulty rises with length", () => {
    const short: Item = {
      id: "s",
      type: "digit_span",
      prompt: "x",
      answer: "1-2",
    };
    const long: Item = {
      id: "l",
      type: "digit_span",
      prompt: "x",
      answer: "1-2-3-4-5-6-7-8",
    };
    expect(effectiveItemDifficulty(long, 0.5)).toBeGreaterThan(
      effectiveItemDifficulty(short, 0.5),
    );
  });
});

describe("sim latency", () => {
  it("higher ability tends faster (same seed path shape)", () => {
    const slow = sampleLatencyMs(
      { itemType: "mcq", ability: 0.1, difficulty: 0.5 },
      createSeededRng(1),
    );
    const fast = sampleLatencyMs(
      { itemType: "mcq", ability: 0.95, difficulty: 0.5 },
      createSeededRng(1),
    );
    expect(fast).toBeLessThan(slow);
  });

  it("returns positive finite ms", () => {
    const ms = sampleLatencyMs(
      {
        itemType: "digit_span",
        ability: 0.5,
        difficulty: 0.5,
        timeLimitMs: 45000,
      },
      createSeededRng(42),
    );
    expect(ms).toBeGreaterThan(0);
    expect(Number.isFinite(ms)).toBe(true);
  });
});

describe("sim wrong answers", () => {
  const mcq: Item = {
    id: "t-mcq",
    type: "mcq",
    prompt: "x",
    choices: [
      { label: "A" },
      { label: "B" },
      { label: "C" },
    ],
    answer: "B",
  };

  it("wrong mcq is not the key", () => {
    const rng = createSeededRng(9);
    for (let i = 0; i < 20; i++) {
      expect(wrongAnswerForItem(mcq, rng)).not.toBe("B");
    }
  });

  it("chooseAnswer returns key when correct", () => {
    expect(chooseAnswer(mcq, true, createSeededRng(1))).toBe("B");
  });

  it("wrong digit_span differs from key", () => {
    const item: Item = {
      id: "t-ds",
      type: "digit_span",
      prompt: "x",
      answer: "1-2-3",
    };
    expect(wrongAnswerForItem(item, createSeededRng(3))).not.toBe("1-2-3");
  });
});

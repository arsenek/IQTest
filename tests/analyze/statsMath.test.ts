import { describe, expect, it } from "vitest";
import { highLowDiff, median, pearson } from "@/lib/analyze/statsMath";

describe("statsMath", () => {
  it("median odd/even", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it("pearson perfect positive", () => {
    const r = pearson([0, 0, 1, 1], [1, 1, 2, 2]);
    expect(r).toBe(1);
  });

  it("pearson null on zero variance", () => {
    expect(pearson([1, 1, 1], [1, 2, 3])).toBeNull();
  });

  it("highLowDiff separates extremes", () => {
    const item = [0, 0, 0, 1, 1, 1];
    const crit = [1, 2, 3, 8, 9, 10];
    const d = highLowDiff(item, crit, 0.33);
    expect(d).toBe(1);
  });
});

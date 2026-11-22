import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runAnalysis } from "@/lib/analyze/runAnalysis";
import { parseJsonl, rowsToCsv, parseCsv } from "@/lib/export/format";

const fixturePath = path.resolve(
  __dirname,
  "../fixtures/stage-a-export/responses.jsonl",
);

function loadFixture() {
  return parseJsonl(fs.readFileSync(fixturePath, "utf8"));
}

describe("stage-A pilot item stats (fixture)", () => {
  const result = runAnalysis(loadFixture(), { minN: 20 });

  it("excludes inferred skip/timeout from analyzed rows", () => {
    // 24 sessions × 6 adult items + 4 child + 2 skip/timeout = 150
    expect(result.meta.inputRows).toBe(150);
    expect(result.meta.analyzedRows).toBe(148);
    expect(result.meta.skippedRows).toBe(2);
    expect(result.meta.disclaimer).toMatch(/not standardized IQ/i);
  });

  it("flags too_easy / too_hard with expected p", () => {
    const easy = result.itemStats.find((s) => s.itemId === "item-easy")!;
    const hard = result.itemStats.find((s) => s.itemId === "item-hard")!;
    expect(easy.n).toBe(24);
    expect(easy.p!).toBeCloseTo(23 / 24, 4);
    expect(easy.flags).toContain("too_easy");
    expect(hard.p!).toBeCloseTo(1 / 24, 4);
    expect(hard.flags).toContain("too_hard");
  });

  it("high-discrimination item has strong positive point-biserial", () => {
    const disc = result.itemStats.find((s) => s.itemId === "item-disc")!;
    expect(disc.n).toBe(24);
    expect(disc.p!).toBeCloseTo(0.5, 4);
    expect(disc.pointBiserial).not.toBeNull();
    expect(disc.pointBiserial!).toBeGreaterThan(0.5);
    expect(disc.highLowDiff).not.toBeNull();
    expect(disc.highLowDiff!).toBeGreaterThan(0.5);
    expect(disc.flags).not.toContain("low_disc");
  });

  it("noise item is low discrimination", () => {
    const noise = result.itemStats.find((s) => s.itemId === "item-noise")!;
    expect(noise.p!).toBeCloseTo(0.5, 4);
    expect(noise.pointBiserial).not.toBeNull();
    expect(Math.abs(noise.pointBiserial!)).toBeLessThan(0.15);
    expect(noise.flags).toContain("low_disc");
  });

  it("reports median latency per item", () => {
    const easy = result.itemStats.find((s) => s.itemId === "item-easy")!;
    expect(easy.medianLatencyMs).toBe(800);
  });

  it("groups by indexKey and profileKind", () => {
    const vci = result.groupSummaries.find(
      (g) => g.groupBy === "indexKey" && g.indexKey === "VCI",
    )!;
    expect(vci.nItems).toBe(6);
    expect(vci.nResponses).toBe(144);
    expect(vci.meanP).not.toBeNull();

    const child = result.groupSummaries.find(
      (g) => g.groupBy === "profileKind" && g.profileKind === "CHILD",
    )!;
    expect(child.nItems).toBe(1);
    expect(child.flagCounts.low_n).toBe(1);
  });

  it("redFlags is non-empty subset with flags", () => {
    expect(result.redFlags.length).toBeGreaterThan(0);
    expect(result.redFlags.every((s) => s.flags.length > 0)).toBe(true);
  });

  it("CSV round-trip feeds the same analysis", () => {
    const rows = loadFixture();
    const csv = rowsToCsv(rows);
    const parsed = parseCsv(csv);
    expect(parsed).toHaveLength(rows.length);
    const again = runAnalysis(parsed, { minN: 20 });
    expect(again.itemStats.find((s) => s.itemId === "item-disc")!.pointBiserial)
      .toBe(result.itemStats.find((s) => s.itemId === "item-disc")!.pointBiserial);
  });
});

import { describe, it, expect } from "vitest";
import { composeReport } from "@/lib/scoring/composeReport";
import { scaleSubtest } from "@/lib/scoring/scaleScore";
import { scoreItem } from "@/lib/scoring/rawScore";
import type { Item } from "@/lib/content/types";
import type { NormTables } from "@/lib/content/types";

describe("composeReport", () => {
  it("composes four indices and composite", () => {
    const r = composeReport({ VCI: 110, PRI: 100, WMI: 90, PSI: 95 });
    expect(r.composite).toBe(98.75);
    expect(r.vci).toBe(110);
    expect(r.pri).toBe(100);
    expect(r.wmi).toBe(90);
    expect(r.psi).toBe(95);
  });

  it("picks weakest index as narrativeKey", () => {
    const r = composeReport({ VCI: 110, PRI: 100, WMI: 90, PSI: 95 });
    expect(r.narrativeKey).toBe("WMI");
  });
});

describe("scaleSubtest", () => {
  const norms: NormTables = {
    version: "placeholder/v1",
    trial: true,
    ageBands: [
      {
        minAgeMonths: 72,
        maxAgeMonths: 143,
        means: { VCI: 10, PRI: 10, WMI: 10, PSI: 10 },
        sds: { VCI: 3, PRI: 3, WMI: 3, PSI: 3 },
      },
    ],
  };

  it("scales raw via z to mean 100 sd 15", () => {
    // raw 10 → z 0 → 100
    expect(scaleSubtest(10, 96, norms, "VCI")).toBe(100);
    // raw 13 → z 1 → 115
    expect(scaleSubtest(13, 96, norms, "VCI")).toBe(115);
    // raw 7 → z -1 → 85
    expect(scaleSubtest(7, 96, norms, "VCI")).toBe(85);
  });

  it("clamps to 40–160", () => {
    expect(scaleSubtest(100, 96, norms, "VCI")).toBe(160);
    expect(scaleSubtest(-100, 96, norms, "VCI")).toBe(40);
  });
});

describe("scoreItem", () => {
  const mcq: Item = {
    id: "t1",
    type: "mcq",
    prompt: "q",
    choices: [{ label: "a" }, { label: "b" }],
    answer: "a",
  };

  it("scores mcq correct/incorrect", () => {
    expect(scoreItem(mcq, "a")).toEqual({ correct: true, rawScore: 1 });
    expect(scoreItem(mcq, "b")).toEqual({ correct: false, rawScore: 0 });
  });

  it("scores digit_span and symbol_search", () => {
    const span: Item = {
      id: "d1",
      type: "digit_span",
      prompt: "p",
      answer: "1-2-3",
    };
    expect(scoreItem(span, "1-2-3")).toEqual({ correct: true, rawScore: 1 });
    expect(scoreItem(span, "3-2-1")).toEqual({ correct: false, rawScore: 0 });

    const sym: Item = {
      id: "s1",
      type: "symbol_search",
      prompt: "p",
      answer: 3,
    };
    expect(scoreItem(sym, 3)).toEqual({ correct: true, rawScore: 1 });
    expect(scoreItem(sym, 2)).toEqual({ correct: false, rawScore: 0 });
  });
});

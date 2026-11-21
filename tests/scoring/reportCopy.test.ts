import { describe, it, expect } from "vitest";
import {
  dualCoreBlurb,
  indexExplain,
  narrativeParagraph,
  practiceCta,
} from "@/lib/scoring/reportCopy";

describe("reportCopy", () => {
  it("mentions dual cores for child and adult", () => {
    expect(dualCoreBlurb("child")).toMatch(/两关|两/);
    expect(dualCoreBlurb("adult")).toMatch(/两核|两/);
  });

  it("gives parent-facing narrative for child", () => {
    const text = narrativeParagraph("WMI", "child");
    expect(text).toMatch(/家长/);
    expect(text).toMatch(/工作记忆/);
    expect(text).toMatch(/不会改写|正式分/);
  });

  it("gives professional narrative for adult", () => {
    expect(narrativeParagraph("PRI", "adult")).toMatch(/知觉推理|练习池|合成分/);
  });

  it("practice CTAs are clearer when highlighted", () => {
    expect(practiceCta("VCI", "child", true)).toMatch(/练习室/);
    expect(practiceCta("VCI", "adult", true)).toMatch(/薄弱|练习/);
    expect(indexExplain("PSI", "child").length).toBeGreaterThan(6);
  });
});

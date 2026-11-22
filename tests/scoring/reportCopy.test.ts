import { describe, it, expect } from "vitest";
import {
  compositeScoreHint,
  compositeScoreLabel,
  dualCoreBlurb,
  indexExplain,
  narrativeParagraph,
  practiceCta,
  reportComplianceNote,
  stageBadgeLabel,
} from "@/lib/scoring/reportCopy";

describe("reportCopy", () => {
  it("mentions dual cores for child and adult", () => {
    expect(dualCoreBlurb("child")).toMatch(/两关|两/);
    expect(dualCoreBlurb("adult")).toMatch(/两核|两/);
  });

  it("trial dual-core blurb forbids standardized IQ framing", () => {
    const child = dualCoreBlurb("child", "trial");
    const adult = dualCoreBlurb("adult", "trial");
    expect(child).toMatch(/试运行能力分数|非正式 IQ/);
    expect(adult).toMatch(/非正式 IQ/);
    // Negation framing is required (「不是已标准化…」OK; bare claim not)
    expect(child).toMatch(/不是已标准化智商|非正式 IQ/);
    expect(adult).toMatch(/非标准化 IQ|非全国百分位|非诊断/);
    expect(child).not.toMatch(/(?<!不是)已标准化智商鉴定/);
    expect(adult).not.toMatch(/全国百分位排名为|诊断为/);
  });

  it("gives parent-facing trial narrative for child", () => {
    const text = narrativeParagraph("WMI", "child", "trial");
    expect(text).toMatch(/家长/);
    expect(text).toMatch(/工作记忆/);
    expect(text).toMatch(/非正式 IQ|试运行能力分数/);
    expect(text).toMatch(/不是已标准化智商|非正式 IQ/);
  });

  it("gives professional trial narrative for adult", () => {
    const text = narrativeParagraph("PRI", "adult", "trial");
    expect(text).toMatch(/知觉推理|练习池|合成分/);
    expect(text).toMatch(/非正式 IQ/);
    expect(text).toMatch(/非.*诊断|不可解读为.*诊断/);
  });

  it("composite labels stay honest in trial", () => {
    expect(compositeScoreLabel("trial")).toMatch(/非正式 IQ/);
    expect(compositeScoreHint("trial")).toMatch(/非正式 IQ/);
    expect(compositeScoreHint("trial")).toMatch(/非全国百分位/);
    expect(stageBadgeLabel("trial")).toBe("试运行");
    expect(reportComplianceNote("trial")).toMatch(/非正式 IQ/);
    expect(reportComplianceNote("trial")).not.toMatch(/已标准化智商鉴定/);
  });

  it("reserves calibrated/standardized copy branches", () => {
    expect(stageBadgeLabel("calibrated")).toMatch(/校准/);
    expect(stageBadgeLabel("standardized")).toMatch(/标准化常模/);
    expect(compositeScoreLabel("calibrated")).toMatch(/校准/);
    expect(dualCoreBlurb("adult", "standardized")).toMatch(/非诊断/);
  });

  it("practice CTAs are clearer when highlighted", () => {
    expect(practiceCta("VCI", "child", true)).toMatch(/练习室/);
    expect(practiceCta("VCI", "adult", true)).toMatch(/薄弱|练习/);
    expect(indexExplain("PSI", "child").length).toBeGreaterThan(6);
  });
});

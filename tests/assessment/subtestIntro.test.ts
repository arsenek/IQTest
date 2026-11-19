import { describe, it, expect } from "vitest";
import { helpForSubtest } from "@/components/assessment/SubtestIntro";

describe("SubtestIntro help copy", () => {
  it("returns child-specific one-liners for each dual-core subtest", () => {
    const ids = [
      "child-vci-vocab",
      "child-vci-analogy",
      "child-pri-matrix",
      "child-pri-sequence",
      "child-wmi-digits",
      "child-wmi-reverse-short",
      "child-psi-symbols",
      "child-psi-pairing",
    ];
    for (const id of ids) {
      const help = helpForSubtest(id, "child");
      expect(help.length).toBeGreaterThan(6);
      expect(help).not.toMatch(/wechsler|WAIS|WISC/i);
    }
  });

  it("returns professional adult copy for dual-core subtests", () => {
    expect(helpForSubtest("adult-pri-sequence", "adult")).toMatch(/序列|补全/);
    expect(helpForSubtest("adult-wmi-reverse-short", "adult")).toMatch(/反向|复述/);
  });

  it("falls back safely for unknown subtest ids", () => {
    expect(helpForSubtest("unknown-id", "child")).toMatch(/仔细|选/);
    expect(helpForSubtest("unknown-id", "adult")).toMatch(/说明|作答/);
  });
});

import { loadPack } from "@/lib/content/loadPack";
import { loadNorms } from "@/lib/content/loadNorms";
import { describe, it, expect } from "vitest";

describe("loadPack", () => {
  it("child/v1 exposes VCI PRI WMI PSI", () => {
    const pack = loadPack("child/v1");
    const keys = new Set(pack.subtests.map((s) => s.indexKey));
    expect(keys).toEqual(new Set(["VCI", "PRI", "WMI", "PSI"]));
  });

  it("child/v1 mcq choices include glyphs and digit_span has encode+mask", () => {
    const pack = loadPack("child/v1");
    const vci = pack.subtests.find((s) => s.indexKey === "VCI")!.items[0];
    expect(vci.choices?.[0]).toMatchObject({
      label: "一种水果",
      glyph: expect.any(String),
    });
    const wmi = pack.subtests.find((s) => s.indexKey === "WMI")!.items[0];
    expect(wmi.encodeMs).toBeGreaterThan(0);
    expect(wmi.maskStem).toBe(true);
  });

  it("adult/v1 exposes VCI PRI WMI PSI", () => {
    const pack = loadPack("adult/v1");
    const keys = new Set(pack.subtests.map((s) => s.indexKey));
    expect(keys).toEqual(new Set(["VCI", "PRI", "WMI", "PSI"]));
  });

  it("adult/v1 digit_span items use encode+mask", () => {
    const pack = loadPack("adult/v1");
    const wmi = pack.subtests.find((s) => s.indexKey === "WMI")!.items;
    expect(wmi.every((i) => i.encodeMs && i.maskStem)).toBe(true);
  });

  it("rejects unknown pack id", () => {
    expect(() => loadPack("missing/v9")).toThrow(/unknown pack/i);
  });
});

describe("loadNorms", () => {
  it("loads placeholder trial norms", () => {
    const norms = loadNorms("placeholder/v1");
    expect(norms.version).toBe("placeholder/v1");
    expect(norms.trial).toBe(true);
    expect(norms.ageBands.length).toBeGreaterThan(0);
  });
});

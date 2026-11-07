import { loadPack } from "@/lib/content/loadPack";
import { loadNorms } from "@/lib/content/loadNorms";
import { INDEX_KEYS } from "@/lib/content/types";
import { describe, it, expect } from "vitest";

describe("loadPack", () => {
  it("child/v1 exposes VCI PRI WMI PSI with ≥8 items each", () => {
    const pack = loadPack("child/v1");
    const keys = new Set(pack.subtests.map((s) => s.indexKey));
    expect(keys).toEqual(new Set(INDEX_KEYS));
    for (const key of INDEX_KEYS) {
      const count = pack.subtests
        .filter((s) => s.indexKey === key)
        .reduce((n, s) => n + s.items.length, 0);
      expect(count, key).toBeGreaterThanOrEqual(8);
    }
  });

  it("child/v1 mcq choices include glyphs and digit_span has encode+mask", () => {
    const pack = loadPack("child/v1");
    const vci = pack.subtests.find((s) => s.indexKey === "VCI")!.items[0];
    expect(vci.choices?.[0]).toMatchObject({
      label: expect.any(String),
      glyph: expect.any(String),
    });
    const wmi = pack.subtests.find((s) => s.indexKey === "WMI")!.items;
    expect(wmi.every((i) => i.encodeMs && i.maskStem)).toBe(true);
  });

  it("adult/v1 exposes VCI PRI WMI PSI with ≥8 items each", () => {
    const pack = loadPack("adult/v1");
    const keys = new Set(pack.subtests.map((s) => s.indexKey));
    expect(keys).toEqual(new Set(INDEX_KEYS));
    for (const key of INDEX_KEYS) {
      const count = pack.subtests
        .filter((s) => s.indexKey === key)
        .reduce((n, s) => n + s.items.length, 0);
      expect(count, key).toBeGreaterThanOrEqual(8);
    }
  });

  it("adult/v1 digit_span items use encode+mask", () => {
    const pack = loadPack("adult/v1");
    const wmi = pack.subtests.find((s) => s.indexKey === "WMI")!.items;
    expect(wmi.every((i) => i.encodeMs && i.maskStem)).toBe(true);
  });

  it("child/e2e remains a short independent fixture", () => {
    const pack = loadPack("child/e2e");
    const total = pack.subtests.reduce((n, s) => n + s.items.length, 0);
    expect(total).toBeLessThan(10);
    expect(pack.id).toBe("child/e2e");
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

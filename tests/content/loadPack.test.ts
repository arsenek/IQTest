import { loadPack } from "@/lib/content/loadPack";
import { loadNorms } from "@/lib/content/loadNorms";
import { INDEX_KEYS } from "@/lib/content/types";
import { describe, it, expect } from "vitest";

function countByIndex(packId: string) {
  const pack = loadPack(packId);
  const counts: Record<string, number> = {};
  for (const key of INDEX_KEYS) {
    counts[key] = pack.subtests
      .filter((s) => s.indexKey === key)
      .reduce((n, s) => n + s.items.length, 0);
  }
  return { pack, counts };
}

describe("loadPack", () => {
  it("child/v1 exposes VCI PRI WMI PSI with ≥16 items each", () => {
    const { pack, counts } = countByIndex("child/v1");
    const keys = new Set(pack.subtests.map((s) => s.indexKey));
    expect(keys).toEqual(new Set(INDEX_KEYS));
    for (const key of INDEX_KEYS) {
      expect(counts[key], key).toBeGreaterThanOrEqual(16);
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

  it("child/v1 WMI is ordered and PRI items carry SVG image paths", () => {
    const pack = loadPack("child/v1");
    const wmi = pack.subtests.find((s) => s.indexKey === "WMI")!;
    expect(wmi.ordered).toBe(true);
    const pri = pack.subtests.find((s) => s.indexKey === "PRI")!.items;
    expect(pri.every((i) => typeof i.image === "string" && i.image.includes("/media/"))).toBe(
      true,
    );
  });

  it("child/v1 PSI answer keys are dispersed (not nearly all identical)", () => {
    const pack = loadPack("child/v1");
    const answers = pack.subtests
      .find((s) => s.indexKey === "PSI")!
      .items.map((i) => i.answer);
    const unique = new Set(answers);
    expect(unique.size).toBeGreaterThanOrEqual(3);
    const modeCount = Math.max(
      ...[...unique].map((v) => answers.filter((a) => a === v).length),
    );
    expect(modeCount / answers.length).toBeLessThan(0.6);
  });

  it("adult/v1 exposes VCI PRI WMI PSI with ≥16 items each", () => {
    const { pack, counts } = countByIndex("adult/v1");
    const keys = new Set(pack.subtests.map((s) => s.indexKey));
    expect(keys).toEqual(new Set(INDEX_KEYS));
    for (const key of INDEX_KEYS) {
      expect(counts[key], key).toBeGreaterThanOrEqual(16);
    }
  });

  it("adult/v1 digit_span items use encode+mask; WMI ordered; PRI has image", () => {
    const pack = loadPack("adult/v1");
    const wmi = pack.subtests.find((s) => s.indexKey === "WMI")!;
    expect(wmi.ordered).toBe(true);
    expect(wmi.items.every((i) => i.encodeMs && i.maskStem)).toBe(true);
    const pri = pack.subtests.find((s) => s.indexKey === "PRI")!.items;
    expect(pri.every((i) => typeof i.image === "string" && i.image.length > 0)).toBe(
      true,
    );
  });

  it("adult/v1 PSI answer keys are dispersed", () => {
    const pack = loadPack("adult/v1");
    const answers = pack.subtests
      .find((s) => s.indexKey === "PSI")!
      .items.map((i) => i.answer);
    expect(new Set(answers).size).toBeGreaterThanOrEqual(3);
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
  it("loads placeholder trial norms with mean ≤ pack max raw", () => {
    const norms = loadNorms("placeholder/v1");
    expect(norms.version).toBe("placeholder/v1");
    expect(norms.trial).toBe(true);
    expect(norms.ageBands.length).toBeGreaterThan(0);

    const child = loadPack("child/v1");
    const maxRaw = Math.max(
      ...INDEX_KEYS.map((key) =>
        child.subtests
          .filter((s) => s.indexKey === key)
          .reduce((n, s) => n + s.items.length, 0),
      ),
    );
    for (const band of norms.ageBands) {
      for (const key of INDEX_KEYS) {
        expect(band.means[key], `${band.minAgeMonths}-${key}`).toBeLessThanOrEqual(
          maxRaw,
        );
      }
    }
  });
});

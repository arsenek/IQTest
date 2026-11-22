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

function subtestsByIndex(packId: string, key: string) {
  return loadPack(packId).subtests.filter((s) => s.indexKey === key);
}

describe("loadPack", () => {
  it("child/v1 exposes dual cores per index (≥16 + 6–8)", () => {
    const { pack, counts } = countByIndex("child/v1");
    const keys = new Set(pack.subtests.map((s) => s.indexKey));
    expect(keys).toEqual(new Set(INDEX_KEYS));
    for (const key of INDEX_KEYS) {
      const subs = pack.subtests.filter((s) => s.indexKey === key);
      expect(subs.length, key).toBeGreaterThanOrEqual(2);
      expect(subs[0].items.length, `${key} core1`).toBe(16);
      expect(subs[1].items.length, `${key} core2`).toBeGreaterThanOrEqual(6);
      expect(subs[1].items.length, `${key} core2`).toBeLessThanOrEqual(8);
      expect(counts[key], key).toBe(subs[0].items.length + subs[1].items.length);
    }
  });

  it("child/v1 battery order is VCI→PRI→WMI→PSI with core1 then core2", () => {
    const pack = loadPack("child/v1");
    expect(pack.subtests.map((s) => s.indexKey)).toEqual([
      "VCI",
      "VCI",
      "PRI",
      "PRI",
      "WMI",
      "WMI",
      "PSI",
      "PSI",
    ]);
  });

  it("child/v1 mcq choices include glyphs and digit_span has encode+mask", () => {
    const pack = loadPack("child/v1");
    const vci = pack.subtests.find((s) => s.indexKey === "VCI")!.items[0];
    expect(vci.choices?.[0]).toMatchObject({
      label: expect.any(String),
      glyph: expect.any(String),
    });
    const wmiItems = pack.subtests
      .filter((s) => s.indexKey === "WMI")
      .flatMap((s) => s.items);
    expect(wmiItems.every((i) => i.encodeMs && i.maskStem)).toBe(true);
  });

  it("child/v1 WMI cores are ordered and all PRI items carry SVG image paths", () => {
    const pack = loadPack("child/v1");
    for (const wmi of pack.subtests.filter((s) => s.indexKey === "WMI")) {
      expect(wmi.ordered).toBe(true);
    }
    const pri = pack.subtests
      .filter((s) => s.indexKey === "PRI")
      .flatMap((s) => s.items);
    expect(
      pri.every((i) => typeof i.image === "string" && i.image.includes("/media/")),
    ).toBe(true);
  });

  it("child/v1 PSI answer keys are dispersed across both cores", () => {
    const pack = loadPack("child/v1");
    const answers = pack.subtests
      .filter((s) => s.indexKey === "PSI")
      .flatMap((s) => s.items)
      .map((i) => i.answer);
    const unique = new Set(answers);
    expect(unique.size).toBeGreaterThanOrEqual(3);
    const modeCount = Math.max(
      ...[...unique].map((v) => answers.filter((a) => a === v).length),
    );
    expect(modeCount / answers.length).toBeLessThan(0.6);
  });

  it("adult/v1 exposes dual cores per index (≥16 + 6–8)", () => {
    const { pack, counts } = countByIndex("adult/v1");
    const keys = new Set(pack.subtests.map((s) => s.indexKey));
    expect(keys).toEqual(new Set(INDEX_KEYS));
    for (const key of INDEX_KEYS) {
      const subs = pack.subtests.filter((s) => s.indexKey === key);
      expect(subs.length, key).toBeGreaterThanOrEqual(2);
      expect(subs[0].items.length, `${key} core1`).toBe(16);
      expect(subs[1].items.length, `${key} core2`).toBeGreaterThanOrEqual(6);
      expect(subs[1].items.length, `${key} core2`).toBeLessThanOrEqual(8);
      expect(counts[key], key).toBeGreaterThanOrEqual(22);
    }
  });

  it("adult/v1 digit_span items use encode+mask; WMI ordered; PRI has image", () => {
    const pack = loadPack("adult/v1");
    for (const wmi of pack.subtests.filter((s) => s.indexKey === "WMI")) {
      expect(wmi.ordered).toBe(true);
      expect(wmi.items.every((i) => i.encodeMs && i.maskStem)).toBe(true);
    }
    const pri = pack.subtests
      .filter((s) => s.indexKey === "PRI")
      .flatMap((s) => s.items);
    expect(pri.every((i) => typeof i.image === "string" && i.image.length > 0)).toBe(
      true,
    );
  });

  it("adult/v1 PSI answer keys are dispersed", () => {
    const pack = loadPack("adult/v1");
    const answers = pack.subtests
      .filter((s) => s.indexKey === "PSI")
      .flatMap((s) => s.items)
      .map((i) => i.answer);
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

  it("second cores use expected item types", () => {
    for (const packId of ["child/v1", "adult/v1"] as const) {
      const vci2 = subtestsByIndex(packId, "VCI")[1];
      const pri2 = subtestsByIndex(packId, "PRI")[1];
      const wmi2 = subtestsByIndex(packId, "WMI")[1];
      const psi2 = subtestsByIndex(packId, "PSI")[1];
      expect(vci2.items.every((i) => i.type === "mcq")).toBe(true);
      expect(pri2.items.every((i) => i.type === "mcq" && i.image)).toBe(true);
      expect(wmi2.items.every((i) => i.type === "digit_span")).toBe(true);
      expect(wmi2.ordered).toBe(true);
      expect(psi2.items.every((i) => i.type === "symbol_search")).toBe(true);
    }
  });
});

describe("loadNorms", () => {
  it("loads placeholder trial norms with mean ≤ that index max raw", () => {
    const norms = loadNorms("placeholder/v1");
    expect(norms.version).toBe("placeholder/v1");
    expect(norms.stage).toBe("trial");
    expect(norms.trial).toBe(true);
    expect(norms.ageBands.length).toBeGreaterThan(0);

    const child = loadPack("child/v1");
    const adult = loadPack("adult/v1");
    const maxRawFor = (pack: ReturnType<typeof loadPack>, key: (typeof INDEX_KEYS)[number]) =>
      pack.subtests
        .filter((s) => s.indexKey === key)
        .reduce((n, s) => n + s.items.length, 0);

    for (const key of INDEX_KEYS) {
      const childMax = maxRawFor(child, key);
      const adultMax = maxRawFor(adult, key);
      expect(childMax).toBeGreaterThanOrEqual(22);
      expect(childMax).toBeLessThanOrEqual(24);
      expect(adultMax).toBeGreaterThanOrEqual(22);
      expect(adultMax).toBeLessThanOrEqual(24);
      for (const band of norms.ageBands) {
        const packMax = band.minAgeMonths >= 192 ? adultMax : childMax;
        expect(band.means[key], `${band.minAgeMonths}-${key}`).toBeLessThanOrEqual(
          packMax,
        );
      }
    }

    // PRI rebuilt as harder 3×3 / multi-rule items: adult-band placeholder
    // mean should sit below the other indices (which still use the old means).
    const adultBand = norms.ageBands.find((b) => b.minAgeMonths >= 192)!;
    expect(adultBand.means.PRI).toBeLessThan(adultBand.means.VCI);
    expect(adultBand.means.PRI).toBeLessThanOrEqual(11);
  });
});

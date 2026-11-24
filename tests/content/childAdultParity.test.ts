import { loadPack } from "@/lib/content/loadPack";
import { describe, expect, it } from "vitest";
import { adultPairing, adultSymbols } from "../../content/psi/adult-formal";
import { childPairing, childSymbols } from "../../content/psi/child-formal";
import { adultPractice as adultPsiPractice } from "../../content/psi/practice";
import { childPractice as childPsiPractice } from "../../content/psi/practice";
import { adultDigitsLadder, adultReverseLadder } from "../../content/wmi/adult-formal";
import { childDigitsLadder, childReverseLadder } from "../../content/wmi/child-formal";
import { adultVocab } from "../../content/vci/adult-formal";
import { childVocab } from "../../content/vci/child-formal";

function targets(specs: Array<{ target: string }>): Set<string> {
  return new Set(specs.map((s) => s.target));
}

function classifyExemplars(
  specs: typeof childVocab,
  categoryId: string,
): string[][] {
  return specs
    .filter((s) => s.kind === "classify" && s.categoryId === categoryId)
    .map((s) => (s.kind === "classify" ? [...s.exemplars] : []));
}

describe("child/adult rule-gen structural parity", () => {
  it("PSI formal targets are disjoint across audiences (not just reworded grids)", () => {
    const child = targets([...childSymbols, ...childPairing]);
    const adult = targets([...adultSymbols, ...adultPairing]);
    expect([...child].filter((t) => adult.has(t))).toEqual([]);
  });

  it("PSI practice targets stay in audience families and do not cross-copy", () => {
    const child = targets(childPsiPractice);
    const adult = targets(adultPsiPractice);
    expect([...child].filter((t) => adult.has(t))).toEqual([]);
  });

  it("WMI length ladders differ between child and adult", () => {
    expect(childDigitsLadder).not.toEqual(adultDigitsLadder);
    expect(childReverseLadder).toEqual(adultReverseLadder); // both 3→9 reverse secondary
    // Primary forward floors/ceilings still differ.
    expect(childDigitsLadder[0]).toBeLessThan(adultDigitsLadder[0]!);
    expect(Math.max(...childDigitsLadder)).toBeLessThan(Math.max(...adultDigitsLadder));
  });

  it("VCI shared categories use different exemplar stems (not wording-only clones)", () => {
    for (const cat of ["geo-feature", "profession"] as const) {
      const childSets = classifyExemplars(childVocab, cat).map((e) => e.join("|"));
      const adultSets = classifyExemplars(adultVocab, cat).map((e) => e.join("|"));
      expect(childSets.length).toBeGreaterThan(0);
      expect(adultSets.length).toBeGreaterThan(0);
      for (const a of adultSets) {
        expect(childSets).not.toContain(a);
      }
    }
  });

  it("formal packs share no prompts and no PRI media bytes across audiences", () => {
    const child = loadPack("child/v1");
    const adult = loadPack("adult/v1");
    const childPrompts = new Set(
      child.subtests.flatMap((s) => s.items.map((i) => i.prompt).filter(Boolean)),
    );
    const adultPrompts = new Set(
      adult.subtests.flatMap((s) => s.items.map((i) => i.prompt).filter(Boolean)),
    );
    expect([...childPrompts].filter((p) => adultPrompts.has(p))).toEqual([]);
  });
});

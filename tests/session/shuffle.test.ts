import { describe, expect, it } from "vitest";
import { loadPack } from "@/lib/content/loadPack";
import {
  createSeededRng,
  shuffleInPlace,
  shufflePlaylist,
} from "@/lib/session/shuffle";

describe("shufflePlaylist", () => {
  it("is deterministic for a fixed seed", () => {
    const pack = loadPack("child/v1");
    const a = shufflePlaylist(pack, createSeededRng(42));
    const b = shufflePlaylist(pack, createSeededRng(42));
    expect(a).toEqual(b);
  });

  it("differs across seeds for item order within a subtest", () => {
    const pack = loadPack("child/v1");
    const a = shufflePlaylist(pack, createSeededRng(1));
    const b = shufflePlaylist(pack, createSeededRng(999));
    const idsA = a.subtests[0].items.map((i) => i.id);
    const idsB = b.subtests[0].items.map((i) => i.id);
    expect(idsA).not.toEqual(idsB);
  });

  it("preserves item ids and correct MCQ answers after choice shuffle", () => {
    const pack = loadPack("child/v1");
    const originalById = new Map(
      pack.subtests.flatMap((s) => s.items.map((i) => [i.id, i] as const)),
    );
    const shuffled = shufflePlaylist(pack, createSeededRng(7));

    for (const sub of shuffled.subtests) {
      for (const item of sub.items) {
        const orig = originalById.get(item.id)!;
        expect(orig).toBeTruthy();
        expect(item.answer).toEqual(orig.answer);
        if (item.choices && orig.choices) {
          expect(item.choices.map((c) => c.label).sort()).toEqual(
            orig.choices.map((c) => c.label).sort(),
          );
        }
      }
    }
  });

  it("shuffleInPlace with seed 0 is reproducible", () => {
    const first = shuffleInPlace([1, 2, 3, 4, 5], createSeededRng(0));
    const second = shuffleInPlace([1, 2, 3, 4, 5], createSeededRng(0));
    expect(first).toEqual(second);
    expect(first).not.toEqual([1, 2, 3, 4, 5]);
  });

  it("preserves digit_span / ordered WMI item order across seeds", () => {
    const pack = loadPack("child/v1");
    const originalWmi = pack.subtests.find((s) => s.indexKey === "WMI")!;
    expect(originalWmi.ordered).toBe(true);
    const origIds = originalWmi.items.map((i) => i.id);

    for (const seed of [1, 42, 999]) {
      const shuffled = shufflePlaylist(pack, createSeededRng(seed));
      const wmi = shuffled.subtests.find((s) => s.indexKey === "WMI")!;
      expect(wmi.items.map((i) => i.id)).toEqual(origIds);
    }
  });

  it("still shuffles non-ordered subtest item order", () => {
    const pack = loadPack("child/v1");
    const a = shufflePlaylist(pack, createSeededRng(1));
    const b = shufflePlaylist(pack, createSeededRng(999));
    const vciA = a.subtests.find((s) => s.indexKey === "VCI")!.items.map((i) => i.id);
    const vciB = b.subtests.find((s) => s.indexKey === "VCI")!.items.map((i) => i.id);
    expect(vciA).not.toEqual(vciB);
  });
});

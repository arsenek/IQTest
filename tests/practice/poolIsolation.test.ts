import { describe, it, expect } from "vitest";
import { loadPack } from "@/lib/content/loadPack";
import { INDEX_KEYS } from "@/lib/content/types";
import {
  buildPracticeRound,
  practicePackIdForKind,
  formalPackIdForKind,
} from "@/lib/practice/run";
import { createSeededRng } from "@/lib/session/shuffle";

function allItemIds(packId: string): Set<string> {
  const pack = loadPack(packId);
  return new Set(pack.subtests.flatMap((s) => s.items.map((i) => i.id)));
}

describe("practice pool isolation", () => {
  it("child/adult practice packs expose 8–12 items per index", () => {
    for (const packId of ["child/practice/v1", "adult/practice/v1"] as const) {
      const pack = loadPack(packId);
      for (const key of INDEX_KEYS) {
        const n = pack.subtests
          .filter((s) => s.indexKey === key)
          .reduce((sum, s) => sum + s.items.length, 0);
        expect(n, `${packId} ${key}`).toBeGreaterThanOrEqual(8);
        expect(n, `${packId} ${key}`).toBeLessThanOrEqual(12);
      }
    }
  });

  it("practice item ids never overlap formal v1 packs", () => {
    for (const kind of ["CHILD", "ADULT"] as const) {
      const practiceIds = allItemIds(practicePackIdForKind(kind));
      const formalIds = allItemIds(formalPackIdForKind(kind));
      for (const id of practiceIds) {
        expect(formalIds.has(id), `overlap ${id}`).toBe(false);
      }
    }
  });

  it("buildPracticeRound draws only from practice pool (ROUND_SIZE 5)", () => {
    const formal = allItemIds("child/v1");
    const practice = allItemIds("child/practice/v1");
    const round = buildPracticeRound(
      "child/practice/v1",
      "VCI",
      5,
      createSeededRng(42),
    );
    expect(round).toHaveLength(5);
    for (const item of round) {
      expect(practice.has(item.id)).toBe(true);
      expect(formal.has(item.id)).toBe(false);
    }
  });

  it("practice pack ids resolve via loadPack", () => {
    expect(loadPack("child/practice/v1").id).toBe("child/practice/v1");
    expect(loadPack("adult/practice/v1").id).toBe("adult/practice/v1");
  });
});

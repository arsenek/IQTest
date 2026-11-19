import { describe, it, expect } from "vitest";
import {
  indexOrder,
  segmentProgress,
} from "@/lib/assessment/progress";

const playlist = [
  ...Array.from({ length: 16 }, (_, i) => ({
    subtestId: "vci-1",
    indexKey: "VCI",
    id: `vci1-${i}`,
  })),
  ...Array.from({ length: 7 }, (_, i) => ({
    subtestId: "vci-2",
    indexKey: "VCI",
    id: `vci2-${i}`,
  })),
  ...Array.from({ length: 16 }, (_, i) => ({
    subtestId: "pri-1",
    indexKey: "PRI",
    id: `pri1-${i}`,
  })),
];

describe("segmentProgress", () => {
  it("labels first VCI core at start", () => {
    const s = segmentProgress(playlist, 0)!;
    expect(s.label).toBe("VCI · 第1核");
    expect(s.coreOrdinal).toBe(1);
    expect(s.itemInCore).toBe(1);
    expect(s.itemsInCore).toBe(16);
    expect(s.corePercent).toBe(0);
  });

  it("labels second VCI core after first core completes", () => {
    const s = segmentProgress(playlist, 16)!;
    expect(s.label).toBe("VCI · 第2核");
    expect(s.coreOrdinal).toBe(2);
    expect(s.coresInIndex).toBe(2);
    expect(s.itemInCore).toBe(1);
    expect(s.itemsInCore).toBe(7);
  });

  it("tracks within-core percent", () => {
    const s = segmentProgress(playlist, 8)!;
    expect(s.itemInCore).toBe(9);
    expect(s.corePercent).toBeCloseTo((8 / 16) * 100);
  });

  it("indexOrder follows playlist appearance", () => {
    expect(indexOrder(playlist)).toEqual(["VCI", "PRI"]);
  });
});

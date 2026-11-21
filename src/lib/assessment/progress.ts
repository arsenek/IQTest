import type { IndexKey } from "@/lib/content/types";

export type ProgressItem = {
  subtestId: string;
  indexKey: string;
};

export type SegmentProgress = {
  indexKey: string;
  /** 1-based core ordinal within this index (1 = first core). */
  coreOrdinal: number;
  /** How many cores this index has in the playlist. */
  coresInIndex: number;
  /** 1-based item position within the current core. */
  itemInCore: number;
  /** Item count of the current core. */
  itemsInCore: number;
  /** 0–100 progress within the current core. */
  corePercent: number;
  /** Human label e.g. "VCI · 第1核". */
  label: string;
};

/**
 * Segment progress by index + core (subtest), not a flat 0–N bar.
 */
export function segmentProgress(
  items: ProgressItem[],
  globalIndex: number,
): SegmentProgress | null {
  if (items.length === 0 || globalIndex < 0 || globalIndex >= items.length) {
    return null;
  }
  const current = items[globalIndex];
  const indexKey = current.indexKey;

  const cores: string[] = [];
  for (const item of items) {
    if (item.indexKey !== indexKey) continue;
    if (!cores.includes(item.subtestId)) cores.push(item.subtestId);
  }
  const coreOrdinal = cores.indexOf(current.subtestId) + 1;
  const coresInIndex = cores.length;

  const coreItems = items
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => item.subtestId === current.subtestId);
  const pos = coreItems.findIndex(({ i }) => i === globalIndex);
  const itemInCore = pos + 1;
  const itemsInCore = coreItems.length;
  const corePercent =
    itemsInCore === 0 ? 100 : Math.min(100, (pos / itemsInCore) * 100);

  return {
    indexKey,
    coreOrdinal,
    coresInIndex,
    itemInCore,
    itemsInCore,
    corePercent,
    label: `${indexKey} · 第${coreOrdinal}核`,
  };
}

/** Ordered unique index keys as they appear in the playlist. */
export function indexOrder(items: ProgressItem[]): IndexKey[] {
  const out: IndexKey[] = [];
  for (const item of items) {
    const key = item.indexKey as IndexKey;
    if (!out.includes(key)) out.push(key);
  }
  return out;
}

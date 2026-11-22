import { mean, median, round4 } from "./statsMath";
import type { GroupSummary, ItemFlag, ItemStat } from "./types";

const FLAG_KEYS: ItemFlag[] = [
  "low_n",
  "too_easy",
  "too_hard",
  "low_disc",
  "slow",
];

function emptyFlagCounts(): Record<ItemFlag, number> {
  return {
    low_n: 0,
    too_easy: 0,
    too_hard: 0,
    low_disc: 0,
    slow: 0,
  };
}

function summarize(
  items: ItemStat[],
  groupBy: GroupSummary["groupBy"],
  indexKey: string | null,
  profileKind: "CHILD" | "ADULT" | null,
): GroupSummary {
  const ps = items.map((i) => i.p).filter((p): p is number => p !== null);
  const rs = items
    .map((i) => i.pointBiserial)
    .filter((r): r is number => r !== null);
  const flagCounts = emptyFlagCounts();
  for (const item of items) {
    for (const f of item.flags) flagCounts[f]++;
  }
  return {
    groupBy,
    indexKey,
    profileKind,
    nItems: items.length,
    nResponses: items.reduce((a, i) => a + i.n, 0),
    meanP: round4(mean(ps)),
    medianP: round4(median(ps)),
    meanPointBiserial: round4(mean(rs)),
    flagCounts,
  };
}

export function computeGroupSummaries(itemStats: ItemStat[]): GroupSummary[] {
  const byIndex = new Map<string, ItemStat[]>();
  const byKind = new Map<"CHILD" | "ADULT", ItemStat[]>();
  const byBoth = new Map<string, ItemStat[]>();

  for (const item of itemStats) {
    const ik = byIndex.get(item.indexKey) ?? [];
    ik.push(item);
    byIndex.set(item.indexKey, ik);

    const pk = byKind.get(item.profileKind) ?? [];
    pk.push(item);
    byKind.set(item.profileKind, pk);

    const bothKey = `${item.indexKey}\0${item.profileKind}`;
    const both = byBoth.get(bothKey) ?? [];
    both.push(item);
    byBoth.set(bothKey, both);
  }

  const out: GroupSummary[] = [];
  for (const [indexKey, items] of [...byIndex.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    out.push(summarize(items, "indexKey", indexKey, null));
  }
  for (const kind of ["ADULT", "CHILD"] as const) {
    const items = byKind.get(kind);
    if (items?.length) out.push(summarize(items, "profileKind", null, kind));
  }
  for (const [k, items] of [...byBoth.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const [indexKey, profileKind] = k.split("\0") as [
      string,
      "CHILD" | "ADULT",
    ];
    out.push(
      summarize(items, "indexKey+profileKind", indexKey, profileKind),
    );
  }
  return out;
}

export function flagKeys(): ItemFlag[] {
  return [...FLAG_KEYS];
}

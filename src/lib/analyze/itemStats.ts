import type { FilteredRow } from "./filterRows";
import { restScore, sessionTotals } from "./sessionTotals";
import { highLowDiff, median, pearson, round4 } from "./statsMath";
import {
  DEFAULT_ANALYZE_OPTIONS,
  type AnalyzeOptions,
  type ItemFlag,
  type ItemStat,
} from "./types";

type ItemKey = string;

function keyOf(row: FilteredRow): ItemKey {
  return `${row.itemId}\0${row.profileKind}\0${row.indexKey}`;
}

function assignFlags(
  stat: Omit<ItemStat, "flags">,
  opts: AnalyzeOptions,
  indexMedianLatency: Map<string, number | null>,
): ItemFlag[] {
  const flags: ItemFlag[] = [];
  if (stat.n < opts.minN) {
    flags.push("low_n");
    return flags;
  }
  if (stat.p !== null && stat.p >= opts.easyThreshold) flags.push("too_easy");
  if (stat.p !== null && stat.p <= opts.hardThreshold) flags.push("too_hard");

  const weakR =
    stat.pointBiserial !== null &&
    stat.pointBiserial < opts.minPointBiserial;
  const weakHl =
    stat.pointBiserial === null &&
    stat.highLowDiff !== null &&
    stat.highLowDiff < opts.minHighLowDiff;
  if (weakR || weakHl) flags.push("low_disc");

  const idxMed = indexMedianLatency.get(stat.indexKey);
  if (
    stat.medianLatencyMs !== null &&
    idxMed !== null &&
    idxMed !== undefined &&
    idxMed > 0 &&
    stat.medianLatencyMs > idxMed * 2
  ) {
    flags.push("slow");
  }
  return flags;
}

export function computeItemStats(
  rows: FilteredRow[],
  options: Partial<AnalyzeOptions> = {},
): ItemStat[] {
  const opts: AnalyzeOptions = { ...DEFAULT_ANALYZE_OPTIONS, ...options };
  const totals = sessionTotals(rows);

  const groups = new Map<ItemKey, FilteredRow[]>();
  for (const row of rows) {
    const k = keyOf(row);
    const list = groups.get(k);
    if (list) list.push(row);
    else groups.set(k, [row]);
  }

  // First pass: p and latency per item; collect latencies by index for slow flag.
  const prelim: Array<{
    key: ItemKey;
    rows: FilteredRow[];
    n: number;
    nSessions: number;
    p: number | null;
    pointBiserial: number | null;
    highLowDiff: number | null;
    medianLatencyMs: number | null;
    itemId: string;
    subtestId: string;
    indexKey: string;
    profileKind: "CHILD" | "ADULT";
  }> = [];

  const latenciesByIndex = new Map<string, number[]>();

  for (const [, itemRows] of groups) {
    const first = itemRows[0]!;
    const scores = itemRows.map((r) => r.score);
    const latencies = itemRows.map((r) => r.latencyMs);
    const sessions = new Set(itemRows.map((r) => r.sessionId));
    const p = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    const criterion = itemRows.map((r) =>
      restScore(totals, r.sessionId, r.score),
    );
    const rpb =
      scores.length >= 2 ? pearson(scores, criterion) : null;
    const hl =
      scores.length >= 2
        ? highLowDiff(scores, criterion, opts.highLowFraction)
        : null;
    const medLat = median(latencies);

    const idxList = latenciesByIndex.get(first.indexKey) ?? [];
    idxList.push(...latencies);
    latenciesByIndex.set(first.indexKey, idxList);

    prelim.push({
      key: keyOf(first),
      rows: itemRows,
      n: itemRows.length,
      nSessions: sessions.size,
      p,
      pointBiserial: round4(rpb),
      highLowDiff: round4(hl),
      medianLatencyMs: medLat === null ? null : Math.round(medLat),
      itemId: first.itemId,
      subtestId: first.subtestId,
      indexKey: first.indexKey,
      profileKind: first.profileKind,
    });
  }

  const indexMedianLatency = new Map<string, number | null>();
  for (const [ik, vals] of latenciesByIndex) {
    indexMedianLatency.set(ik, median(vals));
  }

  const stats: ItemStat[] = prelim.map((p) => {
    const base = {
      itemId: p.itemId,
      subtestId: p.subtestId,
      indexKey: p.indexKey,
      profileKind: p.profileKind,
      n: p.n,
      nSessions: p.nSessions,
      p: round4(p.p),
      pointBiserial: p.pointBiserial,
      highLowDiff: p.highLowDiff,
      medianLatencyMs: p.medianLatencyMs,
    };
    return {
      ...base,
      flags: assignFlags(base, opts, indexMedianLatency),
    };
  });

  stats.sort((a, b) => {
    const c = a.indexKey.localeCompare(b.indexKey);
    if (c !== 0) return c;
    const d = a.profileKind.localeCompare(b.profileKind);
    if (d !== 0) return d;
    return a.itemId.localeCompare(b.itemId);
  });
  return stats;
}

import type { GroupSummary, ItemStat } from "./types";
import { flagKeys } from "./groupStats";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function cell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

export function itemStatsToCsv(stats: ItemStat[]): string {
  const header = [
    "itemId",
    "subtestId",
    "indexKey",
    "profileKind",
    "n",
    "nSessions",
    "p",
    "pointBiserial",
    "highLowDiff",
    "medianLatencyMs",
    "flags",
  ].join(",");
  const lines = stats.map((s) =>
    [
      s.itemId,
      s.subtestId,
      s.indexKey,
      s.profileKind,
      s.n,
      s.nSessions,
      cell(s.p),
      cell(s.pointBiserial),
      cell(s.highLowDiff),
      cell(s.medianLatencyMs),
      s.flags.join("|"),
    ]
      .map((c) => csvEscape(String(c)))
      .join(","),
  );
  return [header, ...lines].join("\n") + (lines.length ? "\n" : "");
}

export function groupSummariesToCsv(groups: GroupSummary[]): string {
  const flags = flagKeys();
  const header = [
    "groupBy",
    "indexKey",
    "profileKind",
    "nItems",
    "nResponses",
    "meanP",
    "medianP",
    "meanPointBiserial",
    ...flags.map((f) => `flag_${f}`),
  ].join(",");
  const lines = groups.map((g) =>
    [
      g.groupBy,
      g.indexKey ?? "",
      g.profileKind ?? "",
      g.nItems,
      g.nResponses,
      cell(g.meanP),
      cell(g.medianP),
      cell(g.meanPointBiserial),
      ...flags.map((f) => g.flagCounts[f]),
    ]
      .map((c) => csvEscape(String(c)))
      .join(","),
  );
  return [header, ...lines].join("\n") + (lines.length ? "\n" : "");
}

export function toPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}

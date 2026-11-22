import type { ExportRow } from "@/lib/export/types";
import { filterAnalyzableRows } from "./filterRows";
import { computeGroupSummaries } from "./groupStats";
import { computeItemStats } from "./itemStats";
import {
  DEFAULT_ANALYZE_OPTIONS,
  PILOT_DISCLAIMER,
  type AnalyzeOptions,
  type AnalyzeResult,
} from "./types";

export function runAnalysis(
  rows: ExportRow[],
  options: Partial<AnalyzeOptions> = {},
): AnalyzeResult {
  const opts = { ...DEFAULT_ANALYZE_OPTIONS, ...options };
  const { kept, skipped } = filterAnalyzableRows(rows);
  const itemStats = computeItemStats(kept, opts);
  const groupSummaries = computeGroupSummaries(itemStats);
  const redFlags = itemStats.filter((s) => s.flags.length > 0);
  return {
    itemStats,
    groupSummaries,
    redFlags,
    meta: {
      inputRows: rows.length,
      analyzedRows: kept.length,
      skippedRows: skipped,
      disclaimer: PILOT_DISCLAIMER,
    },
  };
}

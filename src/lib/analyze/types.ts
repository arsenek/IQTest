/** Stage-A pilot CTT analysis — not standardized IQ. */

export type AnalyzeOptions = {
  /** Minimum n for disc/flag thresholds other than low_n. Default 20. */
  minN: number;
  /** Flag too_easy when p >= this. Default 0.95. */
  easyThreshold: number;
  /** Flag too_hard when p <= this. Default 0.05. */
  hardThreshold: number;
  /** Flag low_disc when pointBiserial < this. Default 0.15. */
  minPointBiserial: number;
  /** Flag low_disc when highLowDiff < this (fallback). Default 0.20. */
  minHighLowDiff: number;
  /** High/low group fraction (each tail). Default 0.27. */
  highLowFraction: number;
};

export const DEFAULT_ANALYZE_OPTIONS: AnalyzeOptions = {
  minN: 20,
  easyThreshold: 0.95,
  hardThreshold: 0.05,
  minPointBiserial: 0.15,
  minHighLowDiff: 0.2,
  highLowFraction: 0.27,
};

export type ItemFlag =
  | "low_n"
  | "too_easy"
  | "too_hard"
  | "low_disc"
  | "slow";

export type ItemStat = {
  itemId: string;
  subtestId: string;
  indexKey: string;
  profileKind: "CHILD" | "ADULT";
  n: number;
  nSessions: number;
  p: number | null;
  pointBiserial: number | null;
  highLowDiff: number | null;
  medianLatencyMs: number | null;
  flags: ItemFlag[];
};

export type GroupSummary = {
  groupBy: "indexKey" | "profileKind" | "indexKey+profileKind";
  indexKey: string | null;
  profileKind: "CHILD" | "ADULT" | null;
  nItems: number;
  nResponses: number;
  meanP: number | null;
  medianP: number | null;
  meanPointBiserial: number | null;
  flagCounts: Record<ItemFlag, number>;
};

export type AnalyzeResult = {
  itemStats: ItemStat[];
  groupSummaries: GroupSummary[];
  redFlags: ItemStat[];
  meta: {
    inputRows: number;
    analyzedRows: number;
    skippedRows: number;
    disclaimer: string;
  };
};

export const PILOT_DISCLAIMER =
  "pilot CTT only — not standardized IQ; do not publish national percentiles from this report";

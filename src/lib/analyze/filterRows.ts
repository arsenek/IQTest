import type { ExportRow } from "@/lib/export/types";

export type FilteredRow = ExportRow & {
  /** 0/1 score used for CTT. */
  score: 0 | 1;
};

function toScore(row: ExportRow): 0 | 1 | null {
  if (typeof row.rawScore === "number" && (row.rawScore === 0 || row.rawScore === 1)) {
    return row.rawScore;
  }
  if (row.correct === true) return 1;
  if (row.correct === false) return 0;
  return null;
}

/** Keep rows that are not inferred skip/timeout and have a binary score. */
export function filterAnalyzableRows(rows: ExportRow[]): {
  kept: FilteredRow[];
  skipped: number;
} {
  const kept: FilteredRow[] = [];
  let skipped = 0;
  for (const row of rows) {
    if (row.inferredSkipped || row.inferredTimedOut) {
      skipped++;
      continue;
    }
    const score = toScore(row);
    if (score === null) {
      skipped++;
      continue;
    }
    kept.push({ ...row, score });
  }
  return { kept, skipped };
}

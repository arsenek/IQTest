import type { FilteredRow } from "./filterRows";

/** Sum of scores per sessionId over analyzable rows. */
export function sessionTotals(rows: FilteredRow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.sessionId, (totals.get(row.sessionId) ?? 0) + row.score);
  }
  return totals;
}

/** Criterion for point-biserial: session total minus this item's score. */
export function restScore(
  totals: Map<string, number>,
  sessionId: string,
  itemScore: 0 | 1,
): number {
  return (totals.get(sessionId) ?? 0) - itemScore;
}

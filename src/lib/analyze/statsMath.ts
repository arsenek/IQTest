/** Pure numeric helpers for pilot CTT stats. */

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Pearson r; returns null if variance is zero or n < 2. */
export function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 2) return null;
  const n = xs.length;
  const mx = mean(xs)!;
  const my = mean(ys)!;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i]! - mx;
    const b = ys[i]! - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

/**
 * High-low discrimination: p(high) - p(low) using top/bottom fraction of
 * criterion scores. Ties: include all with score >= high cut / <= low cut.
 */
export function highLowDiff(
  itemScores: number[],
  criterion: number[],
  fraction: number,
): number | null {
  if (
    itemScores.length !== criterion.length ||
    itemScores.length < 2 ||
    fraction <= 0 ||
    fraction >= 0.5
  ) {
    return null;
  }
  const n = itemScores.length;
  const k = Math.max(1, Math.floor(n * fraction));
  const indexed = criterion.map((c, i) => ({ c, i }));
  indexed.sort((a, b) => a.c - b.c);
  const lowIdx = new Set(indexed.slice(0, k).map((x) => x.i));
  const highIdx = new Set(indexed.slice(n - k).map((x) => x.i));
  const lowScores = [...lowIdx].map((i) => itemScores[i]!);
  const highScores = [...highIdx].map((i) => itemScores[i]!);
  const pLow = mean(lowScores);
  const pHigh = mean(highScores);
  if (pLow === null || pHigh === null) return null;
  return pHigh - pLow;
}

export function round4(n: number | null): number | null {
  if (n === null || Number.isNaN(n)) return null;
  return Math.round(n * 10000) / 10000;
}

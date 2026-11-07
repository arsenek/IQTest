import type { IndexKey, NormTables } from "@/lib/content/types";

const SCALED_MEAN = 100;
const SCALED_SD = 15;
const SCALED_MIN = 40;
const SCALED_MAX = 160;

function findAgeBand(norms: NormTables, ageMonths: number) {
  const exact = norms.ageBands.find(
    (b) => ageMonths >= b.minAgeMonths && ageMonths <= b.maxAgeMonths,
  );
  if (exact) return exact;

  // Nearest band by midpoint distance (placeholder norms / edge ages).
  let best = norms.ageBands[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const band of norms.ageBands) {
    const mid = (band.minAgeMonths + band.maxAgeMonths) / 2;
    const dist = Math.abs(ageMonths - mid);
    if (dist < bestDist) {
      bestDist = dist;
      best = band;
    }
  }
  return best;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Convert subtest raw total to a scaled index-aligned score.
 * z = (raw - mean) / sd; scaled = 100 + 15 * z; clamp 40–160.
 *
 * Fourth arg is the index key used to look up placeholder means/sds
 * (MVP: one core subtest per index).
 */
export function scaleSubtest(
  rawTotal: number,
  ageMonths: number,
  norms: NormTables,
  indexKey: IndexKey,
): number {
  const band = findAgeBand(norms, ageMonths);
  const mean = band.means[indexKey];
  const sd = band.sds[indexKey];
  if (sd === 0) {
    throw new Error(`Norm sd is zero for ${indexKey}`);
  }
  const z = (rawTotal - mean) / sd;
  const scaled = SCALED_MEAN + SCALED_SD * z;
  return clamp(scaled, SCALED_MIN, SCALED_MAX);
}

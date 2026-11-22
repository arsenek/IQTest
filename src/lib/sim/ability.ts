import type { LatencyContext } from "@/lib/sim/types";

/** Clamp to [lo, hi]. */
export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Map ability (0–1) and within-subtest difficulty (0–1) → P(correct).
 * Logistic with floor/ceiling so low-ability still sometimes succeeds (guessing).
 *
 * ⚠️ Synthetic only — not a psychometric IRT model and not for human norms.
 */
export function probabilityCorrect(
  ability01: number,
  difficulty01: number,
): number {
  const a = clamp(ability01, 0, 1);
  const d = clamp(difficulty01, 0, 1);
  const logit = 4.2 * (a - d);
  const p = 1 / (1 + Math.exp(-logit));
  return clamp(p, 0.08, 0.96);
}

/**
 * Sample latencyMs from ability / item type / difficulty.
 * Higher ability → faster; harder items → slower; log-noise for realism.
 */
export function sampleLatencyMs(
  ctx: LatencyContext,
  rng: () => number,
): number {
  const baseByType: Record<LatencyContext["itemType"], number> = {
    mcq: 4800,
    digit_span: 7200,
    symbol_search: 2600,
  };
  const base = baseByType[ctx.itemType] ?? 5000;
  const ability = clamp(ctx.ability, 0, 1);
  const difficulty = clamp(ctx.difficulty, 0, 1);
  const abilityFactor = 1.45 - 0.85 * ability;
  const difficultyFactor = 0.8 + 0.55 * difficulty;
  // log-normal-ish noise via Box-Muller-lite
  const u1 = Math.max(1e-9, rng());
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const noise = Math.exp(0.22 * z);
  let ms = Math.round(base * abilityFactor * difficultyFactor * noise);
  const cap = ctx.timeLimitMs
    ? Math.floor(ctx.timeLimitMs * 0.92)
    : 90_000;
  return clamp(ms, 350, Math.max(800, cap));
}

/** Difficulty proxy: position within subtest (0 = first / easier). */
export function difficultyFromIndex(indexInSubtest: number, n: number): number {
  if (n <= 1) return 0.5;
  return clamp(indexInSubtest / (n - 1), 0, 1);
}

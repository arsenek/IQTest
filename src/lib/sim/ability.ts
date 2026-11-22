import type { Item, ItemType } from "@/lib/content/types";
import type { LatencyContext } from "@/lib/sim/types";

/** Clamp to [lo, hi]. */
export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Soften linear position so first/last items are not absolute floor/ceiling.
 * Raw position difficulty in [0,1] → compressed mid-band.
 */
export function softenPositionDifficulty(raw01: number): number {
  const d = clamp(raw01, 0, 1);
  // Mild power keeps early items easier but not free; late items hard but not impossible.
  return clamp(0.12 + 0.76 * d ** 0.9, 0, 1);
}

/**
 * Map ability (0–1) and effective difficulty (0–1) → P(correct).
 * Steeper slope than v1 so ability differences show up as discrimination
 * (Stage-A sim50 low_disc was largely a flat-sim artifact).
 *
 * ⚠️ Synthetic only — not a psychometric IRT model and not for human norms.
 */
export function probabilityCorrect(
  ability01: number,
  difficulty01: number,
): number {
  const a = clamp(ability01, 0, 1);
  const d = clamp(difficulty01, 0, 1);
  const logit = 6.5 * (a - d);
  const p = 1 / (1 + Math.exp(-logit));
  return clamp(p, 0.05, 0.97);
}

/**
 * Sample latencyMs from ability / item type / difficulty.
 * Higher ability → faster; harder items → slower; log-noise for realism.
 */
export function sampleLatencyMs(
  ctx: LatencyContext,
  rng: () => number,
): number {
  const baseByType: Record<ItemType, number> = {
    mcq: 4800,
    digit_span: 7200,
    symbol_search: 2600,
  };
  const base = baseByType[ctx.itemType] ?? 5000;
  const ability = clamp(ctx.ability, 0, 1);
  const difficulty = clamp(ctx.difficulty, 0, 1);
  const abilityFactor = 1.45 - 0.85 * ability;
  const difficultyFactor = 0.8 + 0.55 * difficulty;
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

/** Raw difficulty proxy: position within subtest (0 = first / easier). */
export function difficultyFromIndex(indexInSubtest: number, n: number): number {
  if (n <= 1) return 0.5;
  return clamp(indexInSubtest / (n - 1), 0, 1);
}

/** Digit-span length from stored answer (`7-1-4` → 3). */
export function digitSpanLength(answer: Item["answer"]): number {
  if (Array.isArray(answer)) return answer.length;
  const s = String(answer).trim();
  if (!s) return 1;
  return s.split("-").filter(Boolean).length;
}

/**
 * Effective difficulty for one playlist row.
 * digit_span mixes position with span length so long reverse spans stay hard
 * without wiping ability signal at the subtest tail.
 */
export function effectiveItemDifficulty(
  item: Item,
  positionDifficulty01: number,
): number {
  const pos = softenPositionDifficulty(positionDifficulty01);
  if (item.type === "digit_span") {
    const len = digitSpanLength(item.answer);
    // Empirical map: len 2 ≈ 0.15, len 10 ≈ 0.95
    const spanDiff = clamp((len - 2) / 8, 0, 1);
    return clamp(0.35 * pos + 0.65 * spanDiff, 0.08, 0.95);
  }
  if (item.type === "symbol_search") {
    // Slightly flatter — PSI was over-flagged low_disc under pure position.
    return clamp(0.2 + 0.6 * pos, 0.1, 0.9);
  }
  return pos;
}

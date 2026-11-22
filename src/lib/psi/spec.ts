import type { PsiFraming, PsiSpec } from "./types";

export function psi(def: {
  id: string;
  target: string;
  grid: string;
  timeLimitMs: number;
  framing?: PsiFraming;
  alphabet?: string[];
  ruleText?: string;
}): PsiSpec {
  const grid = Array.from(def.grid.replace(/\s+/g, ""));
  const alphabet = def.alphabet ?? Array.from(new Set([def.target, ...grid]));
  return {
    id: def.id,
    target: def.target,
    alphabet,
    grid,
    timeLimitMs: def.timeLimitMs,
    framing: def.framing ?? "count",
    ruleText: def.ruleText ?? `在网格中统计目标「${def.target}」出现次数。`,
  };
}

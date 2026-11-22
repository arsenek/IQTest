import type { BuiltPsiItem, PsiFraming, PsiPackPlan, PsiSpec, PsiSubtestPlan } from "./types";

export function countTarget(grid: string[], target: string): number {
  return grid.filter((s) => s === target).length;
}

export function renderPrompt(
  spec: PsiSpec,
  framing: PsiFraming,
  practice: boolean,
  audience: "child" | "adult",
): string {
  const seq = spec.grid.join("");
  let text: string;
  if (framing === "pairing") {
    text =
      audience === "child"
        ? `配对计数：目标${spec.target}。在 ${seq} 中出现几次？`
        : `配对计数：目标${spec.target}。在 ${seq} 中目标出现几次？`;
  } else {
    text = `目标${spec.target}。在 ${seq} 中出现几次？`;
  }
  return practice ? `练习：${text}` : text;
}

export function buildItem(pack: PsiPackPlan, _sub: PsiSubtestPlan, spec: PsiSpec): BuiltPsiItem {
  const targetCount = countTarget(spec.grid, spec.target);
  return {
    spec,
    targetCount,
    manifest: {
      id: spec.id,
      type: "symbol_search",
      prompt: renderPrompt(spec, spec.framing, pack.practice, pack.audience),
      answer: targetCount,
      timeLimitMs: spec.timeLimitMs,
    },
  };
}

export function buildSubtest(pack: PsiPackPlan, sub: PsiSubtestPlan): BuiltPsiItem[] {
  return sub.specs.map((spec) => buildItem(pack, sub, spec));
}

/** Deterministic grid builder for specs that only declare counts. */
export function makeGrid(
  target: string,
  distractors: string[],
  length: number,
  targetCount: number,
  seed: string,
): string[] {
  if (targetCount < 0 || targetCount > length) throw new Error("targetCount out of range");
  if (distractors.length === 0 && targetCount < length) {
    throw new Error("need distractors when targetCount < length");
  }
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const rng = () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const cells: string[] = Array.from({ length }, (_, i) =>
    i < targetCount ? target : distractors[Math.floor(rng() * distractors.length)]!,
  );
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells;
}

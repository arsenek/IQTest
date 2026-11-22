import { getCategory, getRelation } from "./lexicon";
import type {
  BuiltVciItem,
  BuiltVciOption,
  VciAudience,
  VciPackPlan,
  VciSpec,
  VciSubtestPlan,
} from "./types";

const TIME_LIMIT_MS = { child: 60_000, adult: 55_000 } as const;

function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Place the correct answer at a deterministic slot; shuffle distractors into the rest. */
export function arrangeLabels(
  answer: string,
  distractors: [string, string, string],
  seedKey: string,
): BuiltVciOption[] {
  const rng = mulberry32(hashSeed(seedKey));
  const keySlot = Math.floor(rng() * 4);
  const idx = [0, 1, 2];
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const rest = idx.map((i) => distractors[i]);
  const labels: string[] = [];
  for (let slot = 0; slot < 4; slot++) {
    labels.push(slot === keySlot ? answer : (rest.shift() as string));
  }
  return labels.map((label) => ({
    label,
    glyph: glyphFor(label),
    correct: label === answer,
  }));
}

export function glyphFor(label: string): string {
  const ch = Array.from(label).find((c) => /[\u4e00-\u9fff0-9A-Za-z]/.test(c));
  return ch ?? "·";
}

function promptFor(spec: VciSpec, audience: VciAudience, practice: boolean): string {
  let text: string;
  if (spec.kind === "classify") {
    // Prompt stays category-name-free so finding the category is part of the task.
    void getCategory(spec.categoryId);
    const trio = spec.exemplars.join("、");
    text =
      audience === "child"
        ? `看看「${trio}」。下面哪一项和它们是同一类？`
        : `「${trio}」同属一类。下列哪一项与它们属于同一范畴？`;
  } else if (spec.kind === "sequence") {
    const series = spec.series.join("、");
    text =
      audience === "child"
        ? `按规律往下排：${series}、？ 下一项是什么？`
        : `根据序列规律，下一项应为？ ${series}、？`;
  } else {
    void getRelation(spec.relationId);
    text =
      audience === "child"
        ? `「${spec.a}」对「${spec.b}」，就像「${spec.c}」对？`
        : `「${spec.a}」之于「${spec.b}」，最接近「${spec.c}」之于？`;
  }
  return practice ? `练习：${text}` : text;
}

export function buildItem(
  pack: VciPackPlan,
  sub: VciSubtestPlan,
  spec: VciSpec,
): BuiltVciItem {
  const options = arrangeLabels(spec.answer, spec.distractors, `${pack.packId}:${spec.id}`);
  const correct = options.filter((o) => o.correct);
  if (correct.length !== 1) {
    throw new Error(`${spec.id}: expected exactly one correct option`);
  }
  return {
    spec,
    options,
    manifest: {
      id: spec.id,
      type: "mcq",
      prompt: promptFor(spec, pack.audience, pack.practice),
      choices: options.map(({ label, glyph }) => ({ label, glyph })),
      answer: spec.answer,
      timeLimitMs: TIME_LIMIT_MS[pack.audience],
    },
  };
}

export function buildSubtest(pack: VciPackPlan, sub: VciSubtestPlan): BuiltVciItem[] {
  return sub.specs.map((spec) => buildItem(pack, sub, spec));
}

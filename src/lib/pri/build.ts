import type { PriSpec } from "./types";
import { difficultyScore, levelOf, validateSpec } from "./rules";
import { arrangeOptions, planPlacements, type BuiltOption } from "./options";
import { renderContext, renderOption, renderStem } from "./render";

export type SubtestPlan = {
  /** Subtest id in the pack manifest whose items are replaced. */
  subtestId: string;
  /** Media file prefix, e.g. `pri-matrix` → `pri-matrix-01-stem.svg`. */
  filePrefix: string;
  /** Keep items in ascending difficulty when a session is shuffled. */
  ordered: boolean;
  specs: PriSpec[];
};

export type PackPlan = {
  /** `child/v1`, `adult/practice/v1`, … */
  packId: string;
  audience: "child" | "adult";
  practice: boolean;
  subtests: SubtestPlan[];
};

export type ManifestItem = {
  id: string;
  type: "mcq";
  prompt: string;
  image: string;
  choices: Array<{ label: string; image: string }>;
  answer: string;
  timeLimitMs: number;
};

export type BuiltItem = {
  spec: PriSpec;
  score: number;
  level: number;
  options: BuiltOption[];
  manifest: ManifestItem;
  /** File name → SVG source, for the stem and the four options. */
  files: Record<string, string>;
};

const TIME_LIMIT_MS = {
  child: { 1: 60_000, 2: 60_000, 3: 75_000, 4: 90_000, 5: 90_000 },
  adult: { 1: 55_000, 2: 55_000, 3: 70_000, 4: 85_000, 5: 100_000 },
} as const;

/** Prompts never name the rule; finding it is the task. */
function promptFor(audience: "child" | "adult", kind: PriSpec["kind"], practice: boolean): string {
  const text =
    audience === "child"
      ? kind === "matrix"
        ? "找一找规律：哪一个图形应该放在「？」的位置？"
        : "图形在按规律排队：「？」的位置应该是哪一个？"
      : kind === "matrix"
        ? "观察图形的排列规律，选出最适合填入「？」处的一项。"
        : "根据图形序列的变化规律，选出最适合填入「？」处的一项。";
  return practice ? `练习：${text}` : text;
}

export function mediaUrl(packId: string, file: string): string {
  return `/packs/${packId}/media/${file}`;
}

export function buildSubtest(pack: PackPlan, sub: SubtestPlan): BuiltItem[] {
  const placements = planPlacements(sub.specs.length, `${pack.packId}:${sub.subtestId}`);
  return sub.specs.map((spec, i) => {
    validateSpec(spec);
    const options = arrangeOptions(spec, placements[i]);
    const ctx = renderContext(spec, options.map((o) => o.cell));
    const stemFile = `${sub.filePrefix}-${String(i + 1).padStart(2, "0")}-stem.svg`;
    const files: Record<string, string> = { [stemFile]: renderStem(spec, ctx) };
    const choices = options.map((o) => {
      const file = stemFile.replace("-stem.svg", `-${o.letter.toLowerCase()}.svg`);
      files[file] = renderOption(ctx, o.cell);
      return { label: o.label, image: mediaUrl(pack.packId, file) };
    });
    const score = difficultyScore(spec);
    const level = levelOf(score);
    return {
      spec,
      score,
      level,
      options,
      files,
      manifest: {
        id: spec.id,
        type: "mcq",
        prompt: promptFor(pack.audience, spec.kind, pack.practice),
        image: mediaUrl(pack.packId, stemFile),
        choices,
        answer: (options.find((o) => o.correct) as BuiltOption).label,
        timeLimitMs: TIME_LIMIT_MS[pack.audience][level],
      },
    };
  });
}

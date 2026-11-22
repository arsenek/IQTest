/** Declarative VCI item kinds that admit a unique-key proof. */
export type VciKind = "classify" | "sequence" | "analogy";

export type VciAudience = "child" | "adult";

export type ClassifySpec = {
  kind: "classify";
  id: string;
  /** Lexicon category id (closed set). */
  categoryId: string;
  /** Three exemplars shown in the stem (must be members). */
  exemplars: [string, string, string];
  answer: string;
  distractors: [string, string, string];
  ruleText: string;
};

export type NumericSequenceRule = {
  type: "numeric";
  /** Constant difference between consecutive terms. */
  step: number;
};

export type CycleSequenceRule = {
  type: "cycle";
  /** Ordered alphabet; next term wraps. */
  alphabet: string[];
};

export type SequenceRule = NumericSequenceRule | CycleSequenceRule;

export type SequenceSpec = {
  kind: "sequence";
  id: string;
  /** Visible stem terms (strings; numeric rules use decimal strings). */
  series: string[];
  rule: SequenceRule;
  answer: string;
  distractors: [string, string, string];
  ruleText: string;
};

export type AnalogySpec = {
  kind: "analogy";
  id: string;
  /** Lexicon relation id. */
  relationId: string;
  a: string;
  b: string;
  c: string;
  answer: string;
  distractors: [string, string, string];
  ruleText: string;
};

export type VciSpec = ClassifySpec | SequenceSpec | AnalogySpec;

export type VciManifestItem = {
  id: string;
  type: "mcq";
  prompt: string;
  choices: Array<{ label: string; glyph: string }>;
  answer: string;
  timeLimitMs: number;
};

export type BuiltVciOption = {
  label: string;
  glyph: string;
  correct: boolean;
};

export type BuiltVciItem = {
  spec: VciSpec;
  options: BuiltVciOption[];
  manifest: VciManifestItem;
};

export type VciSubtestPlan = {
  subtestId: string;
  /** Manifest title override (optional). */
  title?: string;
  ordered?: boolean;
  specs: VciSpec[];
};

export type VciPackPlan = {
  packId: string;
  audience: VciAudience;
  practice: boolean;
  subtests: VciSubtestPlan[];
};

export type PsiAudience = "child" | "adult";

export type PsiFraming = "count" | "pairing";

export type PsiSpec = {
  id: string;
  target: string;
  /** Closed alphabet; grid symbols must be from this set. */
  alphabet: string[];
  /** Explicit search grid (left → right). */
  grid: string[];
  timeLimitMs: number;
  framing: PsiFraming;
  ruleText: string;
};

export type PsiManifestItem = {
  id: string;
  type: "symbol_search";
  prompt: string;
  answer: number;
  timeLimitMs: number;
};

export type BuiltPsiItem = {
  spec: PsiSpec;
  targetCount: number;
  manifest: PsiManifestItem;
};

export type PsiSubtestPlan = {
  subtestId: string;
  title?: string;
  specs: PsiSpec[];
};

export type PsiPackPlan = {
  packId: string;
  audience: PsiAudience;
  practice: boolean;
  subtests: PsiSubtestPlan[];
};

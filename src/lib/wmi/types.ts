export type WmiAudience = "child" | "adult";
export type WmiDirection = "forward" | "reverse";

export type WmiSpec = {
  id: string;
  digits: number[];
  direction: WmiDirection;
  encodeMs: number;
  timeLimitMs: number;
  ruleText: string;
};

export type WmiManifestItem = {
  id: string;
  type: "digit_span";
  prompt: string;
  answer: string;
  timeLimitMs: number;
  encodeMs: number;
  maskStem: true;
  ordered: true;
};

export type BuiltWmiItem = {
  spec: WmiSpec;
  manifest: WmiManifestItem;
};

export type WmiSubtestPlan = {
  subtestId: string;
  title?: string;
  /** Expected length ladder for soundness (parallel to specs). */
  lengthLadder: number[];
  specs: WmiSpec[];
};

export type WmiPackPlan = {
  packId: string;
  audience: WmiAudience;
  practice: boolean;
  subtests: WmiSubtestPlan[];
};

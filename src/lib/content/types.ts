export const INDEX_KEYS = ["VCI", "PRI", "WMI", "PSI"] as const;
export type IndexKey = (typeof INDEX_KEYS)[number];

export const ITEM_TYPES = ["mcq", "digit_span", "symbol_search"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export type Choice = {
  label: string;
  glyph?: string;
  image?: string;
};

export type Item = {
  id: string;
  type: ItemType;
  prompt: string;
  /** Optional stem figure (e.g. PRI matrix SVG URL). */
  image?: string;
  choices?: Choice[];
  answer: string | number | string[];
  timeLimitMs?: number;
  /** Memory encode window (ms) before stem is masked. */
  encodeMs?: number;
  /** After encode, hide the stem until the next item. */
  maskStem?: boolean;
  /** Keep this item's relative order (used with subtest.ordered / digit_span). */
  ordered?: boolean;
};

export type Subtest = {
  id: string;
  indexKey: IndexKey;
  title: string;
  /** When true, within-subtest item order is preserved (e.g. WMI spans). */
  ordered?: boolean;
  items: Item[];
};

export type ContentPack = {
  id: string;
  audience: "child" | "adult";
  title: string;
  subtests: Subtest[];
};

export type IndexStats = Record<IndexKey, number>;

export type AgeBand = {
  minAgeMonths: number;
  maxAgeMonths: number;
  means: IndexStats;
  sds: IndexStats;
};

/** Product scoring honesty stage; all current norms are trial. */
export const SCORING_STAGES = ["trial", "calibrated", "standardized"] as const;
export type ScoringStage = (typeof SCORING_STAGES)[number];

export type NormTables = {
  version: string;
  /** Normalized stage after schema parse. */
  stage: ScoringStage;
  /** Convenience mirror: `stage === "trial"`. */
  trial: boolean;
  ageBands: AgeBand[];
};

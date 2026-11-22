import type { IndexKey, ItemType } from "@/lib/content/types";

export type AbilityMap = Record<IndexKey, number>;

export type SimPersona = {
  id: string;
  displayName: string;
  /** Chronological age in whole years at simulation time. */
  ageYears: number;
  kind: "CHILD" | "ADULT";
  /** Short free-text traits (Chinese). */
  traits: string;
  /**
   * Index ability on 0–1 scale (not IQ points).
   * Used only to drive Bernoulli correctness + latency; not a norm score.
   */
  ability: AbilityMap;
};

export type PersonasFile = {
  version: string;
  disclaimer: string;
  count: number;
  personas: SimPersona[];
};

export type LatencyContext = {
  itemType: ItemType;
  ability: number;
  /** 0 = easiest in subtest, 1 = hardest. */
  difficulty: number;
  timeLimitMs?: number;
};

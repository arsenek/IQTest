/** One row per item response for Stage-A calibration export. */
export type ExportRow = {
  sessionId: string;
  /** HMAC of profileId — never the raw id. */
  profileIdHash: string;
  profileKind: "CHILD" | "ADULT";
  ageMonths: number;
  itemId: string;
  subtestId: string;
  indexKey: string;
  correct: boolean | null;
  rawScore: number | null;
  latencyMs: number;
  inferredSkipped: boolean;
  inferredTimedOut: boolean;
  contentPackVersion: string;
  normVersion: string;
  scoringStage: string;
  algorithmVersion: string;
  submittedAt: string | null;
  /** Not collected this round — always empty string. */
  deviceClass: string;
  isChildData: boolean;
};

export const EXPORT_COLUMNS = [
  "sessionId",
  "profileIdHash",
  "profileKind",
  "ageMonths",
  "itemId",
  "subtestId",
  "indexKey",
  "correct",
  "rawScore",
  "latencyMs",
  "inferredSkipped",
  "inferredTimedOut",
  "contentPackVersion",
  "normVersion",
  "scoringStage",
  "algorithmVersion",
  "submittedAt",
  "deviceClass",
  "isChildData",
] as const satisfies ReadonlyArray<keyof ExportRow>;

export type ExportColumn = (typeof EXPORT_COLUMNS)[number];

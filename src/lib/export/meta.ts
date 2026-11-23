/** Export-run metadata written beside responses.csv / responses.jsonl. */

export type ExportMeta = {
  /** Ops label for this sample batch (CLI `--cohort`); empty if unset. */
  pilotCohort: string;
  /** Whether sim-*@iqtest.local sessions were included. */
  includeSim: boolean;
  /** Sessions after filters (SUBMITTED+Report, pack/date, sim). */
  sessions: number;
  /** Rows written to responses.* */
  rows: number;
  skippedResponses: number;
  warningCount: number;
  matchedBeforeSimFilter: number;
  excludedSimSessions: number;
  disclaimer: string;
};

export const HUMAN_STAGE_A_DISCLAIMER =
  "Stage A human export — exclude sim by default; pilot CTT only — not standardized IQ";

export function buildExportMeta(input: {
  pilotCohort?: string;
  includeSim: boolean;
  sessions: number;
  rows: number;
  skippedResponses: number;
  warningCount: number;
  matchedBeforeSimFilter: number;
  excludedSimSessions: number;
}): ExportMeta {
  return {
    pilotCohort: input.pilotCohort?.trim() ?? "",
    includeSim: input.includeSim,
    sessions: input.sessions,
    rows: input.rows,
    skippedResponses: input.skippedResponses,
    warningCount: input.warningCount,
    matchedBeforeSimFilter: input.matchedBeforeSimFilter,
    excludedSimSessions: input.excludedSimSessions,
    disclaimer: HUMAN_STAGE_A_DISCLAIMER,
  };
}

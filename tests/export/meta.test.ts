import { describe, expect, it } from "vitest";
import { buildExportMeta, HUMAN_STAGE_A_DISCLAIMER } from "@/lib/export/meta";

describe("buildExportMeta", () => {
  it("records cohort label and sim exclusion counts", () => {
    const meta = buildExportMeta({
      pilotCohort: " stage-a-pilot-2026-11 ",
      includeSim: false,
      sessions: 3,
      rows: 90,
      skippedResponses: 0,
      warningCount: 1,
      matchedBeforeSimFilter: 53,
      excludedSimSessions: 50,
    });
    expect(meta.pilotCohort).toBe("stage-a-pilot-2026-11");
    expect(meta.includeSim).toBe(false);
    expect(meta.excludedSimSessions).toBe(50);
    expect(meta.disclaimer).toBe(HUMAN_STAGE_A_DISCLAIMER);
  });

  it("uses empty cohort when omitted", () => {
    const meta = buildExportMeta({
      includeSim: true,
      sessions: 1,
      rows: 10,
      skippedResponses: 0,
      warningCount: 0,
      matchedBeforeSimFilter: 1,
      excludedSimSessions: 0,
    });
    expect(meta.pilotCohort).toBe("");
    expect(meta.includeSim).toBe(true);
  });
});

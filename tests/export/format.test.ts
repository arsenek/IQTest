import { describe, expect, it } from "vitest";
import { parseCsv, parseJsonl, rowsToCsv, rowsToJsonl } from "@/lib/export/format";
import { EXPORT_COLUMNS, type ExportRow } from "@/lib/export/types";

const sample: ExportRow = {
  sessionId: "s1",
  profileIdHash: "abc",
  profileKind: "ADULT",
  ageMonths: 300,
  itemId: "i1",
  subtestId: "st",
  indexKey: "VCI",
  correct: true,
  rawScore: 1,
  latencyMs: 500,
  inferredSkipped: false,
  inferredTimedOut: false,
  contentPackVersion: "adult/v1",
  normVersion: "placeholder/v1",
  scoringStage: "trial",
  algorithmVersion: "scale-z/v1",
  submittedAt: "2026-11-23T00:00:00.000Z",
  deviceClass: "",
  isChildData: false,
};

describe("export formatters", () => {
  it("CSV starts with EXPORT_COLUMNS header", () => {
    const csv = rowsToCsv([sample]);
    const header = csv.split("\n")[0];
    expect(header).toBe(EXPORT_COLUMNS.join(","));
    expect(csv).toContain("s1");
    expect(csv).toContain("true");
  });

  it("JSONL round-trips", () => {
    const text = rowsToJsonl([sample, { ...sample, sessionId: "s2" }]);
    const parsed = parseJsonl(text);
    expect(parsed).toHaveLength(2);
    expect(parsed[1].sessionId).toBe("s2");
  });

  it("CSV round-trips via parseCsv", () => {
    const text = rowsToCsv([
      sample,
      { ...sample, sessionId: "s2", correct: false, rawScore: 0 },
    ]);
    const parsed = parseCsv(text);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].sessionId).toBe("s1");
    expect(parsed[0].correct).toBe(true);
    expect(parsed[1].correct).toBe(false);
    expect(parsed[1].rawScore).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { inferFlags, isEmptyishAnswer } from "@/lib/export/inferFlags";

describe("inferFlags", () => {
  it("treats empty string and empty array as skipped", () => {
    expect(isEmptyishAnswer("")).toBe(true);
    expect(isEmptyishAnswer([])).toBe(true);
    expect(isEmptyishAnswer("A")).toBe(false);
  });

  it("treats symbol_search -1 as emptyish", () => {
    expect(isEmptyishAnswer(-1, "symbol_search")).toBe(true);
    expect(isEmptyishAnswer(-1, "mcq")).toBe(false);
  });

  it("infers timedOut when latency reaches timeLimitMs", () => {
    expect(
      inferFlags({
        answerJson: "",
        latencyMs: 60_000,
        timeLimitMs: 60_000,
        itemType: "mcq",
      }),
    ).toEqual({ inferredSkipped: true, inferredTimedOut: true });
  });

  it("does not claim timedOut without timeLimitMs", () => {
    expect(
      inferFlags({
        answerJson: "B",
        latencyMs: 999_999,
        timeLimitMs: null,
      }),
    ).toEqual({ inferredSkipped: false, inferredTimedOut: false });
  });
});

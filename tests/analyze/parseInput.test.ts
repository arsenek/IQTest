import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadExportRows } from "@/lib/analyze/parseInput";
import { parseJsonl, rowsToCsv } from "@/lib/export/format";

const fixtureDir = path.resolve(__dirname, "../fixtures/stage-a-export");

describe("loadExportRows", () => {
  it("loads directory preferring jsonl", () => {
    const rows = loadExportRows(fixtureDir);
    expect(rows.length).toBeGreaterThan(50);
    expect(rows[0]!.itemId).toBeTruthy();
  });

  it("loads a single jsonl file", () => {
    const rows = loadExportRows(path.join(fixtureDir, "responses.jsonl"));
    expect(rows[0]!.sessionId).toMatch(/^sess-|child-/);
  });

  it("loads csv from a temp copy", () => {
    const jsonl = fs.readFileSync(
      path.join(fixtureDir, "responses.jsonl"),
      "utf8",
    );
    const rows = parseJsonl(jsonl);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stage-a-"));
    const csvPath = path.join(tmp, "responses.csv");
    fs.writeFileSync(csvPath, rowsToCsv(rows));
    const loaded = loadExportRows(csvPath);
    expect(loaded).toHaveLength(rows.length);
    expect(loaded[0]!.itemId).toBe(rows[0]!.itemId);
  });
});

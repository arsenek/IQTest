import fs from "node:fs";
import path from "node:path";
import { parseCsv, parseJsonl } from "@/lib/export/format";
import type { ExportRow } from "@/lib/export/types";

/**
 * Load Stage-A export rows from a file or directory.
 * Directory preference: responses.jsonl, else responses.csv.
 */
export function loadExportRows(inputPath: string): ExportRow[] {
  const abs = path.resolve(inputPath);
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    const jsonl = path.join(abs, "responses.jsonl");
    const csv = path.join(abs, "responses.csv");
    if (fs.existsSync(jsonl)) return parseJsonl(fs.readFileSync(jsonl, "utf8"));
    if (fs.existsSync(csv)) return parseCsv(fs.readFileSync(csv, "utf8"));
    throw new Error(
      `No responses.jsonl or responses.csv in directory: ${abs}`,
    );
  }
  const lower = abs.toLowerCase();
  const text = fs.readFileSync(abs, "utf8");
  if (lower.endsWith(".jsonl")) return parseJsonl(text);
  if (lower.endsWith(".csv")) return parseCsv(text);
  throw new Error(`Unsupported export file (use .csv or .jsonl): ${abs}`);
}

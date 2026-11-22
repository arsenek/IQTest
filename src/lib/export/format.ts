import { EXPORT_COLUMNS, type ExportRow } from "@/lib/export/types";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function cellValue(row: ExportRow, col: (typeof EXPORT_COLUMNS)[number]): string {
  const v = row[col];
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

export function rowsToCsv(rows: ExportRow[]): string {
  const header = EXPORT_COLUMNS.join(",");
  const lines = rows.map((row) =>
    EXPORT_COLUMNS.map((col) => csvEscape(cellValue(row, col))).join(","),
  );
  return [header, ...lines].join("\n") + (lines.length ? "\n" : "");
}

export function rowsToJsonl(rows: ExportRow[]): string {
  if (rows.length === 0) return "";
  return rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
}

export function parseJsonl(text: string): ExportRow[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l) as ExportRow);
}

/** Minimal RFC4180-ish CSV parser for Stage-A export columns. */
export function parseCsv(text: string): ExportRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const header = parseCsvLine(lines[0]!);
  const missing = EXPORT_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) {
    throw new Error(`CSV missing columns: ${missing.join(", ")}`);
  }
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const obj: Record<string, string> = {};
    for (let i = 0; i < header.length; i++) {
      obj[header[i]!] = cells[i] ?? "";
    }
    return csvObjectToRow(obj);
  });
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseBool(v: string): boolean | null {
  if (v === "" || v === undefined) return null;
  if (v === "true") return true;
  if (v === "false") return false;
  throw new Error(`Invalid boolean CSV cell: ${v}`);
}

function parseOptionalNumber(v: string): number | null {
  if (v === "" || v === undefined) return null;
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error(`Invalid number CSV cell: ${v}`);
  return n;
}

function csvObjectToRow(obj: Record<string, string>): ExportRow {
  const correct = parseBool(obj.correct ?? "");
  return {
    sessionId: obj.sessionId ?? "",
    profileIdHash: obj.profileIdHash ?? "",
    profileKind: (obj.profileKind as "CHILD" | "ADULT") ?? "ADULT",
    ageMonths: Number(obj.ageMonths ?? 0),
    itemId: obj.itemId ?? "",
    subtestId: obj.subtestId ?? "",
    indexKey: obj.indexKey ?? "",
    correct,
    rawScore: parseOptionalNumber(obj.rawScore ?? ""),
    latencyMs: Number(obj.latencyMs ?? 0),
    inferredSkipped: parseBool(obj.inferredSkipped ?? "false") ?? false,
    inferredTimedOut: parseBool(obj.inferredTimedOut ?? "false") ?? false,
    contentPackVersion: obj.contentPackVersion ?? "",
    normVersion: obj.normVersion ?? "",
    scoringStage: obj.scoringStage ?? "",
    algorithmVersion: obj.algorithmVersion ?? "",
    submittedAt: obj.submittedAt || null,
    deviceClass: obj.deviceClass ?? "",
    isChildData: parseBool(obj.isChildData ?? "false") ?? false,
  };
}

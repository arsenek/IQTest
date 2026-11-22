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

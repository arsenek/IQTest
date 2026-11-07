import { readFileSync } from "node:fs";
import path from "node:path";
import { normTablesSchema } from "./schemas";
import type { NormTables } from "./types";

function normsPath(version: string): string {
  // version e.g. "placeholder/v1" → content/norms/placeholder/v1.json
  const parts = version.split("/").filter(Boolean);
  if (parts.length !== 2) {
    throw new Error(`Invalid norm version: ${version}`);
  }
  return path.join(process.cwd(), "content", "norms", `${parts[0]}/${parts[1]}.json`);
}

export function loadNorms(version: string): NormTables {
  let raw: string;
  try {
    raw = readFileSync(normsPath(version), "utf8");
  } catch {
    throw new Error(`Unknown norms version: ${version}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in norms: ${version}`);
  }

  const parsed = normTablesSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid norms ${version}: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
    );
  }

  if (parsed.data.version !== version) {
    throw new Error(
      `Norm version mismatch: expected ${version}, got ${parsed.data.version}`,
    );
  }

  return parsed.data;
}

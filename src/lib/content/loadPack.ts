import { readFileSync } from "node:fs";
import path from "node:path";
import { contentPackSchema } from "./schemas";
import type { ContentPack } from "./types";

function packManifestPath(packId: string): string {
  // packId e.g. "child/v1" → content/packs/child/v1/manifest.json
  const parts = packId.split("/").filter(Boolean);
  if (parts.length !== 2) {
    throw new Error(`Invalid pack id: ${packId}`);
  }
  return path.join(
    process.cwd(),
    "content",
    "packs",
    parts[0],
    parts[1],
    "manifest.json",
  );
}

export function loadPack(packId: string): ContentPack {
  let raw: string;
  try {
    raw = readFileSync(packManifestPath(packId), "utf8");
  } catch {
    throw new Error(`Unknown pack: ${packId}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in pack: ${packId}`);
  }

  const parsed = contentPackSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid pack ${packId}: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
    );
  }

  if (parsed.data.id !== packId) {
    throw new Error(
      `Pack id mismatch: expected ${packId}, got ${parsed.data.id}`,
    );
  }

  return parsed.data;
}

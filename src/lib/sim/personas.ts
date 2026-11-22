import fs from "node:fs";
import path from "node:path";
import { PERSONAS_PATH } from "@/lib/sim/constants";
import type { PersonasFile, SimPersona } from "@/lib/sim/types";
import { INDEX_KEYS } from "@/lib/content/types";

function assertPersona(raw: unknown, idx: number): SimPersona {
  if (!raw || typeof raw !== "object") {
    throw new Error(`persona[${idx}] must be an object`);
  }
  const p = raw as Record<string, unknown>;
  if (typeof p.id !== "string" || !p.id.startsWith("sim-")) {
    throw new Error(`persona[${idx}].id must start with sim-`);
  }
  if (typeof p.displayName !== "string" || !p.displayName.trim()) {
    throw new Error(`persona[${idx}].displayName required`);
  }
  if (typeof p.ageYears !== "number" || !Number.isFinite(p.ageYears)) {
    throw new Error(`persona[${idx}].ageYears required`);
  }
  if (p.kind !== "CHILD" && p.kind !== "ADULT") {
    throw new Error(`persona[${idx}].kind must be CHILD|ADULT`);
  }
  if (typeof p.traits !== "string") {
    throw new Error(`persona[${idx}].traits required`);
  }
  const ability = p.ability as Record<string, unknown> | undefined;
  if (!ability || typeof ability !== "object") {
    throw new Error(`persona[${idx}].ability required`);
  }
  for (const key of INDEX_KEYS) {
    const v = ability[key];
    if (typeof v !== "number" || v < 0 || v > 1) {
      throw new Error(`persona[${idx}].ability.${key} must be 0–1`);
    }
  }
  return {
    id: p.id,
    displayName: p.displayName,
    ageYears: p.ageYears,
    kind: p.kind,
    traits: p.traits,
    ability: {
      VCI: ability.VCI as number,
      PRI: ability.PRI as number,
      WMI: ability.WMI as number,
      PSI: ability.PSI as number,
    },
  };
}

export function loadPersonasFile(
  rootDir: string = process.cwd(),
  relativePath: string = PERSONAS_PATH,
): PersonasFile {
  const full = path.resolve(rootDir, relativePath);
  const raw = JSON.parse(fs.readFileSync(full, "utf8")) as PersonasFile;
  if (!Array.isArray(raw.personas)) {
    throw new Error("personas file missing personas[]");
  }
  const personas = raw.personas.map((p, i) => assertPersona(p, i));
  return {
    version: String(raw.version ?? "unknown"),
    disclaimer: String(raw.disclaimer ?? ""),
    count: personas.length,
    personas,
  };
}

export function selectPersonas(
  all: SimPersona[],
  opts: { count?: number; personaIds?: string[] },
): SimPersona[] {
  if (opts.personaIds?.length) {
    const set = new Set(opts.personaIds);
    const picked = all.filter((p) => set.has(p.id));
    const missing = [...set].filter((id) => !picked.some((p) => p.id === id));
    if (missing.length) {
      throw new Error(`Unknown persona id(s): ${missing.join(", ")}`);
    }
    return picked;
  }
  const n = opts.count ?? all.length;
  if (n < 0) throw new Error("--count must be >= 0");
  return all.slice(0, n);
}

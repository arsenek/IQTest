import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WMI_PACKS } from "../../content/wmi";
import { buildSubtest, type BuiltWmiItem } from "../../src/lib/wmi/build";
import type { WmiPackPlan, WmiSubtestPlan } from "../../src/lib/wmi/types";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export type BuiltSubtest = {
  subtestId: string;
  title?: string;
  plan: WmiSubtestPlan;
  items: BuiltWmiItem[];
};
export type BuiltPack = { plan: WmiPackPlan; subtests: BuiltSubtest[] };

type ManifestSubtest = {
  id: string;
  indexKey?: string;
  title?: string;
  items: unknown[];
  ordered?: boolean;
  [key: string]: unknown;
};
export type Manifest = { subtests: ManifestSubtest[]; [key: string]: unknown };

export function buildPacks(): BuiltPack[] {
  return WMI_PACKS.map((plan) => ({
    plan,
    subtests: plan.subtests.map((sub) => ({
      subtestId: sub.subtestId,
      title: sub.title,
      plan: sub,
      items: buildSubtest(plan, sub),
    })),
  }));
}

export function manifestPath(packId: string): string {
  return path.join(REPO_ROOT, "content/packs", packId, "manifest.json");
}

export function readManifest(packId: string): Manifest {
  return JSON.parse(fs.readFileSync(manifestPath(packId), "utf8")) as Manifest;
}

export function serializeManifest(manifest: Manifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function patchManifest(manifest: Manifest, pack: BuiltPack): Manifest {
  const subtests = manifest.subtests.map((subtest) => {
    const built = pack.subtests.find((s) => s.subtestId === subtest.id);
    if (!built) return subtest;
    const rest = Object.fromEntries(
      Object.entries(subtest).filter(([key]) => key !== "items" && key !== "ordered" && key !== "title"),
    );
    return {
      ...rest,
      title: built.title ?? subtest.title,
      ordered: true,
      items: built.items.map((i) => i.manifest),
    } as ManifestSubtest;
  });
  for (const built of pack.subtests) {
    if (!manifest.subtests.some((s) => s.id === built.subtestId)) {
      throw new Error(`${pack.plan.packId}: manifest has no subtest ${built.subtestId}`);
    }
  }
  return { ...manifest, subtests };
}

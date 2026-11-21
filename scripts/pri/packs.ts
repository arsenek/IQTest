import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PRI_PACKS } from "../../content/pri";
import { buildSubtest, type BuiltItem, type PackPlan } from "../../src/lib/pri/build";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export type BuiltSubtest = { subtestId: string; ordered: boolean; items: BuiltItem[] };
export type BuiltPack = { plan: PackPlan; subtests: BuiltSubtest[] };

type ManifestSubtest = { id: string; items: unknown[]; ordered?: boolean; [key: string]: unknown };
export type Manifest = { subtests: ManifestSubtest[]; [key: string]: unknown };

export function buildPacks(): BuiltPack[] {
  return PRI_PACKS.map((plan) => ({
    plan,
    subtests: plan.subtests.map((sub) => ({
      subtestId: sub.subtestId,
      ordered: sub.ordered,
      items: buildSubtest(plan, sub),
    })),
  }));
}

export function manifestPath(packId: string): string {
  return path.join(REPO_ROOT, "content/packs", packId, "manifest.json");
}

export function mediaDir(packId: string): string {
  return path.join(REPO_ROOT, "content/packs", packId, "media");
}

export function readManifest(packId: string): Manifest {
  return JSON.parse(fs.readFileSync(manifestPath(packId), "utf8")) as Manifest;
}

export function serializeManifest(manifest: Manifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/** Replace only the PRI subtests' items; every other subtest is left untouched. */
export function patchManifest(manifest: Manifest, pack: BuiltPack): Manifest {
  const subtests = manifest.subtests.map((subtest) => {
    const built = pack.subtests.find((s) => s.subtestId === subtest.id);
    if (!built) return subtest;
    const rest = Object.fromEntries(
      Object.entries(subtest).filter(([key]) => key !== "items" && key !== "ordered"),
    );
    return {
      ...rest,
      ...(built.ordered ? { ordered: true } : {}),
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

/** File name → SVG source for every generated media file of a pack. */
export function packFiles(pack: BuiltPack): Record<string, string> {
  const files: Record<string, string> = {};
  for (const sub of pack.subtests) {
    for (const item of sub.items) Object.assign(files, item.files);
  }
  return files;
}

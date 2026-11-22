/**
 * Generates PSI symbol-search items from declarative specs.
 *
 *   npm run psi:generate
 *   npm run psi:generate -- --check
 */
import fs from "node:fs";
import path from "node:path";
import { soundnessChecks } from "../src/lib/psi/verify";
import {
  buildPacks,
  manifestPath,
  patchManifest,
  readManifest,
  serializeManifest,
} from "./psi/packs";

const args = process.argv.slice(2);
const check = args.includes("--check");

const packs = buildPacks();

const failures: string[] = [];
for (const pack of packs) {
  for (const sub of pack.subtests) {
    for (const item of sub.items) {
      for (const c of soundnessChecks(item)) {
        if (!c.ok) failures.push(`${item.spec.id}: ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
      }
    }
  }
}
if (failures.length) {
  console.error(`PSI items failed soundness checks:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}

let stale = 0;
for (const pack of packs) {
  const { packId } = pack.plan;
  const manifest = serializeManifest(patchManifest(readManifest(packId), pack));
  if (check) {
    if (fs.readFileSync(manifestPath(packId), "utf8") !== manifest) {
      console.error(`out of date: ${path.relative(process.cwd(), manifestPath(packId))}`);
      stale += 1;
    }
    continue;
  }
  fs.writeFileSync(manifestPath(packId), manifest);
  const count = pack.subtests.reduce((n, s) => n + s.items.length, 0);
  console.log(`${packId}: ${count} PSI items written`);
}

if (check) {
  if (stale) {
    console.error(`${stale} file(s) differ; run npm run psi:generate`);
    process.exit(1);
  }
  console.log("PSI manifests are up to date.");
}

for (const pack of packs) {
  for (const sub of pack.subtests) {
    console.log(`  ${sub.subtestId}: answers ${sub.items.map((i) => i.manifest.answer).join(" ")}`);
  }
}

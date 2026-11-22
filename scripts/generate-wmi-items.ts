/**
 * Generates WMI digit_span ladders from declarative specs.
 *
 *   npm run wmi:generate
 *   npm run wmi:generate -- --check
 */
import fs from "node:fs";
import path from "node:path";
import { soundnessChecks, subtestLadderChecks } from "../src/lib/wmi/verify";
import {
  buildPacks,
  manifestPath,
  patchManifest,
  readManifest,
  serializeManifest,
} from "./wmi/packs";

const args = process.argv.slice(2);
const check = args.includes("--check");

const packs = buildPacks();

const failures: string[] = [];
for (const pack of packs) {
  for (const sub of pack.subtests) {
    for (const c of subtestLadderChecks(sub.plan, sub.items)) {
      if (!c.ok) failures.push(`${sub.subtestId}: ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
    }
    for (let i = 0; i < sub.items.length; i++) {
      const item = sub.items[i]!;
      for (const c of soundnessChecks(item, sub.plan.lengthLadder[i])) {
        if (!c.ok) failures.push(`${item.spec.id}: ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
      }
    }
  }
}
if (failures.length) {
  console.error(`WMI items failed soundness checks:\n  ${failures.join("\n  ")}`);
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
  console.log(`${packId}: ${count} WMI items written`);
}

if (check) {
  if (stale) {
    console.error(`${stale} file(s) differ; run npm run wmi:generate`);
    process.exit(1);
  }
  console.log("WMI manifests are up to date.");
}

for (const pack of packs) {
  for (const sub of pack.subtests) {
    const lens = sub.items.map((i) => `${i.spec.direction[0]}${i.spec.digits.length}`).join(" ");
    console.log(`  ${sub.subtestId}: ${lens}`);
  }
}

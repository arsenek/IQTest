/**
 * Generates VCI (verbal) items from declarative specs into pack manifests.
 *
 *   npm run vci:generate
 *   npm run vci:generate -- --check
 *   npm run vci:generate -- --doc <file>
 */
import fs from "node:fs";
import path from "node:path";
import { soundnessChecks } from "../src/lib/vci/verify";
import {
  buildPacks,
  manifestPath,
  patchManifest,
  readManifest,
  serializeManifest,
} from "./vci/packs";
import { renderReviewDoc } from "./vci/reviewDoc";

const args = process.argv.slice(2);
const check = args.includes("--check");
const docIndex = args.indexOf("--doc");
const docPath = docIndex >= 0 ? args[docIndex + 1] : undefined;

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
  console.error(`VCI items failed soundness checks:\n  ${failures.join("\n  ")}`);
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
  console.log(`${packId}: ${count} VCI items written`);
}

if (check) {
  if (stale) {
    console.error(`${stale} file(s) differ from the generator output; run npm run vci:generate`);
    process.exit(1);
  }
  console.log("VCI manifests are up to date.");
}

if (docPath) {
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  fs.writeFileSync(docPath, renderReviewDoc(packs));
  console.log(`review notes written to ${docPath}`);
}

for (const pack of packs) {
  for (const sub of pack.subtests) {
    const keys = sub.items.map((i) => i.manifest.answer).join(" | ");
    console.log(`  ${sub.subtestId}: ${keys}`);
  }
}

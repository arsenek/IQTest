/**
 * Generates every PRI (figure reasoning) item from the declarative specs in
 * content/pri: SVG media, answer options and the manifest entries.
 *
 *   npm run pri:generate            write SVGs + manifests
 *   npm run pri:generate -- --check fail if checked-in output is out of date
 *   npm run pri:generate -- --doc <file>   also write the per-item review notes
 *
 * An item that fails any soundness check aborts the run; nothing is written.
 */
import fs from "node:fs";
import path from "node:path";
import { soundnessChecks } from "../src/lib/pri/verify";
import {
  buildPacks,
  manifestPath,
  mediaDir,
  packFiles,
  patchManifest,
  readManifest,
  serializeManifest,
} from "./pri/packs";
import { renderReviewDoc } from "./pri/reviewDoc";

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
  console.error(`PRI items failed soundness checks:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}

let stale = 0;
for (const pack of packs) {
  const { packId } = pack.plan;
  const dir = mediaDir(packId);
  const files = packFiles(pack);
  const manifest = serializeManifest(patchManifest(readManifest(packId), pack));
  const existing = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".svg")) : [];

  if (check) {
    for (const [name, svg] of Object.entries(files)) {
      const file = path.join(dir, name);
      if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== svg) {
        console.error(`out of date: ${path.relative(process.cwd(), file)}`);
        stale += 1;
      }
    }
    for (const name of existing) {
      if (!(name in files) && !manifest.includes(`/media/${name}"`)) {
        console.error(`unreferenced: ${path.relative(process.cwd(), path.join(dir, name))}`);
        stale += 1;
      }
    }
    if (fs.readFileSync(manifestPath(packId), "utf8") !== manifest) {
      console.error(`out of date: ${path.relative(process.cwd(), manifestPath(packId))}`);
      stale += 1;
    }
    continue;
  }

  fs.mkdirSync(dir, { recursive: true });
  let removed = 0;
  for (const name of existing) {
    // Only drop media nothing refers to any more (the previous PRI figures).
    if (!(name in files) && !manifest.includes(`/media/${name}"`)) {
      fs.unlinkSync(path.join(dir, name));
      removed += 1;
    }
  }
  for (const [name, svg] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), svg);
  fs.writeFileSync(manifestPath(packId), manifest);
  const count = pack.subtests.reduce((n, s) => n + s.items.length, 0);
  console.log(
    `${packId}: ${count} items, ${Object.keys(files).length} SVGs written, ${removed} stale SVGs removed`,
  );
}

if (check) {
  if (stale) {
    console.error(`${stale} file(s) differ from the generator output; run npm run pri:generate`);
    process.exit(1);
  }
  console.log("PRI media and manifests are up to date.");
}

if (docPath) {
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  fs.writeFileSync(docPath, renderReviewDoc(packs));
  console.log(`review notes written to ${docPath}`);
}

for (const pack of packs) {
  for (const sub of pack.subtests) {
    const scores = sub.items.map((i) => i.score).join(" ");
    const keys = sub.items.map((i) => i.manifest.answer.slice(-1)).join("");
    console.log(`  ${sub.subtestId}: scores ${scores} | keys ${keys}`);
  }
}

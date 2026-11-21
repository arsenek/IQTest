/**
 * Renders one contact-sheet PNG per pack: every PRI item's stem with its four
 * options, the correct one marked, plus the rule in one sentence.
 *
 *   npm run pri:sheets -- --out <dir> [--tiles <dir>]
 *
 * --tiles additionally saves one PNG per item (for close inspection).
 * Reads the SVGs straight from the generator, i.e. exactly what ships.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import type { BuiltItem } from "../src/lib/pri/build";
import { buildPacks } from "./pri/packs";

const args = process.argv.slice(2);
const arg = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const outDir = arg("--out");
const tilesDir = arg("--tiles");
if (!outDir) {
  console.error("usage: render-pri-contact-sheets --out <dir> [--tiles <dir>]");
  process.exit(1);
}

const SHEET_NAME: Record<string, string> = {
  "child/v1": "pri-child-formal",
  "adult/v1": "pri-adult-formal",
  "child/practice/v1": "pri-child-practice",
  "adult/practice/v1": "pri-adult-practice",
};

const SHEET_TITLE: Record<string, string> = {
  "child/v1": "儿童正式包 · 图形推理（PRI）全部题目",
  "adult/v1": "成人正式包 · 图形推理（PRI）全部题目",
  "child/practice/v1": "儿童练习池 · 图形推理（PRI）全部题目",
  "adult/practice/v1": "成人练习池 · 图形推理（PRI）全部题目",
};

const LEVEL_ZH: Record<number, string> = { 1: "入门", 2: "基础", 3: "中等", 4: "较难", 5: "困难" };

const dataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function card(item: BuiltItem): string {
  const { spec, manifest, files } = item;
  const file = (url: string) => files[url.split("/").pop() as string];
  const options = manifest.choices
    .map((c) => {
      const correct = c.label === manifest.answer;
      return `<div class="opt${correct ? " correct" : ""}">
        <img src="${dataUri(file(c.image))}" alt="">
        <div class="lab">${esc(c.label)}${correct ? " ✓ 正确" : ""}</div>
      </div>`;
    })
    .join("");
  return `<section class="card ${spec.kind}" id="${spec.id}">
    <header><b>${esc(spec.id)}</b><span class="lvl l${item.level}">难度 ${item.level} · ${LEVEL_ZH[item.level]}</span></header>
    <p class="rule">规则：${esc(spec.ruleText)}</p>
    <div class="body">
      <img class="stem" src="${dataUri(file(manifest.image))}" alt="">
      <div class="opts">${options}</div>
    </div>
  </section>`;
}

const CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 28px; width: 1800px; background: #f1f5f9; color: #0f172a;
    font-family: -apple-system, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif; }
  h1 { margin: 0 0 6px; font-size: 34px; }
  .note { margin: 0 0 22px; font-size: 18px; color: #475569; }
  h2 { margin: 26px 0 12px; font-size: 26px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .card { background: #fff; border: 2px solid #cbd5e1; border-radius: 14px; padding: 16px 18px; }
  header { display: flex; align-items: center; gap: 12px; font-size: 22px; }
  .lvl { font-size: 16px; padding: 2px 10px; border-radius: 999px; background: #e2e8f0; }
  .lvl.l3 { background: #fde68a; } .lvl.l4 { background: #fdba74; } .lvl.l5 { background: #fca5a5; }
  .rule { margin: 8px 0 12px; font-size: 17px; line-height: 1.45; min-height: 50px; }
  .body { display: flex; align-items: center; gap: 18px; }
  .card.sequence .body { flex-direction: column; align-items: flex-start; }
  .stem { border: 1px solid #cbd5e1; border-radius: 8px; }
  .card.matrix .stem { width: 380px; height: 380px; }
  .card.sequence .stem { height: 148px; max-width: 100%; }
  .opts { display: grid; gap: 10px; }
  .card.matrix .opts { grid-template-columns: repeat(2, 1fr); }
  .card.sequence .opts { grid-template-columns: repeat(4, auto); }
  .opt { border: 4px solid #e2e8f0; border-radius: 10px; padding: 4px 6px 6px; text-align: center; background: #fff; }
  .opt img { display: block; width: 150px; height: 150px; }
  .opt .lab { font-size: 16px; color: #475569; }
  .opt.correct { border-color: #16a34a; background: #dcfce7; }
  .opt.correct .lab { color: #166534; font-weight: 700; }
`;

async function main() {
  const packs = buildPacks();
  fs.mkdirSync(outDir as string, { recursive: true });
  if (tilesDir) fs.mkdirSync(tilesDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1856, height: 1200 }, deviceScaleFactor: 1 });

  for (const pack of packs) {
    const { packId } = pack.plan;
    const sections = pack.subtests
      .map((sub) => {
        const keys = sub.items.map((i) => i.manifest.answer.slice(-1)).join(" ");
        return `<h2>${esc(sub.subtestId)}（${sub.items.length} 题）　正确选项：${keys}</h2>
          <div class="grid">${sub.items.map(card).join("")}</div>`;
      })
      .join("");
    const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>${CSS}</style></head><body>
      <h1>${SHEET_TITLE[packId]}</h1>
      <p class="note">绿色框为正确选项。图形由题目规格自动生成，与线上测试使用的是同一批 SVG 文件；作答时选项顺序会被打乱。</p>
      ${sections}</body></html>`;
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => Promise.all(Array.from(document.images).map((img) => img.decode())));
    const out = path.join(outDir as string, `${SHEET_NAME[packId]}.png`);
    await page.screenshot({ path: out, fullPage: true });
    console.log(`${out}`);

    if (tilesDir) {
      for (const sub of pack.subtests) {
        for (const item of sub.items) {
          await page.locator(`#${item.spec.id}`).screenshot({ path: path.join(tilesDir, `${item.spec.id}.png`) });
        }
      }
    }
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

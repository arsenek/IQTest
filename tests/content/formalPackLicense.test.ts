import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { loadPack } from "@/lib/content/loadPack";
import { describe, expect, it } from "vitest";

/** Formal standardized packs only — never practice/candidates/e2e. */
const FORMAL_PACKS = ["child/v1", "adult/v1"] as const;

/**
 * Banned commercial-formal sources (license matrix + preferences D1/D2/Open1).
 * Matched case-insensitively against on-disk formal pack text and item metadata.
 */
const BANNED_PATTERNS: Array<{ id: string; re: RegExp }> = [
  { id: "ICAR", re: /\bicar\b/i },
  { id: "MaRs-IB", re: /\bmars(?:-ib)?\b/i },
  { id: "Sandia", re: /\bsandia(?:labs)?\b|\bsgmt\b/i },
  { id: "Wonderlic-in-formal", re: /\bwonderlic\b/i },
  { id: "OMIB-in-formal", re: /\bomib\b/i },
];

const FORMAL_ROOTS = FORMAL_PACKS.map((id) =>
  path.join(process.cwd(), "content", "packs", ...id.split("/")),
);

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walkFiles(p, out);
    else out.push(p);
  }
  return out;
}

describe("formal pack license self-check", () => {
  it("formal items carry no BY-SA / GPL / banned license tags", () => {
    for (const packId of FORMAL_PACKS) {
      const items = loadPack(packId).subtests.flatMap((s) => s.items);
      for (const item of items) {
        expect(item.license, `${packId}/${item.id} license`).toBeUndefined();
        expect(item.attribution, `${packId}/${item.id} attribution`).toBeUndefined();
        expect(item.sourceId, `${packId}/${item.id} sourceId`).toBeUndefined();
        if (item.license) {
          expect(item.license).not.toMatch(/BY-SA|GPL|ICAR|MaRs|Sandia/i);
        }
      }
    }
  });

  it("on-disk formal pack trees never mention banned sources", () => {
    const hits: string[] = [];
    for (const root of FORMAL_ROOTS) {
      for (const file of walkFiles(root)) {
        // SVG media is self-generated geometry; skip binary-ish noise, scan text manifests + svg text.
        if (!/\.(json|md|svg|txt)$/i.test(file)) continue;
        const text = readFileSync(file, "utf8");
        for (const { id, re } of BANNED_PATTERNS) {
          if (re.test(text)) {
            hits.push(`${id} in ${path.relative(process.cwd(), file)}`);
          }
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it("rule-gen formal content specs never name banned banks", () => {
    const roots = ["pri", "vci", "psi", "wmi"].map((d) =>
      path.join(process.cwd(), "content", d),
    );
    const hits: string[] = [];
    for (const root of roots) {
      for (const file of walkFiles(root)) {
        if (!/\.(ts|tsx|json|md)$/i.test(file)) continue;
        // Only formal audience files — practice specs may share templates but still must not cite bans.
        const text = readFileSync(file, "utf8");
        for (const { id, re } of BANNED_PATTERNS) {
          if (re.test(text)) {
            hits.push(`${id} in ${path.relative(process.cwd(), file)}`);
          }
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it("checklist doc exists for human gate", () => {
    const p = path.join(process.cwd(), "docs", "formal-pack-license-checklist.md");
    const text = readFileSync(p, "utf8");
    expect(text).toMatch(/ICAR/);
    expect(text).toMatch(/MaRs/);
    expect(text).toMatch(/Sandia/);
    expect(text).toMatch(/正式包/);
  });
});

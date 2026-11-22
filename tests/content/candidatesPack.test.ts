import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadPack } from "@/lib/content/loadPack";
import { INDEX_KEYS } from "@/lib/content/types";
import { describe, it, expect } from "vitest";

const FORMAL_AND_PRACTICE = [
  "child/v1",
  "adult/v1",
  "child/practice/v1",
  "adult/practice/v1",
  "child/e2e",
] as const;

const CANDIDATES = "adult/candidates/v1";

function allItemIds(packId: string): string[] {
  return loadPack(packId).subtests.flatMap((s) => s.items.map((i) => i.id));
}

describe("adult/candidates/v1", () => {
  it("loads and matches schema / pack id / pool", () => {
    const pack = loadPack(CANDIDATES);
    expect(pack.id).toBe(CANDIDATES);
    expect(pack.audience).toBe("adult");
    expect(pack.pool).toBe("candidates");
    const keys = new Set(pack.subtests.map((s) => s.indexKey));
    expect(keys).toEqual(new Set(INDEX_KEYS));
  });

  it("keeps item ids disjoint from formal and practice packs", () => {
    const cand = new Set(allItemIds(CANDIDATES));
    for (const other of FORMAL_AND_PRACTICE) {
      for (const id of allItemIds(other)) {
        expect(cand.has(id), `overlap with ${other}: ${id}`).toBe(false);
      }
    }
  });

  it("tags Wonderlic imports with CC BY-SA provenance", () => {
    const pack = loadPack(CANDIDATES);
    const imported = pack.subtests
      .flatMap((s) => s.items)
      .filter((i) => i.sourceId);
    expect(imported.length).toBeGreaterThanOrEqual(10);
    for (const item of imported) {
      expect(item.license).toMatch(/BY-SA/i);
      expect(item.attribution).toMatch(/awesome-wonderlic/i);
      expect(item.prompt).toMatch(/【候选】/);
    }
  });

  it("does not place CC BY-SA items into formal packs", () => {
    for (const packId of ["child/v1", "adult/v1"] as const) {
      const items = loadPack(packId).subtests.flatMap((s) => s.items);
      expect(items.every((i) => !i.license?.match(/BY-SA|GPL/i))).toBe(true);
    }
  });

  it("WMI scaffolds stay ordered digit_span; PRI candidates are mcq without claiming norms", () => {
    const pack = loadPack(CANDIDATES);
    const wmi = pack.subtests.find((s) => s.indexKey === "WMI")!;
    expect(wmi.ordered).toBe(true);
    expect(wmi.items.every((i) => i.type === "digit_span")).toBe(true);
    const pri = pack.subtests.find((s) => s.indexKey === "PRI")!;
    expect(pri.items.every((i) => i.type === "mcq")).toBe(true);
    expect(pack.title).toMatch(/非正式|候选/);
  });
});

describe("pack id inventory", () => {
  it("every on-disk manifest is loadable and unique by item id", () => {
    const root = path.join(process.cwd(), "content", "packs");
    const manifests: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, name.name);
        if (name.isDirectory()) walk(p);
        else if (name.name === "manifest.json") manifests.push(p);
      }
    };
    walk(root);

    const seen = new Map<string, string>();
    for (const file of manifests) {
      const raw = JSON.parse(readFileSync(file, "utf8")) as { id: string };
      const pack = loadPack(raw.id);
      expect(pack.id).toBe(raw.id);
      for (const id of allItemIds(raw.id)) {
        expect(seen.has(id), `duplicate id ${id} in ${raw.id} and ${seen.get(id)}`).toBe(
          false,
        );
        seen.set(id, raw.id);
      }
    }
    expect(manifests.length).toBeGreaterThanOrEqual(6);
  });
});

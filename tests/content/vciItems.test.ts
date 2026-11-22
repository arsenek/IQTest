import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { buildItem } from "@/lib/vci/build";
import { analogy, classify, sequence } from "@/lib/vci/spec";
import { soundnessChecks } from "@/lib/vci/verify";
import { VCI_PACKS } from "../../content/vci";
import {
  buildPacks,
  manifestPath,
  patchManifest,
  readManifest,
  serializeManifest,
} from "../../scripts/vci/packs";

const packs = buildPacks();
const allItems = packs.flatMap((pack) =>
  pack.subtests.flatMap((sub) =>
    sub.items.map((item) => ({ packId: pack.plan.packId, subtestId: sub.subtestId, item })),
  ),
);

const failed = (item: (typeof allItems)[0]["item"]) =>
  soundnessChecks(item)
    .filter((c) => !c.ok)
    .map((c) => c.name);

const range = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);

describe("VCI items: every item is provably sound", () => {
  it.each(allItems.map((x) => [x.item.spec.id, x.item] as const))(
    "%s: unique key, distractors break rules, options distinct",
    (_id, item) => {
      const problems = soundnessChecks(item)
        .filter((c) => !c.ok)
        .map((c) => `${c.name}${c.detail ? ` (${c.detail})` : ""}`);
      expect(problems).toEqual([]);
    },
  );

  it("each item states its rule in Chinese and has four options with glyphs", () => {
    for (const { item } of allItems) {
      expect(item.spec.ruleText).toMatch(/[\u4e00-\u9fff]/);
      expect(item.manifest.choices).toHaveLength(4);
      expect(item.manifest.choices.every((c) => c.glyph.length >= 1)).toBe(true);
      expect(item.manifest.prompt).toMatch(/[\u4e00-\u9fff]/);
    }
  });
});

describe("VCI items: the checks reject broken items", () => {
  const plan = VCI_PACKS[0];
  const sub = plan.subtests[0];

  it("a sound item passes", () => {
    expect(failed(buildItem(plan, sub, sub.specs[0]))).toEqual([]);
  });

  it("rejects a distractor that also fits the category", () => {
    const broken = classify({
      id: "x-classify-leak",
      categoryId: "fruit",
      exemplars: ["苹果", "香蕉", "橙子"],
      answer: "葡萄",
      distractors: ["西瓜", "桌子", "汽车"],
      ruleText: "水果。",
    });
    const item = buildItem(plan, sub, broken);
    expect(failed(item)).toEqual(
      expect.arrayContaining(["distractors-break-rules", "answer-deducible"]),
    );
  });

  it("rejects a sequence whose keyed answer is not the deduced next", () => {
    const broken = sequence({
      id: "x-seq-wrong",
      series: ["2", "4", "6"],
      rule: { type: "numeric", step: 2 },
      answer: "7",
      distractors: ["8", "10", "5"],
      ruleText: "加二。",
    });
    const item = buildItem(plan, sub, broken);
    expect(failed(item)).toContain("answer-deducible");
  });

  it("rejects an analogy whose stem pair is not in the lexicon", () => {
    const broken = analogy({
      id: "x-analogy-bad-stem",
      relationId: "habitat",
      a: "鸟",
      b: "大海",
      c: "鱼",
      answer: "水",
      distractors: ["树", "石头", "火"],
      ruleText: "栖息地。",
    });
    const item = buildItem(plan, sub, broken);
    expect(failed(item)).toContain("stem-pair-related");
  });
});

describe("VCI items: checked-in manifests match the generator", () => {
  it.each(packs.map((p) => [p.plan.packId, p] as const))("%s", (packId, pack) => {
    const onDisk = fs.readFileSync(manifestPath(packId), "utf8");
    expect(onDisk).toBe(serializeManifest(patchManifest(readManifest(packId), pack)));
  });

  it("no VCI subtest is left outside the generator", () => {
    for (const pack of packs) {
      const manifest = readManifest(pack.plan.packId) as {
        subtests: Array<{ id: string; indexKey: string; items: Array<{ id: string }> }>;
      };
      const vci = manifest.subtests.filter((s) => s.indexKey === "VCI");
      expect(vci.map((s) => s.id)).toEqual(pack.subtests.map((s) => s.subtestId));
      for (const sub of pack.subtests) {
        const inManifest = vci.find((s) => s.id === sub.subtestId)!;
        expect(inManifest.items.map((i) => i.id)).toEqual(sub.items.map((i) => i.spec.id));
      }
    }
  });
});

describe("VCI items: structure the app relies on is unchanged", () => {
  const ids = (subtestId: string) =>
    allItems.filter((x) => x.subtestId === subtestId).map((x) => x.item.spec.id);

  it("keeps subtest ids, item ids and counts", () => {
    expect(ids("child-vci-vocab")).toEqual(range("child-vci-", 16));
    expect(ids("child-vci-analogy")).toEqual(range("child-vci2-", 7));
    expect(ids("adult-vci-vocab")).toEqual(range("adult-vci-", 16));
    expect(ids("adult-vci-analogy")).toEqual(range("adult-vci2-", 7));
    expect(ids("child-prac-vci")).toEqual(range("child-prac-vci-", 10));
    expect(ids("adult-prac-vci")).toEqual(range("adult-prac-vci-", 10));
    expect(new Set(allItems.map((x) => x.item.spec.id)).size).toBe(66);
  });

  it("practice never repeats a formal prompt", () => {
    const formal = new Set(
      allItems.filter((x) => !x.packId.includes("practice")).map((x) => x.item.manifest.prompt),
    );
    for (const { packId, item } of allItems) {
      if (!packId.includes("practice")) continue;
      expect(formal.has(item.manifest.prompt)).toBe(false);
    }
  });
});

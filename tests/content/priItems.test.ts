import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildSubtest, type BuiltItem } from "@/lib/pri/build";
import { difficultyScore, effectiveRules } from "@/lib/pri/rules";
import { cycle, matrix, oneOf, rule, sequence } from "@/lib/pri/spec";
import { soundnessChecks } from "@/lib/pri/verify";
import { cellKey } from "@/lib/pri/vocab";
import { PRI_PACKS } from "../../content/pri";
import {
  buildPacks,
  manifestPath,
  mediaDir,
  packFiles,
  patchManifest,
  readManifest,
  serializeManifest,
} from "../../scripts/pri/packs";

const packs = buildPacks();
const allItems: Array<{ packId: string; subtestId: string; item: BuiltItem }> = packs.flatMap((pack) =>
  pack.subtests.flatMap((sub) =>
    sub.items.map((item) => ({ packId: pack.plan.packId, subtestId: sub.subtestId, item })),
  ),
);

const failed = (item: BuiltItem) =>
  soundnessChecks(item)
    .filter((c) => !c.ok)
    .map((c) => c.name);

const range = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);

describe("PRI items: every item is provably sound", () => {
  it.each(allItems.map((x) => [x.item.spec.id, x.item] as const))(
    "%s: answer is deducible, unique, keyed correctly, and every distractor breaks a rule",
    (_id, item) => {
      const problems = soundnessChecks(item)
        .filter((c) => !c.ok)
        .map((c) => `${c.name}${c.detail ? ` (${c.detail})` : ""}`);
      expect(problems).toEqual([]);
    },
  );

  it("each item states its rule in Chinese and has four options", () => {
    for (const { item } of allItems) {
      expect(item.spec.ruleText).toMatch(/[\u4e00-\u9fff]/);
      expect(item.manifest.choices).toHaveLength(4);
      expect(item.manifest.choices.map((c) => c.label)).toEqual(["选项 A", "选项 B", "选项 C", "选项 D"]);
    }
  });
});

describe("PRI items: the checks reject broken items", () => {
  const sample = () => structuredClone(allItems.find((x) => x.item.spec.id === "adult-pri-12")!.item);

  it("a sound item passes", () => {
    expect(failed(sample())).toEqual([]);
  });

  it("rejects a key that points at a distractor", () => {
    const item = sample();
    item.manifest.answer = item.options.find((o) => !o.correct)!.label;
    expect(failed(item)).toContain("key-matches-deduction");
  });

  it("rejects a distractor that also satisfies the rules", () => {
    const item = sample();
    const key = item.options.find((o) => o.correct)!;
    item.options.find((o) => !o.correct)!.cell = { ...key.cell };
    expect(failed(item)).toEqual(expect.arrayContaining(["distractors-break-rules", "options-distinct"]));
  });

  it("rejects a stem whose complete rows break the stated rule", () => {
    const item = sample();
    item.spec.grid[0][0] = { ...item.spec.grid[0][1] };
    expect(failed(item)).toContain("stem-obeys-rules");
  });

  it("rejects a stem that shows its rule only once", () => {
    const underdetermined = sequence({
      id: "x-underdetermined",
      length: 5,
      attrs: { shape: ["circle", "square", "triangle", "circle", "square"], fill: "solid" },
      rules: [cycle("shape", 3)],
      distractors: oneOf("shape", ["circle", "triangle", "star"]),
      ruleText: "三个一组重复。",
    });
    const plan = PRI_PACKS[0];
    expect(() =>
      buildSubtest(plan, { subtestId: "x", filePrefix: "x", ordered: true, specs: [underdetermined] }),
    ).toThrow(/shown only 1×/);
  });

  it("rejects a stem where a second reading gives a different answer", () => {
    // The two complete rows never overlap, so "overlay" and "overlay minus the
    // shared part" both fit them, yet they disagree on the third row.
    const ambiguous = matrix({
      id: "x-ambiguous",
      figure: { type: "parts", template: "house" },
      attrs: {
        parts: [
          [["walls"], ["roof"], ["walls", "roof"]],
          [["door"], ["window"], ["door", "window"]],
          [["walls", "roof"], ["roof", "door"], ["walls", "roof", "door"]],
        ],
      },
      rules: [rule("parts", "union", "row")],
      distractors: [{ parts: ["walls", "door"] }, { parts: ["walls", "roof"] }, { parts: ["roof", "door"] }],
      ruleText: "叠加。",
    });
    const [item] = buildSubtest(PRI_PACKS[0], {
      subtestId: "x",
      filePrefix: "x",
      ordered: true,
      specs: [ambiguous],
    });
    expect(failed(item)).toContain("no-rival-rule");
  });

  it("rejects a spec whose stored answer cell is not what the rules deduce", () => {
    const item = structuredClone(allItems.find((x) => x.item.spec.kind === "sequence")!.item);
    const k = item.spec.missing[1];
    item.spec.grid[0][k] = { ...item.options.find((o) => !o.correct)!.cell };
    expect(failed(item)).toContain("answer-deducible");
  });

  it("rejects options from which the answer can be picked without the stem", () => {
    // Three distractors that each differ from the answer in one attribute make
    // the answer the only option that shares every value with another option.
    const item = sample();
    const key = item.options.find((o) => o.correct)!;
    const wrong = item.options.filter((o) => !o.correct);
    wrong[0].cell = { ...key.cell, shape: "star" };
    wrong[1].cell = { ...key.cell, shape: "diamond" };
    wrong[2].cell = { ...key.cell, fill: key.cell.fill === "solid" ? "hollow" : "solid" };
    expect(failed(item)).toContain("no-odd-one-out-shortcut");
  });
});

describe("PRI items: checked-in manifests and SVGs match the generator", () => {
  it.each(packs.map((p) => [p.plan.packId, p] as const))("%s", (packId, pack) => {
    const onDisk = fs.readFileSync(manifestPath(packId), "utf8");
    expect(onDisk).toBe(serializeManifest(patchManifest(readManifest(packId), pack)));

    const files = packFiles(pack);
    for (const [name, svg] of Object.entries(files)) {
      expect(name).toMatch(/^[a-z0-9][a-z0-9._-]*\.svg$/);
      expect(fs.readFileSync(path.join(mediaDir(packId), name), "utf8"), name).toBe(svg);
    }
    const leftovers = fs
      .readdirSync(mediaDir(packId))
      .filter((f) => f.endsWith(".svg") && !(f in files) && !onDisk.includes(`/media/${f}"`));
    expect(leftovers).toEqual([]);
  });

  it("no PRI subtest is left outside the generator", () => {
    for (const pack of packs) {
      const manifest = readManifest(pack.plan.packId) as {
        subtests: Array<{ id: string; indexKey: string; ordered?: boolean; items: Array<{ id: string }> }>;
      };
      const pri = manifest.subtests.filter((s) => s.indexKey === "PRI");
      expect(pri.map((s) => s.id)).toEqual(pack.subtests.map((s) => s.subtestId));
      for (const sub of pack.subtests) {
        const inManifest = pri.find((s) => s.id === sub.subtestId)!;
        expect(inManifest.items.map((i) => i.id)).toEqual(sub.items.map((i) => i.spec.id));
        expect(Boolean(inManifest.ordered)).toBe(sub.ordered);
      }
    }
  });
});

describe("PRI items: structure the app relies on is unchanged", () => {
  const ids = (subtestId: string) =>
    allItems.filter((x) => x.subtestId === subtestId).map((x) => x.item.spec.id);

  it("keeps subtest ids, item ids and counts", () => {
    expect(ids("child-pri-matrix")).toEqual(range("child-pri-", 16));
    expect(ids("child-pri-sequence")).toEqual(range("child-pri2-", 7));
    expect(ids("adult-pri-matrix")).toEqual(range("adult-pri-", 16));
    expect(ids("adult-pri-sequence")).toEqual(range("adult-pri2-", 7));
    expect(ids("child-prac-pri")).toEqual(range("child-prac-pri-", 10));
    expect(ids("adult-prac-pri")).toEqual(range("adult-prac-pri-", 10));
    expect(new Set(allItems.map((x) => x.item.spec.id)).size).toBe(66);
  });

  it("uses one neutral prompt per item kind, so the prompt never gives the rule away", () => {
    for (const pack of packs) {
      for (const sub of pack.subtests) {
        for (const kind of ["matrix", "sequence"] as const) {
          const prompts = new Set(sub.items.filter((i) => i.spec.kind === kind).map((i) => i.manifest.prompt));
          expect(prompts.size).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("no two items show the same stem (practice never repeats a formal item)", () => {
    const stems = allItems.map(({ item }) => {
      const [mr, mc] = item.spec.missing;
      return JSON.stringify([
        item.spec.figure,
        item.spec.grid.map((row, r) => row.map((c, ci) => (r === mr && ci === mc ? "?" : cellKey(c)))),
      ]);
    });
    expect(new Set(stems).size).toBe(stems.length);
  });
});

describe("PRI items: answer key is not predictable", () => {
  it.each(packs.flatMap((p) => p.subtests).map((s) => [s.subtestId, s] as const))(
    "%s spreads the correct option over A–D",
    (_id, sub) => {
      const keys = sub.items.map((i) => i.manifest.answer);
      const counts = ["选项 A", "选项 B", "选项 C", "选项 D"].map((l) => keys.filter((k) => k === l).length);
      expect(Math.min(...counts)).toBeGreaterThanOrEqual(Math.floor(keys.length / 4));
      expect(Math.max(...counts)).toBeLessThanOrEqual(Math.ceil(keys.length / 4));
      const run3 = keys.some((k, i) => i >= 2 && k === keys[i - 1] && k === keys[i - 2]);
      expect(run3).toBe(false);
    },
  );
});

describe("PRI items: difficulty", () => {
  const scores = (subtestId: string) =>
    allItems.filter((x) => x.subtestId === subtestId).map((x) => x.item.score);
  const explicitRules = (subtestId: string) =>
    allItems.filter((x) => x.subtestId === subtestId).map((x) => x.item.spec.rules.length);
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  it.each(["child-pri-matrix", "child-pri-sequence", "adult-pri-matrix", "adult-pri-sequence"])(
    "%s never gets easier from one item to the next, and ends harder than it starts",
    (subtestId) => {
      const s = scores(subtestId);
      s.forEach((x, i) => {
        if (i > 0) expect(x).toBeGreaterThanOrEqual(s[i - 1]);
      });
      expect(s[s.length - 1]).toBeGreaterThanOrEqual(s[0] + 3);
    },
  );

  it("score is the summed rule weight recorded with the item", () => {
    for (const { item } of allItems) {
      expect(item.score).toBe(difficultyScore(item.spec));
      expect(effectiveRules(item.spec).length).toBeGreaterThanOrEqual(item.spec.rules.length);
    }
  });

  it("child items combine at most two rules; adult items go up to three", () => {
    for (const id of ["child-pri-matrix", "child-pri-sequence", "child-prac-pri"]) {
      expect(Math.max(...explicitRules(id))).toBeLessThanOrEqual(2);
    }
    expect(Math.max(...explicitRules("adult-pri-matrix"))).toBe(3);
    expect(Math.max(...explicitRules("adult-pri-sequence"))).toBe(3);
  });

  it("the child pack is gentler than the adult pack", () => {
    expect(mean(scores("child-pri-matrix"))).toBeLessThan(mean(scores("adult-pri-matrix")));
    expect(mean(scores("child-pri-sequence"))).toBeLessThan(mean(scores("adult-pri-sequence")));
    expect(mean(scores("child-prac-pri"))).toBeLessThan(mean(scores("adult-prac-pri")));
  });
});

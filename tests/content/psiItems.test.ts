import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { buildItem, makeGrid } from "@/lib/psi/build";
import { psi } from "@/lib/psi/spec";
import { soundnessChecks } from "@/lib/psi/verify";
import { PSI_PACKS } from "../../content/psi";
import {
  buildPacks,
  manifestPath,
  patchManifest,
  readManifest,
  serializeManifest,
} from "../../scripts/psi/packs";

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

describe("PSI items: every item is provably sound", () => {
  it.each(allItems.map((x) => [x.item.spec.id, x.item] as const))(
    "%s: count unique, prompt parseable, alphabet closed",
    (_id, item) => {
      const problems = soundnessChecks(item)
        .filter((c) => !c.ok)
        .map((c) => `${c.name}${c.detail ? ` (${c.detail})` : ""}`);
      expect(problems).toEqual([]);
    },
  );
});

describe("PSI items: the checks reject broken items", () => {
  const plan = PSI_PACKS[0];
  const sub = plan.subtests[0];

  it("rejects a wrong keyed answer", () => {
    const item = buildItem(plan, sub, psi({ id: "x", target: "☆", grid: "★☆☆", timeLimitMs: 30000 }));
    item.manifest.answer = 1;
    expect(failed(item)).toContain("count-matches-grid");
  });

  it("rejects a grid symbol outside the alphabet", () => {
    const spec = psi({ id: "x", target: "☆", grid: "★☆●", timeLimitMs: 30000, alphabet: ["☆", "★"] });
    expect(failed(buildItem(plan, sub, spec))).toContain("grid-subset-alphabet");
  });

  it("makeGrid yields the requested target count", () => {
    const grid = makeGrid("A", ["B", "C"], 8, 3, "seed");
    expect(grid.filter((s) => s === "A")).toHaveLength(3);
    expect(grid).toHaveLength(8);
  });
});

describe("PSI items: checked-in manifests match the generator", () => {
  it.each(packs.map((p) => [p.plan.packId, p] as const))("%s", (packId, pack) => {
    const onDisk = fs.readFileSync(manifestPath(packId), "utf8");
    expect(onDisk).toBe(serializeManifest(patchManifest(readManifest(packId), pack)));
  });

  it("keeps ids and counts", () => {
    const ids = (subtestId: string) =>
      allItems.filter((x) => x.subtestId === subtestId).map((x) => x.item.spec.id);
    expect(ids("child-psi-symbols")).toEqual(range("child-psi-", 16));
    expect(ids("child-psi-pairing")).toEqual(range("child-psi2-", 7));
    expect(ids("adult-psi-symbols")).toEqual(range("adult-psi-", 16));
    expect(ids("adult-psi-pairing")).toEqual(range("adult-psi2-", 7));
    expect(ids("child-prac-psi")).toEqual(range("child-prac-psi-", 10));
    expect(ids("adult-prac-psi")).toEqual(range("adult-prac-psi-", 10));
    expect(new Set(allItems.map((x) => x.item.spec.id)).size).toBe(66);
  });
});

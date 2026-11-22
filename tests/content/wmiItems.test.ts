import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { buildItem, expectedAnswer } from "@/lib/wmi/build";
import { span } from "@/lib/wmi/spec";
import { soundnessChecks, subtestLadderChecks } from "@/lib/wmi/verify";
import { WMI_PACKS } from "../../content/wmi";
import {
  buildPacks,
  manifestPath,
  patchManifest,
  readManifest,
  serializeManifest,
} from "../../scripts/wmi/packs";

const packs = buildPacks();
const allItems = packs.flatMap((pack) =>
  pack.subtests.flatMap((sub) =>
    sub.items.map((item, i) => ({
      packId: pack.plan.packId,
      subtestId: sub.subtestId,
      ladder: sub.plan.lengthLadder[i]!,
      item,
    })),
  ),
);

const failed = (item: (typeof allItems)[0]["item"], ladder?: number) =>
  soundnessChecks(item, ladder)
    .filter((c) => !c.ok)
    .map((c) => c.name);

const range = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);

describe("WMI items: every item is provably sound", () => {
  it.each(allItems.map((x) => [x.item.spec.id, x] as const))(
    "%s: answer matches direction and ladder",
    (_id, row) => {
      const problems = soundnessChecks(row.item, row.ladder)
        .filter((c) => !c.ok)
        .map((c) => `${c.name}${c.detail ? ` (${c.detail})` : ""}`);
      expect(problems).toEqual([]);
    },
  );

  it("each subtest ladder is consistent", () => {
    for (const pack of packs) {
      for (const sub of pack.subtests) {
        const problems = subtestLadderChecks(sub.plan, sub.items).filter((c) => !c.ok);
        expect(problems).toEqual([]);
      }
    }
  });
});

describe("WMI items: the checks reject broken items", () => {
  const plan = WMI_PACKS[0];
  const sub = plan.subtests[0];

  it("rejects a wrong reverse answer", () => {
    const item = buildItem(
      plan,
      sub,
      span({ id: "x", digits: [1, 2, 3], direction: "reverse", encodeMs: 4500 }),
    );
    item.manifest.answer = "1-2-3";
    expect(failed(item)).toContain("answer-matches-direction");
  });

  it("rejects adjacent duplicate digits", () => {
    const item = buildItem(
      plan,
      sub,
      span({ id: "x", digits: [1, 1, 2], direction: "forward", encodeMs: 4500 }),
    );
    expect(failed(item)).toContain("no-adjacent-duplicate");
  });

  it("expectedAnswer reverses correctly", () => {
    expect(expectedAnswer([7, 2, 9], "reverse")).toBe("9-2-7");
    expect(expectedAnswer([7, 2, 9], "forward")).toBe("7-2-9");
  });
});

describe("WMI items: checked-in manifests match the generator", () => {
  it.each(packs.map((p) => [p.plan.packId, p] as const))("%s", (packId, pack) => {
    const onDisk = fs.readFileSync(manifestPath(packId), "utf8");
    expect(onDisk).toBe(serializeManifest(patchManifest(readManifest(packId), pack)));
  });

  it("keeps ids, counts, and ordered flags", () => {
    const ids = (subtestId: string) =>
      allItems.filter((x) => x.subtestId === subtestId).map((x) => x.item.spec.id);
    expect(ids("child-wmi-digits")).toEqual(range("child-wmi-", 16));
    expect(ids("child-wmi-reverse-short")).toEqual(range("child-wmi2-", 7));
    expect(ids("adult-wmi-digits")).toEqual(range("adult-wmi-", 16));
    expect(ids("adult-wmi-reverse-short")).toEqual(range("adult-wmi2-", 7));
    expect(ids("child-prac-wmi")).toEqual(range("child-prac-wmi-", 10));
    expect(ids("adult-prac-wmi")).toEqual(range("adult-prac-wmi-", 10));
    expect(new Set(allItems.map((x) => x.item.spec.id)).size).toBe(66);

    for (const packId of ["child/v1", "adult/v1"] as const) {
      const manifest = readManifest(packId);
      for (const sub of manifest.subtests.filter((s) => s.indexKey === "WMI")) {
        expect(sub.ordered).toBe(true);
      }
    }
  });
});

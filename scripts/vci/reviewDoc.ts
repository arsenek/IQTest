import { getCategory, getRelation } from "../../src/lib/vci/lexicon";
import type { BuiltPack } from "./packs";

const PACK_ZH: Record<string, string> = {
  "child/v1": "儿童正式包 child/v1",
  "adult/v1": "成人正式包 adult/v1",
  "child/practice/v1": "儿童练习池 child/practice/v1",
  "adult/practice/v1": "成人练习池 adult/practice/v1",
};

const KIND_ZH = { classify: "分类", sequence: "序列", analogy: "类比" } as const;

function ruleSummary(item: BuiltPack["subtests"][0]["items"][0]): string {
  const { spec } = item;
  if (spec.kind === "classify") return `${spec.ruleText}（范畴：${getCategory(spec.categoryId).label}）`;
  if (spec.kind === "sequence") {
    const r =
      spec.rule.type === "numeric"
        ? `等差 step=${spec.rule.step}`
        : spec.rule.type === "geometric"
          ? `等比 ratio=${spec.rule.ratio}`
          : `循环 [${spec.rule.alphabet.join("")}]`;
    return `${spec.ruleText}（${r}）`;
  }
  return `${spec.ruleText}（关系：${getRelation(spec.relationId).label}）`;
}

export function renderReviewDoc(packs: BuiltPack[]): string {
  const out: string[] = [
    "# VCI 规则生成题 · 审核摘要",
    "",
    "由 `npm run vci:generate -- --doc <file>` 生成。题干对考生不展示 ruleText。",
    "",
  ];
  for (const pack of packs) {
    out.push(`## ${PACK_ZH[pack.plan.packId] ?? pack.plan.packId}`, "");
    for (const sub of pack.subtests) {
      out.push(`### ${sub.subtestId}（${sub.items.length} 题）`, "");
      out.push("| 题号 | 题型 | 规则 | 正解 |", "|---|---|---|---|");
      for (const item of sub.items) {
        out.push(
          `| ${item.spec.id} | ${KIND_ZH[item.spec.kind]} | ${ruleSummary(item)} | ${item.manifest.answer} |`,
        );
      }
      out.push("");
      const sample = sub.items[0];
      if (sample) {
        out.push(
          `<details><summary>样例 ${sample.spec.id}</summary>`,
          "",
          `- 题干：${sample.manifest.prompt}`,
          `- 选项：${sample.manifest.choices.map((c) => c.label).join(" / ")}`,
          `- 正解：${sample.manifest.answer}`,
          "",
          "</details>",
          "",
        );
      }
    }
  }
  return out.join("\n");
}

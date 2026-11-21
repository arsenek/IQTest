import type { BuiltItem } from "../../src/lib/pri/build";
import type { BuiltPack } from "./packs";
import { describeCell, describeDistractor, describeRules } from "../../src/lib/pri/describe";
import { solve } from "../../src/lib/pri/rules";

const PACK_ZH: Record<string, string> = {
  "child/v1": "儿童正式包 child/v1",
  "adult/v1": "成人正式包 adult/v1",
  "child/practice/v1": "儿童练习池 child/practice/v1",
  "adult/practice/v1": "成人练习池 adult/practice/v1",
};

const SUBTEST_ZH: Record<string, string> = {
  "child-pri-matrix": "图形推理（矩阵，核心 1）",
  "child-pri-sequence": "图形序列（核心 2）",
  "adult-pri-matrix": "图形推理（矩阵，核心 1）",
  "adult-pri-sequence": "图形序列与补全（核心 2）",
  "child-prac-pri": "图形练习",
  "adult-prac-pri": "图形练习",
};

const LEVEL_ZH: Record<number, string> = { 1: "入门", 2: "基础", 3: "中等", 4: "较难", 5: "困难" };

const KIND_ZH = { matrix: "3×3 矩阵", sequence: "序列" } as const;

function stemBlock(item: BuiltItem): string {
  const { spec } = item;
  const [mr, mc] = spec.missing;
  const text = (r: number, c: number) =>
    r === mr && c === mc ? "**？**" : describeCell(spec.figure, spec.grid[r][c]);
  if (spec.kind === "sequence") {
    return `- 题干（从左到右）：${spec.grid[0].map((_, c) => text(0, c)).join(" → ")}`;
  }
  const rows = spec.grid.map(
    (row, r) => `| 第 ${r + 1} 行 | ${row.map((_, c) => text(r, c)).join(" | ")} |`,
  );
  return ["- 题干：", "", "| | 第 1 列 | 第 2 列 | 第 3 列 |", "|---|---|---|---|", ...rows, ""].join("\n");
}

function itemBlock(item: BuiltItem): string {
  const { spec, options } = item;
  const answer = solve(spec);
  const key = options.find((o) => o.correct)!;
  const lines = [
    `#### ${spec.id} · 难度 ${item.level}（${LEVEL_ZH[item.level]}，规则分 ${item.score}）· ${KIND_ZH[spec.kind]}`,
    "",
    `- 规则：${spec.ruleText}`,
    `- 程序逐条校验的规则：${describeRules(spec).join("；")}`,
    stemBlock(item),
    `- 正确答案：**${key.label}** —— ${describeCell(spec.figure, key.cell)}`,
    "- 干扰项：",
    ...options
      .filter((o) => !o.correct)
      .map(
        (o) =>
          `  - ${o.label}（${describeCell(spec.figure, o.cell)}）：${describeDistractor(spec, answer, o.cell)}`,
      ),
    "",
  ];
  return lines.join("\n");
}

/** The per-item part of the review document (Chinese, for non-programmers). */
export function renderReviewDoc(packs: BuiltPack[]): string {
  const out: string[] = [];
  for (const pack of packs) {
    out.push(`### ${PACK_ZH[pack.plan.packId] ?? pack.plan.packId}`, "");
    for (const sub of pack.subtests) {
      const letters = sub.items.map((i) => i.manifest.answer.replace("选项 ", "")).join(" ");
      out.push(
        `**分测验 ${sub.subtestId} · ${SUBTEST_ZH[sub.subtestId] ?? ""}（${sub.items.length} 题）**`,
        "",
        `正确选项依次为：${letters}`,
        "",
        "| 题号 | 题型 | 难度 | 规则 | 正确选项 |",
        "|---|---|---|---|---|",
        ...sub.items.map(
          (i) =>
            `| ${i.spec.id} | ${KIND_ZH[i.spec.kind]} | ${i.level}（${LEVEL_ZH[i.level]}） | ${i.spec.ruleText} | ${i.manifest.answer} |`,
        ),
        "",
        ...sub.items.map(itemBlock),
      );
    }
  }
  return out.join("\n");
}

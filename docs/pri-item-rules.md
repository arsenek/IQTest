# PRI 规则生成题 · 审核摘要

`npm run pri:generate` / `npm run pri:check` 根据声明式矩阵/序列规格写入 SVG 与正式/练习包。唯一解 = 规则推导单元格与键一致，且干扰项均破坏规则、无竞争读法。

## 题型

| 题型 | 规则 | 唯一解条件 |
|------|------|------------|
| matrix | 行列属性规则（循环、并集等） | 缺失格唯一可推；干扰格均不满足 |
| sequence | 线性属性循环/递推 | 下一项唯一；无「只出现一次」的欠定规则 |

## 关键 soundness 检查

| 检查 | 含义 |
|------|------|
| answer-deducible / key-matches-deduction | 规则推出的答案与 manifest 键一致 |
| distractors-break-rules | 每个干扰项破坏至少一条规则 |
| options-distinct | 四选项单元格互异 |
| stem-obeys-rules / no-rival-rule | 完整行遵守规则；无第二种读法给出不同答案 |
| no-odd-one-out-shortcut | 不能仅凭选项集合不看题干选出答案 |

## 结构

| 包 | 分测验 | 题量 |
|----|--------|------|
| child/v1 | child-pri-matrix / child-pri-sequence | 16 + 7 |
| adult/v1 | adult-pri-matrix / adult-pri-sequence | 16 + 7 |
| */practice/v1 | *-prac-pri | 10 |

生成失败（任一项校验不过）则**不写盘**。详细逐题审核长文与总览图见项目 Context store `docs/pri-item-rules.md`（可选用 `pri:generate -- --doc <path>` 重生）。

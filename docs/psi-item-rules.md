# PSI 规则生成题 · 审核摘要

`npm run psi:generate` 根据声明式网格规格写入正式/练习包。唯一解 = 网格内目标符号出现次数。

## 规则

| 检查 | 含义 |
|------|------|
| count-matches-grid | `answer === count(grid, target)` |
| prompt-parseable | `parseSymbolPrompt` 还原 target 与序列 |
| grid-subset-alphabet | 网格符号均在闭集 alphabet |
| target-count-in-range | 作答 0–9（匹配 UI） |

## 结构

| 包 | 分测验 | 题量 |
|----|--------|------|
| child/v1 | symbols + pairing | 16 + 7 |
| adult/v1 | symbols + pairing | 16 + 7 |
| practice | *-prac-psi | 10 |

儿童多用几何/星号；成人多用希腊字母与数理符号。限时随题序递减。

## 样例

**child-psi-1：** 目标☆，网格 ★☆●☆■ → 出现 2 次。  
**adult-psi-2：** 目标≠，网格 =≠≈≠≡≠∼≠ → 出现 4 次。

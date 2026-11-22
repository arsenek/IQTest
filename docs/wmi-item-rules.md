# WMI 规则生成题 · 审核摘要

`npm run wmi:generate` 根据长度阶梯规格写入 digit_span 题。唯一解 = 按方向复述 digits 得到的连字符答案。

## 规则

| 检查 | 含义 |
|------|------|
| answer-matches-direction | forward: join(digits)；reverse: join(reversed) |
| prompt-contains-digits | 题干顿号序列与 digits 一致 |
| ladder-length | 与分测验 lengthLadder 对齐 |
| ordered-flag | subtest / item 均为 ordered |
| no-adjacent-duplicate | 相邻数字不重复，降低分块捷径 |

## 阶梯

| 包 | 核心 1（16） | 核心 2（7） |
|----|--------------|-------------|
| child | 正向 2→10（9）+ 反向 3→8（7，末两题均为 8） | 反向 3→9 |
| adult | 正向 3→11（9）+ 反向 4→10（7） | 反向 3→9 |

练习包各 10 题，正/反向混合，ID 与正式包不重叠。

## 样例

**child-wmi-1：** 题干数字 4、7；正向；答案 `4-7`。  
**adult-wmi2-1：** 题干 7、2、9；倒序；答案 `9-2-7`。

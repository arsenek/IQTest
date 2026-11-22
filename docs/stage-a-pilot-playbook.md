# 阶段 A 试测分析 Playbook

面向内部题库质控：**难度 / 区分度 / 时延**试点报表。  
**不是**标准化常模，**不能**据此发布「标准 IQ」「全国百分位」或收费标准化测评声称。

> 一句话边界：`pilot CTT only — not standardized IQ`

---

## 1. 前置

1. 已有可导出的 SUBMITTED 会话（见 `docs/export-stage-a.md`），或先用合成 fixture 练手。
2. 本机 Node 依赖已安装（`npm install`）。
3. 真数据导出需 `DATABASE_URL`；分析脚本**只读文件**，不连库。

---

## 2. 导出 → 分析

### 2.1 导出（真样本）

```bash
npm run export:responses -- --out ./tmp/stage-a-export --format both
```

得到 `responses.csv` / `responses.jsonl`。儿童行（`isChildData=true`）按机密处理，勿外传可追溯个体。

### 2.2 分析

```bash
# 真导出目录
npm run analyze:stage-a -- --in ./tmp/stage-a-export --out ./tmp/stage-a-analysis

# 无真人样本时：合成 fixture
npm run analyze:stage-a -- --in tests/fixtures/stage-a-export --out ./tmp/stage-a-analysis --min-n 20
```

| 参数 | 说明 | 默认 |
|------|------|------|
| `--in` | 导出目录，或单个 `.jsonl`/`.csv` | `./tmp/stage-a-export` |
| `--out` | 报表目录 | `./tmp/stage-a-analysis` |
| `--format` | `csv` \| `json` \| `both` | `both` |
| `--min-n` | 低于此 n 只打 `low_n`，不打易/难/区分 | `20` |
| `--easy` | `p >=` → `too_easy` | `0.95` |
| `--hard` | `p <=` → `too_hard` | `0.05` |
| `--min-r` | 点二列相关 `<` → `low_disc` | `0.15` |

输出：

| 文件 | 内容 |
|------|------|
| `item-stats.csv\|json` | 每题：n、p、pointBiserial、highLowDiff、medianLatencyMs、flags |
| `group-summary.csv\|json` | 按 `indexKey` / `profileKind` / 交叉汇总 |
| `red-flags.csv\|json` | flags 非空的题 |
| `meta.json` | 行数、剔除数、免责声明 |

CLI 启动时会向 stderr 打印非标准化 IQ 声明。

---

## 3. 指标怎么读

| 指标 | 含义（试点） |
|------|----------------|
| `n` | 有效作答数（已剔除推断跳题/超时） |
| `p` | 正确率；**越高越易**（经典 CTT 难度代理） |
| `pointBiserial` | 本题 0/1 与「会话其余题总分」的相关；越高越能拉开能力 |
| `highLowDiff` | 约上下 27% 组正确率差；备选区分度 |
| `medianLatencyMs` | 有效作答中位时延 |

纳入规则：`inferredSkipped` / `inferredTimedOut` 为 true，或无法解析 0/1 分的行**不进** p / 区分度 / 中位时延。

---

## 4. 红旗题解读

| Flag | 典型含义 | 建议动作 |
|------|----------|----------|
| `low_n` | 样本太少，其余旗不可信 | 继续收集；勿下修题结论 |
| `too_easy` | 几乎全对 | 检查是否送分题、指导语泄露、选项过弱；考虑换题或后移 |
| `too_hard` | 几乎全错 | 检查歧义、超纲、渲染错误、时限过紧 |
| `low_disc` | 与总分几乎无关 | 可能噪音/双解/猜答主导；优先人工复审 |
| `slow` | 中位时延远高于同指数 | 检查交互卡顿、题目过长、设备效应（本轮无 deviceClass） |

**不要**因为红旗就自动改常模或上线「校准完成」文案。修题后重新导出再跑分析；记录进顾问 backlog。

---

## 5. 下一步（阶段 B）

1. **修题 / 换题**：内容与规则生成侧迭代（本 playbook 不改正式计分）。
2. **顾问合同**：采样协议、排除规则、IRT/等值；见商业方案审计中的阶段 B/C。
3. **报告阶段**：保持 `trial`（或等价）措辞，禁止伪全国百分位，直到标定与合规就绪。

本报表**禁止**用于：

- 对外宣传「已标定 IQ」
- 把 `p` 或点二列直接写成 IQ / 百分位
- 用儿童样本做对外可追溯展示

---

## 6. 自测（无 DB）

```bash
node tests/fixtures/stage-a-export/build-fixture.mjs   # 可选：重生合成数据
npm run analyze:stage-a -- --in tests/fixtures/stage-a-export --out ./tmp/stage-a-analysis
npm test
```

Fixture 含：过易、过难、高区分、低区分、跳题/超时剔除、少量儿童 `low_n` 行。

---

## 7. 相关文档

- 仓内导出字段：`docs/export-stage-a.md`
- 规格（store）：`docs/superpowers/specs/2026-11-23-stage-a-pilot-analysis-design.md`
- 商业边界：`docs/reviews/commercial-iq-plan-audit.md`（阶段 A→B→C；测量评测 ≠ Promptfoo）

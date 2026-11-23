# 阶段 A 作答导出 · 字段说明

面向内部 CTT/IRT 标定准备。**不是**标准 IQ 数据集；不含参数估计结果。

## 如何导出

```bash
# 需 DATABASE_URL；建议设置 EXPORT_PROFILE_SALT（否则回退 AUTH_SECRET）
# 默认排除 sim-*@iqtest.local（真人 Stage A）
npm run export:responses -- \
  --out ./tmp/stage-a-live-human-export \
  --format both \
  --cohort stage-a-pilot
```

可选参数：

| 参数 | 说明 |
|------|------|
| `--out <dir>` | 输出目录（默认 `./tmp/stage-a-export`） |
| `--format csv\|jsonl\|both` | 默认 `both` → `responses.csv` + `responses.jsonl` |
| `--pack <id>` | 仅该内容包（如 `child/v1`） |
| `--since <ISO>` / `--until <ISO>` | 按 `submittedAt` 过滤 |
| `--include-sim` | **纳入** `sim-*@iqtest.local`（默认排除；仅管线对照用） |
| `--cohort <label>` | 试点队列标签，写入同目录 `meta.json` 的 `pilotCohort`（无 DB 列） |

产物：

| 文件 | 内容 |
|------|------|
| `responses.csv` / `responses.jsonl` | 作答行 |
| `meta.json` | `pilotCohort`、`includeSim`、`excludedSimSessions`、免责声明等 |

### 真人 vs sim

| 用途 | 命令要点 |
|------|----------|
| **真人 Stage A**（默认） | 不加 `--include-sim`；建议 `--cohort stage-a-pilot`（或运营约定标签） |
| **sim 管线对照** | 加 `--include-sim`；**分目录**存放，勿与真人导出混跑分析后当常模 |

约定：`sim-*@iqtest.local` 为合成账号（见 `sim:seed`）；真人招募禁止使用该域。识别逻辑与 `isSimEmail` 一致。

受保护 API（默认关闭；同样默认排除 sim）：

```bash
ENABLE_RESPONSE_EXPORT=1 EXPORT_TOKEN=… \
  curl -H "Authorization: Bearer $EXPORT_TOKEN" \
  "http://127.0.0.1:3000/api/admin/export/responses?format=jsonl"

# 仅管线对照时显式纳入 sim：
# .../responses?format=jsonl&includeSim=1
```

启用条件：`ENABLE_RESPONSE_EXPORT=1` **或** `NODE_ENV=development`，**且** Bearer token 匹配 `EXPORT_TOKEN`。

## 行粒度

每题一次作答一行。仅 **SUBMITTED** 且已有 **Report** 的正式评估会话；不含练习包、进行中或放弃会话。默认再排除 sim 账号会话。

## 字段

| 列 | 类型 | 说明 |
|----|------|------|
| `sessionId` | string | 会话 id |
| `profileIdHash` | string | HMAC-SHA256(profileId)；不明文 profileId |
| `profileKind` | CHILD\|ADULT | 档案类型 |
| `ageMonths` | int | 交卷时（或开测时）月龄 |
| `itemId` | string | 题目 id |
| `subtestId` | string | 子测验 id |
| `indexKey` | VCI\|PRI\|WMI\|PSI | 来自 playlist |
| `correct` | bool\|空 | 是否答对 |
| `rawScore` | number\|空 | 单位计分 0/1 |
| `latencyMs` | int | 作答时延 |
| `inferredSkipped` | bool | 空答 / 超时兜底答（推断，非 DB 列） |
| `inferredTimedOut` | bool | `latencyMs >= item.timeLimitMs`（推断） |
| `contentPackVersion` | string | 即 `packId` |
| `normVersion` | string | 报告快照优先 |
| `scoringStage` | string | trial / calibrated / standardized |
| `algorithmVersion` | string | 如 `scale-z/v1` |
| `submittedAt` | ISO\|空 | 交卷时间 |
| `deviceClass` | string | **本轮未采集，恒为空** |
| `isChildData` | bool | `profileKind === CHILD` |

试点队列标签**不**写入行字段（避免 schema 膨胀）；见同目录 `meta.json` → `pilotCohort`。

## 隐私

- **不导出**：邮箱、密码哈希、显示名、明文 `profileId`、`answerJson`。
- `profileIdHash` 依赖 `EXPORT_PROFILE_SALT`（或 `AUTH_SECRET`）保密。

## 儿童数据

`isChildData=true` 的行仅可用于内部标定与产品改进：

- 禁止再识别、禁止对外发布可追溯个体数据。
- 导出文件按机密处理；分发需最小必要原则。
- 下游管道应可按 `isChildData` 隔离儿童样本。

## 跳题 / 超时（推断）

模型无显式 `skipped` / `timedOut` 列。UI 超时会提交 `""` 或 `symbol_search` 的 `-1`。

- `inferredTimedOut`：playlist 中该题有 `timeLimitMs` 且 `latencyMs >= timeLimitMs`。
- `inferredSkipped`：答案空串、空数组，或 symbol_search 的 `-1`。

二者可同时为 true。后续可改为 DB 显式列。

## 未采集缺口（后续）

| 缺口 | 说明 |
|------|------|
| 设备 / UA / `deviceClass` | 无采集；可加可选 client meta（本轮明确延后） |
| 显式 skipped/timedOut | 仅推断 |
| 人口学、研究同意标签 | 无 DB 列；试点用 `--cohort` + 运营表 |
| 完整 answerJson | 故意不导出 |
| IP / 地理 | 默认不采 |

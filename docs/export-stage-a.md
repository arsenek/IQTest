# 阶段 A 作答导出 · 字段说明

面向内部 CTT/IRT 标定准备。**不是**标准 IQ 数据集；不含参数估计结果。

## 如何导出

```bash
# 需 DATABASE_URL；建议设置 EXPORT_PROFILE_SALT（否则回退 AUTH_SECRET）
npm run export:responses -- --out ./tmp/export --format both
```

可选参数：

| 参数 | 说明 |
|------|------|
| `--out <dir>` | 输出目录（默认 `./tmp/stage-a-export`） |
| `--format csv\|jsonl\|both` | 默认 `both` → `responses.csv` + `responses.jsonl` |
| `--pack <id>` | 仅该内容包（如 `child/v1`） |
| `--since <ISO>` / `--until <ISO>` | 按 `submittedAt` 过滤 |

受保护 API（默认关闭）：

```bash
ENABLE_RESPONSE_EXPORT=1 EXPORT_TOKEN=… \
  curl -H "Authorization: Bearer $EXPORT_TOKEN" \
  "http://127.0.0.1:3000/api/admin/export/responses?format=jsonl"
```

启用条件：`ENABLE_RESPONSE_EXPORT=1` **或** `NODE_ENV=development`，**且** Bearer token 匹配 `EXPORT_TOKEN`。

## 行粒度

每题一次作答一行。仅 **SUBMITTED** 且已有 **Report** 的正式评估会话；不含练习包、进行中或放弃会话。

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
| 设备 / UA / `deviceClass` | 无采集；可加可选 client meta |
| 显式 skipped/timedOut | 仅推断 |
| 人口学、研究同意标签 | 无 |
| 完整 answerJson | 故意不导出 |
| IP / 地理 | 默认不采 |

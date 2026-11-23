# 正式包许可自检清单

**范围：** `content/packs/child/v1` 与 `content/packs/adult/v1`（正式标准化施测包）。  
**对照：** 项目 store `docs/item-bank-license-matrix.md`、根目录 `THIRD_PARTY.md` / `NOTICE`、preferences D1/D2/Open1。  
**自动化：** `tests/content/formalPackLicense.test.ts`（`npm test` / CI）。

---

## 硬排除（正式包必须为零）

| 源 | 为何排除 | 检查方式 |
|----|----------|----------|
| **ICAR** | Scientific Use；禁商业常规施测 | 正式 manifest / 题干 / attribution / sourceId **不得**出现 `ICAR` |
| **MaRs-IB / MaRs** | 非商业题库（OSF CC BY-NC 等） | 正式包不得出现 `MaRs` / `mars-ib` / `MaRs-IB` |
| **Sandia Matrices / SGMT** | 默不进正式标准化包（Open1） | 正式包不得出现 `Sandia` / `SGMT` / `sandialabs` |
| **GPL 原题 / GPL 生成器产物** | copyleft 不适静默嵌入闭源正式包 | 正式 item 不得带 `GPL` license；不得 vendoring OMIB/OMSS 进正式包 |
| **CC BY-SA 题（如 Wonderlic 样本）** | ShareAlike；仅候选池 | 正式 item 不得带 `BY-SA`；Wonderlic 仅 `adult/candidates/v1` |

## 允许（正式包）

| 源 | 条件 |
|----|------|
| 自研规则生成（VCI/PSI/WMI/PRI） | 生成器 + 唯一解校验；`npm run bank:check` 绿 |
| 练习池自研题 | ID 与正式包不重叠；同样禁运源 |

## 人工勾选（每次改正式包 / 合 PR 前）

- [ ] 未从 ICAR / MaRs / Sandia 仓库或发布物拷贝题干、SVG、参数进 `child/v1` 或 `adult/v1`
- [ ] 未把 `adult/candidates/v1` 的 Wonderlic / CC BY-SA 题迁入正式包
- [ ] 未 vendoring GPLv3 矩阵生成器进主仓正式路径
- [ ] `npm run bank:check` 与 `npm test`（含本清单自动化）绿
- [ ] 若新增第三方来源：先更新 `THIRD_PARTY.md` + `NOTICE`，且**不**进正式标准化包除非法务书面放行

## 不在本清单内

- 候选池尽调与 ShareAlike 义务（见 `docs/candidate-bank-import.md`）
- Stage B 常模 / 黑盒 API（另受选型与 preferences 约束）

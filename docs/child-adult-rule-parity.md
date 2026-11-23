# 儿童 / 成人规则生成差异复核（IQT-56）

**日期：** 2026-11-23（Asia/Shanghai）  
**对照：** 重启门 Phase 1.2「避免仅措辞不同」；`docs/rule-gen-baseline-inventory.md` G6。

## 结论

| 指数 | 复核前 | 本轮处理 |
|------|--------|----------|
| **VCI** | 分类范畴大体分流；`geo-feature` / `profession` 有共享范畴且 exemplar 茎重叠 | 成人 exemplar 改写（高原/湖泊/沙漠；法官/工程师/护士），重生 |
| **PSI** | 成人核心 1 为希腊/逻辑符；**核心 2 + 练习**仍用儿童几何符族 | 成人 pairing + practice 全部改到希腊/逻辑族；目标集与儿童正式/练习 **不相交** |
| **WMI** | 阶梯已分流（儿童正向 2→10 / 反向顶 8；成人正向 3→11 / 反向顶 10） | 保持；测试锁定 ladder 不等 |
| **PRI** | 规则元组与 SVG 字节均无跨受众复用 | 保持；无再生必要 |

自动化：`tests/content/childAdultParity.test.ts`（随 `npm test` / `test:content`）。

## 验收

- `npm run bank:check` 绿  
- `npm run test:content` 含 parity 断言  
- 正式包无 ICAR / MaRs / Sandia  

## 非本轮

- 不再扩新规则族（见 IQT-55）  
- 不做 CAT / 支付 / Stage B  

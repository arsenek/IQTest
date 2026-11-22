---
name: iqtest-simulated-examinees
description: Seed, list, and purge synthetic IQTest examinees (personas with VCI/PRI/WMI/PSI ability, timed answers, full SUBMITTED+Report). Use when generating sim users, sim-*@iqtest.local data, stage-A pilot fills, or cleaning bad sim rows. Never treat sim data as human norms.
---

# IQTest simulated examinees

Generate **synthetic** full assessments for preview/calibration plumbing. Output is tagged sim-only; reports stay **trial**. Do **not** use these rows as real-person norms.

## Hard rules

1. Emails must be `sim-<id>@iqtest.local` — purge keys off this prefix+domain.
2. Idempotent seed: same persona id → skip if already `SUBMITTED` with Report.
3. Purge never deletes non-sim users.
4. Every report / analysis mention of this data must say **synthetic / not human norms / trial**.

## Persona schema (`content/sim/personas-v1.json`)

```ts
{
  id: "sim-c01",           // stable; drives email + RNG seed
  displayName: "小安",
  ageYears: 10,
  kind: "CHILD" | "ADULT", // selects child/v1 or adult/v1 pack
  traits: "简短特征",
  ability: {               // 0–1 per index (NOT IQ points)
    VCI: 0.55, PRI: 0.5, WMI: 0.4, PSI: 0.6
  }
}
```

## Ability → P(correct)

Within each subtest, item difficulty ≈ position `(i / n-1)`.

```
logit = 4.2 * (ability - difficulty)
P(correct) = clamp(logistic(logit), 0.08, 0.96)
```

Bernoulli draw per item. Wrong answers are type-aware (wrong MCQ choice / mutated digit span / nearby symbol count).

## Latency model → `Response.latencyMs`

```
base = { mcq: 4800, digit_span: 7200, symbol_search: 2600 }
latency ≈ base * (1.45 - 0.85*ability) * (0.8 + 0.55*difficulty) * logNoise
clamped to [350, ~0.92 * timeLimitMs]
```

## Commands

```bash
npm run sim:seed -- --count 50          # idempotent; first N personas
npm run sim:seed -- --persona sim-c01   # one persona
npm run sim:list                        # review sim rows
npm run sim:purge -- --persona sim-c01  # delete one sim user tree
npm run sim:purge -- --all-sim          # delete all sim-*@iqtest.local
```

Seed path: `createSession` → `recordAnswer` (× playlist) → `submitSession` → real `Report`.

After a large seed, typical Stage-A follow-up:

```bash
npm run export:responses -- --out ./tmp/stage-a-sim50 --format both
npm run analyze:stage-a -- --in ./tmp/stage-a-sim50 --out ./tmp/stage-a-sim50-analysis
```

## Review / delete bad sims

1. `npm run sim:list` — spot odd composites / incomplete sessions.
2. `npm run sim:purge -- --persona <id>` for one bad row.
3. Re-seed that persona only: `npm run sim:seed -- --persona <id>`.

## Disclaimer (copy into reports)

> 本批数据为合成模拟考生（`sim-*@iqtest.local`），不可当作真人常模；评分阶段仍为 trial。

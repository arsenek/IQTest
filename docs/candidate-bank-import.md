# Candidate bank import (IQT-35)

Full design & diligence live in the project agent store:

- `docs/superpowers/specs/2026-11-23-candidate-bank-import-design.md`
- `docs/item-bank-diligence-log.md`
- `docs/item-bank-license-matrix.md`

## In this repo

| Path | Role |
|------|------|
| `content/packs/adult/candidates/v1/` | Candidate pool (Wonderlic CC BY-SA sample + proprietary WMI/PSI scaffolds) |
| `NOTICE` / `THIRD_PARTY.md` | Attribution & obligations |
| Item fields `license` / `attribution` / `sourceId` | Per-item provenance |

Formal packs `child/v1` and `adult/v1` are unchanged and must not receive GPL/CC BY-SA items by default.

## Load / test

```bash
npm test
# vitest includes tests/content/candidatesPack.test.ts
```

`loadPack("adult/candidates/v1")` validates schema; runtime assessment/practice routes do not auto-select this pack.

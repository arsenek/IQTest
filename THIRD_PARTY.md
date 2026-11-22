# Third-party item sources

Diligence detail (project store): `docs/item-bank-diligence-log.md` / `docs/item-bank-license-matrix.md`.

| Source | License | Imported? | Location | Notes |
|--------|---------|-----------|----------|-------|
| [Awesome Wonderlic](https://github.com/paladini/awesome-wonderlic) | CC BY-SA 4.0 (content) | **Yes (sample)** | `content/packs/adult/candidates/v1` | Attribution + ShareAlike; not in formal packs |
| [8tp/iq-test](https://github.com/8tp/iq-test) | README claims MIT; **no LICENSE file** | No | — | Pending until LICENSE covers embedded items |
| [OMIB](https://osf.io/4km79/) | GPLv3 (paper/NOTICE) | No | — | Reference only; copyleft unfit for silent closed-source embed |
| [MyIQ.Science](https://myiq.science/) | Site claims MIT | No | — | Pending obtainable release + LICENSE hash |
| IQ Measurer | Unpinned | No | — | Pending canonical repository |
| ICAR | Scientific Use (non-commercial product use) | No | — | Hard exclude |
| MaRs-IB | Non-commercial item-bank use | No | — | Hard exclude |

## Obligations for imported Wonderlic sample

1. Keep this file and `NOTICE` in distributions that include the candidates pack.
2. Preserve per-item `attribution` / `sourceId` / `license: CC-BY-SA-4.0`.
3. ShareAlike: further adaptations of those items under CC BY-SA 4.0.
4. Do not move these items into `child/v1` or `adult/v1` without legal review.

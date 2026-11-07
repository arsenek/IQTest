import { INDEX_KEYS, type IndexKey } from "@/lib/content/types";

export type ScaledByIndex = Record<IndexKey, number>;

export type ComposedReport = {
  vci: number;
  pri: number;
  wmi: number;
  psi: number;
  /** Mean of the four index scores (MVP; document in UI). */
  composite: number;
  /** Weakest index — used for practice CTA copy id. */
  narrativeKey: IndexKey;
};

function weakestIndex(scaled: ScaledByIndex): IndexKey {
  let weakest: IndexKey = INDEX_KEYS[0];
  let min = scaled[weakest];
  for (const key of INDEX_KEYS) {
    if (scaled[key] < min) {
      min = scaled[key];
      weakest = key;
    }
  }
  return weakest;
}

export function composeReport(scaledByIndex: ScaledByIndex): ComposedReport {
  const { VCI, PRI, WMI, PSI } = scaledByIndex;
  const composite = (VCI + PRI + WMI + PSI) / 4;
  return {
    vci: VCI,
    pri: PRI,
    wmi: WMI,
    psi: PSI,
    composite,
    narrativeKey: weakestIndex(scaledByIndex),
  };
}

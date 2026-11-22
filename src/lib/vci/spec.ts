import type { AnalogySpec, ClassifySpec, SequenceSpec, SequenceRule } from "./types";

export function classify(
  def: Omit<ClassifySpec, "kind"> & { kind?: "classify" },
): ClassifySpec {
  return { kind: "classify", ...def };
}

export function sequence(
  def: Omit<SequenceSpec, "kind"> & { kind?: "sequence"; rule: SequenceRule },
): SequenceSpec {
  return { kind: "sequence", ...def };
}

export function analogy(def: Omit<AnalogySpec, "kind"> & { kind?: "analogy" }): AnalogySpec {
  return { kind: "analogy", ...def };
}

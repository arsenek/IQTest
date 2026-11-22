import { psi } from "../../src/lib/psi/spec";
import type { PsiSpec } from "../../src/lib/psi/types";

export const adultSymbols: PsiSpec[] = [
  psi({ id: "adult-psi-1", target: "Σ", grid: "ΑΣΒΓΔΕ", timeLimitMs: 32000 }),
  psi({ id: "adult-psi-2", target: "≠", grid: "=≠≈≠≡≠∼≠", timeLimitMs: 31200 }),
  psi({ id: "adult-psi-3", target: "∞", grid: "∅∞∪∩⊂⊃", timeLimitMs: 30400 }),
  psi({ id: "adult-psi-4", target: "√", grid: "√π√e√2√φ√", timeLimitMs: 29600 }),
  psi({ id: "adult-psi-5", target: "∴", grid: "∵∴∵∴∵∴", timeLimitMs: 28800 }),
  psi({ id: "adult-psi-6", target: "∂", grid: "∇Δ∫∑∂", timeLimitMs: 28000 }),
  psi({ id: "adult-psi-7", target: "∈", grid: "⊂∈∪∈∩∈∅∈", timeLimitMs: 27200 }),
  psi({ id: "adult-psi-8", target: "ℵ", grid: "αβγδℵε", timeLimitMs: 26400 }),
  psi({ id: "adult-psi-9", target: "⊢", grid: "⊨⊢⊥⊢⊤⊢∼⊢", timeLimitMs: 25600 }),
  psi({ id: "adult-psi-10", target: "∀", grid: "∃∀∃∀∃∀∀", timeLimitMs: 24800 }),
  psi({ id: "adult-psi-11", target: "⊆", grid: "⊂⊆⊂⊆⊆⊃", timeLimitMs: 24000 }),
  psi({ id: "adult-psi-12", target: "∧", grid: "∨∧∨∧∨∧∧", timeLimitMs: 23200 }),
  psi({ id: "adult-psi-13", target: "⊥", grid: "⊤⊥⊤⊥⊥⊤", timeLimitMs: 22400 }),
  psi({ id: "adult-psi-14", target: "≈", grid: "=≈≠≈≡≈∼", timeLimitMs: 21600 }),
  psi({ id: "adult-psi-15", target: "Ω", grid: "αΩβΩγδΩ", timeLimitMs: 20800 }),
  psi({ id: "adult-psi-16", target: "∅", grid: "∅∪∅∩∅⊂∅", timeLimitMs: 20000 }),
];

export const adultPairing: PsiSpec[] = [
  psi({
    id: "adult-psi2-1",
    target: "※",
    grid: "＊＃※＃＊※＃",
    timeLimitMs: 28000,
    framing: "pairing",
  }),
  psi({ id: "adult-psi2-2", target: "◇", grid: "◆◇○◇◆◇○◇", timeLimitMs: 26000 }),
  psi({
    id: "adult-psi2-3",
    target: "▲",
    grid: "△▼▲◆▲△▼▲",
    timeLimitMs: 24000,
    framing: "pairing",
  }),
  psi({ id: "adult-psi2-4", target: "＋", grid: "×÷＋＝＋－＋×", timeLimitMs: 22000 }),
  psi({ id: "adult-psi2-5", target: "◎", grid: "○●◎○◎●◎○", timeLimitMs: 21000 }),
  psi({
    id: "adult-psi2-6",
    target: "■",
    grid: "□■◆□■▲■□",
    timeLimitMs: 20000,
    framing: "pairing",
  }),
  psi({ id: "adult-psi2-7", target: "★", grid: "☆★●★☆■★☆", timeLimitMs: 18000 }),
];

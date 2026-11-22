import { psi } from "../../src/lib/psi/spec";
import type { PsiSpec } from "../../src/lib/psi/types";

export const childSymbols: PsiSpec[] = [
  psi({ id: "child-psi-1", target: "☆", grid: "★☆●☆■", timeLimitMs: 32000 }),
  psi({ id: "child-psi-2", target: "△", grid: "△○△□△", timeLimitMs: 31200 }),
  psi({ id: "child-psi-3", target: "●", grid: "■●▲○●○", timeLimitMs: 30400 }),
  psi({ id: "child-psi-4", target: "□", grid: "□△○☆■◇", timeLimitMs: 29600 }),
  psi({ id: "child-psi-5", target: "◇", grid: "◇◆◇◇○◆◇", timeLimitMs: 28800 }),
  psi({ id: "child-psi-6", target: "＋", grid: "×÷＝－＋", timeLimitMs: 28000 }),
  psi({ id: "child-psi-7", target: "▲", grid: "△▲▼◆△○▼", timeLimitMs: 27200 }),
  psi({ id: "child-psi-8", target: "○", grid: "●○◎○●○◎○", timeLimitMs: 26400 }),
  psi({ id: "child-psi-9", target: "※", grid: "※＊＃＊＃", timeLimitMs: 25600 }),
  psi({ id: "child-psi-10", target: "■", grid: "■□■○■□▲■", timeLimitMs: 24800 }),
  psi({ id: "child-psi-11", target: "◆", grid: "◇◆◇○◆◇◆", timeLimitMs: 24000 }),
  psi({ id: "child-psi-12", target: "◎", grid: "○●◎○◎●○", timeLimitMs: 23200 }),
  psi({ id: "child-psi-13", target: "▼", grid: "▲▼▲▼▼▲◆", timeLimitMs: 22400 }),
  psi({ id: "child-psi-14", target: "＃", grid: "＊＃※＃＊※＃＃", timeLimitMs: 21600 }),
  psi({ id: "child-psi-15", target: "×", grid: "＋×÷×＝×－×", timeLimitMs: 20800 }),
  psi({ id: "child-psi-16", target: "★", grid: "☆★☆●★☆■", timeLimitMs: 20000 }),
];

export const childPairing: PsiSpec[] = [
  psi({
    id: "child-psi2-1",
    target: "☆",
    grid: "★☆●■",
    timeLimitMs: 32000,
    framing: "pairing",
  }),
  psi({ id: "child-psi2-2", target: "▲", grid: "▲△▲○▲■", timeLimitMs: 30000 }),
  psi({
    id: "child-psi2-3",
    target: "◇",
    grid: "◆◇○◇◆◇",
    timeLimitMs: 28000,
    framing: "pairing",
  }),
  psi({ id: "child-psi2-4", target: "＋", grid: "×＋÷＋＝－", timeLimitMs: 26000 }),
  psi({ id: "child-psi2-5", target: "○", grid: "●◎○●○◎○○", timeLimitMs: 24000 }),
  psi({
    id: "child-psi2-6",
    target: "■",
    grid: "□■◆■□▲■",
    timeLimitMs: 22000,
    framing: "pairing",
  }),
  psi({ id: "child-psi2-7", target: "※", grid: "＊＃※＊※＃※", timeLimitMs: 20000 }),
];

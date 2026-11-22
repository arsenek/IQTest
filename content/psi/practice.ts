import { psi } from "../../src/lib/psi/spec";
import type { PsiSpec } from "../../src/lib/psi/types";

export const childPractice: PsiSpec[] = [
  psi({ id: "child-prac-psi-1", target: "○", grid: "●○◎○●", timeLimitMs: 30000 }),
  psi({ id: "child-prac-psi-2", target: "△", grid: "△□△○△■", timeLimitMs: 29000 }),
  psi({ id: "child-prac-psi-3", target: "★", grid: "☆★●★☆", timeLimitMs: 28000 }),
  psi({ id: "child-prac-psi-4", target: "■", grid: "□■◆■□▲", timeLimitMs: 27000 }),
  psi({ id: "child-prac-psi-5", target: "＋", grid: "×＋÷＋＝", timeLimitMs: 26000 }),
  psi({ id: "child-prac-psi-6", target: "◇", grid: "◆◇○◇◆◇", timeLimitMs: 25000 }),
  psi({ id: "child-prac-psi-7", target: "▲", grid: "△▼▲◆▲△", timeLimitMs: 24000 }),
  psi({ id: "child-prac-psi-8", target: "※", grid: "＊＃※＊＃※", timeLimitMs: 23000 }),
  psi({ id: "child-prac-psi-9", target: "◎", grid: "○●◎○◎●", timeLimitMs: 22000 }),
  psi({ id: "child-prac-psi-10", target: "▼", grid: "▲▼▲▼▼◆", timeLimitMs: 21000 }),
];

export const adultPractice: PsiSpec[] = [
  psi({ id: "adult-prac-psi-1", target: "※", grid: "＊＃※＃＊※", timeLimitMs: 26000 }),
  psi({ id: "adult-prac-psi-2", target: "◇", grid: "◆◇○◇◆◇○", timeLimitMs: 25000 }),
  psi({ id: "adult-prac-psi-3", target: "▲", grid: "△▼▲◆▲△▼", timeLimitMs: 24000 }),
  psi({ id: "adult-prac-psi-4", target: "＋", grid: "×÷＋＝＋－", timeLimitMs: 23000 }),
  psi({ id: "adult-prac-psi-5", target: "◎", grid: "○●◎○◎●◎", timeLimitMs: 22000 }),
  psi({ id: "adult-prac-psi-6", target: "■", grid: "□■◆□■▲■", timeLimitMs: 21000 }),
  psi({ id: "adult-prac-psi-7", target: "★", grid: "☆★●★☆■★", timeLimitMs: 20000 }),
  psi({ id: "adult-prac-psi-8", target: "▼", grid: "▲▼▲▼◆▼▲", timeLimitMs: 19000 }),
  psi({ id: "adult-prac-psi-9", target: "＃", grid: "＊＃※＃＊＃※", timeLimitMs: 18000 }),
  psi({ id: "adult-prac-psi-10", target: "○", grid: "●◎○●○◎○○", timeLimitMs: 17000 }),
];

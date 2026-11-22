import type { PsiPackPlan } from "../../src/lib/psi/types";
import { adultPairing, adultSymbols } from "./adult-formal";
import { childPairing, childSymbols } from "./child-formal";
import { adultPractice, childPractice } from "./practice";

export const PSI_PACKS: PsiPackPlan[] = [
  {
    packId: "child/v1",
    audience: "child",
    practice: false,
    subtests: [
      { subtestId: "child-psi-symbols", title: "符号搜索", specs: childSymbols },
      { subtestId: "child-psi-pairing", title: "符号配对", specs: childPairing },
    ],
  },
  {
    packId: "adult/v1",
    audience: "adult",
    practice: false,
    subtests: [
      { subtestId: "adult-psi-symbols", title: "符号搜索", specs: adultSymbols },
      { subtestId: "adult-psi-pairing", title: "符号配对", specs: adultPairing },
    ],
  },
  {
    packId: "child/practice/v1",
    audience: "child",
    practice: true,
    subtests: [{ subtestId: "child-prac-psi", title: "符号练习", specs: childPractice }],
  },
  {
    packId: "adult/practice/v1",
    audience: "adult",
    practice: true,
    subtests: [{ subtestId: "adult-prac-psi", title: "符号练习", specs: adultPractice }],
  },
];

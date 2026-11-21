import type { PackPlan } from "../../src/lib/pri/build";
import { adultMatrix, adultSequence } from "./adult-formal";
import { childMatrix, childSequence } from "./child-formal";
import { adultPractice, childPractice } from "./practice";

/**
 * Every PRI item in the product, by pack and subtest. The generator turns
 * this into SVG media and manifest entries; the tests prove each item sound.
 */
export const PRI_PACKS: PackPlan[] = [
  {
    packId: "child/v1",
    audience: "child",
    practice: false,
    subtests: [
      { subtestId: "child-pri-matrix", filePrefix: "pri-matrix", ordered: true, specs: childMatrix },
      { subtestId: "child-pri-sequence", filePrefix: "pri-sequence", ordered: true, specs: childSequence },
    ],
  },
  {
    packId: "adult/v1",
    audience: "adult",
    practice: false,
    subtests: [
      { subtestId: "adult-pri-matrix", filePrefix: "pri-matrix", ordered: true, specs: adultMatrix },
      { subtestId: "adult-pri-sequence", filePrefix: "pri-sequence", ordered: true, specs: adultSequence },
    ],
  },
  {
    packId: "child/practice/v1",
    audience: "child",
    practice: true,
    subtests: [
      { subtestId: "child-prac-pri", filePrefix: "pri-practice", ordered: false, specs: childPractice },
    ],
  },
  {
    packId: "adult/practice/v1",
    audience: "adult",
    practice: true,
    subtests: [
      { subtestId: "adult-prac-pri", filePrefix: "pri-practice", ordered: false, specs: adultPractice },
    ],
  },
];

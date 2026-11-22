import type { VciPackPlan } from "../../src/lib/vci/types";
import { adultAnalogy, adultVocab } from "./adult-formal";
import { childAnalogy, childVocab } from "./child-formal";
import { adultPractice, childPractice } from "./practice";

export const VCI_PACKS: VciPackPlan[] = [
  {
    packId: "child/v1",
    audience: "child",
    practice: false,
    subtests: [
      {
        subtestId: "child-vci-vocab",
        title: "分类与序列",
        specs: childVocab,
      },
      {
        subtestId: "child-vci-analogy",
        title: "类比推理",
        specs: childAnalogy,
      },
    ],
  },
  {
    packId: "adult/v1",
    audience: "adult",
    practice: false,
    subtests: [
      {
        subtestId: "adult-vci-vocab",
        title: "分类与序列",
        specs: adultVocab,
      },
      {
        subtestId: "adult-vci-analogy",
        title: "类比推理",
        specs: adultAnalogy,
      },
    ],
  },
  {
    packId: "child/practice/v1",
    audience: "child",
    practice: true,
    subtests: [
      {
        subtestId: "child-prac-vci",
        title: "词语练习",
        specs: childPractice,
      },
    ],
  },
  {
    packId: "adult/practice/v1",
    audience: "adult",
    practice: true,
    subtests: [
      {
        subtestId: "adult-prac-vci",
        title: "词语练习",
        specs: adultPractice,
      },
    ],
  },
];

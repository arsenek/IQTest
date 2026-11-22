import type { WmiPackPlan } from "../../src/lib/wmi/types";
import {
  adultDigits,
  adultDigitsLadder,
  adultReverse,
  adultReverseLadder,
} from "./adult-formal";
import {
  childDigits,
  childDigitsLadder,
  childReverse,
  childReverseLadder,
} from "./child-formal";
import {
  adultPractice,
  adultPracticeLadder,
  childPractice,
  childPracticeLadder,
} from "./practice";

export const WMI_PACKS: WmiPackPlan[] = [
  {
    packId: "child/v1",
    audience: "child",
    practice: false,
    subtests: [
      {
        subtestId: "child-wmi-digits",
        title: "数字广度",
        lengthLadder: childDigitsLadder,
        specs: childDigits,
      },
      {
        subtestId: "child-wmi-reverse-short",
        title: "倒序广度",
        lengthLadder: childReverseLadder,
        specs: childReverse,
      },
    ],
  },
  {
    packId: "adult/v1",
    audience: "adult",
    practice: false,
    subtests: [
      {
        subtestId: "adult-wmi-digits",
        title: "数字广度",
        lengthLadder: adultDigitsLadder,
        specs: adultDigits,
      },
      {
        subtestId: "adult-wmi-reverse-short",
        title: "倒序广度",
        lengthLadder: adultReverseLadder,
        specs: adultReverse,
      },
    ],
  },
  {
    packId: "child/practice/v1",
    audience: "child",
    practice: true,
    subtests: [
      {
        subtestId: "child-prac-wmi",
        title: "记忆练习",
        lengthLadder: childPracticeLadder,
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
        subtestId: "adult-prac-wmi",
        title: "记忆练习",
        lengthLadder: adultPracticeLadder,
        specs: adultPractice,
      },
    ],
  },
];

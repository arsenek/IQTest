import { span } from "../../src/lib/wmi/spec";
import type { WmiSpec } from "../../src/lib/wmi/types";

export const childPracticeLadder = [2, 3, 4, 5, 2, 3, 4, 5, 6, 6];

export const childPractice: WmiSpec[] = [
  span({ id: "child-prac-wmi-1", digits: [5, 2], direction: "forward", encodeMs: 4000 }),
  span({ id: "child-prac-wmi-2", digits: [8, 1, 4], direction: "forward", encodeMs: 4500 }),
  span({ id: "child-prac-wmi-3", digits: [3, 7, 0, 6], direction: "forward", encodeMs: 5000 }),
  span({ id: "child-prac-wmi-4", digits: [9, 2, 5, 1, 8], direction: "forward", encodeMs: 5500 }),
  span({ id: "child-prac-wmi-5", digits: [4, 7], direction: "reverse", encodeMs: 4000 }),
  span({ id: "child-prac-wmi-6", digits: [1, 9, 3], direction: "reverse", encodeMs: 4500 }),
  span({ id: "child-prac-wmi-7", digits: [6, 2, 8, 5], direction: "reverse", encodeMs: 5000 }),
  span({ id: "child-prac-wmi-8", digits: [0, 4, 7, 1, 9], direction: "reverse", encodeMs: 5500 }),
  span({ id: "child-prac-wmi-9", digits: [2, 8, 3, 6, 1, 4], direction: "forward", encodeMs: 6000 }),
  span({ id: "child-prac-wmi-10", digits: [5, 0, 8, 2, 7, 3], direction: "reverse", encodeMs: 6000 }),
];

export const adultPracticeLadder = [3, 4, 5, 3, 4, 5, 6, 6, 7, 7];

export const adultPractice: WmiSpec[] = [
  span({ id: "adult-prac-wmi-1", digits: [6, 3, 9], direction: "forward", encodeMs: 4500 }),
  span({ id: "adult-prac-wmi-2", digits: [1, 8, 4, 2], direction: "forward", encodeMs: 5000 }),
  span({ id: "adult-prac-wmi-3", digits: [7, 0, 5, 3, 9], direction: "forward", encodeMs: 5500 }),
  span({ id: "adult-prac-wmi-4", digits: [2, 8, 5], direction: "reverse", encodeMs: 4500 }),
  span({ id: "adult-prac-wmi-5", digits: [9, 1, 6, 4], direction: "reverse", encodeMs: 5000 }),
  span({ id: "adult-prac-wmi-6", digits: [3, 7, 0, 8, 2], direction: "reverse", encodeMs: 5500 }),
  span({ id: "adult-prac-wmi-7", digits: [4, 9, 1, 6, 0, 8], direction: "forward", encodeMs: 6000 }),
  span({ id: "adult-prac-wmi-8", digits: [5, 2, 9, 1, 7, 3], direction: "reverse", encodeMs: 6000 }),
  span({ id: "adult-prac-wmi-9", digits: [8, 3, 6, 0, 4, 9, 1], direction: "forward", encodeMs: 6500 }),
  span({ id: "adult-prac-wmi-10", digits: [1, 7, 4, 9, 2, 6, 0], direction: "reverse", encodeMs: 6500 }),
];

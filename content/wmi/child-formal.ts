import { span } from "../../src/lib/wmi/spec";
import type { WmiSpec } from "../../src/lib/wmi/types";

/** Forward 2→10 then reverse 3→9. */
export const childDigitsLadder = [2, 3, 4, 5, 6, 7, 8, 9, 10, 3, 4, 5, 6, 7, 8, 9];

export const childDigits: WmiSpec[] = [
  span({ id: "child-wmi-1", digits: [4, 7], direction: "forward", encodeMs: 4000 }),
  span({ id: "child-wmi-2", digits: [2, 9, 5], direction: "forward", encodeMs: 4500 }),
  span({ id: "child-wmi-3", digits: [8, 1, 6, 3], direction: "forward", encodeMs: 5000 }),
  span({ id: "child-wmi-4", digits: [5, 2, 9, 4, 7], direction: "forward", encodeMs: 5500 }),
  span({ id: "child-wmi-5", digits: [3, 8, 1, 6, 2, 9], direction: "forward", encodeMs: 6000 }),
  span({ id: "child-wmi-6", digits: [7, 4, 9, 1, 5, 8, 2], direction: "forward", encodeMs: 6500 }),
  span({ id: "child-wmi-7", digits: [6, 3, 8, 2, 9, 1, 5, 4], direction: "forward", encodeMs: 7000 }),
  span({ id: "child-wmi-8", digits: [9, 1, 4, 7, 2, 8, 3, 6, 5], direction: "forward", encodeMs: 7500 }),
  span({ id: "child-wmi-9", digits: [2, 8, 5, 1, 9, 4, 7, 3, 6, 0], direction: "forward", encodeMs: 8000 }),
  span({ id: "child-wmi-10", digits: [9, 2, 5], direction: "reverse", encodeMs: 5000 }),
  span({ id: "child-wmi-11", digits: [4, 7, 1, 8], direction: "reverse", encodeMs: 5500 }),
  span({ id: "child-wmi-12", digits: [3, 6, 2, 9, 5], direction: "reverse", encodeMs: 6000 }),
  span({ id: "child-wmi-13", digits: [8, 1, 4, 7, 2, 6], direction: "reverse", encodeMs: 6500 }),
  span({ id: "child-wmi-14", digits: [5, 9, 3, 1, 8, 4, 7], direction: "reverse", encodeMs: 7000 }),
  span({ id: "child-wmi-15", digits: [2, 7, 4, 9, 1, 6, 3, 8], direction: "reverse", encodeMs: 7500 }),
  span({ id: "child-wmi-16", digits: [6, 1, 8, 3, 9, 2, 5, 4, 7], direction: "reverse", encodeMs: 8000 }),
];

export const childReverseLadder = [2, 3, 4, 5, 6, 7, 8];

export const childReverse: WmiSpec[] = [
  span({ id: "child-wmi2-1", digits: [6, 1], direction: "reverse", encodeMs: 4000 }),
  span({ id: "child-wmi2-2", digits: [8, 3, 5], direction: "reverse", encodeMs: 4500 }),
  span({ id: "child-wmi2-3", digits: [2, 9, 4, 7], direction: "reverse", encodeMs: 5000 }),
  span({ id: "child-wmi2-4", digits: [1, 6, 3, 8, 5], direction: "reverse", encodeMs: 5500 }),
  span({ id: "child-wmi2-5", digits: [9, 2, 7, 4, 0, 6], direction: "reverse", encodeMs: 6000 }),
  span({ id: "child-wmi2-6", digits: [4, 8, 1, 5, 9, 2, 7], direction: "reverse", encodeMs: 6500 }),
  span({ id: "child-wmi2-7", digits: [3, 0, 6, 9, 1, 8, 4, 2], direction: "reverse", encodeMs: 7000 }),
];

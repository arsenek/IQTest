import { span } from "../../src/lib/wmi/spec";
import type { WmiSpec } from "../../src/lib/wmi/types";

/** Forward 3→11 then reverse 4→10. */
export const adultDigitsLadder = [3, 4, 5, 6, 7, 8, 9, 10, 11, 4, 5, 6, 7, 8, 9, 10];

export const adultDigits: WmiSpec[] = [
  span({ id: "adult-wmi-1", digits: [7, 1, 4], direction: "forward", encodeMs: 4500 }),
  span({ id: "adult-wmi-2", digits: [3, 9, 2, 6], direction: "forward", encodeMs: 5000 }),
  span({ id: "adult-wmi-3", digits: [5, 8, 1, 4, 7], direction: "forward", encodeMs: 5500 }),
  span({ id: "adult-wmi-4", digits: [2, 6, 9, 3, 5, 1], direction: "forward", encodeMs: 6000 }),
  span({ id: "adult-wmi-5", digits: [8, 4, 7, 1, 9, 2, 6], direction: "forward", encodeMs: 6500 }),
  span({ id: "adult-wmi-6", digits: [9, 3, 6, 1, 8, 4, 2, 7], direction: "forward", encodeMs: 7000 }),
  span({ id: "adult-wmi-7", digits: [1, 5, 9, 2, 8, 4, 7, 3, 6], direction: "forward", encodeMs: 7500 }),
  span({ id: "adult-wmi-8", digits: [4, 8, 1, 6, 9, 2, 5, 7, 3, 0], direction: "forward", encodeMs: 8000 }),
  span({ id: "adult-wmi-9", digits: [6, 2, 9, 4, 1, 8, 5, 3, 7, 0, 2], direction: "forward", encodeMs: 8500 }),
  span({ id: "adult-wmi-10", digits: [4, 8, 2, 9], direction: "reverse", encodeMs: 5500 }),
  span({ id: "adult-wmi-11", digits: [1, 6, 3, 9, 5], direction: "reverse", encodeMs: 6000 }),
  span({ id: "adult-wmi-12", digits: [7, 2, 8, 4, 1, 6], direction: "reverse", encodeMs: 6500 }),
  span({ id: "adult-wmi-13", digits: [5, 9, 1, 7, 3, 8, 2], direction: "reverse", encodeMs: 7000 }),
  span({ id: "adult-wmi-14", digits: [3, 8, 5, 1, 9, 4, 7, 2], direction: "reverse", encodeMs: 7500 }),
  span({ id: "adult-wmi-15", digits: [9, 4, 1, 6, 8, 2, 5, 3, 7], direction: "reverse", encodeMs: 8000 }),
  span({ id: "adult-wmi-16", digits: [2, 7, 4, 9, 1, 5, 8, 3, 6, 0], direction: "reverse", encodeMs: 8500 }),
];

export const adultReverseLadder = [3, 4, 5, 6, 7, 8, 9];

export const adultReverse: WmiSpec[] = [
  span({ id: "adult-wmi2-1", digits: [7, 2, 9], direction: "reverse", encodeMs: 4500 }),
  span({ id: "adult-wmi2-2", digits: [1, 8, 4, 6], direction: "reverse", encodeMs: 5000 }),
  span({ id: "adult-wmi2-3", digits: [5, 0, 3, 9, 2], direction: "reverse", encodeMs: 5500 }),
  span({ id: "adult-wmi2-4", digits: [8, 4, 1, 7, 0, 6], direction: "reverse", encodeMs: 6000 }),
  span({ id: "adult-wmi2-5", digits: [2, 9, 5, 3, 8, 1, 4], direction: "reverse", encodeMs: 6500 }),
  span({ id: "adult-wmi2-6", digits: [6, 1, 8, 0, 4, 9, 3, 7], direction: "reverse", encodeMs: 7000 }),
  span({ id: "adult-wmi2-7", digits: [9, 3, 7, 1, 5, 0, 8, 2, 6], direction: "reverse", encodeMs: 7500 }),
];

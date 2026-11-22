import type { Figure, PriSpec } from "../../src/lib/pri/types";
import {
  colsConst,
  cross,
  cycle,
  latin,
  matrix,
  oneOf,
  pairs,
  rowsConst,
  rule,
  sequence,
  steps,
} from "../../src/lib/pri/spec";

const BOX: Figure = { type: "parts", template: "box" };
const SPOKES: Figure = { type: "parts", template: "spokes" };
const BOARD: Figure = { type: "grid" };
const RING: Figure = { type: "glyph", posLayout: "ring8" };
const CORNERS: Figure = { type: "glyph", posLayout: "corner4" };

/** adult/v1 · adult-pri-matrix — 16 items, up to three rules. */
export const adultMatrix: PriSpec[] = [
  matrix({
    id: "adult-pri-1",
    attrs: { shape: rowsConst(["hexagon", "cross", "pentagon"]), fill: "hollow" },
    rules: [rule("shape", "constant", "row")],
    distractors: oneOf("shape", ["hexagon", "cross", "diamond"]),
    ruleText: "每一行的三个图形相同。",
  }),
  matrix({
    id: "adult-pri-2",
    attrs: { shape: "arrow", fill: "solid", rot: colsConst([0, 45, 90]) },
    rules: [rule("rot", "progression", "row")],
    distractors: oneOf("rot", [45, 135, 0]),
    ruleText: "每一行从左到右，箭头每次顺时针旋转 45°。",
  }),
  matrix({
    id: "adult-pri-3",
    attrs: { shape: latin(["triangle", "square", "pentagon"], -1), fill: "solid" },
    rules: [rule("shape", "distribution", "both")],
    distractors: oneOf("shape", ["square", "pentagon", "hexagon"]),
    ruleText: "每一行、每一列里，三角形、正方形、五边形各出现一次。",
  }),
  matrix({
    id: "adult-pri-4",
    attrs: { shape: "square", fill: "hollow", count: steps([1, 2, 3], 1) },
    rules: [rule("count", "progression", "both")],
    distractors: oneOf("count", [4, 6, 3]),
    ruleText: "向右一格或向下一格，方块数量都加一。",
  }),
  matrix({
    id: "adult-pri-5",
    figure: RING,
    attrs: { shape: "circle", fill: "solid", pos: steps([0, 3, 6], 1, 8) },
    rules: [rule("pos", "progression", "both")],
    distractors: oneOf("pos", [7, 1, 6]),
    ruleText: "圆点沿外圈 8 个位置顺时针移动：向右一格移 1 位，向下一格移 3 位。",
  }),
  matrix({
    id: "adult-pri-6",
    attrs: {
      shape: latin(["circle", "diamond", "cross"]),
      fill: rowsConst(["striped", "solid", "hollow"]),
    },
    rules: [rule("shape", "distribution", "both"), rule("fill", "constant", "row")],
    distractors: cross({ shape: "circle", fill: "solid" }),
    ruleText: "每一行、每一列里三种图形各出现一次；每一行的填充方式相同。",
  }),
  matrix({
    id: "adult-pri-7",
    attrs: {
      shape: "arrow",
      fill: rowsConst(["solid", "hollow", "striped"]),
      rot: steps([0, 90, 180], 45, 360),
    },
    rules: [rule("fill", "constant", "row"), rule("rot", "progression", "both")],
    distractors: cross({ fill: "hollow", rot: 225 }),
    ruleText: "每一行的填充方式相同；箭头向右一格顺时针转 45°，向下一格顺时针转 90°。",
  }),
  matrix({
    id: "adult-pri-8",
    figure: BOX,
    attrs: {
      parts: [
        [["t", "d1"], ["t", "r"], ["t", "r", "d1"]],
        [["l", "b"], ["b", "d2"], ["b", "l", "d2"]],
        [["l", "h"], ["l", "v"], ["l", "h", "v"]],
      ],
    },
    rules: [rule("parts", "union", "row")],
    distractors: [{ parts: ["h", "v"] }, { parts: ["l"] }, { parts: ["l", "h"] }],
    ruleText: "每一行里，第三格是第一格和第二格的线条叠加在一起（重合的线只算一条）。",
  }),
  matrix({
    id: "adult-pri-9",
    attrs: {
      shape: latin(["star", "hexagon", "triangle"]),
      fill: "hollow",
      size: colsConst([1, 2, 3]),
    },
    rules: [rule("shape", "distribution", "both"), rule("size", "progression", "row")],
    distractors: cross({ shape: "triangle", size: 2 }),
    ruleText: "每一行、每一列里三种图形各出现一次；每一行从左到右一个比一个大。",
  }),
  matrix({
    id: "adult-pri-10",
    figure: SPOKES,
    attrs: {
      parts: [
        [["n", "e", "s", "w"], ["n", "ne"], ["e", "s", "w"]],
        [["ne", "se", "sw", "nw"], ["se", "s"], ["ne", "sw", "nw"]],
        [["n", "ne", "s", "w"], ["ne", "e", "w"], ["n", "s"]],
      ],
    },
    rules: [rule("parts", "difference", "row")],
    distractors: [{ parts: ["n", "e", "s"] }, { parts: ["ne", "w"] }, { parts: ["n", "s", "w"] }],
    ruleText: "每一行里，第三格 = 第一格的线条去掉在第二格中也出现的线条。",
  }),
  matrix({
    id: "adult-pri-11",
    figure: BOARD,
    attrs: {
      on: [
        [["0", "1"], ["1", "2", "4"], ["0", "2", "4"]],
        [["1", "3"], ["3", "4", "5"], ["1", "4", "5"]],
        [["0", "3"], ["1", "2", "3", "5"], ["0", "1", "2", "5"]],
      ],
    },
    rules: [rule("on", "xor", "both")],
    distractors: [
      { on: ["0", "1", "2", "3", "5"] },
      { on: ["1", "2", "3", "5"] },
      { on: ["0", "1", "2", "4", "5"] },
    ],
    ruleText: "每一行、每一列里，第三格 = 前两格叠加后，只保留恰好在其中一格里涂黑的格子（两格都涂黑的格子变白）。",
  }),
  matrix({
    id: "adult-pri-12",
    attrs: {
      shape: latin(["circle", "triangle", "square"]),
      fill: latin(["solid", "striped", "hollow"], -1),
    },
    rules: [rule("shape", "distribution", "both"), rule("fill", "distribution", "both")],
    distractors: cross({ shape: "square", fill: "hollow" }),
    ruleText: "每一行、每一列里，三种图形各出现一次，三种填充也各出现一次。",
  }),
  matrix({
    id: "adult-pri-13",
    missing: [1, 1],
    attrs: {
      shape: latin(["diamond", "star", "circle"]),
      fill: "solid",
      count: steps([1, 2, 3], 1),
    },
    rules: [rule("shape", "distribution", "both"), rule("count", "progression", "both")],
    distractors: cross({ shape: "star", count: 2 }),
    ruleText: "每一行、每一列里三种图形各出现一次；向右一格或向下一格，数量都加一（缺格在正中）。",
  }),
  matrix({
    id: "adult-pri-14",
    figure: SPOKES,
    attrs: {
      frame: latin(["circle", "square", "hexagon"]),
      parts: [
        [["n", "s"], ["n", "e"], ["n", "e", "s"]],
        [["ne", "sw"], ["se", "sw"], ["ne", "se", "sw"]],
        [["w", "nw"], ["n", "e", "nw"], ["n", "e", "w", "nw"]],
      ],
    },
    rules: [rule("frame", "distribution", "both"), rule("parts", "union", "row")],
    distractors: cross({ frame: "hexagon", parts: ["n", "e", "w"] }),
    ruleText: "每一行、每一列里三种外框各出现一次；框内线条按行叠加：第三格 = 第一格 + 第二格。",
  }),
  // sim50 flagged too_hard (p≈0.03) — unique-key item kept as late-bank ceiling;
  // discrimination fix is via steeper sim difficulty model, not rewriting a sound item.
  matrix({
    id: "adult-pri-15",
    attrs: {
      shape: latin(["circle", "triangle", "square"]),
      fill: latin(["solid", "hollow", "striped"], -1),
      count: colsConst([1, 2, 3]),
    },
    rules: [
      rule("shape", "distribution", "both"),
      rule("fill", "distribution", "both"),
      rule("count", "progression", "row"),
    ],
    distractors: pairs({ shape: "circle", fill: "striped", count: 2 }),
    ruleText: "每一行、每一列里三种图形、三种填充各出现一次；每一行从左到右数量加一。",
  }),
  matrix({
    id: "adult-pri-16",
    figure: SPOKES,
    attrs: {
      frame: latin(["square", "circle", "hexagon"], -1),
      parts: [
        [["n", "e", "s"], ["e", "s", "w"], ["n", "w"]],
        [["n", "ne", "sw"], ["n", "se"], ["ne", "se", "sw"]],
        [["n", "se", "s", "nw"], ["e", "s", "nw"], ["n", "e", "se"]],
      ],
    },
    rules: [rule("frame", "distribution", "both"), rule("parts", "xor", "row")],
    distractors: cross({ frame: "circle", parts: ["n", "e", "se", "s", "nw"] }),
    ruleText: "每一行、每一列里三种外框各出现一次；框内线条按行做“异或”：前两格叠加后，两格都有的线条被消去。",
  }),
];

/** adult/v1 · adult-pri-sequence — 7 items. */
export const adultSequence: PriSpec[] = [
  sequence({
    id: "adult-pri2-1",
    length: 5,
    attrs: { shape: "arrow", fill: "solid", rot: [0, 45, 90, 135, 180] },
    rules: [rule("rot", "progression")],
    distractors: oneOf("rot", [135, 225, 90]),
    ruleText: "箭头每次顺时针旋转 45°。",
  }),
  sequence({
    id: "adult-pri2-2",
    length: 6,
    attrs: {
      shape: ["pentagon", "cross", "diamond", "pentagon", "cross", "diamond"],
      fill: "hollow",
    },
    rules: [cycle("shape", 3)],
    distractors: oneOf("shape", ["pentagon", "cross", "hexagon"]),
    ruleText: "五边形、十字、菱形三个一组循环。",
  }),
  sequence({
    id: "adult-pri2-3",
    length: 5,
    missing: 2,
    figure: RING,
    attrs: { shape: "circle", fill: "solid", pos: [0, 3, 6, 1, 4] },
    rules: [rule("pos", "progression")],
    distractors: oneOf("pos", [5, 7, 4]),
    ruleText: "圆点沿外圈 8 个位置每次顺时针移 3 位（缺的是中间一格）。",
  }),
  sequence({
    id: "adult-pri2-4",
    length: 5,
    attrs: {
      shape: "triangle",
      fill: ["solid", "hollow", "solid", "hollow", "solid"],
      count: [1, 2, 3, 4, 5],
    },
    rules: [cycle("fill", 2), rule("count", "progression")],
    distractors: cross({ fill: "hollow", count: 4 }),
    ruleText: "数量每次加一；填充按涂黑、空心交替。",
  }),
  sequence({
    id: "adult-pri2-5",
    length: 6,
    attrs: {
      shape: ["arrow", "heart", "drop", "arrow", "heart", "drop"],
      fill: "solid",
      rot: [0, 90, 180, 270, 0, 90],
    },
    rules: [cycle("shape", 3), rule("rot", "progression")],
    distractors: cross({ shape: "arrow", rot: 0 }),
    ruleText: "图形按箭头、爱心、水滴三个一组循环；同时每一格都比前一格顺时针多转 90°。",
  }),
  sequence({
    id: "adult-pri2-6",
    length: 6,
    missing: 3,
    attrs: {
      shape: "arrow",
      fill: ["solid", "hollow", "striped", "solid", "hollow", "striped"],
      rot: [0, 45, 90, 135, 180, 225],
    },
    rules: [cycle("fill", 3), rule("rot", "progression")],
    distractors: cross({ fill: "striped", rot: 90 }),
    ruleText: "箭头每次顺时针转 45°；填充按涂黑、空心、斜线三个一组循环（缺的是第四格）。",
  }),
  sequence({
    id: "adult-pri2-7",
    length: 6,
    figure: CORNERS,
    attrs: {
      shape: ["circle", "square", "triangle", "circle", "square", "triangle"],
      fill: ["solid", "hollow", "solid", "hollow", "solid", "hollow"],
      pos: [0, 1, 2, 3, 0, 1],
    },
    rules: [cycle("shape", 3), cycle("fill", 2), rule("pos", "progression")],
    distractors: pairs({ shape: "circle", fill: "solid", pos: 0 }),
    ruleText: "图形按圆、方、三角三个一组循环；填充按涂黑、空心交替；位置每次顺时针挪到下一个角。",
  }),
];

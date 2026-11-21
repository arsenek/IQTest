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

const FACE: Figure = { type: "parts", template: "face" };
const BOX: Figure = { type: "parts", template: "box" };
const SPOKES: Figure = { type: "parts", template: "spokes" };
const CORNERS: Figure = { type: "glyph", posLayout: "corner4" };

/**
 * child/practice/v1 · child-prac-pri — 10 items.
 * Same rule families as the formal pack, different figures and values, so
 * practising teaches the kind of task without revealing any formal item.
 */
export const childPractice: PriSpec[] = [
  matrix({
    id: "child-prac-pri-1",
    attrs: { shape: rowsConst(["drop", "tree", "fish"]), fill: "solid" },
    rules: [rule("shape", "constant", "row")],
    distractors: oneOf("shape", ["drop", "tree", "house"]),
    ruleText: "每一行里的三个图形都一样。",
  }),
  sequence({
    id: "child-prac-pri-2",
    length: 5,
    attrs: { shape: "drop", fill: "solid", count: [1, 2, 3, 4, 5] },
    rules: [rule("count", "progression")],
    distractors: oneOf("count", [4, 3, 6]),
    ruleText: "每往右一格，水滴多一个。",
  }),
  matrix({
    id: "child-prac-pri-3",
    attrs: { shape: "tree", fill: "solid", count: colsConst([1, 2, 3]) },
    rules: [rule("count", "progression", "row")],
    distractors: oneOf("count", [1, 2, 4]),
    ruleText: "每一行从左到右，小树每次多一棵。",
  }),
  sequence({
    id: "child-prac-pri-4",
    length: 5,
    attrs: { shape: ["fish", "tree", "fish", "tree", "fish"], fill: "solid" },
    rules: [cycle("shape", 2)],
    distractors: oneOf("shape", ["tree", "house", "star"]),
    ruleText: "小鱼和小树轮流出现。",
  }),
  matrix({
    id: "child-prac-pri-5",
    figure: CORNERS,
    attrs: { shape: "star", fill: "solid", pos: colsConst([1, 2, 3]) },
    rules: [rule("pos", "progression", "row")],
    distractors: oneOf("pos", [0, 1, 2]),
    ruleText: "每一行从左到右，星星每次顺时针挪到下一个角（右上→右下→左下）。",
  }),
  matrix({
    id: "child-prac-pri-6",
    attrs: {
      shape: rowsConst(["heart", "star", "moon"]),
      fill: "hollow",
      count: colsConst([1, 2, 3]),
    },
    rules: [rule("shape", "constant", "row"), rule("count", "progression", "row")],
    distractors: cross({ shape: "star", count: 2 }),
    ruleText: "每一行的图形相同，并且从左到右每次多一个。",
  }),
  sequence({
    id: "child-prac-pri-7",
    length: 6,
    attrs: { shape: ["circle", "triangle", "square", "circle", "triangle", "square"], fill: "hollow" },
    rules: [cycle("shape", 3)],
    distractors: oneOf("shape", ["circle", "triangle", "diamond"]),
    ruleText: "圆形、三角形、正方形三个一组，按顺序重复。",
  }),
  matrix({
    id: "child-prac-pri-8",
    attrs: { shape: latin(["heart", "drop", "star"], -1), fill: "solid" },
    rules: [rule("shape", "distribution", "both")],
    distractors: oneOf("shape", ["drop", "star", "moon"]),
    ruleText: "每一行、每一列里，爱心、水滴、星星各出现一次。",
  }),
  matrix({
    id: "child-prac-pri-9",
    figure: FACE,
    attrs: {
      parts: [
        [["head"], ["eyes"], ["head", "eyes"]],
        [["head", "eyes"], ["head", "mouth"], ["head", "eyes", "mouth"]],
        [["head", "hat"], ["eyes", "mouth"], ["head", "eyes", "mouth", "hat"]],
      ],
    },
    rules: [rule("parts", "union", "row")],
    distractors: [
      { parts: ["head", "hat"] },
      { parts: ["head", "eyes", "hat"] },
      { parts: ["head", "eyes", "mouth", "ears"] },
    ],
    ruleText: "每一行里，把第一格和第二格的图叠在一起，就得到第三格。",
  }),
  matrix({
    id: "child-prac-pri-10",
    attrs: {
      shape: latin(["drop", "tree", "house"]),
      fill: "solid",
      count: colsConst([1, 2, 3]),
    },
    rules: [rule("shape", "distribution", "both"), rule("count", "progression", "row")],
    distractors: cross({ shape: "house", count: 2 }),
    ruleText: "每一行、每一列里，水滴、小树、房子各出现一次；并且每一行从左到右每次多一个。",
  }),
];

/** adult/practice/v1 · adult-prac-pri — 10 items. */
export const adultPractice: PriSpec[] = [
  sequence({
    id: "adult-prac-pri-1",
    length: 5,
    attrs: { shape: "drop", fill: "solid", rot: [180, 225, 270, 315, 0] },
    rules: [rule("rot", "progression")],
    distractors: oneOf("rot", [315, 45, 270]),
    ruleText: "水滴每次顺时针旋转 45°。",
  }),
  matrix({
    id: "adult-prac-pri-2",
    attrs: { shape: latin(["cross", "hexagon", "star"]), fill: "hollow" },
    rules: [rule("shape", "distribution", "both")],
    distractors: oneOf("shape", ["star", "cross", "pentagon"]),
    ruleText: "每一行、每一列里，十字、六边形、五角星各出现一次。",
  }),
  matrix({
    id: "adult-prac-pri-3",
    attrs: { shape: "triangle", fill: "solid", count: steps([5, 4, 3], -1) },
    rules: [rule("count", "progression", "both")],
    distractors: oneOf("count", [2, 3, 4]),
    ruleText: "向右一格或向下一格，三角形数量都减一。",
  }),
  sequence({
    id: "adult-prac-pri-4",
    length: 6,
    attrs: { shape: ["hexagon", "star", "triangle", "hexagon", "star", "triangle"], fill: "solid" },
    rules: [cycle("shape", 3)],
    distractors: oneOf("shape", ["hexagon", "star", "square"]),
    ruleText: "六边形、五角星、三角形三个一组循环。",
  }),
  matrix({
    id: "adult-prac-pri-5",
    attrs: {
      shape: latin(["pentagon", "star", "square"], -1),
      fill: rowsConst(["hollow", "striped", "solid"]),
    },
    rules: [rule("shape", "distribution", "both"), rule("fill", "constant", "row")],
    distractors: cross({ shape: "square", fill: "striped" }),
    ruleText: "每一行、每一列里三种图形各出现一次；每一行的填充方式相同。",
  }),
  matrix({
    id: "adult-prac-pri-6",
    figure: BOX,
    attrs: {
      parts: [
        [["t", "b"], ["b", "v"], ["t", "b", "v"]],
        [["r", "d1"], ["l", "d1"], ["r", "l", "d1"]],
        [["t", "d2"], ["d2", "h"], ["t", "d2", "h"]],
      ],
    },
    rules: [rule("parts", "union", "row")],
    distractors: [{ parts: ["t", "h"] }, { parts: ["d2"] }, { parts: ["d2", "h"] }],
    ruleText: "每一行里，第三格是第一格和第二格的线条叠加在一起（重合的线只算一条）。",
  }),
  sequence({
    id: "adult-prac-pri-7",
    length: 5,
    attrs: {
      shape: ["diamond", "cross", "diamond", "cross", "diamond"],
      fill: "hollow",
      count: [1, 2, 3, 4, 5],
    },
    rules: [cycle("shape", 2), rule("count", "progression")],
    distractors: cross({ shape: "cross", count: 4 }),
    ruleText: "菱形和十字交替出现，同时数量每次加一。",
  }),
  matrix({
    id: "adult-prac-pri-8",
    figure: BOX,
    attrs: {
      parts: [
        [["t", "r", "b", "l"], ["t", "d1"], ["r", "b", "l"]],
        [["l", "d1", "d2", "h"], ["d2", "v"], ["l", "d1", "h"]],
        [["t", "b", "h", "v"], ["b", "l", "v"], ["t", "h"]],
      ],
    },
    rules: [rule("parts", "difference", "row")],
    distractors: [{ parts: ["t", "l", "h"] }, { parts: ["b", "v"] }, { parts: ["t", "h", "v"] }],
    ruleText: "每一行里，第三格 = 第一格的线条去掉在第二格中也出现的线条。",
  }),
  matrix({
    id: "adult-prac-pri-9",
    figure: SPOKES,
    attrs: {
      parts: [
        [["n", "ne", "e"], ["e", "se"], ["n", "ne", "se"]],
        [["s", "w"], ["s", "sw", "nw"], ["sw", "w", "nw"]],
        [["n", "se", "w"], ["n", "e", "w"], ["e", "se"]],
      ],
    },
    rules: [rule("parts", "xor", "row")],
    distractors: [{ parts: ["n", "e", "se", "w"] }, { parts: ["n", "w"] }, { parts: ["se"] }],
    ruleText: "每一行里做“异或”：前两格叠加后，两格都有的线条被消去，只留下恰好出现一次的线条。",
  }),
  matrix({
    id: "adult-prac-pri-10",
    attrs: {
      frame: latin(["circle", "square", "hexagon"]),
      shape: latin(["triangle", "star", "cross"], -1),
      fill: rowsConst(["solid", "hollow", "striped"]),
    },
    rules: [
      rule("frame", "distribution", "both"),
      rule("shape", "distribution", "both"),
      rule("fill", "constant", "row"),
    ],
    distractors: pairs({ frame: "circle", shape: "star", fill: "hollow" }),
    ruleText: "每一行、每一列里三种外框各出现一次、框内三种图形也各出现一次；每一行的填充方式相同。",
  }),
];

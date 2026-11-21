import type { Figure, PriSpec } from "../../src/lib/pri/types";
import {
  colsConst,
  cross,
  cycle,
  latin,
  matrix,
  oneOf,
  rowsConst,
  rule,
  sequence,
  steps,
} from "../../src/lib/pri/spec";

const HOUSE: Figure = { type: "parts", template: "house" };
const FACE: Figure = { type: "parts", template: "face" };
const CORNERS: Figure = { type: "glyph", posLayout: "corner4" };

/** child/v1 · child-pri-matrix — 16 items, at most two rules each. */
export const childMatrix: PriSpec[] = [
  matrix({
    id: "child-pri-1",
    attrs: { shape: rowsConst(["star", "heart", "moon"]), fill: "solid" },
    rules: [rule("shape", "constant", "row")],
    distractors: oneOf("shape", ["star", "heart", "drop"]),
    ruleText: "每一行里的三个图形都一样。",
  }),
  matrix({
    id: "child-pri-2",
    attrs: { shape: colsConst(["circle", "triangle", "square"]), fill: "hollow" },
    rules: [rule("shape", "constant", "col")],
    distractors: oneOf("shape", ["circle", "triangle", "diamond"]),
    ruleText: "每一列里的三个图形都一样（每一行都是圆、三角、方）。",
  }),
  matrix({
    id: "child-pri-3",
    attrs: { shape: "heart", fill: "solid", count: colsConst([1, 2, 3]) },
    rules: [rule("count", "progression", "row")],
    distractors: oneOf("count", [1, 2, 4]),
    ruleText: "每一行从左到右，爱心每次多一个。",
  }),
  matrix({
    id: "child-pri-4",
    attrs: { shape: "arrow", fill: "solid", rot: colsConst([0, 90, 180]) },
    rules: [rule("rot", "progression", "row")],
    distractors: oneOf("rot", [0, 90, 270]),
    ruleText: "每一行从左到右，箭头每次顺时针转四分之一圈（上→右→下）。",
  }),
  matrix({
    id: "child-pri-5",
    figure: CORNERS,
    attrs: { shape: "circle", fill: "solid", pos: colsConst([0, 1, 2]) },
    rules: [rule("pos", "progression", "row")],
    distractors: oneOf("pos", [0, 1, 3]),
    ruleText: "每一行从左到右，小球每次顺时针挪到下一个角（左上→右上→右下）。",
  }),
  matrix({
    id: "child-pri-6",
    attrs: {
      shape: rowsConst(["tree", "fish", "house"]),
      fill: "solid",
      size: colsConst([1, 2, 3]),
    },
    rules: [rule("shape", "constant", "row"), rule("size", "progression", "row")],
    distractors: cross({ shape: "fish", size: 2 }),
    ruleText: "每一行的图形相同，并且从左到右一个比一个大。",
  }),
  matrix({
    id: "child-pri-7",
    attrs: {
      shape: "star",
      fill: rowsConst(["solid", "hollow", "striped"]),
      count: colsConst([1, 2, 3]),
    },
    rules: [rule("fill", "constant", "row"), rule("count", "progression", "row")],
    distractors: cross({ fill: "hollow", count: 2 }),
    ruleText: "每一行的涂法相同（涂黑／空心／斜线），并且星星从左到右每次多一个。",
  }),
  matrix({
    id: "child-pri-8",
    attrs: { shape: latin(["circle", "square", "triangle"]), fill: "solid" },
    rules: [rule("shape", "distribution", "both")],
    distractors: oneOf("shape", ["triangle", "circle", "diamond"]),
    ruleText: "每一行、每一列里，圆形、正方形、三角形各出现一次。",
  }),
  matrix({
    id: "child-pri-9",
    attrs: { shape: "circle", fill: "solid", count: steps([1, 2, 3], 1) },
    rules: [rule("count", "progression", "both")],
    distractors: oneOf("count", [4, 3, 6]),
    ruleText: "往右一格或往下一格，圆点都多一个。",
  }),
  matrix({
    id: "child-pri-10",
    attrs: { shape: "arrow", fill: "solid", rot: steps([0, 90, 180], 90, 360) },
    rules: [rule("rot", "progression", "both")],
    distractors: oneOf("rot", [270, 90, 180]),
    ruleText: "往右一格或往下一格，箭头都顺时针转四分之一圈。",
  }),
  matrix({
    id: "child-pri-11",
    attrs: {
      shape: rowsConst(["heart", "drop", "moon"]),
      fill: latin(["solid", "hollow", "striped"]),
    },
    rules: [rule("shape", "constant", "row"), rule("fill", "distribution", "both")],
    distractors: cross({ shape: "drop", fill: "solid" }),
    ruleText: "每一行的图形相同；每一行、每一列里，涂黑、空心、斜线三种涂法各出现一次。",
  }),
  matrix({
    id: "child-pri-12",
    figure: HOUSE,
    attrs: {
      parts: [
        [["walls"], ["roof"], ["walls", "roof"]],
        [["walls", "door"], ["walls", "roof"], ["walls", "roof", "door"]],
        [["walls", "window"], ["roof", "chimney"], ["walls", "roof", "window", "chimney"]],
      ],
    },
    rules: [rule("parts", "union", "row")],
    distractors: [
      { parts: ["walls", "window"] },
      { parts: ["walls", "roof", "window"] },
      { parts: ["walls", "roof", "door", "chimney"] },
    ],
    ruleText: "每一行里，把第一格和第二格的图叠在一起，就得到第三格。",
  }),
  matrix({
    id: "child-pri-13",
    attrs: {
      shape: latin(["star", "heart", "moon"]),
      fill: "solid",
      count: colsConst([1, 2, 3]),
    },
    rules: [rule("shape", "distribution", "both"), rule("count", "progression", "row")],
    distractors: cross({ shape: "star", count: 2 }),
    ruleText: "每一行、每一列里，星、心、月各出现一次；并且每一行从左到右每次多一个。",
  }),
  matrix({
    id: "child-pri-14",
    figure: FACE,
    attrs: {
      parts: [
        [["head", "eyes", "mouth"], ["mouth"], ["head", "eyes"]],
        [["head", "eyes", "hat"], ["eyes"], ["head", "hat"]],
        [["head", "eyes", "mouth", "hat"], ["eyes", "hat"], ["head", "mouth"]],
      ],
    },
    rules: [rule("parts", "difference", "row")],
    distractors: [
      { parts: ["head", "eyes", "mouth", "hat"] },
      { parts: ["head", "eyes", "mouth"] },
      { parts: ["head", "hat"] },
    ],
    ruleText: "每一行里，从第一格的图中拿走第二格画出的部分，就得到第三格。",
  }),
  matrix({
    id: "child-pri-15",
    attrs: {
      shape: latin(["tree", "house", "fish"]),
      fill: latin(["solid", "hollow", "striped"], -1),
    },
    rules: [rule("shape", "distribution", "both"), rule("fill", "distribution", "both")],
    distractors: cross({ shape: "tree", fill: "striped" }),
    ruleText: "每一行、每一列里，三种图形各出现一次，三种涂法也各出现一次。",
  }),
  matrix({
    id: "child-pri-16",
    attrs: {
      shape: latin(["circle", "square", "triangle"]),
      fill: "solid",
      count: steps([1, 2, 3], 1),
    },
    rules: [rule("shape", "distribution", "both"), rule("count", "progression", "both")],
    distractors: cross({ shape: "circle", count: 4 }),
    ruleText: "每一行、每一列里三种图形各出现一次；同时往右一格或往下一格，数量都多一个。",
  }),
];

/** child/v1 · child-pri-sequence — 7 items. */
export const childSequence: PriSpec[] = [
  sequence({
    id: "child-pri2-1",
    length: 5,
    attrs: { shape: "star", fill: "solid", count: [1, 2, 3, 4, 5] },
    rules: [rule("count", "progression")],
    distractors: oneOf("count", [4, 3, 6]),
    ruleText: "每往右一格，星星多一个。",
  }),
  sequence({
    id: "child-pri2-2",
    length: 5,
    attrs: { shape: ["heart", "moon", "heart", "moon", "heart"], fill: "solid" },
    rules: [cycle("shape", 2)],
    distractors: oneOf("shape", ["moon", "star", "drop"]),
    ruleText: "爱心和月亮轮流出现。",
  }),
  sequence({
    id: "child-pri2-3",
    length: 5,
    attrs: { shape: "arrow", fill: "solid", rot: [0, 90, 180, 270, 0] },
    rules: [rule("rot", "progression")],
    distractors: oneOf("rot", [270, 90, 180]),
    ruleText: "箭头每次顺时针转四分之一圈。",
  }),
  sequence({
    id: "child-pri2-4",
    length: 5,
    missing: 2,
    attrs: { shape: "circle", fill: "hollow", count: [1, 2, 3, 4, 5] },
    rules: [rule("count", "progression")],
    distractors: oneOf("count", [2, 4, 1]),
    ruleText: "每往右一格，圆圈多一个（缺的是中间一格）。",
  }),
  sequence({
    id: "child-pri2-5",
    length: 6,
    attrs: { shape: ["tree", "fish", "house", "tree", "fish", "house"], fill: "solid" },
    rules: [cycle("shape", 3)],
    distractors: oneOf("shape", ["tree", "fish", "star"]),
    ruleText: "小树、小鱼、房子三个一组，按顺序重复。",
  }),
  sequence({
    id: "child-pri2-6",
    length: 5,
    attrs: {
      shape: ["circle", "square", "circle", "square", "circle"],
      fill: "solid",
      count: [1, 2, 3, 4, 5],
    },
    rules: [cycle("shape", 2), rule("count", "progression")],
    distractors: cross({ shape: "square", count: 4 }),
    ruleText: "圆形和正方形轮流出现，同时数量每次多一个。",
  }),
  sequence({
    id: "child-pri2-7",
    length: 6,
    attrs: {
      shape: ["star", "heart", "moon", "star", "heart", "moon"],
      fill: ["solid", "hollow", "solid", "hollow", "solid", "hollow"],
    },
    rules: [cycle("shape", 3), cycle("fill", 2)],
    distractors: cross({ shape: "star", fill: "solid" }),
    ruleText: "图形按星、心、月三个一组重复；涂法按涂黑、空心轮流。",
  }),
];

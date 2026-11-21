import type { Cell, Figure, LineDir, PriSpec, Rule, Value } from "./types";
import { applySetOp, effectiveRules, isFixed, violatedRules } from "./rules";
import {
  FILLS,
  FRAMES,
  GRID_ZH,
  PARTS,
  POS_ZH,
  ROT_ZH,
  SHAPES,
  SIZE_ZH,
  attrMeta,
  cellKey,
  isSet,
  sameValue,
} from "./vocab";

/** One attribute value in plain Chinese. */
export function describeValue(figure: Figure, attr: string, v: Value): string {
  if (isSet(v)) {
    if (attr === "on") return v.map((i) => GRID_ZH[Number(i)]).join("、");
    if (figure.type === "parts") return v.map((p) => PARTS[figure.template][p]).join("＋");
    return v.join("、");
  }
  switch (attr) {
    case "shape":
      return SHAPES[v as keyof typeof SHAPES].zh;
    case "fill":
      return FILLS[v as keyof typeof FILLS];
    case "frame":
      return `${FRAMES[v as keyof typeof FRAMES]}外框`;
    case "count":
      return `${v} 个`;
    case "size":
      return SIZE_ZH[v as number];
    case "rot":
      return ROT_ZH[v as number];
    case "pos": {
      const layout = figure.type === "glyph" && figure.posLayout === "ring8" ? "ring8" : "corner4";
      return POS_ZH[layout][v as number];
    }
    default:
      return String(v);
  }
}

/** A whole cell in plain Chinese, e.g. "3 个空心三角形". */
export function describeCell(figure: Figure, cell: Cell): string {
  const frame = cell.frame !== undefined ? `${describeValue(figure, "frame", cell.frame)}内：` : "";
  if (figure.type === "grid") {
    const on = cell.on as string[];
    return `涂黑 ${on.length} 格（${describeValue(figure, "on", on)}）`;
  }
  if (figure.type === "parts") return frame + describeValue(figure, "parts", cell.parts);

  const count = typeof cell.count === "number" ? cell.count : 1;
  const size = cell.size !== undefined ? describeValue(figure, "size", cell.size) : "";
  const fill = describeValue(figure, "fill", cell.fill);
  const shape = describeValue(figure, "shape", cell.shape);
  const rot = cell.rot !== undefined ? `，${describeValue(figure, "rot", cell.rot)}` : "";
  const pos = cell.pos !== undefined ? `，在${describeValue(figure, "pos", cell.pos)}` : "";
  return `${frame}${count} 个${size}${fill}${shape}${rot}${pos}`;
}

const DIR_ZH: Record<LineDir, string> = { row: "行", col: "列" };

function stepText(spec: PriSpec, rule: Rule, dir: LineDir): string {
  const meta = attrMeta(spec.figure, rule.attr);
  const a = spec.grid[0][0][rule.attr] as number;
  const b = (dir === "row" ? spec.grid[0][1] : spec.grid[1][0])[rule.attr] as number;
  let d = b - a;
  if (meta.kind === "num" && meta.mod) {
    d = ((d % meta.mod) + meta.mod) % meta.mod;
    if (d > meta.mod / 2) d -= meta.mod;
  }
  const more = d > 0;
  const abs = Math.abs(d);
  switch (rule.attr) {
    case "count":
      return `${more ? "多" : "少"} ${abs} 个`;
    case "size":
      return more ? "大一号" : "小一号";
    case "rot":
      return `${more ? "顺" : "逆"}时针转 ${abs}°`;
    case "pos":
      return `${more ? "顺" : "逆"}时针移 ${abs} 位`;
    default:
      return `${more ? "+" : "−"}${abs}`;
  }
}

function distinctValues(spec: PriSpec, attr: string): string {
  const seen: Value[] = [];
  for (const cell of spec.grid.flat()) {
    if (!seen.some((v) => sameValue(v, cell[attr]))) seen.push(cell[attr]);
  }
  return seen.map((v) => describeValue(spec.figure, attr, v)).join("、");
}

const OP_ZH: Record<string, string> = {
  union: "第一格与第二格叠在一起（并集）",
  xor: "第一格与第二格叠在一起，再去掉两格都有的部分（异或）",
  difference: "第一格去掉第二格里出现的部分（差集）",
  intersection: "第一格与第二格都有的部分（交集）",
};

/** The machine-checked rule, spelled out. Mirrors exactly what the test enforces. */
export function describeRule(spec: PriSpec, rule: Rule): string {
  const label = attrMeta(spec.figure, rule.attr).label;
  const dirs: LineDir[] = rule.dir === "both" ? ["row", "col"] : [rule.dir];
  const lineWord = dirs.map((d) => `每一${DIR_ZH[d]}`).join("、");

  if (spec.kind === "sequence") {
    if (rule.type === "constant") return `${label}：始终不变`;
    if (rule.type === "progression") return `${label}：每往右一格${stepText(spec, rule, "row")}`;
    const run = spec.grid[0]
      .slice(0, rule.period)
      .map((c) => describeValue(spec.figure, rule.attr, c[rule.attr]))
      .join(" → ");
    return `${label}：每 ${rule.period} 格循环一次（${run}）`;
  }

  switch (rule.type) {
    case "constant":
      return `${label}：${lineWord}内相同`;
    case "progression":
      return `${label}：${dirs
        .map((d) => `沿${DIR_ZH[d]}${d === "row" ? "从左到右" : "从上到下"}每格${stepText(spec, rule, d)}`)
        .join("；")}`;
    case "distribution":
      return `${label}：${lineWord}里 ${distinctValues(spec, rule.attr)} 各出现一次`;
    default:
      return `${label}：${lineWord}的第三格 = ${OP_ZH[rule.type]}`;
  }
}

/** Notable ways a wrong option relates to the stem (partial solutions). */
function partialSolutionNotes(spec: PriSpec, cell: Cell): string[] {
  const notes: string[] = [];
  const [mr, mc] = spec.missing;
  const key = cellKey(cell);
  const at = (r: number, c: number) => spec.grid[r]?.[c];
  const left = at(mr, mc - 1);
  const up = spec.kind === "matrix" ? at(mr - 1, mc) : undefined;
  if (left && cellKey(left) === key) {
    notes.push(spec.kind === "matrix" ? "与左边一格完全相同（照抄）" : "与前一格完全相同（照抄）");
  }
  if (up && cellKey(up) === key) notes.push("与上面一格完全相同（照抄）");

  for (const rule of spec.rules) {
    const meta = attrMeta(spec.figure, rule.attr);
    if (meta.kind !== "set" || spec.kind !== "matrix") continue;
    if (!["union", "xor", "difference", "intersection"].includes(rule.type)) continue;
    const got = cell[rule.attr];
    const lines: Array<[string, string[], string[]]> = [];
    if (rule.dir !== "col" && mc === 2) {
      lines.push(["这一行", spec.grid[mr][0][rule.attr] as string[], spec.grid[mr][1][rule.attr] as string[]]);
    }
    if (rule.dir !== "row" && mr === 2) {
      lines.push(["这一列", spec.grid[0][mc][rule.attr] as string[], spec.grid[1][mc][rule.attr] as string[]]);
    }
    for (const [where, a, b] of lines) {
      const named: Array<[string, string[]]> = [
        ["只照搬了第一格", a],
        ["只照搬了第二格", b],
        ["把前两格简单叠加（并集），没有去掉该去的部分", applySetOp("union", meta.universe, a, b)],
        ["只留下前两格都有的部分（交集）", applySetOp("intersection", meta.universe, a, b)],
        ["做成了异或（去掉了前两格都有的部分）", applySetOp("xor", meta.universe, a, b)],
        ["做成了差集（第一格减第二格）", applySetOp("difference", meta.universe, a, b)],
      ];
      const hit = named.find(([, v]) => v.length > 0 && sameValue(v, got));
      if (hit) {
        notes.push(`${meta.label}${hit[0]}（按${where}看）`);
        break;
      }
    }
  }
  return notes;
}

function setDelta(figure: Figure, attr: string, want: readonly string[], got: readonly string[]): string {
  const extra = got.filter((x) => !want.includes(x));
  const lacking = want.filter((x) => !got.includes(x));
  const bits: string[] = [];
  if (extra.length) bits.push(`多了${describeValue(figure, attr, extra)}`);
  if (lacking.length) bits.push(`少了${describeValue(figure, attr, lacking)}`);
  return bits.join("，");
}

/**
 * Why a distractor is wrong: which rules it breaks (computed by actually
 * placing it in the grid) and what it should have been.
 */
export function describeDistractor(spec: PriSpec, answer: Cell, cell: Cell): string {
  const broken = violatedRules(spec, cell);
  const reasons = broken.map((rule) => {
    const label = attrMeta(spec.figure, rule.attr).label;
    const want = answer[rule.attr];
    const got = cell[rule.attr];
    const scope = isFixed(spec, rule.attr) ? `题干里「${label}」从不变化` : `违反「${label}」规则`;
    if (isSet(want) && isSet(got)) {
      return `${scope}：${setDelta(spec.figure, rule.attr, want, got)}`;
    }
    return `${scope}：应为「${describeValue(spec.figure, rule.attr, want)}」，这里是「${describeValue(spec.figure, rule.attr, got)}」`;
  });
  const notes = partialSolutionNotes(spec, cell);
  return reasons.join("；") + (notes.length ? `。${notes.join("；")}` : "");
}

/** Rules of an item for the review document (explicit ones only). */
export function describeRules(spec: PriSpec): string[] {
  return effectiveRules(spec)
    .filter((r) => !isFixed(spec, r.attr))
    .map((r) => describeRule(spec, r));
}

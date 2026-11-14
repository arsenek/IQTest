#!/usr/bin/env node
/**
 * Generate practice-ready child/adult v1 manifests + PRI SVG media.
 * Self-authored zh-CN fixtures; no official Wechsler content.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function mediaUrl(audience, file) {
  return `/packs/${audience}/v1/media/${file}`;
}

function svgShell(inner, w = 320, h = 240) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-hidden="true">
  <rect width="100%" height="100%" fill="#fafafa"/>
  ${inner}
</svg>
`;
}

function cell(x, y, size, kind, fill = "#1e293b") {
  const pad = 8;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2 - pad;
  switch (kind) {
    case "circle":
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
    case "square":
      return `<rect x="${x + pad}" y="${y + pad}" width="${size - 2 * pad}" height="${size - 2 * pad}" fill="${fill}"/>`;
    case "triangle":
      return `<polygon points="${cx},${y + pad} ${x + size - pad},${y + size - pad} ${x + pad},${y + size - pad}" fill="${fill}"/>`;
    case "diamond":
      return `<polygon points="${cx},${y + pad} ${x + size - pad},${cy} ${cx},${y + size - pad} ${x + pad},${cy}" fill="${fill}"/>`;
    case "star":
      return `<text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="${r}" fill="${fill}">★</text>`;
    case "plus":
      return `<text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="${r * 1.4}" fill="${fill}">＋</text>`;
    case "ring":
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${fill}" stroke-width="6"/>`;
    case "blank":
      return `<rect x="${x + pad}" y="${y + pad}" width="${size - 2 * pad}" height="${size - 2 * pad}" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6 4"/>`;
    case "q":
      return `<rect x="${x + pad}" y="${y + pad}" width="${size - 2 * pad}" height="${size - 2 * pad}" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/><text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="36" font-family="system-ui,sans-serif" fill="#334155">?</text>`;
    default:
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
  }
}

function matrixSvg(cells, cols = 2, rows = 2) {
  const margin = 16;
  const gap = 10;
  const size = 80;
  const w = margin * 2 + cols * size + (cols - 1) * gap;
  const h = margin * 2 + rows * size + (rows - 1) * gap;
  let inner = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x = margin + c * (size + gap);
      const y = margin + r * (size + gap);
      inner += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#fff" stroke="#cbd5e1" stroke-width="2" rx="6"/>`;
      inner += cell(x, y, size, cells[i] || "blank");
    }
  }
  return svgShell(inner, w, h);
}

function choiceSvg(kind, fill = "#1e293b") {
  const size = 96;
  const inner = `<rect x="8" y="8" width="80" height="80" fill="#fff" stroke="#cbd5e1" stroke-width="2" rx="8"/>${cell(8, 8, 80, kind, fill)}`;
  return svgShell(inner, size, size);
}

/** 16 PRI item blueprints: stem cells (last = missing '?'), correct choice kind, distractors. */
const CHILD_PRI = [
  { stem: ["circle", "circle", "circle", "q"], correct: "circle", wrong: ["square", "triangle", "diamond"], prompt: "右下角应填哪个图形？" },
  { stem: ["square", "circle", "square", "q"], correct: "circle", wrong: ["square", "triangle", "star"], prompt: "按交替规律，缺格是？" },
  { stem: ["triangle", "triangle", "triangle", "q"], correct: "triangle", wrong: ["circle", "square", "ring"], prompt: "哪一个能补全这一组？" },
  { stem: ["circle", "ring", "circle", "q"], correct: "ring", wrong: ["circle", "square", "plus"], prompt: "实心与空心交替，下一项是？" },
  { stem: ["diamond", "square", "diamond", "q"], correct: "square", wrong: ["diamond", "circle", "star"], prompt: "菱形与方形交替，缺的是？" },
  { stem: ["star", "star", "circle", "q"], correct: "circle", wrong: ["star", "triangle", "plus"], prompt: "最后一格应与第三格同类？" },
  { stem: ["plus", "circle", "plus", "q"], correct: "circle", wrong: ["plus", "square", "diamond"], prompt: "加号与圆点交替，缺格？" },
  { stem: ["square", "square", "triangle", "q"], correct: "triangle", wrong: ["square", "circle", "ring"], prompt: "两方一角再重复，缺的是？" },
  { stem: ["circle", "triangle", "square", "q"], correct: "diamond", wrong: ["circle", "triangle", "square"], prompt: "边数增加：圆→三角→方→？" },
  { stem: ["ring", "circle", "ring", "q"], correct: "circle", wrong: ["ring", "square", "star"], prompt: "空心与实心圆交替？" },
  { stem: ["triangle", "diamond", "triangle", "q"], correct: "diamond", wrong: ["triangle", "circle", "plus"], prompt: "三角与菱形交替？" },
  { stem: ["square", "ring", "square", "q"], correct: "ring", wrong: ["square", "circle", "star"], prompt: "方块与圆环交替？" },
  { stem: ["star", "plus", "star", "q"], correct: "plus", wrong: ["star", "circle", "square"], prompt: "星与加号交替？" },
  { stem: ["circle", "circle", "square", "square", "triangle", "q"], correct: "triangle", wrong: ["circle", "square", "diamond"], prompt: "成对出现：圆圆方方△△，缺？" , cols: 3, rows: 2 },
  { stem: ["diamond", "diamond", "diamond", "circle", "circle", "q"], correct: "circle", wrong: ["diamond", "triangle", "star"], prompt: "三个菱形后三个圆，缺？" , cols: 3, rows: 2 },
  { stem: ["plus", "ring", "star", "ring", "plus", "q"], correct: "star", wrong: ["plus", "ring", "circle"], prompt: "对称序列中间应是？" , cols: 3, rows: 2 },
];

const ADULT_PRI = [
  { stem: ["circle", "square", "square", "q"], correct: "circle", wrong: ["square", "triangle", "diamond"], prompt: "行列互补：缺格应取与对角同类？" },
  { stem: ["triangle", "circle", "circle", "q"], correct: "triangle", wrong: ["circle", "square", "ring"], prompt: "按对角相等规律，缺项是？" },
  { stem: ["ring", "ring", "diamond", "q"], correct: "diamond", wrong: ["ring", "circle", "plus"], prompt: "两环一菱重复，缺？" },
  { stem: ["square", "diamond", "square", "q"], correct: "diamond", wrong: ["square", "circle", "star"], prompt: "方块与菱形交替？" },
  { stem: ["plus", "plus", "star", "q"], correct: "star", wrong: ["plus", "circle", "triangle"], prompt: "两加一星，缺？" },
  { stem: ["circle", "triangle", "circle", "q"], correct: "triangle", wrong: ["circle", "square", "ring"], prompt: "圆与三角交替？" },
  { stem: ["diamond", "ring", "diamond", "q"], correct: "ring", wrong: ["diamond", "square", "plus"], prompt: "菱形与空心环交替？" },
  { stem: ["star", "square", "star", "q"], correct: "square", wrong: ["star", "circle", "triangle"], prompt: "星与方交替？" },
  { stem: ["triangle", "triangle", "ring", "q"], correct: "ring", wrong: ["triangle", "circle", "diamond"], prompt: "两三角一环，缺？" },
  { stem: ["circle", "plus", "square", "q"], correct: "diamond", wrong: ["circle", "plus", "square"], prompt: "复杂度递增：圆→加→方→？" },
  { stem: ["ring", "square", "ring", "q"], correct: "square", wrong: ["ring", "circle", "star"], prompt: "环与方交替？" },
  { stem: ["diamond", "diamond", "circle", "q"], correct: "circle", wrong: ["diamond", "triangle", "plus"], prompt: "两菱一圆，缺？" },
  { stem: ["plus", "triangle", "plus", "q"], correct: "triangle", wrong: ["plus", "circle", "square"], prompt: "加号与三角交替？" },
  { stem: ["circle", "square", "triangle", "square", "circle", "q"], correct: "triangle", wrong: ["circle", "square", "star"], prompt: "对称：圆方△方圆？", cols: 3, rows: 2 },
  { stem: ["star", "ring", "plus", "ring", "star", "q"], correct: "plus", wrong: ["star", "ring", "circle"], prompt: "对称序列：缺中间镜像？", cols: 3, rows: 2 },
  { stem: ["diamond", "circle", "square", "circle", "diamond", "q"], correct: "square", wrong: ["diamond", "circle", "triangle"], prompt: "对称矩阵缺格？", cols: 3, rows: 2 },
];

function writePriMedia(audience, blueprints) {
  const dir = path.join(root, "content", "packs", audience, "v1", "media");
  mkdirSync(dir, { recursive: true });
  const items = [];
  blueprints.forEach((bp, idx) => {
    const n = String(idx + 1).padStart(2, "0");
    const cols = bp.cols || 2;
    const rows = bp.rows || 2;
    const stemFile = `pri-${n}-stem.svg`;
    writeFileSync(path.join(dir, stemFile), matrixSvg(bp.stem, cols, rows));
    const labels = ["A", "B", "C", "D"];
    const kinds = [bp.correct, ...bp.wrong];
    const choiceMeta = kinds.map((kind, i) => {
      const file = `pri-${n}-${labels[i].toLowerCase()}.svg`;
      writeFileSync(path.join(dir, file), choiceSvg(kind));
      return {
        label: `选项 ${labels[i]}`,
        image: mediaUrl(audience, file),
        kind,
      };
    });
    // Keep answer as correct choice label (A is always authored as correct; shuffle remaps order)
    items.push({
      id: `${audience}-pri-${idx + 1}`,
      type: "mcq",
      prompt: bp.prompt,
      image: mediaUrl(audience, stemFile),
      choices: choiceMeta.map(({ label, image }) => ({ label, image })),
      answer: "选项 A",
      timeLimitMs: audience === "child" ? 60000 : 55000,
    });
  });
  return items;
}

const CHILD_VCI = [
  { prompt: "「雨伞」主要用来做什么？", answer: "挡住雨水", choices: ["挡住雨水", "切水果", "写字", "踢足球"], glyphs: ["傘", "刀", "筆", "球"] },
  { prompt: "「图书馆」是做什么的地方？", answer: "借阅图书", choices: ["借阅图书", "修车", "游泳", "烤蛋糕"], glyphs: ["書", "車", "泳", "糕"] },
  { prompt: "「早晨」通常发生在一天的什么时候？", answer: "刚起床、天刚亮", choices: ["刚起床、天刚亮", "半夜最黑时", "太阳落山后", "只在周末"], glyphs: ["晨", "夜", "暮", "休"] },
  { prompt: "「医生」和「护士」有什么共同点？", answer: "都在医院帮助病人", choices: ["都在医院帮助病人", "都会开飞机", "都只卖文具", "都不需要学习"], glyphs: ["醫", "機", "筆", "休"] },
  { prompt: "「吵闹」的反义词最接近？", answer: "安静", choices: ["安静", "巨大", "快速", "彩色"], glyphs: ["静", "大", "速", "彩"] },
  { prompt: "「钥匙」通常和什么一起使用？", answer: "锁", choices: ["锁", "枕头", "雨靴", "跳绳"], glyphs: ["鎖", "枕", "靴", "繩"] },
  { prompt: "「勇敢」最可能用来形容谁？", answer: "敢于尝试新事物的人", choices: ["敢于尝试新事物的人", "总是躲在角落的人", "只爱吃糖的人", "从不说话的人"], glyphs: ["勇", "躲", "糖", "默"] },
  { prompt: "「冬天」和「夏天」的关系最像？", answer: "白天和黑夜", choices: ["白天和黑夜", "铅笔和橡皮", "妈妈和孩子", "书和封面"], glyphs: ["↔", "工", "亲", "⊂"] },
  { prompt: "「节约」是什么意思？", answer: "不浪费、好好使用", choices: ["不浪费、好好使用", "全部扔掉", "越买越多", "从不分享"], glyphs: ["省", "弃", "购", "独"] },
  { prompt: "「邻居」通常住在哪里？", answer: "你家附近", choices: ["你家附近", "外太空", "海底火山", "只有动物园里"], glyphs: ["邻", "星", "海", "园"] },
  { prompt: "「透明」最接近下列哪一项？", answer: "能看得见对面", choices: ["能看得见对面", "完全听不见", "特别烫", "特别咸"], glyphs: ["透", "静", "热", "咸"] },
  { prompt: "「种子」长大后可能变成？", answer: "植物", choices: ["植物", "石头", "云朵", "橡皮"], glyphs: ["芽", "石", "云", "擦"] },
  { prompt: "「礼貌」的表现是？", answer: "说谢谢、请、对不起", choices: ["说谢谢、请、对不起", "推别人抢玩具", "大声打断别人", "从来不排队"], glyphs: ["礼", "抢", "吵", "队"] },
  { prompt: "「地图」主要帮助我们？", answer: "找到方向和位置", choices: ["找到方向和位置", "做饭", "刷牙", "量体温"], glyphs: ["图", "厨", "刷", "温"] },
  { prompt: "「果实」通常长在？", answer: "树上或植物上", choices: ["树上或植物上", "电脑里", "书包夹层", "只在夜里出现"], glyphs: ["果", "电", "包", "夜"] },
  { prompt: "「合作」是什么意思？", answer: "大家一起完成一件事", choices: ["大家一起完成一件事", "只顾自己", "互相隐瞒", "永远不说话"], glyphs: ["合", "己", "隐", "默"] },
];

const ADULT_VCI = [
  { prompt: "「隐喻」最接近下列哪一含义？", answer: "用一种事物暗示另一种事物", choices: ["用一种事物暗示另一种事物", "逐字翻译", "随机联想", "否定陈述"], glyphs: ["⇔", "≡", "?", "¬"] },
  { prompt: "「稀缺」与「充裕」的关系最接近？", answer: "反义", choices: ["反义", "同义", "因果", "整体与部分"], glyphs: ["↔", "=", "→", "⊂"] },
  { prompt: "「范式」在学术语境中通常指？", answer: "被广泛接受的研究框架或模式", choices: ["被广泛接受的研究框架或模式", "临时假设", "实验误差", "样本偏差"], glyphs: ["▣", "…", "±", "≠"] },
  { prompt: "「冗余」最接近？", answer: "多余、可精简的部分", choices: ["多余、可精简的部分", "核心必要部分", "随机噪声的同义词", "样本量的下限"], glyphs: ["余", "核", "噪", "n"] },
  { prompt: "「归纳」与「演绎」的关系最像？", answer: "自下而上与自上而下", choices: ["自下而上与自上而下", "同义反复", "加减运算", "左右对称"], glyphs: ["↕", "=", "+−", "⇔"] },
  { prompt: "「效度」主要关心？", answer: "是否测到了想测的构念", choices: ["是否测到了想测的构念", "仪器是否校准到零", "打印机分辨率", "网络延迟"], glyphs: ["✓", "0", "dpi", "ms"] },
  { prompt: "「信度」强调？", answer: "测量结果的一致性与稳定性", choices: ["测量结果的一致性与稳定性", "外观是否美观", "价格是否最低", "是否首次发表"], glyphs: ["≈", "美", "¥", "1st"] },
  { prompt: "「对照组」的作用是？", answer: "提供比较基线以估计效应", choices: ["提供比较基线以估计效应", "替换自变量", "删除所有异常值", "保证样本量无穷大"], glyphs: ["基", "替", "删", "∞"] },
  { prompt: "「混淆变量」可能导致？", answer: "因果解释被干扰", choices: ["因果解释被干扰", "字体自动放大", "电池耗电变慢", "键盘布局改变"], glyphs: ["混", "Aa", "电", "键"] },
  { prompt: "「操作性定义」是指？", answer: "用可观测程序界定概念", choices: ["用可观测程序界定概念", "词典里的文学释义", "口号式宣传语", "未经验证的传闻"], glyphs: ["操", "辞", "宣", "传"] },
  { prompt: "「天花板效应」描述？", answer: "题目过易导致分数挤在高端", choices: ["题目过易导致分数挤在高端", "房间真的没有天花板", "只测最低分被试", "永远无法完成测试"], glyphs: ["顶", "屋", "低", "∞"] },
  { prompt: "「地板效应」描述？", answer: "题目过难导致分数挤在低端", choices: ["题目过难导致分数挤在低端", "地板材质检测", "只奖励满分", "忽略时间限制"], glyphs: ["底", "材", "满分", "时"] },
  { prompt: "「常模」在测评中通常指？", answer: "参照群体的分数分布基准", choices: ["参照群体的分数分布基准", "试卷封面设计", "监考老师名单", "机房空调设定"], glyphs: ["范", "封", "名", "℃"] },
  { prompt: "「建构效度」关注？", answer: "分数与理论构念的符合程度", choices: ["分数与理论构念的符合程度", "装订是否牢固", "是否彩色印刷", "二维码能否扫描"], glyphs: ["构", "钉", "彩", "码"] },
  { prompt: "「生态效度」更强调？", answer: "结论推广到真实情境的程度", choices: ["结论推广到真实情境的程度", "实验室电压稳定", "显示器色域", "鼠标灵敏度"], glyphs: ["境", "V", "色", "dpi"] },
  { prompt: "「双盲」设计主要是为了？", answer: "减少期望效应与评估偏倚", choices: ["减少期望效应与评估偏倚", "加快打印速度", "节省仓储空间", "统一服装颜色"], glyphs: ["盲", "速", "仓", "衣"] },
];

function mcqItems(audience, indexTag, rows) {
  return rows.map((row, i) => ({
    id: `${audience}-${indexTag}-${i + 1}`,
    type: "mcq",
    prompt: row.prompt,
    choices: row.choices.map((label, j) => ({
      label,
      glyph: row.glyphs[j],
    })),
    answer: row.answer,
    timeLimitMs: audience === "child" ? 60000 : 55000,
  }));
}

function wmiItems(audience) {
  const forward =
    audience === "child"
      ? [
          [4, 7],
          [2, 9, 5],
          [8, 1, 6, 3],
          [5, 2, 9, 4, 7],
          [3, 8, 1, 6, 2, 9],
          [7, 4, 9, 1, 5, 8, 2],
          [6, 3, 8, 2, 9, 1, 5, 4],
          [9, 1, 4, 7, 2, 8, 3, 6, 5],
          [2, 8, 5, 1, 9, 4, 7, 3, 6, 0],
        ]
      : [
          [7, 1, 4],
          [3, 9, 2, 6],
          [5, 8, 1, 4, 7],
          [2, 6, 9, 3, 5, 1],
          [8, 4, 7, 1, 9, 2, 6],
          [9, 3, 6, 1, 8, 4, 2, 7],
          [1, 5, 9, 2, 8, 4, 7, 3, 6],
          [4, 8, 1, 6, 9, 2, 5, 7, 3, 0],
          [6, 2, 9, 4, 1, 8, 5, 3, 7, 0, 2],
        ];
  const backward =
    audience === "child"
      ? [
          [9, 2, 5],
          [4, 7, 1, 8],
          [3, 6, 2, 9, 5],
          [8, 1, 4, 7, 2, 6],
          [5, 9, 3, 1, 8, 4, 7],
          [2, 7, 4, 9, 1, 6, 3, 8],
          [6, 1, 8, 3, 9, 2, 5, 4, 7],
        ]
      : [
          [4, 8, 2, 9],
          [1, 6, 3, 9, 5],
          [7, 2, 8, 4, 1, 6],
          [5, 9, 1, 7, 3, 8, 2],
          [3, 8, 5, 1, 9, 4, 7, 2],
          [9, 4, 1, 6, 8, 2, 5, 3, 7],
          [2, 7, 4, 9, 1, 5, 8, 3, 6, 0],
        ];

  const items = [];
  let id = 1;
  for (const seq of forward) {
    const shown = seq.join("、");
    items.push({
      id: `${audience}-wmi-${id}`,
      type: "digit_span",
      prompt: `请按顺序复述这些数字：${shown}`,
      answer: seq.join("-"),
      timeLimitMs: 45000,
      encodeMs: 3000 + seq.length * 500,
      maskStem: true,
      ordered: true,
    });
    id += 1;
  }
  for (const seq of backward) {
    const shown = seq.join("、");
    const rev = [...seq].reverse().join("-");
    items.push({
      id: `${audience}-wmi-${id}`,
      type: "digit_span",
      prompt: `请倒序复述这些数字：${shown}（从后往前说）`,
      answer: rev,
      timeLimitMs: 45000,
      encodeMs: 3500 + seq.length * 500,
      maskStem: true,
      ordered: true,
    });
    id += 1;
  }
  return items;
}

/** Dispersed PSI keys — not nearly all 3. */
function psiItems(audience) {
  const child = [
    { prompt: "目标☆。在 ★☆●☆■ 中出现几次？", answer: 2 },
    { prompt: "目标△。在 △○△□△ 中出现几次？", answer: 3 },
    { prompt: "目标●。在 ■●▲○●○ 中出现几次？", answer: 2 },
    { prompt: "目标□。在 □△○☆■◇ 中出现几次？", answer: 1 },
    { prompt: "目标◇。在 ◇◆◇◇○◆◇ 中出现几次？", answer: 4 },
    { prompt: "目标＋。在 ×÷＝－＋ 中出现几次？", answer: 1 },
    { prompt: "目标▲。在 △▲▼◆△○▼ 中出现几次？", answer: 1 },
    { prompt: "目标○。在 ●○◎○●○◎○ 中出现几次？", answer: 4 },
    { prompt: "目标※。在 ※＊＃＊＃ 中出现几次？", answer: 1 },
    { prompt: "目标■。在 ■□■○■□▲■ 中出现几次？", answer: 4 },
    { prompt: "目标◆。在 ◇◆◇○◆◇◆ 中出现几次？", answer: 3 },
    { prompt: "目标◎。在 ○●◎○◎●○ 中出现几次？", answer: 2 },
    { prompt: "目标▼。在 ▲▼▲▼▼▲◆ 中出现几次？", answer: 3 },
    { prompt: "目标＃。在 ＊＃※＃＊※＃＃ 中出现几次？", answer: 4 },
    { prompt: "目标×。在 ＋×÷×＝×－× 中出现几次？", answer: 4 },
    { prompt: "目标★。在 ☆★☆●★☆■ 中出现几次？", answer: 2 },
  ];
  const adult = [
    { prompt: "目标 Σ。在 ΑΣΒΓΔΕ 中出现几次？", answer: 1 },
    { prompt: "目标 ≠。在 =≠≈≠≡≠∼≠ 中出现几次？", answer: 4 },
    { prompt: "目标 ∞。在 ∅∞∪∩⊂⊃ 中出现几次？", answer: 1 },
    { prompt: "目标 √。在 √π√e√2√φ√ 中出现几次？", answer: 5 },
    { prompt: "目标 ∴。在 ∵∴∵∴∵∴ 中出现几次？", answer: 3 },
    { prompt: "目标 ∂。在 ∇Δ∫∑∂ 中出现几次？", answer: 1 },
    { prompt: "目标 ∈。在 ⊂∈∪∈∩∈∅∈ 中出现几次？", answer: 4 },
    { prompt: "目标 ℵ。在 αβγδℵε 中出现几次？", answer: 1 },
    { prompt: "目标 ⊢。在 ⊨⊢⊥⊢⊤⊢∼⊢ 中出现几次？", answer: 4 },
    { prompt: "目标 ∀。在 ∃∀∃∀∃∀∀ 中出现几次？", answer: 4 },
    { prompt: "目标 ⊆。在 ⊂⊆⊂⊆⊆⊃ 中出现几次？", answer: 3 },
    { prompt: "目标 ∧。在 ∨∧∨∧∨∧∧ 中出现几次？", answer: 4 },
    { prompt: "目标 ⊥。在 ⊤⊥⊤⊥⊥⊤ 中出现几次？", answer: 3 },
    { prompt: "目标 ≈。在 =≈≠≈≡≈∼ 中出现几次？", answer: 3 },
    { prompt: "目标 Ω。在 αΩβΩγδΩ 中出现几次？", answer: 3 },
    { prompt: "目标 ∅。在 ∅∪∅∩∅⊂∅ 中出现几次？", answer: 4 },
  ];
  const rows = audience === "child" ? child : adult;
  return rows.map((row, i) => ({
    id: `${audience}-psi-${i + 1}`,
    type: "symbol_search",
    prompt: row.prompt,
    answer: row.answer,
    timeLimitMs: Math.max(18000, 32000 - i * 800),
  }));
}

function buildPack(audience, title) {
  const pri = writePriMedia(audience, audience === "child" ? CHILD_PRI : ADULT_PRI);
  return {
    id: `${audience}/v1`,
    audience,
    title,
    subtests: [
      {
        id: `${audience}-vci-vocab`,
        indexKey: "VCI",
        title: audience === "child" ? "词语理解" : "词汇与类比",
        items: mcqItems(audience, "vci", audience === "child" ? CHILD_VCI : ADULT_VCI),
      },
      {
        id: `${audience}-pri-matrix`,
        indexKey: "PRI",
        title: "图形推理",
        items: pri,
      },
      {
        id: `${audience}-wmi-digits`,
        indexKey: "WMI",
        title: "数字广度",
        ordered: true,
        items: wmiItems(audience),
      },
      {
        id: `${audience}-psi-symbols`,
        indexKey: "PSI",
        title: "符号搜索",
        items: psiItems(audience),
      },
    ],
  };
}

for (const [audience, title] of [
  ["child", "儿童标准测 v1"],
  ["adult", "成人标准测 v1"],
]) {
  const pack = buildPack(audience, title);
  const out = path.join(root, "content", "packs", audience, "v1", "manifest.json");
  writeFileSync(out, JSON.stringify(pack, null, 2) + "\n");
  const counts = Object.fromEntries(
    pack.subtests.map((s) => [s.indexKey, s.items.length]),
  );
  console.log(audience, counts, "total", pack.subtests.reduce((n, s) => n + s.items.length, 0));
}

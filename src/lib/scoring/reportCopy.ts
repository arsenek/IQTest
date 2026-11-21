import type { IndexKey } from "@/lib/content/types";

export const INDEX_LABELS: Record<IndexKey, string> = {
  VCI: "言语理解",
  PRI: "知觉推理",
  WMI: "工作记忆",
  PSI: "加工速度",
};

/** Short dual-core blurb shown on every report. */
export function dualCoreBlurb(audience: "child" | "adult"): string {
  if (audience === "child") {
    return "这次测评每个能力各有两关（例如词语 + 类比）。合成分把四项能力合在一起看；某一关弱，不代表孩子「不行」，只是提示可以多练练。";
  }
  return "本卷每个指数含两核分测验（如词汇与类比）。合成为四指数均值；剖面反映相对强弱，非诊断结论。";
}

export function indexExplain(
  key: IndexKey,
  audience: "child" | "adult",
): string {
  const child: Record<IndexKey, string> = {
    VCI: "听懂词语、类比和日常常识的能力。",
    PRI: "看图找规律、补全图形的能力。",
    WMI: "短时记住并按顺序或倒序复述信息的能力。",
    PSI: "又快又准地找出符号的能力。",
  };
  const adult: Record<IndexKey, string> = {
    VCI: "词汇、类比与言语推理相关表现。",
    PRI: "非言语视觉推理与序列补全表现。",
    WMI: "短时存储与操作序列信息的表现。",
    PSI: "在时限内完成符号扫描与配对的表现。",
  };
  return (audience === "child" ? child : adult)[key];
}

export function practiceCta(
  key: IndexKey,
  audience: "child" | "adult",
  highlight: boolean,
): string {
  const label = INDEX_LABELS[key];
  if (audience === "child") {
    return highlight
      ? `先练「${label}」练习室（不会改正式分）→`
      : `去「${label}」练习室玩一玩 →`;
  }
  return highlight
    ? `针对薄弱项「${label}」开始练习（不影响正式报告）→`
    : `打开「${label}」专项练习 →`;
}

export function narrativeParagraph(
  weakest: IndexKey,
  audience: "child" | "adult",
): string {
  const label = INDEX_LABELS[weakest];
  if (audience === "child") {
    return `家长看这里：相对更需要关注的是「${label}」。可以点下面高亮卡片，用独立练习题（和正式卷不是同一批题）轻松练几轮；练习星星不会改写这次正式分数。`;
  }
  return `相对薄弱指数为「${label}」。可进入对应练习室巩固；练习池与正式卷题目隔离，进度不回写合成分。`;
}

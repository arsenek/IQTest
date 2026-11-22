import type { IndexKey, ScoringStage } from "@/lib/content/types";

export const INDEX_LABELS: Record<IndexKey, string> = {
  VCI: "言语理解",
  PRI: "知觉推理",
  WMI: "工作记忆",
  PSI: "加工速度",
};

export function stageBadgeLabel(stage: ScoringStage): string {
  switch (stage) {
    case "calibrated":
      return "自研校准常模";
    case "standardized":
      return "标准化常模";
    case "trial":
    default:
      return "试运行";
  }
}

/** Primary composite score heading — trial keeps numbers but forbids IQ framing. */
export function compositeScoreLabel(stage: ScoringStage): string {
  switch (stage) {
    case "calibrated":
      return "自研校准综合能力分数";
    case "standardized":
      return "综合能力分数";
    case "trial":
    default:
      return "试运行综合能力分数（非正式 IQ）";
  }
}

export function compositeScoreHint(stage: ScoringStage): string {
  switch (stage) {
    case "calibrated":
      return "四指数均值 · 自研校准量表 · 非临床诊断";
    case "standardized":
      return "四指数均值 · 产品标准化常模 · 非临床诊断";
    case "trial":
    default:
      return "精确内部量表 · 四指数均值（MVP）· 非正式 IQ · 非全国百分位";
  }
}

/** Short dual-core blurb shown on every report. */
export function dualCoreBlurb(
  audience: "child" | "adult",
  stage: ScoringStage = "trial",
): string {
  if (stage === "trial") {
    if (audience === "child") {
      return "这次测评每个能力各有两关（例如词语 + 类比）。下面的数字是试运行能力分数（非正式 IQ），只反映相对强弱，不是已标准化智商，也不能当作诊断。";
    }
    return "本卷每个指数含两核分测验（如词汇与类比）。所示为试运行能力分数（非正式 IQ），剖面反映相对强弱，非标准化 IQ、非全国百分位、非诊断结论。";
  }

  if (audience === "child") {
    return "这次测评每个能力各有两关（例如词语 + 类比）。合成分把四项能力合在一起看；某一关弱，不代表孩子「不行」，只是提示可以多练练。结果不能替代专业评估。";
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
  stage: ScoringStage = "trial",
): string {
  const label = INDEX_LABELS[weakest];
  if (stage === "trial") {
    if (audience === "child") {
      return `家长看这里：相对更需要关注的是「${label}」。这些是试运行能力分数（非正式 IQ），不是已标准化智商或全国排名。可以点下面高亮卡片，用独立练习题轻松练几轮；练习不会改写这次分数。`;
    }
    return `相对薄弱指数为「${label}」。当前为试运行能力分数（非正式 IQ），不可解读为标准化 IQ、全国百分位或诊断。可进入对应练习室巩固；练习池与正式卷隔离，进度不回写合成分。`;
  }

  if (audience === "child") {
    return `家长看这里：相对更需要关注的是「${label}」。可以点下面高亮卡片，用独立练习题（和正式卷不是同一批题）轻松练几轮；练习星星不会改写这次正式分数。`;
  }
  return `相对薄弱指数为「${label}」。可进入对应练习室巩固；练习池与正式卷题目隔离，进度不回写合成分。`;
}

export function reportComplianceNote(stage: ScoringStage): string {
  if (stage === "trial") {
    return "合规提示：本站采用自研题库与占位常模（试运行）。报告中的分数是试运行能力分数（非正式 IQ），结构对齐韦氏四指数，但不是已标准化智商、不是全国百分位、非官方韦氏/WISC/WAIS，也不能替代专业心理或医学评估/诊断。儿童请在家长陪同下阅读与练习。练习不会回写正式分。";
  }
  return "合规提示：本站采用自研题库与常模，结构对齐韦氏四指数，非官方韦氏/WISC/WAIS；结果仅供参考，不能替代专业心理或医学评估。儿童请在家长陪同下阅读与练习。练习不会回写正式分。";
}

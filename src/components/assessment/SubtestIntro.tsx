"use client";

export type SubtestIntroProps = {
  audience: "child" | "adult";
  title: string;
  help: string;
  indexKey: string;
  onStart: () => void;
};

export function SubtestIntro({
  audience,
  title,
  help,
  indexKey,
  onStart,
}: SubtestIntroProps) {
  return (
    <div
      data-testid="subtest-intro"
      className="flex flex-1 flex-col items-center justify-center gap-6 rounded-[var(--assess-radius)] bg-[var(--assess-panel)] px-6 py-16 text-center shadow-[var(--assess-shadow)] md:px-10 md:py-20"
    >
      <p
        data-testid="subtest-intro-index"
        className="text-xs font-semibold tracking-[0.14em] text-[var(--assess-muted)] uppercase"
      >
        {indexKey}
      </p>
      <h2
        data-testid="subtest-intro-title"
        className="max-w-lg text-2xl font-semibold text-[var(--assess-fg)] md:text-3xl"
      >
        {title}
      </h2>
      <p
        data-testid="subtest-intro-help"
        className="max-w-md text-base leading-relaxed text-[var(--assess-muted)] md:text-lg"
      >
        {help}
      </p>
      <button
        type="button"
        data-testid="subtest-intro-start"
        onClick={onStart}
        className="min-h-12 rounded-[var(--assess-radius)] bg-[var(--assess-accent)] px-10 text-base font-semibold text-[var(--assess-accent-fg)] transition-transform duration-200 hover:brightness-105 active:scale-[0.98]"
      >
        {audience === "child" ? "开始这一关" : "开始本分测验"}
      </button>
    </div>
  );
}

/** One-line help copy by subtest id (audience-specific tone). */
export function helpForSubtest(
  subtestId: string,
  audience: "child" | "adult",
): string {
  const child: Record<string, string> = {
    "child-vci-vocab": "选一选词语的意思，像闯关一样认真想哦。",
    "child-vci-analogy": "找一找谁和谁更像，或生活里常见的小常识。",
    "child-pri-matrix": "看看缺了一块的图画，选出最合适的那一块。",
    "child-pri-sequence": "图形会排队出现，猜猜下一个是谁。",
    "child-wmi-digits": "先记住数字，遮住后按顺序说出来。",
    "child-wmi-reverse-short": "这次要从后往前说数字，慢慢来。",
    "child-psi-symbols": "在一串符号里数一数目标出现了几次。",
    "child-psi-pairing": "配对或快速数一数，看看你有多快。",
  };
  const adult: Record<string, string> = {
    "adult-vci-vocab": "根据题干选择最贴切的词义或关系。",
    "adult-vci-analogy": "完成类比推理或常识判断，选最合理的一项。",
    "adult-pri-matrix": "观察矩阵规律，选出补全缺格的图形。",
    "adult-pri-sequence": "根据序列规则选出下一项或补全项。",
    "adult-wmi-digits": "识记后按指定顺序复述数字序列。",
    "adult-wmi-reverse-short": "短梯反向广度：从后往前复述数字。",
    "adult-psi-symbols": "在限定时间内统计目标符号出现次数。",
    "adult-psi-pairing": "完成符号配对或计数扫描。",
  };
  const table = audience === "child" ? child : adult;
  return (
    table[subtestId] ??
    (audience === "child"
      ? "仔细看题，想清楚再选。"
      : "请阅读说明后开始作答。")
  );
}

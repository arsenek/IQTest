"use client";

import { useEffect, useState } from "react";

export const DEFAULT_BREAK_MS = 45_000;

export type SubtestBreakProps = {
  audience: "child" | "adult";
  completedTitle: string;
  nextTitle: string;
  durationMs?: number;
  onContinue: () => void;
  onSkip: () => void;
};

export function SubtestBreak({
  audience,
  completedTitle,
  nextTitle,
  durationMs = DEFAULT_BREAK_MS,
  onContinue,
  onSkip,
}: SubtestBreakProps) {
  const [remainingMs, setRemainingMs] = useState(durationMs);

  useEffect(() => {
    setRemainingMs(durationMs);
    const id = window.setInterval(() => {
      setRemainingMs((prev) => Math.max(0, prev - 250));
    }, 250);
    return () => window.clearInterval(id);
  }, [durationMs, completedTitle, nextTitle]);

  useEffect(() => {
    if (remainingMs === 0) onContinue();
  }, [remainingMs, onContinue]);

  const sec = Math.ceil(remainingMs / 1000);

  return (
    <div
      data-testid="subtest-break"
      className="flex flex-1 flex-col items-center justify-center gap-5 rounded-[var(--assess-radius)] border-2 border-dashed border-[var(--assess-border)] bg-[var(--assess-surface)] px-6 py-16 text-center"
    >
      <p className="text-xs font-semibold tracking-[0.12em] text-[var(--assess-muted)] uppercase">
        {audience === "child" ? "休息一下" : "可选休息"}
      </p>
      <h2
        data-testid="subtest-break-title"
        className="max-w-lg text-2xl font-semibold text-[var(--assess-fg)] md:text-3xl"
      >
        {audience === "child"
          ? `「${completedTitle}」完成啦`
          : `已完成：${completedTitle}`}
      </h2>
      <p className="max-w-md text-base text-[var(--assess-muted)] md:text-lg">
        {audience === "child"
          ? `接下来是「${nextTitle}」。可以歇一会儿，也可以马上继续。`
          : `下一部分：${nextTitle}。可短暂休息后继续，或立即跳过。`}
      </p>
      <p
        data-testid="subtest-break-timer"
        className="font-mono text-3xl font-semibold text-[var(--assess-fg)]"
        aria-live="polite"
      >
        {sec}s
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          data-testid="subtest-break-continue"
          onClick={onContinue}
          className="min-h-12 rounded-[var(--assess-radius)] bg-[var(--assess-accent)] px-8 font-semibold text-[var(--assess-accent-fg)]"
        >
          {audience === "child" ? "休息好了，继续" : "继续"}
        </button>
        <button
          type="button"
          data-testid="subtest-break-skip"
          onClick={onSkip}
          className="min-h-12 rounded-[var(--assess-radius)] border-2 border-[var(--assess-border)] bg-[var(--assess-panel)] px-8 font-medium text-[var(--assess-fg)]"
        >
          {audience === "child" ? "跳过休息" : "跳过"}
        </button>
      </div>
    </div>
  );
}

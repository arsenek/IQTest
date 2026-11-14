"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { McqItem, type ItemAnswer } from "@/components/items/McqItem";
import { DigitSpanItem } from "@/components/items/DigitSpanItem";
import { SymbolSearchItem } from "@/components/items/SymbolSearchItem";
import type { Choice, ItemType } from "@/lib/content/types";

export type ShellItem = {
  globalIndex: number;
  subtestId: string;
  indexKey: string;
  id: string;
  type: ItemType;
  prompt: string;
  image?: string;
  choices?: Choice[];
  timeLimitMs?: number;
  encodeMs?: number;
  maskStem?: boolean;
};

type AssessmentShellProps = {
  sessionId: string;
  audience: "child" | "adult";
  title: string;
  items: ShellItem[];
  initialIndex: number;
  initialStatus: "IN_PROGRESS" | "SUBMITTED" | "ABANDONED";
};

type Phase = "active" | "paused" | "submitting" | "done" | "error";

export function AssessmentShell({
  sessionId,
  audience,
  title,
  items,
  initialIndex,
  initialStatus,
}: AssessmentShellProps) {
  const router = useRouter();
  const [index, setIndex] = useState(initialIndex);
  const [phase, setPhase] = useState<Phase>(
    initialStatus === "SUBMITTED" ? "done" : "active",
  );
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const submittingRef = useRef(false);
  const budgetRef = useRef<number | null>(null);
  const timedOutRef = useRef(false);
  const pendingAnswerRef = useRef<ItemAnswer | null>(null);
  /** After answer POST succeeds but final submit fails, retry only submit. */
  const pendingSubmitOnlyRef = useRef(false);

  const total = items.length;
  const current = index < total ? items[index] : null;
  const progress = total === 0 ? 100 : Math.min(100, (index / total) * 100);

  // Reset per-item timer budget when the item changes.
  useEffect(() => {
    timedOutRef.current = false;
    if (!current?.timeLimitMs) {
      budgetRef.current = null;
      setRemainingMs(null);
      return;
    }
    budgetRef.current = current.timeLimitMs;
    setRemainingMs(current.timeLimitMs);
  }, [current?.id, current?.timeLimitMs]);

  // Tick only while active; pause freezes remainingMs.
  useEffect(() => {
    if (phase !== "active" || budgetRef.current == null) return;
    const tick = window.setInterval(() => {
      setRemainingMs((prev) => {
        if (prev === null) return prev;
        const next = Math.max(0, prev - 250);
        budgetRef.current = next;
        return next;
      });
    }, 250);
    return () => window.clearInterval(tick);
  }, [phase, current?.id]);

  const finishSubmit = useCallback(async (nextIndex: number) => {
    const submitRes = await fetch(`/api/sessions/${sessionId}/submit`, {
      method: "POST",
    });
    const submitData = (await submitRes.json()) as {
      error?: string;
      retryable?: boolean;
    };
    if (!submitRes.ok) {
      const err = new Error(submitData.error ?? "交卷失败");
      (err as Error & { retryable?: boolean }).retryable =
        submitData.retryable === true || submitRes.status >= 500;
      pendingSubmitOnlyRef.current = true;
      throw err;
    }
    pendingSubmitOnlyRef.current = false;
    pendingAnswerRef.current = null;
    setIndex(nextIndex);
    setPhase("done");
  }, [sessionId]);

  const submitAnswer = useCallback(
    async (answer: ItemAnswer) => {
      if (!current || submittingRef.current || phase === "paused") return;
      submittingRef.current = true;
      pendingAnswerRef.current = answer;
      pendingSubmitOnlyRef.current = false;
      setPhase("submitting");
      setError(null);
      setRetryable(false);
      const latencyMs = Math.max(0, Date.now() - startedAtRef.current);

      try {
        const res = await fetch(`/api/sessions/${sessionId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answer,
            latencyMs,
            itemId: current.id,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          done?: boolean;
          currentIndex?: number;
          retryable?: boolean;
          code?: string;
        };
        if (!res.ok) {
          const err = new Error(data.error ?? "提交作答失败");
          (err as Error & { retryable?: boolean }).retryable =
            data.retryable === true || res.status >= 500;
          throw err;
        }

        const nextIndex = data.currentIndex ?? index + 1;
        if (data.done || nextIndex >= total) {
          await finishSubmit(nextIndex);
          return;
        }

        pendingAnswerRef.current = null;
        setIndex(nextIndex);
        startedAtRef.current = Date.now();
        setPhase("active");
      } catch (err) {
        const retry =
          err instanceof Error &&
          (err as Error & { retryable?: boolean }).retryable === true;
        setRetryable(
          retry ||
            pendingAnswerRef.current != null ||
            pendingSubmitOnlyRef.current,
        );
        setError(err instanceof Error ? err.message : "网络错误，请重试");
        setPhase("error");
      } finally {
        submittingRef.current = false;
      }
    },
    [current, finishSubmit, index, phase, sessionId, total],
  );

  async function retryLastAnswer() {
    setError(null);
    setRetryable(false);
    if (pendingSubmitOnlyRef.current) {
      submittingRef.current = true;
      setPhase("submitting");
      try {
        await finishSubmit(Math.min(index + 1, total));
      } catch (err) {
        setRetryable(true);
        setError(err instanceof Error ? err.message : "交卷失败，请重试");
        setPhase("error");
      } finally {
        submittingRef.current = false;
      }
      return;
    }
    const pending = pendingAnswerRef.current;
    if (pending != null) {
      void submitAnswer(pending);
      return;
    }
    setPhase("active");
  }

  useEffect(() => {
    if (
      phase === "active" &&
      remainingMs === 0 &&
      current &&
      !timedOutRef.current
    ) {
      timedOutRef.current = true;
      const fallback: ItemAnswer =
        current.type === "symbol_search" ? -1 : "";
      void submitAnswer(fallback);
    }
  }, [remainingMs, phase, current, submitAnswer]);

  useEffect(() => {
    if (phase === "active") {
      startedAtRef.current = Date.now();
    }
  }, [phase, current?.id]);

  function togglePause() {
    if (phase === "paused") {
      setPhase("active");
      return;
    }
    if (phase === "active") {
      setPhase("paused");
    }
  }

  const skinClass = audience === "child" ? "skin-child" : "skin-adult";
  const busy = phase === "submitting";

  if (phase === "done") {
    return (
      <div
        data-testid="assess-done"
        className={`${skinClass} assess-root min-h-screen`}
      >
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold text-[var(--assess-fg)] md:text-4xl">
            测评已完成
          </h1>
          <p className="max-w-md text-base text-[var(--assess-muted)] md:text-lg">
            报告已生成，可查看四指数与薄弱项练习入口。
          </p>
          <button
            type="button"
            data-testid="view-report"
            onClick={() => router.push(`/report/${sessionId}`)}
            className="min-h-12 rounded-[var(--assess-radius)] bg-[var(--assess-accent)] px-8 text-base font-semibold text-[var(--assess-accent-fg)]"
          >
            查看报告
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className={`${skinClass} assess-root min-h-screen`}>
      <header className="border-b border-[var(--assess-border)] bg-[var(--assess-header)]">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8 lg:px-10">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-[var(--assess-muted)] uppercase">
              {audience === "child" ? "儿童标准测" : "成人标准测"}
            </p>
            <h1 className="truncate text-lg font-semibold text-[var(--assess-fg)] md:text-xl">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            {current?.timeLimitMs != null && remainingMs != null && (
              <div
                className="rounded-full bg-[var(--assess-surface)] px-4 py-2 font-mono text-sm font-semibold text-[var(--assess-fg)] md:text-base"
                aria-live="polite"
              >
                {formatMs(remainingMs)}
              </div>
            )}
            <button
              type="button"
              onClick={togglePause}
              disabled={busy || phase === "error"}
              className="min-h-11 min-w-24 rounded-[var(--assess-radius)] border-2 border-[var(--assess-border)] bg-[var(--assess-surface)] px-4 text-sm font-medium text-[var(--assess-fg)] disabled:opacity-50 md:min-h-12 md:text-base"
            >
              {phase === "paused" ? "继续" : "暂停"}
            </button>
          </div>
        </div>
        <div className="h-2 w-full bg-[var(--assess-track)]">
          <div
            className="h-full bg-[var(--assess-accent)] transition-[width] duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-10 lg:px-10">
        <div className="flex items-baseline justify-between gap-4 text-sm text-[var(--assess-muted)] md:text-base">
          <span>
            进度 {Math.min(index + 1, total)} / {total}
          </span>
          {current && (
            <span className="font-medium text-[var(--assess-fg)]">
              {current.indexKey}
            </span>
          )}
        </div>

        {phase === "paused" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-[var(--assess-radius)] border-2 border-dashed border-[var(--assess-border)] bg-[var(--assess-surface)] px-6 py-16 text-center">
            <p className="text-xl font-semibold text-[var(--assess-fg)] md:text-2xl">
              已暂停
            </p>
            <p className="text-[var(--assess-muted)]">休息好了再继续作答</p>
            <button
              type="button"
              onClick={togglePause}
              className="min-h-12 rounded-[var(--assess-radius)] bg-[var(--assess-accent)] px-8 font-semibold text-[var(--assess-accent-fg)]"
            >
              继续测评
            </button>
          </div>
        ) : current ? (
          <div
            key={current.id}
            className="rounded-[var(--assess-radius)] bg-[var(--assess-panel)] p-5 shadow-[var(--assess-shadow)] md:p-8 lg:p-10"
          >
            {current.type === "mcq" && current.choices && (
              <McqItem
                prompt={current.prompt}
                image={current.image}
                choices={current.choices}
                disabled={busy}
                onAnswer={submitAnswer}
              />
            )}
            {current.type === "digit_span" && (
              <DigitSpanItem
                prompt={current.prompt}
                disabled={busy}
                encodeMs={current.encodeMs}
                maskStem={current.maskStem}
                onAnswer={submitAnswer}
              />
            )}
            {current.type === "symbol_search" && (
              <SymbolSearchItem
                prompt={current.prompt}
                disabled={busy}
                onAnswer={submitAnswer}
              />
            )}
          </div>
        ) : (
          <p className="text-[var(--assess-muted)]">没有更多题目</p>
        )}

        {error && (
          <div
            data-testid="assess-error"
            className="rounded-[var(--assess-radius)] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <p>{error}</p>
            <p className="mt-1 text-xs text-red-700/80">
              {retryable
                ? "作答可能尚未写入；可立即重试，刷新页面也会从服务端进度续测。"
                : "可返回题目后重新作答，或刷新页面从已保存进度继续。"}
            </p>
            <button
              type="button"
              data-testid="assess-retry"
              className="mt-2 underline"
              onClick={retryLastAnswer}
            >
              {retryable ? "重试保存" : "继续作答"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function formatMs(ms: number): string {
  const sec = Math.ceil(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { McqItem, type ItemAnswer } from "@/components/items/McqItem";
import { DigitSpanItem } from "@/components/items/DigitSpanItem";
import { SymbolSearchItem } from "@/components/items/SymbolSearchItem";
import type { PracticeItem } from "@/lib/practice/run";
import type { IndexKey } from "@/lib/content/types";

const INDEX_LABELS: Record<IndexKey, string> = {
  VCI: "言语理解",
  PRI: "知觉推理",
  WMI: "工作记忆",
  PSI: "加工速度",
};

type PracticeRoomProps = {
  indexKey: IndexKey;
  profileId: string;
  reportSessionId?: string;
  items: PracticeItem[];
  audience?: "child" | "adult";
};

type LocalAnswer = { itemId: string; answer: ItemAnswer };

export function PracticeRoom({
  indexKey,
  profileId,
  reportSessionId,
  items,
  audience = "child",
}: PracticeRoomProps) {
  const skinClass = audience === "child" ? "skin-child" : "skin-adult";
  const [cursor, setCursor] = useState(0);
  const [answers, setAnswers] = useState<LocalAnswer[]>([]);
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(
    null,
  );
  const [stars, setStars] = useState(0);
  const [phase, setPhase] = useState<"ready" | "active" | "done" | "error">(
    "ready",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const current = items[cursor] ?? null;
  const progressLabel = useMemo(
    () => `${Math.min(cursor + 1, items.length)} / ${items.length}`,
    [cursor, items.length],
  );

  async function ensureSession(): Promise<string> {
    if (practiceSessionId) return practiceSessionId;
    const res = await fetch("/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        profileId,
        indexKey,
      }),
    });
    const data = (await res.json()) as {
      error?: string;
      session?: { id: string };
    };
    if (!res.ok || !data.session) {
      throw new Error(data.error ?? "无法开始练习");
    }
    setPracticeSessionId(data.session.id);
    return data.session.id;
  }

  async function start() {
    setBusy(true);
    setMessage(null);
    try {
      await ensureSession();
      setPhase("active");
      setCursor(0);
      setAnswers([]);
    } catch (err) {
      setPhase("error");
      setMessage(err instanceof Error ? err.message : "开始失败");
    } finally {
      setBusy(false);
    }
  }

  async function onAnswer(answer: ItemAnswer) {
    if (!current || busy) return;
    const nextAnswers = [...answers, { itemId: current.id, answer }];
    setAnswers(nextAnswers);

    if (cursor + 1 < items.length) {
      setCursor(cursor + 1);
      return;
    }

    setBusy(true);
    try {
      const sid = await ensureSession();
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "progress",
          practiceSessionId: sid,
          answers: nextAnswers,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        starsEarned?: number;
        correct?: number;
        progress?: { stars: number };
      };
      if (!res.ok) {
        throw new Error(data.error ?? "记录练习失败");
      }
      setStars(data.progress?.stars ?? data.starsEarned ?? 0);
      setMessage(
        `本轮答对 ${data.correct ?? 0}/${items.length}，获得 ${data.starsEarned ?? 0} 星`,
      );
      setPhase("done");
    } catch (err) {
      setPhase("error");
      setMessage(err instanceof Error ? err.message : "提交失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${skinClass} assess-root min-h-screen`}>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 md:px-8 md:py-14">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium text-[var(--assess-muted)]">
            专项练习室
          </p>
          <h1 className="text-3xl font-semibold text-[var(--assess-fg)] md:text-4xl">
            {INDEX_LABELS[indexKey]}（{indexKey}）
          </h1>
          <p className="text-sm text-[var(--assess-muted)] md:text-base">
            练习分只写入练习进度，不会改写正式报告分数。
          </p>
        </header>

        {phase === "ready" && (
          <div className="rounded-[var(--assess-radius)] border-2 border-[var(--assess-border)] bg-[var(--assess-panel)] p-6 shadow-[var(--assess-shadow)] md:p-8">
            <p className="text-base text-[var(--assess-muted)]">
              本轮 {items.length} 题，完成后结算星星。
            </p>
            <button
              type="button"
              data-testid="practice-start"
              disabled={busy || items.length === 0}
              onClick={() => void start()}
              className="mt-6 min-h-12 rounded-[var(--assess-radius)] bg-[var(--assess-accent)] px-6 font-semibold text-[var(--assess-accent-fg)] disabled:opacity-50"
            >
              开始练习
            </button>
          </div>
        )}

        {phase === "active" && current && (
          <div className="rounded-[var(--assess-radius)] border-2 border-[var(--assess-border)] bg-[var(--assess-panel)] p-5 shadow-[var(--assess-shadow)] md:p-8">
            <div className="mb-4 flex justify-between text-sm text-[var(--assess-muted)]">
              <span>进度 {progressLabel}</span>
              <span>即时反馈局</span>
            </div>
            {current.type === "mcq" && current.choices && (
              <McqItem
                prompt={current.prompt}
                choices={current.choices}
                disabled={busy}
                onAnswer={onAnswer}
              />
            )}
            {current.type === "digit_span" && (
              <DigitSpanItem
                prompt={current.prompt}
                disabled={busy}
                encodeMs={current.encodeMs}
                maskStem={current.maskStem}
                onAnswer={onAnswer}
              />
            )}
            {current.type === "symbol_search" && (
              <SymbolSearchItem
                prompt={current.prompt}
                disabled={busy}
                onAnswer={onAnswer}
              />
            )}
          </div>
        )}

        {phase === "done" && (
          <div
            data-testid="practice-done"
            className="rounded-[var(--assess-radius)] border-2 border-[var(--assess-border)] bg-[var(--assess-panel)] p-6 text-center shadow-[var(--assess-shadow)] md:p-8"
          >
            <p className="text-4xl" aria-label={`${stars} 星`}>
              {"★".repeat(Math.min(3, stars)) || "☆"}
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--assess-fg)]">
              练习完成
            </p>
            {message && (
              <p className="mt-2 text-[var(--assess-muted)]">{message}</p>
            )}
            <p className="mt-1 text-sm text-[var(--assess-muted)]">
              累计星星：{stars}
            </p>
            <button
              type="button"
              className="mt-6 min-h-11 rounded-[var(--assess-radius)] border-2 border-[var(--assess-border)] bg-[var(--assess-surface)] px-5 text-sm font-medium text-[var(--assess-fg)]"
              onClick={() => {
                setPhase("ready");
                setMessage(null);
              }}
            >
              再练一轮
            </button>
          </div>
        )}

        {(phase === "error" || message) && phase !== "done" && (
          <p className="text-sm text-red-700">{message}</p>
        )}

        <div className="flex flex-wrap gap-4 text-sm">
          {reportSessionId && (
            <Link
              href={`/report/${reportSessionId}`}
              className="text-[var(--assess-muted)] underline-offset-2 hover:underline"
            >
              返回报告
            </Link>
          )}
          <Link
            href="/"
            className="text-[var(--assess-muted)] underline-offset-2 hover:underline"
          >
            首页
          </Link>
        </div>
      </main>
    </div>
  );
}

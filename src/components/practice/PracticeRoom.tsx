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
};

type LocalAnswer = { itemId: string; answer: ItemAnswer };

export function PracticeRoom({
  indexKey,
  profileId,
  reportSessionId,
  items,
}: PracticeRoomProps) {
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 md:px-8 md:py-14">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium text-zinc-500">专项练习室</p>
          <h1 className="text-3xl font-semibold md:text-4xl">
            {INDEX_LABELS[indexKey]}（{indexKey}）
          </h1>
          <p className="text-sm text-zinc-500 md:text-base">
            练习分只写入练习进度，不会改写正式报告分数。
          </p>
        </header>

        {phase === "ready" && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
            <p className="text-base text-zinc-600">
              本轮 {items.length} 题，完成后结算星星。
            </p>
            <button
              type="button"
              disabled={busy || items.length === 0}
              onClick={() => void start()}
              className="mt-6 min-h-12 rounded-xl bg-zinc-900 px-6 font-semibold text-white disabled:opacity-50"
            >
              开始练习
            </button>
          </div>
        )}

        {phase === "active" && current && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-8">
            <div className="mb-4 flex justify-between text-sm text-zinc-500">
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
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center md:p-8">
            <p className="text-4xl" aria-label={`${stars} 星`}>
              {"★".repeat(Math.min(3, stars)) || "☆"}
            </p>
            <p className="mt-3 text-lg font-semibold">练习完成</p>
            {message && <p className="mt-2 text-zinc-600">{message}</p>}
            <p className="mt-1 text-sm text-zinc-500">累计星星：{stars}</p>
            <button
              type="button"
              className="mt-6 min-h-11 rounded-xl border border-zinc-300 px-5 text-sm font-medium"
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
              className="text-zinc-500 underline-offset-2 hover:underline"
            >
              返回报告
            </Link>
          )}
          <Link href="/" className="text-zinc-500 underline-offset-2 hover:underline">
            首页
          </Link>
        </div>
      </main>
    </div>
  );
}

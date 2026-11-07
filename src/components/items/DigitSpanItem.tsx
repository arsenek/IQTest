"use client";

import { useEffect, useState } from "react";
import {
  canAnswerMemoryMask,
  createMemoryMaskState,
  isStemMasked,
  tickMemoryMask,
  type MemoryMaskState,
} from "@/lib/items/memoryMask";
import type { ItemAnswer } from "./McqItem";
import { ItemCard } from "./ItemCard";

type DigitSpanItemProps = {
  prompt: string;
  disabled?: boolean;
  paused?: boolean;
  encodeMs?: number;
  maskStem?: boolean;
  onAnswer: (answer: ItemAnswer) => void;
};

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function DigitSpanItem({
  prompt,
  disabled = false,
  paused = false,
  encodeMs,
  maskStem = false,
  onAnswer,
}: DigitSpanItemProps) {
  const [digits, setDigits] = useState<string[]>([]);
  const [maskState, setMaskState] = useState<MemoryMaskState>(() =>
    createMemoryMaskState({ encodeMs, maskStem }),
  );
  const encodeTotal =
    typeof encodeMs === "number" && encodeMs > 0 ? encodeMs : null;

  // Reset flow when the item identity / config changes.
  useEffect(() => {
    setDigits([]);
    setMaskState(createMemoryMaskState({ encodeMs, maskStem }));
  }, [prompt, encodeMs, maskStem]);

  // Encode countdown; frozen while paused.
  useEffect(() => {
    if (paused || maskState.phase !== "encoding") return;
    const id = window.setInterval(() => {
      setMaskState((prev) => tickMemoryMask(prev, 100));
    }, 100);
    return () => window.clearInterval(id);
  }, [paused, maskState.phase, prompt]);

  const answering = canAnswerMemoryMask(maskState);
  const stemMasked = isStemMasked(maskState);
  const inputLocked = disabled || !answering;

  function pushDigit(d: string) {
    if (inputLocked) return;
    setDigits((prev) => (prev.length >= 12 ? prev : [...prev, d]));
  }

  function backspace() {
    if (inputLocked) return;
    setDigits((prev) => prev.slice(0, -1));
  }

  function submit() {
    if (inputLocked || digits.length === 0) return;
    onAnswer(digits.join("-"));
  }

  return (
    <ItemCard
      data-testid="item-digit-span"
      stemMasked={stemMasked}
      maskLabel="题干已遮盖，请凭记忆输入"
      timerMs={
        maskState.phase === "encoding" ? maskState.remainingEncodeMs : null
      }
      timerTotalMs={encodeTotal}
      timerLabel="请记住数字"
      stem={
        <p className="text-lg leading-relaxed font-medium text-[var(--assess-fg)] md:text-xl lg:text-2xl">
          {prompt}
        </p>
      }
    >
      {answering ? (
        <>
          <div
            className="min-h-14 rounded-[var(--card-radius)] border-2 border-dashed border-[var(--card-border)] bg-[var(--card-choice-bg)] px-4 py-3 text-center font-mono text-2xl tracking-widest text-[var(--assess-fg)] shadow-[var(--card-shadow)] md:min-h-16 md:text-3xl"
            aria-live="polite"
          >
            {digits.length > 0 ? digits.join(" · ") : "点按数字作答"}
          </div>
          <div className="mx-auto grid w-full max-w-md grid-cols-3 gap-3 md:max-w-lg md:gap-4">
            {DIGITS.map((d) => (
              <button
                key={d}
                type="button"
                disabled={inputLocked}
                onClick={() => pushDigit(d)}
                className="choice-card min-h-14 rounded-[var(--card-radius)] border-2 border-[var(--card-border)] bg-[var(--card-choice-bg)] text-xl font-semibold text-[var(--assess-fg)] shadow-[var(--card-shadow)] transition hover:border-[var(--assess-accent)] hover:bg-[var(--assess-accent-soft)] disabled:opacity-50 md:min-h-16 md:text-2xl"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              disabled={inputLocked}
              onClick={backspace}
              className="min-h-14 rounded-[var(--card-radius)] border-2 border-[var(--card-border)] bg-[var(--card-choice-bg)] text-base font-medium text-[var(--assess-muted)] shadow-[var(--card-shadow)] disabled:opacity-50 md:min-h-16"
            >
              删除
            </button>
            <button
              type="button"
              data-testid="digit-span-submit"
              disabled={inputLocked || digits.length === 0}
              onClick={submit}
              className="col-span-2 min-h-14 rounded-[var(--card-radius)] bg-[var(--assess-accent)] text-base font-semibold text-[var(--assess-accent-fg)] shadow-[var(--card-shadow-active)] transition hover:opacity-90 disabled:opacity-50 md:min-h-16 md:text-lg"
            >
              确认
            </button>
          </div>
        </>
      ) : (
        <p
          data-testid="digit-span-encoding"
          className="rounded-[var(--card-radius)] border-2 border-dashed border-[var(--card-border)] bg-[var(--card-choice-bg)] px-4 py-8 text-center text-base text-[var(--assess-muted)] md:text-lg"
        >
          记住题干中的数字，倒计时结束后再作答
        </p>
      )}
    </ItemCard>
  );
}

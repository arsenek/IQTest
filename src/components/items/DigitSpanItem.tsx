"use client";

import { useState } from "react";
import type { ItemAnswer } from "./McqItem";

type DigitSpanItemProps = {
  prompt: string;
  disabled?: boolean;
  onAnswer: (answer: ItemAnswer) => void;
};

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function DigitSpanItem({
  prompt,
  disabled = false,
  onAnswer,
}: DigitSpanItemProps) {
  const [digits, setDigits] = useState<string[]>([]);

  function pushDigit(d: string) {
    if (disabled) return;
    setDigits((prev) => (prev.length >= 12 ? prev : [...prev, d]));
  }

  function backspace() {
    if (disabled) return;
    setDigits((prev) => prev.slice(0, -1));
  }

  function submit() {
    if (disabled || digits.length === 0) return;
    onAnswer(digits.join("-"));
  }

  return (
    <div
      data-testid="item-digit-span"
      className="flex w-full flex-col gap-5 md:gap-6"
    >
      <p className="text-lg leading-relaxed font-medium text-[var(--assess-fg)] md:text-xl lg:text-2xl">
        {prompt}
      </p>
      <div
        className="min-h-14 rounded-[var(--assess-radius)] border-2 border-dashed border-[var(--assess-border)] bg-[var(--assess-surface)] px-4 py-3 text-center font-mono text-2xl tracking-widest text-[var(--assess-fg)] md:min-h-16 md:text-3xl"
        aria-live="polite"
      >
        {digits.length > 0 ? digits.join(" · ") : "点按数字作答"}
      </div>
      <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-3 md:max-w-md md:gap-4">
        {DIGITS.map((d) => (
          <button
            key={d}
            type="button"
            disabled={disabled}
            onClick={() => pushDigit(d)}
            className="min-h-14 rounded-[var(--assess-radius)] border-2 border-[var(--assess-border)] bg-[var(--assess-surface)] text-xl font-semibold text-[var(--assess-fg)] transition hover:border-[var(--assess-accent)] hover:bg-[var(--assess-accent-soft)] disabled:opacity-50 md:min-h-16 md:text-2xl"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={backspace}
          className="min-h-14 rounded-[var(--assess-radius)] border-2 border-[var(--assess-border)] bg-[var(--assess-surface)] text-base font-medium text-[var(--assess-muted)] disabled:opacity-50 md:min-h-16"
        >
          删除
        </button>
        <button
          type="button"
          data-testid="digit-span-submit"
          disabled={disabled || digits.length === 0}
          onClick={submit}
          className="col-span-2 min-h-14 rounded-[var(--assess-radius)] bg-[var(--assess-accent)] text-base font-semibold text-[var(--assess-accent-fg)] transition hover:opacity-90 disabled:opacity-50 md:min-h-16 md:text-lg"
        >
          确认
        </button>
      </div>
    </div>
  );
}

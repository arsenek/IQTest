"use client";

import { useState } from "react";
import type { ItemAnswer } from "./McqItem";

type SymbolSearchItemProps = {
  prompt: string;
  disabled?: boolean;
  onAnswer: (answer: ItemAnswer) => void;
};

const COUNTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function SymbolSearchItem({
  prompt,
  disabled = false,
  onAnswer,
}: SymbolSearchItemProps) {
  const [selected, setSelected] = useState<number | null>(null);

  function submit() {
    if (disabled || selected === null) return;
    onAnswer(selected);
  }

  return (
    <div className="flex w-full flex-col gap-5 md:gap-6">
      <p className="text-lg leading-relaxed font-medium text-[var(--assess-fg)] md:text-xl lg:text-2xl">
        {prompt}
      </p>
      <p className="text-sm text-[var(--assess-muted)] md:text-base">
        目标符号在序列中出现了几次？
      </p>
      <div className="grid grid-cols-5 gap-2 sm:gap-3 md:max-w-xl md:gap-4">
        {COUNTS.map((n) => {
          const active = selected === n;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => setSelected(n)}
              className={`min-h-14 rounded-[var(--assess-radius)] border-2 text-xl font-semibold transition disabled:opacity-50 md:min-h-16 md:text-2xl ${
                active
                  ? "border-[var(--assess-accent)] bg-[var(--assess-accent)] text-[var(--assess-accent-fg)]"
                  : "border-[var(--assess-border)] bg-[var(--assess-surface)] text-[var(--assess-fg)] hover:border-[var(--assess-accent)] hover:bg-[var(--assess-accent-soft)]"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={disabled || selected === null}
        onClick={submit}
        className="min-h-14 w-full max-w-md rounded-[var(--assess-radius)] bg-[var(--assess-accent)] px-6 text-base font-semibold text-[var(--assess-accent-fg)] transition hover:opacity-90 disabled:opacity-50 md:min-h-16 md:text-lg"
      >
        确认
      </button>
    </div>
  );
}

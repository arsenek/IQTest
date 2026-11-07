"use client";

import { useState } from "react";
import type { ItemAnswer } from "./McqItem";
import { ChoiceCardButton, ItemCard } from "./ItemCard";

type SymbolSearchItemProps = {
  prompt: string;
  disabled?: boolean;
  onAnswer: (answer: ItemAnswer) => void;
};

const COUNTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/** Pull target + sequence glyphs from Chinese prompt fixtures when present. */
export function parseSymbolPrompt(prompt: string): {
  target?: string;
  sequence: string[];
} {
  const targetMatch = prompt.match(/目标\s*([^\s。．.]+)/);
  const seqMatch = prompt.match(/在\s*(.+?)\s*中/);
  const target = targetMatch?.[1]?.trim();
  const sequence = seqMatch?.[1]
    ? Array.from(seqMatch[1].replace(/\s+/g, ""))
    : [];
  return { target, sequence };
}

export function SymbolSearchItem({
  prompt,
  disabled = false,
  onAnswer,
}: SymbolSearchItemProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const { target, sequence } = parseSymbolPrompt(prompt);

  function submit() {
    if (disabled || selected === null) return;
    onAnswer(selected);
  }

  return (
    <ItemCard
      data-testid="item-symbol-search"
      stem={
        <div className="flex flex-col gap-4">
          <p className="text-lg leading-relaxed font-medium text-[var(--assess-fg)] md:text-xl lg:text-2xl">
            {prompt}
          </p>
          {(target || sequence.length > 0) && (
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              {target && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-medium tracking-wide text-[var(--assess-muted)] uppercase">
                    目标
                  </span>
                  <span className="choice-card-glyph flex h-14 w-14 items-center justify-center rounded-[var(--card-radius)] border-2 border-[var(--assess-accent)] bg-[var(--card-glyph-bg)] text-3xl shadow-[var(--card-shadow)] md:h-16 md:w-16 md:text-4xl">
                    {target}
                  </span>
                </div>
              )}
              {sequence.length > 0 && (
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-xs font-medium tracking-wide text-[var(--assess-muted)] uppercase">
                    序列
                  </span>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {sequence.map((g, i) => (
                      <span
                        key={`${g}-${i}`}
                        className="flex h-12 w-12 items-center justify-center rounded-[calc(var(--card-radius)-0.25rem)] border-2 border-[var(--card-border)] bg-[var(--card-choice-bg)] text-2xl shadow-[var(--card-shadow)] md:h-14 md:w-14 md:text-3xl"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      }
    >
      <p className="mb-3 text-sm text-[var(--assess-muted)] md:text-base">
        目标符号在序列中出现了几次？
      </p>
      <div className="grid grid-cols-5 gap-2 sm:gap-3 md:max-w-2xl md:gap-4">
        {COUNTS.map((n) => (
          <ChoiceCardButton
            key={n}
            label={String(n)}
            selected={selected === n}
            disabled={disabled}
            onClick={() => setSelected(n)}
            testId={`symbol-count-${n}`}
          />
        ))}
      </div>
      <button
        type="button"
        data-testid="symbol-search-submit"
        disabled={disabled || selected === null}
        onClick={submit}
        className="mt-4 min-h-14 w-full max-w-md rounded-[var(--card-radius)] bg-[var(--assess-accent)] px-6 text-base font-semibold text-[var(--assess-accent-fg)] shadow-[var(--card-shadow-active)] transition hover:opacity-90 disabled:opacity-50 md:min-h-16 md:text-lg"
      >
        确认
      </button>
    </ItemCard>
  );
}

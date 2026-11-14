"use client";

import type { ReactNode } from "react";

type ItemCardProps = {
  /** Stem / prompt content (text or graphical sequence). */
  stem: ReactNode;
  /** When true, stem is covered by a memory mask. */
  stemMasked?: boolean;
  /** Mask helper copy shown over the stem. */
  maskLabel?: string;
  /** Encode / item countdown remaining (ms). */
  timerMs?: number | null;
  /** Total encode budget for progress bar (ms). */
  timerTotalMs?: number | null;
  /** Timer label, e.g. "记忆中". */
  timerLabel?: string;
  /** Choices / answer controls. */
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
};

/**
 * Shared assessment item shell: stem area, optional timer bar, choices area.
 * Visual chrome comes from `.skin-child` / `.skin-adult` CSS variables.
 */
export function ItemCard({
  stem,
  stemMasked = false,
  maskLabel = "请凭记忆作答",
  timerMs = null,
  timerTotalMs = null,
  timerLabel,
  children,
  className = "",
  "data-testid": testId,
}: ItemCardProps) {
  const showTimer =
    timerMs != null && timerTotalMs != null && timerTotalMs > 0;
  const timerRatio = showTimer
    ? Math.max(0, Math.min(1, timerMs / timerTotalMs))
    : 0;

  return (
    <div
      data-testid={testId}
      className={`item-card flex w-full flex-col gap-5 md:gap-6 ${className}`}
    >
      <div
        className={`item-card-stem relative overflow-hidden rounded-[var(--card-radius)] border-2 border-[var(--card-border)] p-5 shadow-[var(--card-shadow)] md:p-7 lg:p-8 ${
          stemMasked ? "item-card-stem--masked" : ""
        }`}
      >
        <div
          className={`item-card-stem-body transition-opacity duration-300 ${
            stemMasked ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          aria-hidden={stemMasked}
        >
          {stem}
        </div>
        {stemMasked && (
          <div
            data-testid="item-stem-mask"
            className="item-card-mask absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--card-mask-bg)] px-4 text-center"
            role="status"
          >
            <span className="item-card-mask-glyph text-3xl md:text-4xl" aria-hidden>
              ░
            </span>
            <p className="text-base font-semibold text-[var(--assess-fg)] md:text-lg">
              {maskLabel}
            </p>
          </div>
        )}
      </div>

      {showTimer && (
        <div
          className="item-card-timer flex flex-col gap-2"
          data-testid="item-encode-timer"
        >
          <div className="flex items-center justify-between text-sm text-[var(--assess-muted)] md:text-base">
            <span>{timerLabel ?? "倒计时"}</span>
            <span className="font-mono font-semibold text-[var(--assess-fg)]">
              {formatEncodeMs(timerMs)}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--card-timer-track)] md:h-3">
            <div
              className="h-full rounded-full bg-[var(--card-timer-fill)] transition-[width] duration-200 ease-linear"
              style={{ width: `${timerRatio * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="item-card-choices">{children}</div>
    </div>
  );
}

export function ChoiceCardButton({
  label,
  glyph,
  image,
  selected = false,
  disabled = false,
  onClick,
  testId = "mcq-choice",
}: {
  label: string;
  glyph?: string;
  image?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={`choice-card flex min-h-[4.5rem] flex-col items-center justify-center gap-2 rounded-[var(--card-radius)] border-2 px-4 py-4 text-center transition md:min-h-[5.5rem] md:gap-3 md:px-5 md:py-5 ${
        selected
          ? "border-[var(--assess-accent)] bg-[var(--assess-accent)] text-[var(--assess-accent-fg)] shadow-[var(--card-shadow-active)]"
          : "border-[var(--card-border)] bg-[var(--card-choice-bg)] text-[var(--assess-fg)] shadow-[var(--card-shadow)] hover:border-[var(--assess-accent)] hover:bg-[var(--assess-accent-soft)]"
      } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--assess-accent)] disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {(glyph || image) && (
        <span
          className="choice-card-glyph flex h-12 w-12 items-center justify-center rounded-[calc(var(--card-radius)-0.35rem)] bg-[var(--card-glyph-bg)] text-2xl md:h-14 md:w-14 md:text-3xl"
          aria-hidden={Boolean(glyph)}
        >
          {image ? (
            // Decorative content glyph/image from pack fixtures.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="h-14 w-14 object-contain md:h-16 md:w-16"
            />
          ) : (
            glyph
          )}
        </span>
      )}
      <span className="text-base font-medium leading-snug md:text-lg">{label}</span>
    </button>
  );
}

function formatEncodeMs(ms: number): string {
  const sec = Math.ceil(ms / 1000);
  return `${sec}s`;
}

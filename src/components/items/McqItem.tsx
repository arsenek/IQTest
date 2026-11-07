"use client";

export type ItemAnswer = string | number | string[];

type McqItemProps = {
  prompt: string;
  choices: string[];
  disabled?: boolean;
  onAnswer: (answer: ItemAnswer) => void;
};

export function McqItem({
  prompt,
  choices,
  disabled = false,
  onAnswer,
}: McqItemProps) {
  return (
    <div className="flex w-full flex-col gap-5 md:gap-6">
      <p className="text-lg leading-relaxed font-medium text-[var(--assess-fg)] md:text-xl lg:text-2xl">
        {prompt}
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            disabled={disabled}
            onClick={() => onAnswer(choice)}
            className="min-h-14 rounded-[var(--assess-radius)] border-2 border-[var(--assess-border)] bg-[var(--assess-surface)] px-5 py-4 text-left text-base font-medium text-[var(--assess-fg)] transition hover:border-[var(--assess-accent)] hover:bg-[var(--assess-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--assess-accent)] disabled:cursor-not-allowed disabled:opacity-50 md:min-h-16 md:text-lg"
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import type { Choice } from "@/lib/content/types";
import { ChoiceCardButton, ItemCard } from "./ItemCard";

export type ItemAnswer = string | number | string[];

type McqItemProps = {
  prompt: string;
  choices: Array<Choice | string>;
  disabled?: boolean;
  onAnswer: (answer: ItemAnswer) => void;
};

function normalizeChoice(choice: Choice | string): Choice {
  return typeof choice === "string" ? { label: choice } : choice;
}

export function McqItem({
  prompt,
  choices,
  disabled = false,
  onAnswer,
}: McqItemProps) {
  const normalized = choices.map(normalizeChoice);

  return (
    <ItemCard
      data-testid="item-mcq"
      stem={
        <p className="text-lg leading-relaxed font-medium text-[var(--assess-fg)] md:text-xl lg:text-2xl">
          {prompt}
        </p>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:gap-5">
        {normalized.map((choice) => (
          <ChoiceCardButton
            key={choice.label}
            label={choice.label}
            glyph={choice.glyph}
            image={choice.image}
            disabled={disabled}
            onClick={() => onAnswer(choice.label)}
          />
        ))}
      </div>
    </ItemCard>
  );
}

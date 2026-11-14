"use client";

import type { Choice } from "@/lib/content/types";
import { ChoiceCardButton, ItemCard } from "./ItemCard";

export type ItemAnswer = string | number | string[];

type McqItemProps = {
  prompt: string;
  /** Optional stem figure URL (PRI matrix SVG, etc.). */
  image?: string;
  choices: Array<Choice | string>;
  disabled?: boolean;
  onAnswer: (answer: ItemAnswer) => void;
};

function normalizeChoice(choice: Choice | string): Choice {
  return typeof choice === "string" ? { label: choice } : choice;
}

export function McqItem({
  prompt,
  image,
  choices,
  disabled = false,
  onAnswer,
}: McqItemProps) {
  const normalized = choices.map(normalizeChoice);

  return (
    <ItemCard
      data-testid="item-mcq"
      stem={
        <div className="flex flex-col gap-4">
          <p className="text-lg leading-relaxed font-medium text-[var(--assess-fg)] md:text-xl lg:text-2xl">
            {prompt}
          </p>
          {image ? (
            // Pack fixture SVG (matrix / figure). Decorative relative to prompt.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              data-testid="item-stem-image"
              className="mx-auto h-auto w-full max-w-md rounded-[calc(var(--card-radius)-0.25rem)] border border-[var(--card-border)] bg-white object-contain p-2 md:max-w-lg"
            />
          ) : null}
        </div>
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

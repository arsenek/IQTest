import type { Choice, ContentPack, Item } from "@/lib/content/types";

/** Uniform RNG in [0, 1). */
export type Rng = () => number;

/** Mulberry32 — deterministic, seedable PRNG for tests and session shuffle. */
export function createSeededRng(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle; mutates and returns the same array. */
export function shuffleInPlace<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

function remapMcqAnswer(item: Item, shuffledChoices: Choice[]): Item["answer"] {
  // Answers are stored as choice labels (or numbers / digit strings).
  // After shuffle, keep the same correct label; if answer was a 0-based index,
  // remap to the new index of that choice.
  if (typeof item.answer === "number" && item.choices) {
    const original = item.choices[item.answer];
    if (original) {
      const next = shuffledChoices.findIndex(
        (c) => c.label === (typeof original === "string" ? original : original.label),
      );
      if (next >= 0) return next;
    }
  }
  return item.answer;
}

function shuffleItemChoices(item: Item, rng: Rng): Item {
  if (!item.choices || item.choices.length < 2) {
    return { ...item, choices: item.choices ? [...item.choices] : undefined };
  }
  const choices = shuffleInPlace(
    item.choices.map((c) => ({ ...c })),
    rng,
  );
  return {
    ...item,
    choices,
    answer: remapMcqAnswer(item, choices),
  };
}

/**
 * Per-subtest: shuffle item order; for choice items, shuffle options and
 * remap indexed answers. Returns a deep-cloned pack suitable for playlistJson.
 */
export function shufflePlaylist(pack: ContentPack, rng: Rng): ContentPack {
  return {
    id: pack.id,
    audience: pack.audience,
    title: pack.title,
    subtests: pack.subtests.map((subtest) => {
      const items = shuffleInPlace(
        subtest.items.map((item) => shuffleItemChoices(item, rng)),
        rng,
      );
      return {
        id: subtest.id,
        indexKey: subtest.indexKey,
        title: subtest.title,
        items,
      };
    }),
  };
}

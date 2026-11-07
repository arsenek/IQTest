import type { PracticeProgress, PracticeSession } from "@prisma/client";
import { prisma } from "@/lib/db";
import { loadPack } from "@/lib/content/loadPack";
import { INDEX_KEYS, type IndexKey, type Item } from "@/lib/content/types";
import { scoreItem } from "@/lib/scoring/rawScore";
import { shuffleInPlace, type Rng } from "@/lib/session/shuffle";

export class PracticeError extends Error {
  constructor(
    public readonly code:
      | "PROFILE_NOT_FOUND"
      | "PRACTICE_NOT_FOUND"
      | "INVALID_INDEX"
      | "INVALID_PAYLOAD",
    message: string,
  ) {
    super(message);
    this.name = "PracticeError";
  }
}

export type PracticeItem = Pick<
  Item,
  | "id"
  | "type"
  | "prompt"
  | "choices"
  | "timeLimitMs"
  | "encodeMs"
  | "maskStem"
> & { subtestId: string };

const ROUND_SIZE = 5;

function isIndexKey(value: string): value is IndexKey {
  return (INDEX_KEYS as readonly string[]).includes(value);
}

function packIdForKind(kind: "CHILD" | "ADULT"): string {
  const override = process.env.IQTEST_E2E_PACK?.trim();
  if (override) return override;
  return kind === "CHILD" ? "child/v1" : "adult/v1";
}

/** Stars 0–3 from accuracy in a round. */
export function starsFromAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0;
  const ratio = correct / total;
  if (ratio >= 1) return 3;
  if (ratio >= 0.6) return 2;
  if (ratio >= 0.3) return 1;
  return 0;
}

/**
 * Start a practice session for one index.
 * Writes only PracticeSession — never AssessmentSession / Report.
 */
export async function startPractice(
  profileId: string,
  indexKey: string,
): Promise<PracticeSession> {
  if (!isIndexKey(indexKey)) {
    throw new PracticeError("INVALID_INDEX", `Invalid indexKey: ${indexKey}`);
  }

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) {
    throw new PracticeError("PROFILE_NOT_FOUND", `Profile not found: ${profileId}`);
  }

  return prisma.practiceSession.create({
    data: {
      profileId,
      indexKey,
    },
  });
}

/** Build a short practice round from pack subtests of this index (no answers). */
export function buildPracticeRound(
  packId: string,
  indexKey: IndexKey,
  roundSize: number = ROUND_SIZE,
  rng: Rng = Math.random,
): PracticeItem[] {
  const pack = loadPack(packId);
  const pool = pack.subtests
    .filter((s) => s.indexKey === indexKey)
    .flatMap((s) =>
      s.items.map((item) => ({
        id: item.id,
        type: item.type,
        prompt: item.prompt,
        choices: item.choices
          ? shuffleInPlace(
              item.choices.map((c) => ({ ...c })),
              rng,
            )
          : undefined,
        timeLimitMs: item.timeLimitMs,
        encodeMs: item.encodeMs,
        maskStem: item.maskStem,
        subtestId: s.id,
      })),
    );

  if (pool.length === 0) {
    throw new PracticeError(
      "INVALID_INDEX",
      `No items for index ${indexKey} in ${packId}`,
    );
  }

  shuffleInPlace(pool, rng);
  return pool.slice(0, Math.min(roundSize, pool.length));
}

export async function getPracticeItemsForProfile(
  profileId: string,
  indexKey: string,
): Promise<{
  packId: string;
  items: PracticeItem[];
  audience: "child" | "adult";
}> {
  if (!isIndexKey(indexKey)) {
    throw new PracticeError("INVALID_INDEX", `Invalid indexKey: ${indexKey}`);
  }
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) {
    throw new PracticeError("PROFILE_NOT_FOUND", `Profile not found: ${profileId}`);
  }
  const packId = packIdForKind(profile.kind);
  const audience = profile.kind === "CHILD" ? "child" : "adult";
  return { packId, items: buildPracticeRound(packId, indexKey), audience };
}

export type PracticeAnswerInput = {
  itemId: string;
  answer: string | number | string[];
};

/**
 * Score a practice round and upsert PracticeProgress only.
 * Guarantees no writes to AssessmentSession or Report.
 */
export async function recordPracticeRound(
  practiceSessionId: string,
  answers: PracticeAnswerInput[],
): Promise<{
  progress: PracticeProgress;
  correct: number;
  itemsDone: number;
  starsEarned: number;
}> {
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new PracticeError("INVALID_PAYLOAD", "answers required");
  }

  const session = await prisma.practiceSession.findUnique({
    where: { id: practiceSessionId },
    include: { profile: true, progress: true },
  });
  if (!session) {
    throw new PracticeError(
      "PRACTICE_NOT_FOUND",
      `Practice session not found: ${practiceSessionId}`,
    );
  }

  const packId = packIdForKind(session.profile.kind);
  const pack = loadPack(packId);
  const byId = new Map(
    pack.subtests
      .filter((s) => s.indexKey === session.indexKey)
      .flatMap((s) => s.items.map((item) => [item.id, item] as const)),
  );

  let correct = 0;
  for (const a of answers) {
    const item = byId.get(a.itemId);
    if (!item) continue;
    if (scoreItem(item, a.answer).correct) correct += 1;
  }
  const itemsDoneDelta = answers.length;
  const starsEarned = starsFromAccuracy(correct, itemsDoneDelta);

  // Only PracticeProgress — never AssessmentSession / Report.
  const existing = session.progress[0];
  const progress = existing
    ? await prisma.practiceProgress.update({
        where: { id: existing.id },
        data: {
          stars: existing.stars + starsEarned,
          itemsDone: existing.itemsDone + itemsDoneDelta,
        },
      })
    : await prisma.practiceProgress.create({
        data: {
          sessionId: practiceSessionId,
          stars: starsEarned,
          itemsDone: itemsDoneDelta,
        },
      });

  return {
    progress,
    correct,
    itemsDone: itemsDoneDelta,
    starsEarned,
  };
}

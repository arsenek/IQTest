import type {
  AssessmentSession,
  Profile,
  Report,
  Response,
  SessionStatus,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma, withPrismaRetry } from "@/lib/db";
import { loadPack } from "@/lib/content/loadPack";
import { loadNorms } from "@/lib/content/loadNorms";
import { contentPackSchema } from "@/lib/content/schemas";
import {
  INDEX_KEYS,
  type ContentPack,
  type IndexKey,
  type Item,
} from "@/lib/content/types";
import { scoreItem } from "@/lib/scoring/rawScore";
import { scaleSubtest } from "@/lib/scoring/scaleScore";
import { composeReport } from "@/lib/scoring/composeReport";
import { shufflePlaylist } from "@/lib/session/shuffle";

export class SessionError extends Error {
  constructor(
    public readonly code:
      | "PROFILE_NOT_FOUND"
      | "SESSION_NOT_FOUND"
      | "SESSION_NOT_IN_PROGRESS"
      | "NO_MORE_ITEMS"
      | "ITEM_MISMATCH"
      | "INVALID_PAYLOAD"
      | "INVALID_PLAYLIST"
      | "WRITE_FAILED",
    message: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "SessionError";
  }
}

/** Map transient Prisma / DB failures to a retryable SessionError. */
export function asWriteFailed(err: unknown): SessionError {
  if (err instanceof SessionError) return err;
  const message =
    err instanceof Error && err.message
      ? `保存作答失败，请重试（${err.message}）`
      : "保存作答失败，请重试";
  return new SessionError("WRITE_FAILED", message, true);
}

export type AnswerPayload = {
  answer: string | number | string[];
  latencyMs: number;
  /** Optional guard: must match the item at currentIndex. */
  itemId?: string;
};

export type FlatItem = {
  globalIndex: number;
  subtestId: string;
  indexKey: IndexKey;
  item: Item;
};

export type ResumeResult = {
  session: AssessmentSession & {
    responses: Response[];
    report: Report | null;
    profile: Profile;
  };
  currentIndex: number;
  totalItems: number;
  status: SessionStatus;
  playlist: ContentPack;
  currentItem: (Item & { subtestId: string; indexKey: IndexKey }) | null;
};

const DEFAULT_NORM_VERSION = "placeholder/v1";

export function flattenPack(pack: ContentPack): FlatItem[] {
  const out: FlatItem[] = [];
  for (const subtest of pack.subtests) {
    for (const item of subtest.items) {
      out.push({
        globalIndex: out.length,
        subtestId: subtest.id,
        indexKey: subtest.indexKey,
        item,
      });
    }
  }
  return out;
}

function packIdForProfile(kind: Profile["kind"]): string {
  return kind === "CHILD" ? "child/v1" : "adult/v1";
}

/** Optional short fixture pack for Playwright (`IQTEST_E2E_PACK=child/e2e`). */
function resolvePackId(kind: Profile["kind"]): string {
  const override = process.env.IQTEST_E2E_PACK?.trim();
  return override && override.length > 0 ? override : packIdForProfile(kind);
}

export function ageMonthsAt(birthDate: Date, at: Date = new Date()): number {
  const years = at.getFullYear() - birthDate.getFullYear();
  const months = at.getMonth() - birthDate.getMonth();
  let total = years * 12 + months;
  if (at.getDate() < birthDate.getDate()) total -= 1;
  return Math.max(0, total);
}

function toJsonAnswer(
  answer: string | number | string[],
): Prisma.InputJsonValue {
  return answer as Prisma.InputJsonValue;
}

/** Resolve the session playlist; fall back to canonical pack if missing. */
export function resolveSessionPlaylist(
  session: Pick<AssessmentSession, "packId" | "playlistJson">,
): ContentPack {
  if (session.playlistJson != null) {
    const parsed = contentPackSchema.safeParse(session.playlistJson);
    if (!parsed.success) {
      throw new SessionError(
        "INVALID_PLAYLIST",
        `Invalid playlistJson for pack ${session.packId}`,
      );
    }
    return parsed.data;
  }
  return loadPack(session.packId);
}

/** Start a new assessment for a profile; pack chosen by Profile.kind. */
export async function createSession(
  profileId: string,
  rng: () => number = Math.random,
): Promise<AssessmentSession> {
  const profile = await withPrismaRetry(() =>
    prisma.profile.findUnique({ where: { id: profileId } }),
  );
  if (!profile) {
    throw new SessionError("PROFILE_NOT_FOUND", `Profile not found: ${profileId}`);
  }

  const packId = resolvePackId(profile.kind);
  const normVersion = DEFAULT_NORM_VERSION;
  const pack = loadPack(packId);
  loadNorms(normVersion);
  const playlist = shufflePlaylist(pack, rng);

  try {
    return await withPrismaRetry(() =>
      prisma.assessmentSession.create({
        data: {
          profileId,
          packId,
          normVersion,
          status: "IN_PROGRESS",
          currentIndex: 0,
          playlistJson: playlist as unknown as Prisma.InputJsonValue,
        },
      }),
    );
  } catch (err) {
    throw asWriteFailed(err);
  }
}

/** Persist one answer at currentIndex and advance the cursor. */
export async function recordAnswer(
  sessionId: string,
  payload: AnswerPayload,
): Promise<{
  response: Response;
  currentIndex: number;
  totalItems: number;
  done: boolean;
}> {
  if (
    payload == null ||
    typeof payload.latencyMs !== "number" ||
    !Number.isFinite(payload.latencyMs) ||
    payload.latencyMs < 0 ||
    payload.answer === undefined ||
    payload.answer === null
  ) {
    throw new SessionError("INVALID_PAYLOAD", "answer and latencyMs are required");
  }

  const session = await withPrismaRetry(() =>
    prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    }),
  );
  if (!session) {
    throw new SessionError("SESSION_NOT_FOUND", `Session not found: ${sessionId}`);
  }
  if (session.status !== "IN_PROGRESS") {
    throw new SessionError(
      "SESSION_NOT_IN_PROGRESS",
      "Cannot answer after session is submitted",
    );
  }

  const playlist = resolveSessionPlaylist(session);
  const flat = flattenPack(playlist);
  if (session.currentIndex >= flat.length) {
    throw new SessionError("NO_MORE_ITEMS", "All items already answered");
  }

  const current = flat[session.currentIndex];
  if (payload.itemId && payload.itemId !== current.item.id) {
    throw new SessionError(
      "ITEM_MISMATCH",
      `Expected item ${current.item.id}, got ${payload.itemId}`,
    );
  }

  const scored = scoreItem(current.item, payload.answer);
  const nextIndex = session.currentIndex + 1;

  try {
    const [response] = await withPrismaRetry(() =>
      prisma.$transaction([
        prisma.response.create({
          data: {
            sessionId,
            subtestId: current.subtestId,
            itemId: current.item.id,
            answerJson: toJsonAnswer(payload.answer),
            correct: scored.correct,
            rawScore: scored.rawScore,
            latencyMs: Math.round(payload.latencyMs),
          },
        }),
        prisma.assessmentSession.update({
          where: { id: sessionId },
          data: { currentIndex: nextIndex },
        }),
      ]),
    );

    return {
      response,
      currentIndex: nextIndex,
      totalItems: flat.length,
      done: nextIndex >= flat.length,
    };
  } catch (err) {
    throw asWriteFailed(err);
  }
}

/** Restore session progress for resume / UI. */
export async function resumeSession(sessionId: string): Promise<ResumeResult> {
  const session = await withPrismaRetry(() =>
    prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        responses: { orderBy: { createdAt: "asc" } },
        report: true,
        profile: true,
      },
    }),
  );
  if (!session) {
    throw new SessionError("SESSION_NOT_FOUND", `Session not found: ${sessionId}`);
  }

  const playlist = resolveSessionPlaylist(session);
  const flat = flattenPack(playlist);
  const current =
    session.status === "IN_PROGRESS" && session.currentIndex < flat.length
      ? flat[session.currentIndex]
      : null;

  return {
    session,
    currentIndex: session.currentIndex,
    totalItems: flat.length,
    status: session.status,
    playlist,
    currentItem: current
      ? {
          ...current.item,
          subtestId: current.subtestId,
          indexKey: current.indexKey,
        }
      : null,
  };
}

/**
 * Score responses, create Report once, mark session SUBMITTED.
 * Re-submit returns the existing report.
 */
export async function submitSession(sessionId: string): Promise<Report> {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    include: { responses: true, report: true, profile: true },
  });
  if (!session) {
    throw new SessionError("SESSION_NOT_FOUND", `Session not found: ${sessionId}`);
  }

  if (session.report) {
    return session.report;
  }

  const playlist = resolveSessionPlaylist(session);
  const norms = loadNorms(session.normVersion);
  const subtestIndex = new Map(
    playlist.subtests.map((s) => [s.id, s.indexKey] as const),
  );

  const rawByIndex: Record<IndexKey, number> = {
    VCI: 0,
    PRI: 0,
    WMI: 0,
    PSI: 0,
  };
  for (const r of session.responses) {
    const key = subtestIndex.get(r.subtestId);
    if (key) {
      rawByIndex[key] += r.rawScore ?? 0;
    }
  }

  const ageMonths = ageMonthsAt(session.profile.birthDate);
  const scaled = {} as Record<IndexKey, number>;
  for (const key of INDEX_KEYS) {
    scaled[key] = scaleSubtest(rawByIndex[key], ageMonths, norms, key);
  }
  const composed = composeReport(scaled);

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.report.findUnique({ where: { sessionId } });
      if (existing) return existing;

      const report = await tx.report.create({
        data: {
          sessionId,
          vci: composed.vci,
          pri: composed.pri,
          wmi: composed.wmi,
          psi: composed.psi,
          composite: composed.composite,
          narrative: composed.narrativeKey,
        },
      });

      await tx.assessmentSession.update({
        where: { id: sessionId },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });

      return report;
    });
  } catch (err) {
    // Unique race: another submit won — return that report.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const again = await prisma.report.findUnique({ where: { sessionId } });
      if (again) return again;
    }
    throw err;
  }
}

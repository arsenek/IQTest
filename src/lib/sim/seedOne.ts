import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import {
  createSession,
  flattenPack,
  recordAnswer,
  resolveSessionPlaylist,
  submitSession,
} from "@/lib/session/machine";
import { createSeededRng as packRng } from "@/lib/session/shuffle";
import {
  difficultyFromIndex,
  effectiveItemDifficulty,
  probabilityCorrect,
  sampleLatencyMs,
} from "@/lib/sim/ability";
import { chooseAnswer } from "@/lib/sim/answers";
import {
  SIM_PASSWORD,
  isSimEmail,
  simEmailForPersona,
} from "@/lib/sim/constants";
import { createSeededRng, seedFromPersonaId } from "@/lib/sim/rng";
import type { SimPersona } from "@/lib/sim/types";

export type SeedOneResult =
  | {
      status: "added";
      personaId: string;
      email: string;
      sessionId: string;
      reportId: string;
      composite: number;
      correctCount: number;
      totalItems: number;
    }
  | {
      status: "skip";
      personaId: string;
      email: string;
      reason: string;
      sessionId?: string;
    };

function birthDateFromAgeYears(ageYears: number, now = new Date()): Date {
  const d = new Date(now);
  d.setFullYear(d.getFullYear() - ageYears);
  d.setMonth(0, 15);
  d.setHours(12, 0, 0, 0);
  return d;
}

/**
 * Idempotent seed for one persona: create user/profile, full playlist answers,
 * submit → Report. Skips if sim email already has a SUBMITTED session with report.
 */
export async function seedOnePersona(
  persona: SimPersona,
): Promise<SeedOneResult> {
  const email = simEmailForPersona(persona.id);
  if (!isSimEmail(email)) {
    throw new Error(`Refusing non-sim email: ${email}`);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    include: {
      profiles: {
        include: {
          assessments: {
            where: { status: "SUBMITTED" },
            include: { report: true },
            orderBy: { submittedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (existing) {
    const submitted = existing.profiles
      .flatMap((p) => p.assessments)
      .find((s) => s.report);
    if (submitted?.report) {
      return {
        status: "skip",
        personaId: persona.id,
        email,
        reason: "already SUBMITTED with report",
        sessionId: submitted.id,
      };
    }
  }

  const rng = createSeededRng(seedFromPersonaId(persona.id));
  const passwordHash = await hashPassword(SIM_PASSWORD);

  const user =
    existing ??
    (await prisma.user.create({
      data: { email, passwordHash },
    }));

  let profile = await prisma.profile.findFirst({
    where: { userId: user.id },
  });
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId: user.id,
        displayName: `[SIM] ${persona.displayName}`,
        birthDate: birthDateFromAgeYears(persona.ageYears),
        kind: persona.kind,
      },
    });
  }

  // Drop incomplete prior sim sessions for this profile so we can re-run cleanly.
  const stale = await prisma.assessmentSession.findMany({
    where: { profileId: profile.id, status: { not: "SUBMITTED" } },
    select: { id: true },
  });
  if (stale.length) {
    const ids = stale.map((s) => s.id);
    await prisma.response.deleteMany({ where: { sessionId: { in: ids } } });
    await prisma.assessmentSession.deleteMany({ where: { id: { in: ids } } });
  }

  const session = await createSession(profile.id, packRng(seedFromPersonaId(persona.id) ^ 0x9e3779b9));
  const playlist = resolveSessionPlaylist(session);
  const flat = flattenPack(playlist);

  // Precompute within-subtest indices for difficulty.
  const subtestPos = new Map<string, { i: number; n: number }>();
  for (const sub of playlist.subtests) {
    subtestPos.set(sub.id, { i: 0, n: sub.items.length });
  }

  let correctCount = 0;
  for (const row of flat) {
    const pos = subtestPos.get(row.subtestId)!;
    const positionDifficulty = difficultyFromIndex(pos.i, pos.n);
    const difficulty = effectiveItemDifficulty(row.item, positionDifficulty);
    pos.i += 1;

    const ability = persona.ability[row.indexKey];
    const p = probabilityCorrect(ability, difficulty);
    const correct = rng() < p;
    if (correct) correctCount += 1;
    const answer = chooseAnswer(row.item, correct, rng);
    const latencyMs = sampleLatencyMs(
      {
        itemType: row.item.type,
        ability,
        difficulty,
        timeLimitMs: row.item.timeLimitMs,
      },
      rng,
    );

    await recordAnswer(session.id, {
      answer,
      latencyMs,
      itemId: row.item.id,
    });
  }

  const report = await submitSession(session.id);

  return {
    status: "added",
    personaId: persona.id,
    email,
    sessionId: session.id,
    reportId: report.id,
    composite: report.composite,
    correctCount,
    totalItems: flat.length,
  };
}

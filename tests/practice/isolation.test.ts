import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  createSession,
  recordAnswer,
  flattenPack,
  resolveSessionPlaylist,
  submitSession,
} from "@/lib/session/machine";
import { loadPack } from "@/lib/content/loadPack";
import {
  recordPracticeRound,
  startPractice,
  starsFromAccuracy,
} from "@/lib/practice/run";
import { createSeededRng } from "@/lib/session/shuffle";

async function seedSubmittedSession() {
  const user = await prisma.user.create({
    data: {
      email: `p-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`,
      passwordHash: "x",
    },
  });
  const birthDate = new Date();
  birthDate.setFullYear(birthDate.getFullYear() - 10);
  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      displayName: "练习隔离",
      birthDate,
      kind: "CHILD",
    },
  });

  const session = await createSession(profile.id, createSeededRng(21));
  const flat = flattenPack(resolveSessionPlaylist(session));
  for (let i = 0; i < 4; i++) {
    await recordAnswer(session.id, {
      answer: flat[i].item.answer as string | number | string[],
      latencyMs: 200 + i,
    });
  }
  const report = await submitSession(session.id);
  return { profile, session, report };
}

beforeEach(async () => {
  await prisma.report.deleteMany();
  await prisma.response.deleteMany();
  await prisma.assessmentSession.deleteMany();
  await prisma.practiceProgress.deleteMany();
  await prisma.practiceSession.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
});


describe("practice score isolation", () => {
  it("starsFromAccuracy maps ratios to 0–3", () => {
    expect(starsFromAccuracy(5, 5)).toBe(3);
    expect(starsFromAccuracy(3, 5)).toBe(2);
    expect(starsFromAccuracy(2, 5)).toBe(1);
    expect(starsFromAccuracy(1, 5)).toBe(0);
    expect(starsFromAccuracy(0, 5)).toBe(0);
  });

  it("practice does not mutate report composite", async () => {
    const { profile, session, report } = await seedSubmittedSession();
    const original = report.composite;
    const originalRow = await prisma.report.findUniqueOrThrow({
      where: { sessionId: session.id },
    });

    const practice = await startPractice(profile.id, "VCI");
    const pack = loadPack("child/v1");
    const vciItems = pack.subtests
      .filter((s) => s.indexKey === "VCI")
      .flatMap((s) => s.items)
      .slice(0, 3);

    await recordPracticeRound(
      practice.id,
      vciItems.map((item) => ({
        itemId: item.id,
        answer: item.answer as string | number | string[],
      })),
    );

    // Practice progress written
    const progress = await prisma.practiceProgress.findMany({
      where: { sessionId: practice.id },
    });
    expect(progress).toHaveLength(1);
    expect(progress[0].itemsDone).toBe(3);
    expect(progress[0].stars).toBeGreaterThan(0);

    // Formal report untouched
    const reloaded = await prisma.report.findUniqueOrThrow({
      where: { sessionId: session.id },
    });
    expect(reloaded.composite).toBe(original);
    expect(reloaded.vci).toBe(originalRow.vci);
    expect(reloaded.pri).toBe(originalRow.pri);
    expect(reloaded.wmi).toBe(originalRow.wmi);
    expect(reloaded.psi).toBe(originalRow.psi);
    expect(reloaded.narrative).toBe(originalRow.narrative);
    expect(reloaded.id).toBe(originalRow.id);

    const assessment = await prisma.assessmentSession.findUniqueOrThrow({
      where: { id: session.id },
    });
    expect(assessment.status).toBe("SUBMITTED");
    expect(assessment.currentIndex).toBe(4);
  });
});

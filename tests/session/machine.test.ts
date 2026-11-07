import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  createSession,
  recordAnswer,
  resumeSession,
  submitSession,
  SessionError,
  flattenPack,
  resolveSessionPlaylist,
} from "@/lib/session/machine";
import { createSeededRng } from "@/lib/session/shuffle";

async function seedProfile(kind: "CHILD" | "ADULT" = "CHILD") {
  const user = await prisma.user.create({
    data: {
      email: `t-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`,
      passwordHash: "x",
    },
  });
  // ~8 years old for child norms band
  const birthDate = new Date();
  birthDate.setFullYear(birthDate.getFullYear() - (kind === "CHILD" ? 8 : 25));

  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      displayName: kind === "CHILD" ? "测试儿童" : "测试成人",
      birthDate,
      kind,
    },
  });
  return { user, profile };
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

describe("assessment session state machine", () => {
  it("createSession picks child pack, starts at 0, persists playlistJson", async () => {
    const { profile } = await seedProfile("CHILD");
    const session = await createSession(profile.id, createSeededRng(11));
    expect(session.packId).toBe("child/v1");
    expect(session.normVersion).toBe("placeholder/v1");
    expect(session.status).toBe("IN_PROGRESS");
    expect(session.currentIndex).toBe(0);
    expect(session.playlistJson).toBeTruthy();
    const playlist = resolveSessionPlaylist(session);
    expect(playlist.subtests).toHaveLength(4);
  });

  it("two sessions with different seeds get different item order", async () => {
    const { profile } = await seedProfile("CHILD");
    const a = await createSession(profile.id, createSeededRng(1));
    const b = await createSession(profile.id, createSeededRng(99));
    const idsA = flattenPack(resolveSessionPlaylist(a)).map((r) => r.item.id);
    const idsB = flattenPack(resolveSessionPlaylist(b)).map((r) => r.item.id);
    expect(idsA).not.toEqual(idsB);
  });

  it("resume restores currentIndex after answers using playlist order", async () => {
    const { profile } = await seedProfile("CHILD");
    const session = await createSession(profile.id, createSeededRng(3));
    const flat = flattenPack(resolveSessionPlaylist(session));
    const first = flat[0];

    await recordAnswer(session.id, {
      answer: first.item.answer as string | number | string[],
      latencyMs: 1200,
      itemId: first.item.id,
    });

    const resumed = await resumeSession(session.id);
    expect(resumed.currentIndex).toBe(1);
    expect(resumed.session.responses).toHaveLength(1);
    expect(resumed.session.responses[0].latencyMs).toBe(1200);
    expect(resumed.currentItem?.id).toBe(flat[1].item.id);
    expect(resumed.playlist.subtests[0].items[0].id).toBe(
      resolveSessionPlaylist(session).subtests[0].items[0].id,
    );
    expect(resumed.status).toBe("IN_PROGRESS");
  });

  it("cannot answer after SUBMITTED", async () => {
    const { profile } = await seedProfile("CHILD");
    const session = await createSession(profile.id, createSeededRng(5));
    const flat = flattenPack(resolveSessionPlaylist(session));

    await recordAnswer(session.id, {
      answer: flat[0].item.answer as string | number | string[],
      latencyMs: 500,
    });

    await submitSession(session.id);

    await expect(
      recordAnswer(session.id, {
        answer: flat[1].item.answer as string | number | string[],
        latencyMs: 400,
      }),
    ).rejects.toMatchObject({
      name: "SessionError",
      code: "SESSION_NOT_IN_PROGRESS",
    } satisfies Partial<SessionError>);
  });

  it("submit creates Report once and is idempotent", async () => {
    const { profile } = await seedProfile("CHILD");
    const session = await createSession(profile.id, createSeededRng(8));
    const flat = flattenPack(resolveSessionPlaylist(session));

    for (let i = 0; i < 2; i++) {
      await recordAnswer(session.id, {
        answer: flat[i].item.answer as string | number | string[],
        latencyMs: 100 + i,
      });
    }

    const report1 = await submitSession(session.id);
    expect(report1.sessionId).toBe(session.id);
    expect(report1.composite).toBeTypeOf("number");
    expect(["VCI", "PRI", "WMI", "PSI"]).toContain(report1.narrative);

    const report2 = await submitSession(session.id);
    expect(report2.id).toBe(report1.id);

    const count = await prisma.report.count({
      where: { sessionId: session.id },
    });
    expect(count).toBe(1);

    const updated = await prisma.assessmentSession.findUniqueOrThrow({
      where: { id: session.id },
    });
    expect(updated.status).toBe("SUBMITTED");
    expect(updated.submittedAt).not.toBeNull();
  });

  it("createSession for ADULT uses adult pack", async () => {
    const { profile } = await seedProfile("ADULT");
    const session = await createSession(profile.id);
    expect(session.packId).toBe("adult/v1");
    expect(session.playlistJson).toBeTruthy();
  });
});

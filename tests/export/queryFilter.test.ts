import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  createSession,
  flattenPack,
  recordAnswer,
  resolveSessionPlaylist,
  submitSession,
} from "@/lib/session/machine";
import { createSeededRng } from "@/lib/session/shuffle";
import { buildRowsForSessions } from "@/lib/export/buildRows";
import { fetchExportableSessions } from "@/lib/export/query";
import { EXPORT_COLUMNS } from "@/lib/export/types";

async function seedProfile(kind: "CHILD" | "ADULT" = "CHILD") {
  const user = await prisma.user.create({
    data: {
      email: `export-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`,
      passwordHash: "x",
    },
  });
  const birthDate = new Date();
  birthDate.setFullYear(birthDate.getFullYear() - (kind === "CHILD" ? 8 : 25));
  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      displayName: kind === "CHILD" ? "导出儿童" : "导出成人",
      birthDate,
      kind,
    },
  });
  return profile;
}

async function answerAllAndSubmit(sessionId: string, seed: number) {
  const session = await prisma.assessmentSession.findUniqueOrThrow({
    where: { id: sessionId },
  });
  const flat = flattenPack(resolveSessionPlaylist(session));
  for (const row of flat) {
    await recordAnswer(sessionId, {
      answer: row.item.answer as string | number | string[],
      latencyMs: 800 + seed,
      itemId: row.item.id,
    });
  }
  return submitSession(sessionId);
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

describe("fetchExportableSessions filter", () => {
  it("exports only SUBMITTED sessions with reports; columns match schema", async () => {
    process.env.EXPORT_PROFILE_SALT = "query-filter-test-salt";

    const child = await seedProfile("CHILD");
    const submitted = await createSession(child.id, createSeededRng(7));
    await answerAllAndSubmit(submitted.id, 7);

    const adult = await seedProfile("ADULT");
    const inProgress = await createSession(adult.id, createSeededRng(8));
    const flat = flattenPack(resolveSessionPlaylist(inProgress));
    await recordAnswer(inProgress.id, {
      answer: flat[0].item.answer as string | number | string[],
      latencyMs: 400,
      itemId: flat[0].item.id,
    });

    const sessions = await fetchExportableSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(submitted.id);
    expect(sessions[0].status).toBe("SUBMITTED");
    expect(sessions.every((s) => s.id !== inProgress.id)).toBe(true);

    const { rows } = buildRowsForSessions(sessions, "query-filter-test-salt");
    expect(rows.length).toBeGreaterThan(0);
    for (const col of EXPORT_COLUMNS) {
      expect(rows[0]).toHaveProperty(col);
    }
    expect(rows.every((r) => r.isChildData)).toBe(true);
    expect(rows.every((r) => r.sessionId === submitted.id)).toBe(true);
    expect(JSON.stringify(rows)).not.toContain(child.id);
    expect(JSON.stringify(rows)).not.toContain("@test.local");

    const packed = await fetchExportableSessions({ packId: "adult/v1" });
    expect(packed).toHaveLength(0);
  }, 60_000);
});

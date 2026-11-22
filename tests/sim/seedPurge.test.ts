import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { isSimEmail } from "@/lib/sim/constants";
import { listSimExaminees } from "@/lib/sim/list";
import { loadPersonasFile } from "@/lib/sim/personas";
import { purgeSimUsers } from "@/lib/sim/purge";
import { seedOnePersona } from "@/lib/sim/seedOne";

async function wipeAll() {
  await prisma.report.deleteMany();
  await prisma.response.deleteMany();
  await prisma.assessmentSession.deleteMany();
  await prisma.practiceProgress.deleteMany();
  await prisma.practiceSession.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
}

beforeEach(async () => {
  await wipeAll();
});

describe("sim seed + purge safety", () => {
  it("seeds one persona to SUBMITTED with report and latencyMs", async () => {
    const persona = loadPersonasFile().personas[0]!;
    const first = await seedOnePersona(persona);
    expect(first.status).toBe("added");
    if (first.status !== "added") return;

    const session = await prisma.assessmentSession.findUniqueOrThrow({
      where: { id: first.sessionId },
      include: { responses: true, report: true },
    });
    expect(session.status).toBe("SUBMITTED");
    expect(session.report).toBeTruthy();
    expect(session.responses.length).toBe(first.totalItems);
    expect(session.responses.every((r) => r.latencyMs > 0)).toBe(true);

    const second = await seedOnePersona(persona);
    expect(second.status).toBe("skip");
  }, 120_000);

  it("purge --persona removes only that sim user; real user survives", async () => {
    const real = await prisma.user.create({
      data: {
        email: "real-human@example.com",
        passwordHash: "x",
      },
    });
    await prisma.profile.create({
      data: {
        userId: real.id,
        displayName: "真人",
        birthDate: new Date("1990-01-01"),
        kind: "ADULT",
      },
    });

    const [p0, p1] = loadPersonasFile().personas;
    await seedOnePersona(p0!);
    await seedOnePersona(p1!);

    const before = await listSimExaminees();
    expect(before.length).toBe(2);

    const purged = await purgeSimUsers({ personaId: p0!.id });
    expect(purged.deletedUsers).toBe(1);
    expect(purged.emails.every(isSimEmail)).toBe(true);

    const after = await listSimExaminees();
    expect(after.map((r) => r.personaId)).toEqual([p1!.id]);

    const realStill = await prisma.user.findUnique({ where: { id: real.id } });
    expect(realStill).toBeTruthy();
    expect(isSimEmail(realStill!.email)).toBe(false);
  }, 180_000);

  it("purge --all-sim leaves non-sim untouched", async () => {
    await prisma.user.create({
      data: { email: "keeper@example.com", passwordHash: "x" },
    });
    const persona = loadPersonasFile().personas[2]!;
    await seedOnePersona(persona);

    const result = await purgeSimUsers({ allSim: true });
    expect(result.deletedUsers).toBe(1);

    const keep = await prisma.user.findUnique({
      where: { email: "keeper@example.com" },
    });
    expect(keep).toBeTruthy();
    expect(await listSimExaminees()).toHaveLength(0);
  }, 120_000);
});

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  assertAssessmentOwned,
  assertProfileOwned,
  AuthError,
  sealSessionToken,
  unsealSessionToken,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session/machine";

beforeEach(async () => {
  await prisma.report.deleteMany();
  await prisma.response.deleteMany();
  await prisma.assessmentSession.deleteMany();
  await prisma.practiceProgress.deleteMany();
  await prisma.practiceSession.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
});


describe("auth password + cookie", () => {
  it("hashes and verifies passwords with bcrypt", async () => {
    const hash = await hashPassword("secret-pass");
    expect(hash).not.toBe("secret-pass");
    expect(await verifyPassword("secret-pass", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("seals and unseals httpOnly session token", () => {
    const token = sealSessionToken("user_abc");
    expect(unsealSessionToken(token)).toBe("user_abc");
    expect(unsealSessionToken(token + "x")).toBeNull();
    expect(unsealSessionToken("nope")).toBeNull();
  });
});

describe("ownership guards", () => {
  it("allows owner and rejects other userId", async () => {
    const owner = await prisma.user.create({
      data: {
        email: `owner-${Date.now()}@t.local`,
        passwordHash: await hashPassword("password12"),
      },
    });
    const other = await prisma.user.create({
      data: {
        email: `other-${Date.now()}@t.local`,
        passwordHash: await hashPassword("password12"),
      },
    });
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 10);
    const profile = await prisma.profile.create({
      data: {
        userId: owner.id,
        displayName: "孩子",
        birthDate,
        kind: "CHILD",
      },
    });
    const session = await createSession(profile.id);

    await expect(assertProfileOwned(profile.id, owner.id)).resolves.toBeUndefined();
    await expect(assertAssessmentOwned(session.id, owner.id)).resolves.toBeUndefined();

    await expect(assertProfileOwned(profile.id, other.id)).rejects.toMatchObject({
      name: "AuthError",
      code: "FORBIDDEN",
    } satisfies Partial<AuthError>);
    await expect(assertAssessmentOwned(session.id, other.id)).rejects.toMatchObject({
      name: "AuthError",
      code: "FORBIDDEN",
    } satisfies Partial<AuthError>);
  });
});

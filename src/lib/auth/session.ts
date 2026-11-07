import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

export const SESSION_COOKIE = "iqtest_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14; // 14 days

type SessionPayload = {
  uid: string;
  exp: number;
};

function authSecret(): string {
  return process.env.AUTH_SECRET ?? "dev-insecure-auth-secret-change-me";
}

function sign(payloadB64: string): string {
  return createHmac("sha256", authSecret())
    .update(payloadB64)
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Seal user id into a signed cookie value. */
export function sealSessionToken(userId: string): string {
  const payload: SessionPayload = {
    uid: userId,
    exp: Date.now() + SESSION_MAX_AGE_SEC * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function unsealSessionToken(
  token: string | undefined | null,
): string | null {
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  if (!safeEqual(sign(payloadB64), sig)) return null;

  try {
    const raw = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(raw) as SessionPayload;
    if (
      typeof payload.uid !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Date.now()
    ) {
      return null;
    }
    return payload.uid;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SEC,
};

export function attachSessionCookie(res: NextResponse, userId: string): void {
  res.cookies.set(SESSION_COOKIE, sealSessionToken(userId), sessionCookieOptions);
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });
}

/** Read authenticated user from the httpOnly session cookie (App Router). */
export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const userId = unsealSessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireSessionUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("UNAUTHORIZED", "请先登录");
  }
  return user;
}

export class AuthError extends Error {
  constructor(
    public readonly code: "UNAUTHORIZED" | "FORBIDDEN",
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Ensure the profile belongs to the given user. */
export async function assertProfileOwned(
  profileId: string,
  userId: string,
): Promise<void> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { userId: true },
  });
  if (!profile) {
    throw new AuthError("FORBIDDEN", "档案不存在或无权访问");
  }
  if (profile.userId !== userId) {
    throw new AuthError("FORBIDDEN", "无权操作该档案");
  }
}

/** Ensure the assessment session belongs to the given user. */
export async function assertAssessmentOwned(
  sessionId: string,
  userId: string,
): Promise<void> {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    select: { profile: { select: { userId: true } } },
  });
  if (!session) {
    throw new AuthError("FORBIDDEN", "会话不存在或无权访问");
  }
  if (session.profile.userId !== userId) {
    throw new AuthError("FORBIDDEN", "无权操作该测评会话");
  }
}

/** Ensure the practice session belongs to the given user. */
export async function assertPracticeOwned(
  practiceSessionId: string,
  userId: string,
): Promise<void> {
  const session = await prisma.practiceSession.findUnique({
    where: { id: practiceSessionId },
    select: { profile: { select: { userId: true } } },
  });
  if (!session) {
    throw new AuthError("FORBIDDEN", "练习会话不存在或无权访问");
  }
  if (session.profile.userId !== userId) {
    throw new AuthError("FORBIDDEN", "无权操作该练习会话");
  }
}

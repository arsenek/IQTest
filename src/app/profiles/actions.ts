"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { profileKindFromBirthDate, yearsOld } from "@/lib/auth/age";
import {
  SESSION_COOKIE,
  getSessionUser,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session/machine";

export type AddProfileState = { error?: string };

export async function addProfileAction(
  _prev: AddProfileState,
  formData: FormData,
): Promise<AddProfileState> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/profiles");

  const displayName = String(formData.get("displayName") ?? "").trim();
  const birthRaw = String(formData.get("birthDate") ?? "").trim();
  if (!displayName || !birthRaw) {
    return { error: "请填写姓名与出生日期" };
  }
  const birthDate = new Date(`${birthRaw}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) {
    return { error: "出生日期无效" };
  }
  const age = yearsOld(birthDate);
  if (age < 6 || age > 90) {
    return { error: "年龄需在 6–90 岁之间（试运行）" };
  }

  await prisma.profile.create({
    data: {
      userId: user.id,
      displayName,
      birthDate,
      kind: profileKindFromBirthDate(birthDate),
    },
  });
  redirect("/profiles");
}

export async function startAssessment(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/profiles");

  const profileId = String(formData.get("profileId") ?? "");
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id },
  });
  if (!profile) {
    throw new Error("档案不存在");
  }

  const existing = await prisma.assessmentSession.findFirst({
    where: { profileId: profile.id, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
  });
  if (existing) {
    redirect(`/assess/${existing.id}`);
  }

  const session = await createSession(profile.id);
  redirect(`/assess/${session.id}`);
}

export async function logout() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  redirect("/");
}

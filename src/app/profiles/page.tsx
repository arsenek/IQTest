import Link from "next/link";
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

async function addProfile(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/profiles");

  const displayName = String(formData.get("displayName") ?? "").trim();
  const birthRaw = String(formData.get("birthDate") ?? "").trim();
  if (!displayName || !birthRaw) {
    throw new Error("请填写姓名与出生日期");
  }
  const birthDate = new Date(`${birthRaw}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) {
    throw new Error("出生日期无效");
  }
  const age = yearsOld(birthDate);
  if (age < 6 || age > 90) {
    throw new Error("年龄需在 6–90 岁之间（试运行）");
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

async function startAssessment(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/profiles");

  const profileId = String(formData.get("profileId") ?? "");
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id },
  });
  if (!profile) {
    throw new Error("档案不存在");
  }
  const session = await createSession(profile.id);
  redirect(`/assess/${session.id}`);
}

async function logout() {
  "use server";
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  redirect("/");
}

export default async function ProfilesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/profiles");
  }

  const profiles = await prisma.profile.findMany({
    where: { userId: user.id },
    orderBy: { displayName: "asc" },
  });
  const children = profiles.filter((p) => p.kind === "CHILD");
  const adults = profiles.filter((p) => p.kind === "ADULT");

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">档案中心</p>
            <h1 className="text-3xl font-semibold md:text-4xl">我的测评档案</h1>
            <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="min-h-10 rounded-xl border border-zinc-300 px-4 text-sm"
            >
              退出登录
            </button>
          </form>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">儿童档案</h2>
          {children.length === 0 ? (
            <p className="text-sm text-zinc-500">尚未添加儿童档案。</p>
          ) : (
            <ul className="grid gap-3">
              {children.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{p.displayName}</p>
                    <p className="text-sm text-zinc-500">
                      {yearsOld(p.birthDate)} 岁 · CHILD
                    </p>
                  </div>
                  <form action={startAssessment}>
                    <input type="hidden" name="profileId" value={p.id} />
                    <button
                      type="submit"
                      className="min-h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white"
                    >
                      开始测评
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">成人档案（本人）</h2>
          {adults.length === 0 ? (
            <p className="text-sm text-zinc-500">尚未创建成人自测档案。</p>
          ) : (
            <ul className="grid gap-3">
              {adults.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{p.displayName}</p>
                    <p className="text-sm text-zinc-500">
                      {yearsOld(p.birthDate)} 岁 · ADULT
                    </p>
                  </div>
                  <form action={startAssessment}>
                    <input type="hidden" name="profileId" value={p.id} />
                    <button
                      type="submit"
                      className="min-h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white"
                    >
                      开始测评
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold">添加档案</h2>
          <p className="mt-1 text-sm text-zinc-500">
            未满 16 岁 → 儿童档案；≥ 16 岁 → 成人档案。
          </p>
          <form action={addProfile} className="mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm">
              显示名称
              <input
                name="displayName"
                required
                maxLength={40}
                placeholder="例如：小明 / 本人"
                className="min-h-11 rounded-xl border border-zinc-300 px-3"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              出生日期
              <input
                name="birthDate"
                type="date"
                required
                className="min-h-11 rounded-xl border border-zinc-300 px-3"
              />
            </label>
            <button
              type="submit"
              className="min-h-11 rounded-xl bg-zinc-900 font-semibold text-white"
            >
              保存档案
            </button>
          </form>
        </section>

        <Link href="/" className="text-sm text-zinc-500 underline-offset-2 hover:underline">
          返回首页
        </Link>
      </main>
    </div>
  );
}

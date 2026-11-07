import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session/machine";

function yearsOld(birthDate: Date, at: Date = new Date()): number {
  let years = at.getFullYear() - birthDate.getFullYear();
  const monthDiff = at.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < birthDate.getDate())) {
    years -= 1;
  }
  return years;
}

async function startOnboarding(formData: FormData) {
  "use server";

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

  const kind = age < 16 ? "CHILD" : "ADULT";
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const profile = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: `guest-${stamp}@iqtest.local`,
        passwordHash: "guest-pending-auth",
      },
    });
    return tx.profile.create({
      data: {
        userId: user.id,
        displayName,
        birthDate,
        kind,
      },
    });
  });

  const session = await createSession(profile.id);
  redirect(`/assess/${session.id}`);
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-12 md:py-16 lg:max-w-2xl lg:py-20">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-zinc-500">建档开测</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            开始测评
          </h1>
          <p className="text-base leading-relaxed text-zinc-600 md:text-lg">
            填写档案后将按年龄进入儿童或成人内容包（未满 16 岁为儿童包）。正式账号登录将在后续版本接入。
          </p>
        </div>

        <form
          action={startOnboarding}
          className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8"
        >
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-700">显示名称</span>
            <input
              name="displayName"
              required
              maxLength={40}
              placeholder="例如：小明 / 张三"
              className="min-h-12 rounded-xl border border-zinc-300 px-4 text-base outline-none focus:border-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-700">出生日期</span>
            <input
              name="birthDate"
              type="date"
              required
              className="min-h-12 rounded-xl border border-zinc-300 px-4 text-base outline-none focus:border-zinc-900"
            />
          </label>

          <p className="text-sm leading-relaxed text-zinc-500">
            规则：年龄 &lt; 16 → 儿童包；≥ 16 → 成人包。儿童请在家长陪同下进行。
          </p>

          <button
            type="submit"
            className="min-h-12 rounded-xl bg-zinc-900 px-6 text-base font-semibold text-white transition hover:bg-zinc-700 md:min-h-14 md:text-lg"
          >
            创建档案并开始
          </button>
        </form>

        <Link
          href="/"
          className="text-sm text-zinc-500 underline-offset-2 hover:underline"
        >
          返回首页
        </Link>
      </main>
    </div>
  );
}

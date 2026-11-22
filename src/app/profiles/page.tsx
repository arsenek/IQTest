import Link from "next/link";
import { redirect } from "next/navigation";
import { yearsOld } from "@/lib/auth/age";
import { profileKindLabel } from "@/lib/auth/labels";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AddProfileForm } from "./AddProfileForm";
import { logout, startAssessment } from "./actions";

const HISTORY_LIMIT = 5;

type ReportScores = {
  narrative: string;
  vci: number;
  pri: number;
  wmi: number;
  psi: number;
};

function weakestIndexKey(report: ReportScores): "VCI" | "PRI" | "WMI" | "PSI" {
  const keys = ["VCI", "PRI", "WMI", "PSI"] as const;
  if (keys.includes(report.narrative as (typeof keys)[number])) {
    return report.narrative as (typeof keys)[number];
  }
  const scores = {
    VCI: report.vci,
    PRI: report.pri,
    WMI: report.wmi,
    PSI: report.psi,
  };
  return keys.reduce((a, b) => (scores[a] <= scores[b] ? a : b));
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export default async function ProfilesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/profiles");
  }

  const profiles = await prisma.profile.findMany({
    where: { userId: user.id },
    orderBy: { displayName: "asc" },
    include: {
      assessments: {
        where: {
          OR: [
            { status: "IN_PROGRESS" },
            { status: "SUBMITTED", report: { isNot: null } },
          ],
        },
        orderBy: { startedAt: "desc" },
        select: {
          id: true,
          status: true,
          currentIndex: true,
          startedAt: true,
          submittedAt: true,
          report: {
            select: {
              narrative: true,
              vci: true,
              pri: true,
              wmi: true,
              psi: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  const inProgress = profiles
    .flatMap((p) =>
      p.assessments
        .filter((a) => a.status === "IN_PROGRESS")
        .map((a) => ({
          profileId: p.id,
          displayName: p.displayName,
          kind: p.kind,
          sessionId: a.id,
          currentIndex: a.currentIndex,
          startedAt: a.startedAt,
        })),
    )
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

  const isEmpty = profiles.length === 0;

  return (
    <div className="hub-page">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="hub-title text-3xl font-semibold md:text-4xl">
              我的档案
            </h1>
            <p className="mt-1 text-sm text-[var(--home-ink-muted)]">
              {user.email}
            </p>
          </div>
          <form action={logout}>
            <button type="submit" className="hub-btn-quiet">
              退出登录
            </button>
          </form>
        </header>

        {isEmpty ? (
          <section
            className="hub-panel flex flex-col gap-6 p-6 md:p-8"
            aria-labelledby="empty-guide"
          >
            <div>
              <h2 id="empty-guide" className="text-xl font-semibold">
                创建第一个档案
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--home-ink-muted)]">
                同一账号可挂多个儿童档案，也可创建成人档案。根据出生日期自动区分：未满
                16 岁为儿童，≥ 16 岁为成人（年龄需在 6–90 岁）。
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-semibold text-[var(--home-ink)]">儿童档案</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--home-ink-muted)]">
                  适合学龄儿童；建议家长陪同。创建后将进入儿童测评体验。
                </p>
              </div>
              <div>
                <p className="font-semibold text-[var(--home-ink)]">成人档案</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--home-ink-muted)]">
                  适合本人自测。创建后将进入成人测评体验。
                </p>
              </div>
            </div>
            <AddProfileForm submitLabel="创建第一个档案" />
          </section>
        ) : (
          <>
            {inProgress.length > 0 && (
              <section
                className="flex flex-col gap-3"
                aria-labelledby="resume-heading"
              >
                <h2 id="resume-heading" className="text-lg font-semibold">
                  继续测评
                </h2>
                <ul className="flex flex-col gap-3">
                  {inProgress.map((item) => (
                    <li key={item.sessionId} className="hub-resume">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">
                            {item.displayName}{" "}
                            <span className="hub-kind">
                              {profileKindLabel(item.kind)}
                            </span>
                          </p>
                          <p className="text-sm text-[var(--home-ink-muted)]">
                            进行中 · 题 {item.currentIndex + 1}
                          </p>
                        </div>
                        <Link
                          href={`/assess/${item.sessionId}`}
                          data-testid="resume-assessment"
                          className="hub-cta"
                        >
                          继续测评
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="flex flex-col gap-4" aria-labelledby="list-heading">
              <h2 id="list-heading" className="text-lg font-semibold">
                全部档案
              </h2>
              <ul className="grid gap-4">
                {profiles.map((p) => {
                  const open = p.assessments.find(
                    (a) => a.status === "IN_PROGRESS",
                  );
                  const history = p.assessments
                    .filter((a) => a.status === "SUBMITTED" && a.report)
                    .slice(0, HISTORY_LIMIT);
                  const age = yearsOld(p.birthDate);
                  const kindZh = profileKindLabel(p.kind);

                  return (
                    <li
                      key={p.id}
                      className="hub-panel flex flex-col gap-4 p-4 md:p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-lg">{p.displayName}</p>
                          <p className="text-sm text-[var(--home-ink-muted)]">
                            {age} 岁 ·{" "}
                            <span className="hub-kind">{kindZh}</span>
                            {open
                              ? ` · 进行中（题 ${open.currentIndex + 1}）`
                              : ""}
                          </p>
                        </div>
                        {open ? (
                          <Link
                            href={`/assess/${open.id}`}
                            data-testid="resume-assessment"
                            className="hub-cta"
                          >
                            继续测评
                          </Link>
                        ) : (
                          <form action={startAssessment}>
                            <input
                              type="hidden"
                              name="profileId"
                              value={p.id}
                            />
                            <button type="submit" className="hub-cta">
                              开始测评
                            </button>
                          </form>
                        )}
                      </div>

                      {history.length > 0 && (
                        <div className="hub-history">
                          <p className="text-sm font-medium text-[var(--home-ink)]">
                            最近报告
                          </p>
                          <ul className="mt-2 flex flex-col gap-2">
                            {history.map((h) => {
                              const report = h.report!;
                              const weak = weakestIndexKey(report);
                              const when =
                                formatDate(h.submittedAt) ||
                                formatDate(report.createdAt);
                              return (
                                <li
                                  key={h.id}
                                  className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <span className="text-[var(--home-ink-muted)]">
                                    {when} · {kindZh}
                                  </span>
                                  <span className="flex flex-wrap gap-3">
                                    <Link
                                      href={`/report/${h.id}`}
                                      className="font-medium text-[var(--home-cta)] underline-offset-2 hover:underline"
                                    >
                                      查看报告
                                    </Link>
                                    <Link
                                      href={`/practice/${weak}?profileId=${encodeURIComponent(p.id)}&sessionId=${encodeURIComponent(h.id)}`}
                                      className="text-[var(--home-ink-muted)] underline-offset-2 hover:underline"
                                    >
                                      去练习
                                    </Link>
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="hub-panel p-6">
              <h2 className="text-lg font-semibold">添加档案</h2>
              <p className="mt-1 text-sm text-[var(--home-ink-muted)]">
                未满 16 岁为儿童档案，≥ 16 为成人档案。年龄范围 6–90。
              </p>
              <AddProfileForm />
            </section>
          </>
        )}

        <Link
          href="/"
          className="text-sm text-[var(--home-ink-muted)] underline-offset-2 hover:underline"
        >
          返回首页
        </Link>
      </main>
    </div>
  );
}

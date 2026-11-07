import Link from "next/link";
import { notFound } from "next/navigation";
import { IndexCard } from "@/components/report/IndexCard";
import { loadNorms } from "@/lib/content/loadNorms";
import { INDEX_KEYS, type IndexKey } from "@/lib/content/types";
import { prisma } from "@/lib/db";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ReportPage({ params }: PageProps) {
  const { sessionId } = await params;

  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    include: { report: true, profile: true },
  });

  if (!session || !session.report) {
    notFound();
  }

  const report = session.report;
  const norms = loadNorms(session.normVersion);
  const scores: Record<IndexKey, number> = {
    VCI: report.vci,
    PRI: report.pri,
    WMI: report.wmi,
    PSI: report.psi,
  };
  const weakest = (INDEX_KEYS.includes(report.narrative as IndexKey)
    ? report.narrative
    : INDEX_KEYS.reduce((a, b) => (scores[a] <= scores[b] ? a : b))) as IndexKey;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14 lg:px-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-zinc-500">测评报告</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {session.profile.displayName} 的结果
            </h1>
            <p className="text-sm text-zinc-500 md:text-base">
              合成分 = 四指数均值（MVP）。点任一指数进入专项练习。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {norms.trial && (
              <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-900">
                试运行
              </span>
            )}
            <span className="rounded-full bg-zinc-200 px-3 py-1 text-sm text-zinc-700">
              常模 {session.normVersion}
            </span>
          </div>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
          <p className="text-sm font-medium text-zinc-500">总合成分</p>
          <p className="mt-2 text-5xl font-semibold tabular-nums md:text-6xl">
            {Math.round(report.composite)}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            精确值 {report.composite.toFixed(2)} · 薄弱指数提示：{weakest}
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INDEX_KEYS.map((key) => (
            <IndexCard
              key={key}
              indexKey={key}
              score={scores[key]}
              profileId={session.profileId}
              reportSessionId={sessionId}
              highlight={key === weakest}
            />
          ))}
        </section>

        <aside className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-950 md:text-base">
          合规提示：本站采用自研题库与占位常模，结构对齐韦氏四指数，非官方韦氏/WISC/WAIS；结果仅供参考，不能替代专业心理或医学评估。儿童请在家长陪同下阅读与练习。
        </aside>

        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-zinc-500 underline-offset-2 hover:underline">
            返回首页
          </Link>
          <Link
            href="/onboarding"
            className="text-zinc-500 underline-offset-2 hover:underline"
          >
            再测一次
          </Link>
        </div>
      </main>
    </div>
  );
}

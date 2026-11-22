import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { IndexCard } from "@/components/report/IndexCard";
import {
  AuthError,
  assertAssessmentOwned,
  getSessionUser,
} from "@/lib/auth/session";
import { INDEX_KEYS, type IndexKey, type ScoringStage } from "@/lib/content/types";
import { prisma } from "@/lib/db";
import {
  compositeScoreHint,
  compositeScoreLabel,
  dualCoreBlurb,
  narrativeParagraph,
  reportComplianceNote,
  stageBadgeLabel,
} from "@/lib/scoring/reportCopy";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

function asScoringStage(value: string): ScoringStage {
  if (value === "calibrated" || value === "standardized" || value === "trial") {
    return value;
  }
  return "trial";
}

export default async function ReportPage({ params }: PageProps) {
  const { sessionId } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/report/${sessionId}`)}`);
  }

  try {
    await assertAssessmentOwned(sessionId, user.id);
  } catch (err) {
    if (err instanceof AuthError) notFound();
    throw err;
  }

  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    include: { report: true, profile: true },
  });

  if (!session || !session.report) {
    notFound();
  }

  const report = session.report;
  const stage = asScoringStage(report.scoringStage);
  const normVersion = report.normVersion || session.normVersion;
  const algorithmVersion = report.algorithmVersion;
  const audience = session.profile.kind === "CHILD" ? "child" : "adult";
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
    <div
      className={`min-h-screen text-zinc-900 ${
        audience === "child" ? "skin-child assess-root bg-[var(--assess-bg)]" : "bg-zinc-50"
      }`}
    >
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14 lg:px-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-zinc-500">
              {audience === "child" ? "给家长的测评报告" : "测评报告"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {session.profile.displayName} 的结果
            </h1>
            <p
              data-testid="report-dual-core-blurb"
              className="max-w-2xl text-sm leading-relaxed text-zinc-600 md:text-base"
            >
              {dualCoreBlurb(audience, stage)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              data-testid="report-stage-badge"
              className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-900"
            >
              {stageBadgeLabel(stage)}
            </span>
            {stage === "trial" && (
              <>
                <span
                  data-testid="report-nonstandard-badge"
                  className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-950"
                >
                  非标准化 IQ
                </span>
                <span
                  data-testid="report-nonclinical-badge"
                  className="rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-950"
                >
                  非临床
                </span>
              </>
            )}
            <span
              data-testid="report-norm-version"
              className="rounded-full bg-zinc-200 px-3 py-1 text-sm text-zinc-700"
            >
              常模 {normVersion}
            </span>
            {algorithmVersion ? (
              <span
                data-testid="report-algorithm-version"
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600"
              >
                算法 {algorithmVersion}
              </span>
            ) : null}
          </div>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
          <p
            data-testid="report-composite-label"
            className="text-sm font-medium text-zinc-500"
          >
            {compositeScoreLabel(stage)}
          </p>
          <p className="mt-2 text-5xl font-semibold tabular-nums md:text-6xl">
            {Math.round(report.composite)}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            精确值 {report.composite.toFixed(2)} · {compositeScoreHint(stage)}
          </p>
          <p
            data-testid="report-narrative"
            className="mt-4 text-sm leading-relaxed text-zinc-700 md:text-base"
          >
            {narrativeParagraph(weakest, audience, stage)}
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
              audience={audience}
              highlight={key === weakest}
            />
          ))}
        </section>

        <aside
          data-testid="report-compliance"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-950 md:text-base"
        >
          {reportComplianceNote(stage)}
        </aside>

        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-zinc-500 underline-offset-2 hover:underline">
            返回首页
          </Link>
          <Link
            href="/profiles"
            className="text-zinc-500 underline-offset-2 hover:underline"
          >
            返回档案
          </Link>
        </div>
      </main>
    </div>
  );
}

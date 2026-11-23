import { prisma } from "@/lib/db";
import type { ExportSessionInput } from "@/lib/export/buildRows";
import { isSimEmail } from "@/lib/sim/constants";

export type ExportQueryOptions = {
  packId?: string;
  since?: Date;
  until?: Date;
  /**
   * When false (default), drop sessions whose user email is `sim-*@iqtest.local`.
   * Use true for sim-pipeline comparison exports only — never mix into human CTT.
   */
  includeSim?: boolean;
};

export type FetchExportableResult = {
  sessions: ExportSessionInput[];
  /** Sessions that matched SUBMITTED+Report (+ pack/date) before sim filtering. */
  matchedBeforeSimFilter: number;
  /** Count removed because the owning user is a sim account. */
  excludedSimSessions: number;
};

/**
 * Load SUBMITTED sessions that have a Report (eligible for Stage-A export).
 * Human Stage-A default: exclude synthetic `sim-*@iqtest.local` accounts.
 */
export async function fetchExportableSessions(
  options: ExportQueryOptions = {},
): Promise<FetchExportableResult> {
  const includeSim = options.includeSim === true;

  const sessions = await prisma.assessmentSession.findMany({
    where: {
      status: "SUBMITTED",
      report: { isNot: null },
      ...(options.packId ? { packId: options.packId } : {}),
      ...(options.since || options.until
        ? {
            submittedAt: {
              ...(options.since ? { gte: options.since } : {}),
              ...(options.until ? { lte: options.until } : {}),
            },
          }
        : {}),
    },
    include: {
      profile: { include: { user: { select: { email: true } } } },
      report: true,
      responses: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { submittedAt: "asc" },
  });

  const matchedBeforeSimFilter = sessions.length;
  const kept = includeSim
    ? sessions
    : sessions.filter((s) => !isSimEmail(s.profile.user.email));
  const excludedSimSessions = matchedBeforeSimFilter - kept.length;

  return {
    matchedBeforeSimFilter,
    excludedSimSessions,
    sessions: kept.map((s) => ({
      id: s.id,
      packId: s.packId,
      normVersion: s.normVersion,
      playlistJson: s.playlistJson,
      status: s.status,
      submittedAt: s.submittedAt,
      startedAt: s.startedAt,
      profile: {
        id: s.profile.id,
        kind: s.profile.kind,
        birthDate: s.profile.birthDate,
      },
      report: s.report
        ? {
            scoringStage: s.report.scoringStage,
            normVersion: s.report.normVersion,
            algorithmVersion: s.report.algorithmVersion,
          }
        : null,
      responses: s.responses.map((r) => ({
        itemId: r.itemId,
        subtestId: r.subtestId,
        answerJson: r.answerJson,
        correct: r.correct,
        rawScore: r.rawScore,
        latencyMs: r.latencyMs,
        createdAt: r.createdAt,
      })),
    })),
  };
}

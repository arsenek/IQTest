import { prisma } from "@/lib/db";
import type { ExportSessionInput } from "@/lib/export/buildRows";

export type ExportQueryOptions = {
  packId?: string;
  since?: Date;
  until?: Date;
};

/**
 * Load SUBMITTED sessions that have a Report (eligible for Stage-A export).
 */
export async function fetchExportableSessions(
  options: ExportQueryOptions = {},
): Promise<ExportSessionInput[]> {
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
      profile: true,
      report: true,
      responses: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { submittedAt: "asc" },
  });

  return sessions.map((s) => ({
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
  }));
}

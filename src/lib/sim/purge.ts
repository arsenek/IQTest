import { prisma } from "@/lib/db";
import { isSimEmail, simEmailForPersona } from "@/lib/sim/constants";

export type PurgeResult = {
  deletedUsers: number;
  deletedProfiles: number;
  deletedSessions: number;
  deletedResponses: number;
  deletedReports: number;
  emails: string[];
};

/**
 * Delete only synthetic users (sim-*@iqtest.local) and cascaded assessment data.
 * Never touches real users.
 */
export async function purgeSimUsers(opts: {
  personaId?: string;
  allSim?: boolean;
}): Promise<PurgeResult> {
  if (!opts.personaId && !opts.allSim) {
    throw new Error("Specify --persona <id> or --all-sim");
  }
  if (opts.personaId && opts.allSim) {
    throw new Error("Use either --persona or --all-sim, not both");
  }

  const users = opts.allSim
    ? await prisma.user.findMany({
        where: {
          email: { startsWith: "sim-", endsWith: "@iqtest.local" },
        },
      })
    : await prisma.user.findMany({
        where: { email: simEmailForPersona(opts.personaId!) },
      });

  // Belt-and-suspenders: never delete non-sim emails even if query drifts.
  const safe = users.filter((u) => isSimEmail(u.email));
  if (safe.length === 0) {
    return {
      deletedUsers: 0,
      deletedProfiles: 0,
      deletedSessions: 0,
      deletedResponses: 0,
      deletedReports: 0,
      emails: [],
    };
  }

  const userIds = safe.map((u) => u.id);
  const profiles = await prisma.profile.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const profileIds = profiles.map((p) => p.id);
  const sessions = await prisma.assessmentSession.findMany({
    where: { profileId: { in: profileIds } },
    select: { id: true },
  });
  const sessionIds = sessions.map((s) => s.id);

  const practiceSessions = await prisma.practiceSession.findMany({
    where: { profileId: { in: profileIds } },
    select: { id: true },
  });
  const practiceIds = practiceSessions.map((s) => s.id);

  const [deletedReports, deletedResponses, deletedPracticeProgress] =
    await prisma.$transaction([
      prisma.report.deleteMany({ where: { sessionId: { in: sessionIds } } }),
      prisma.response.deleteMany({ where: { sessionId: { in: sessionIds } } }),
      prisma.practiceProgress.deleteMany({
        where: { sessionId: { in: practiceIds } },
      }),
    ]);

  const [deletedAssessmentSessions, deletedPracticeSessions] =
    await prisma.$transaction([
      prisma.assessmentSession.deleteMany({
        where: { id: { in: sessionIds } },
      }),
      prisma.practiceSession.deleteMany({ where: { id: { in: practiceIds } } }),
    ]);

  const deletedProfiles = await prisma.profile.deleteMany({
    where: { id: { in: profileIds } },
  });
  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });

  void deletedPracticeProgress;

  return {
    deletedUsers: deletedUsers.count,
    deletedProfiles: deletedProfiles.count,
    deletedSessions: deletedAssessmentSessions.count,
    deletedResponses: deletedResponses.count,
    deletedReports: deletedReports.count,
    emails: safe.map((u) => u.email),
  };
}

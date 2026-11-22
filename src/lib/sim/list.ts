import { prisma } from "@/lib/db";
import { isSimEmail, personaIdFromSimEmail } from "@/lib/sim/constants";

export type SimListRow = {
  personaId: string | null;
  email: string;
  userId: string;
  profileId: string | null;
  displayName: string | null;
  kind: string | null;
  sessionId: string | null;
  sessionStatus: string | null;
  responseCount: number;
  hasReport: boolean;
  composite: number | null;
  submittedAt: string | null;
};

export async function listSimExaminees(): Promise<SimListRow[]> {
  const users = await prisma.user.findMany({
    where: {
      email: { startsWith: "sim-", endsWith: "@iqtest.local" },
    },
    include: {
      profiles: {
        include: {
          assessments: {
            orderBy: { startedAt: "desc" },
            take: 1,
            include: {
              report: true,
              _count: { select: { responses: true } },
            },
          },
        },
      },
    },
    orderBy: { email: "asc" },
  });

  const rows: SimListRow[] = [];
  for (const u of users) {
    if (!isSimEmail(u.email)) continue;
    const profile = u.profiles[0] ?? null;
    const session = profile?.assessments[0] ?? null;
    rows.push({
      personaId: personaIdFromSimEmail(u.email),
      email: u.email,
      userId: u.id,
      profileId: profile?.id ?? null,
      displayName: profile?.displayName ?? null,
      kind: profile?.kind ?? null,
      sessionId: session?.id ?? null,
      sessionStatus: session?.status ?? null,
      responseCount: session?._count.responses ?? 0,
      hasReport: Boolean(session?.report),
      composite: session?.report?.composite ?? null,
      submittedAt: session?.submittedAt?.toISOString() ?? null,
    });
  }
  return rows;
}

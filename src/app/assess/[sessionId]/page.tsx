import { notFound, redirect } from "next/navigation";
import {
  AssessmentShell,
  type ShellItem,
} from "@/components/assessment/AssessmentShell";
import {
  AuthError,
  assertAssessmentOwned,
  getSessionUser,
} from "@/lib/auth/session";
import {
  flattenPack,
  resumeSession,
  SessionError,
} from "@/lib/session/machine";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function AssessPage({ params }: PageProps) {
  const { sessionId } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/assess/${sessionId}`)}`);
  }

  try {
    await assertAssessmentOwned(sessionId, user.id);
  } catch (err) {
    if (err instanceof AuthError) notFound();
    throw err;
  }

  let resumed;
  try {
    resumed = await resumeSession(sessionId);
  } catch (err) {
    if (err instanceof SessionError && err.code === "SESSION_NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  const playlist = resumed.playlist;
  const items: ShellItem[] = flattenPack(playlist).map((row) => ({
    globalIndex: row.globalIndex,
    subtestId: row.subtestId,
    indexKey: row.indexKey,
    id: row.item.id,
    type: row.item.type,
    prompt: row.item.prompt,
    choices: row.item.choices,
    timeLimitMs: row.item.timeLimitMs,
    encodeMs: row.item.encodeMs,
    maskStem: row.item.maskStem,
  }));

  return (
    <AssessmentShell
      sessionId={sessionId}
      audience={playlist.audience}
      title={playlist.title}
      items={items}
      initialIndex={resumed.currentIndex}
      initialStatus={resumed.status}
    />
  );
}

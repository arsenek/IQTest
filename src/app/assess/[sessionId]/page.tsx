import { notFound } from "next/navigation";
import {
  AssessmentShell,
  type ShellItem,
} from "@/components/assessment/AssessmentShell";
import { loadPack } from "@/lib/content/loadPack";
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

  let resumed;
  try {
    resumed = await resumeSession(sessionId);
  } catch (err) {
    if (err instanceof SessionError && err.code === "SESSION_NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  const pack = loadPack(resumed.session.packId);
  const items: ShellItem[] = flattenPack(pack).map((row) => ({
    globalIndex: row.globalIndex,
    subtestId: row.subtestId,
    indexKey: row.indexKey,
    id: row.item.id,
    type: row.item.type,
    prompt: row.item.prompt,
    choices: row.item.choices,
    timeLimitMs: row.item.timeLimitMs,
  }));

  return (
    <AssessmentShell
      sessionId={sessionId}
      audience={pack.audience}
      title={pack.title}
      items={items}
      initialIndex={resumed.currentIndex}
      initialStatus={resumed.status}
    />
  );
}

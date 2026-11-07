import { notFound, redirect } from "next/navigation";
import { PracticeRoom } from "@/components/practice/PracticeRoom";
import {
  AuthError,
  assertProfileOwned,
  getSessionUser,
} from "@/lib/auth/session";
import { INDEX_KEYS, type IndexKey } from "@/lib/content/types";
import {
  getPracticeItemsForProfile,
  PracticeError,
} from "@/lib/practice/run";

type PageProps = {
  params: Promise<{ indexKey: string }>;
  searchParams: Promise<{ profileId?: string; sessionId?: string }>;
};

function asIndexKey(value: string): IndexKey | null {
  return (INDEX_KEYS as readonly string[]).includes(value)
    ? (value as IndexKey)
    : null;
}

export default async function PracticePage({ params, searchParams }: PageProps) {
  const { indexKey: rawKey } = await params;
  const { profileId, sessionId } = await searchParams;
  const indexKey = asIndexKey(rawKey);

  if (!indexKey || !profileId) {
    notFound();
  }

  const user = await getSessionUser();
  if (!user) {
    const next = `/practice/${indexKey}?profileId=${encodeURIComponent(profileId)}${
      sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : ""
    }`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  try {
    await assertProfileOwned(profileId, user.id);
  } catch (err) {
    if (err instanceof AuthError) notFound();
    throw err;
  }

  let items;
  let audience: "child" | "adult" = "child";
  try {
    ({ items, audience } = await getPracticeItemsForProfile(
      profileId,
      indexKey,
    ));
  } catch (err) {
    if (err instanceof PracticeError) notFound();
    throw err;
  }

  return (
    <PracticeRoom
      indexKey={indexKey}
      profileId={profileId}
      reportSessionId={sessionId}
      items={items}
      audience={audience}
    />
  );
}

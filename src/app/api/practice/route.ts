import { NextResponse } from "next/server";
import {
  PracticeError,
  recordPracticeRound,
  startPractice,
} from "@/lib/practice/run";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const action = (body as { action?: unknown }).action;

  try {
    if (action === "start") {
      const { profileId, indexKey } = body as {
        profileId?: unknown;
        indexKey?: unknown;
      };
      if (typeof profileId !== "string" || typeof indexKey !== "string") {
        return NextResponse.json(
          { error: "profileId and indexKey required" },
          { status: 400 },
        );
      }
      const session = await startPractice(profileId, indexKey);
      return NextResponse.json({ session }, { status: 201 });
    }

    if (action === "progress") {
      const { practiceSessionId, answers } = body as {
        practiceSessionId?: unknown;
        answers?: unknown;
      };
      if (
        typeof practiceSessionId !== "string" ||
        !Array.isArray(answers)
      ) {
        return NextResponse.json(
          { error: "practiceSessionId and answers required" },
          { status: 400 },
        );
      }
      const result = await recordPracticeRound(
        practiceSessionId,
        answers as { itemId: string; answer: string | number | string[] }[],
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    if (err instanceof PracticeError) {
      const status =
        err.code === "PROFILE_NOT_FOUND" || err.code === "PRACTICE_NOT_FOUND"
          ? 404
          : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { recordAnswer, SessionError } from "@/lib/session/machine";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id: sessionId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { answer, latencyMs, itemId } = body as {
    answer?: unknown;
    latencyMs?: unknown;
    itemId?: unknown;
  };

  if (
    answer === undefined ||
    answer === null ||
    typeof latencyMs !== "number" ||
    (itemId !== undefined && typeof itemId !== "string")
  ) {
    return NextResponse.json(
      { error: "answer and latencyMs are required" },
      { status: 400 },
    );
  }

  if (
    !(
      typeof answer === "string" ||
      typeof answer === "number" ||
      (Array.isArray(answer) && answer.every((a) => typeof a === "string"))
    )
  ) {
    return NextResponse.json({ error: "Invalid answer type" }, { status: 400 });
  }

  try {
    const result = await recordAnswer(sessionId, {
      answer,
      latencyMs,
      itemId,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SessionError) {
      const status =
        err.code === "SESSION_NOT_FOUND"
          ? 404
          : err.code === "SESSION_NOT_IN_PROGRESS"
            ? 409
            : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

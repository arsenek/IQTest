import { NextResponse } from "next/server";
import { submitSession, SessionError } from "@/lib/session/machine";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id: sessionId } = await context.params;

  try {
    const report = await submitSession(sessionId);
    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof SessionError) {
      const status = err.code === "SESSION_NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

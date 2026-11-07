import { NextResponse } from "next/server";
import { createSession, SessionError } from "@/lib/session/machine";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const profileId =
    body &&
    typeof body === "object" &&
    "profileId" in body &&
    typeof (body as { profileId: unknown }).profileId === "string"
      ? (body as { profileId: string }).profileId
      : null;

  if (!profileId) {
    return NextResponse.json({ error: "profileId is required" }, { status: 400 });
  }

  try {
    const session = await createSession(profileId);
    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    if (err instanceof SessionError) {
      const status = err.code === "PROFILE_NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

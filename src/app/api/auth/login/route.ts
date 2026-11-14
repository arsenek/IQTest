import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { attachSessionCookie } from "@/lib/auth/session";
import { prisma, withPrismaRetry } from "@/lib/db";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email =
    body &&
    typeof body === "object" &&
    typeof (body as { email?: unknown }).email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";
  const password =
    body &&
    typeof body === "object" &&
    typeof (body as { password?: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!email || !password) {
    return NextResponse.json({ error: "请输入邮箱和密码" }, { status: 400 });
  }

  const user = await withPrismaRetry(() =>
    prisma.user.findUnique({ where: { email } }),
  );
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }

  const res = NextResponse.json({
    user: { id: user.id, email: user.email },
  });
  attachSessionCookie(res, user.id);
  return res;
}

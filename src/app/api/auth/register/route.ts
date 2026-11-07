import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { attachSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

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

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "请输入有效邮箱" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "密码至少 8 位" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });

  const res = NextResponse.json(
    { user: { id: user.id, email: user.email } },
    { status: 201 },
  );
  attachSessionCookie(res, user.id);
  return res;
}

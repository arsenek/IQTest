"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/profiles";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "登录失败");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-14">
        <div>
          <p className="text-sm font-medium text-zinc-500">账号</p>
          <h1 className="mt-1 text-3xl font-semibold">登录</h1>
        </div>
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6"
        >
          <label className="flex flex-col gap-2 text-sm">
            邮箱
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="min-h-11 rounded-xl border border-zinc-300 px-3"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            密码
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="min-h-11 rounded-xl border border-zinc-300 px-3"
            />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 rounded-xl bg-zinc-900 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "登录中…" : "登录"}
          </button>
        </form>
        <p className="text-sm text-zinc-500">
          还没有账号？{" "}
          <Link
            href={`/register?next=${encodeURIComponent(next)}`}
            className="underline-offset-2 hover:underline"
          >
            注册
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">加载中…</div>}>
      <LoginForm />
    </Suspense>
  );
}

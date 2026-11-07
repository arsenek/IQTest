import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-900">
      <main className="flex w-full max-w-xl flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          IQTest
        </h1>
        <p className="text-base leading-relaxed text-zinc-600 sm:text-lg">
          结构对齐 + 自研题库（试运行）
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href={user ? "/profiles" : "/register?next=/profiles"}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-zinc-900 px-8 text-base font-medium text-white transition-colors hover:bg-zinc-700"
          >
            {user ? "我的档案" : "开始测评"}
          </Link>
          {!user && (
            <Link
              href="/login?next=/profiles"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-zinc-300 bg-white px-8 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              登录
            </Link>
          )}
        </div>
        <p className="max-w-md text-sm leading-relaxed text-zinc-500">
          本站采用自研题库，结构对齐韦氏四指数；结果仅供参考，不能替代专业评估。
        </p>
      </main>
    </div>
  );
}

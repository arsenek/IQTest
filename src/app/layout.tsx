import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IQTest — 认知测评",
  description:
    "结构对齐韦氏四指数的自研认知测评（试运行）。结果仅供参考，不能替代专业评估。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <div className="flex-1">{children}</div>
        <footer className="border-t border-zinc-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between md:px-8">
            <p>IQTest · 结构对齐 + 自研题库（试运行）</p>
            <nav className="flex flex-wrap gap-4">
              <Link
                href="/legal/disclaimer"
                className="underline-offset-2 hover:text-zinc-800 hover:underline"
              >
                免责声明
              </Link>
              <Link
                href="/profiles"
                className="underline-offset-2 hover:text-zinc-800 hover:underline"
              >
                我的档案
              </Link>
              <Link
                href="/"
                className="underline-offset-2 hover:text-zinc-800 hover:underline"
              >
                首页
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}

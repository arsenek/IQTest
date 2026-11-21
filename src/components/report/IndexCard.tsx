import Link from "next/link";
import type { IndexKey } from "@/lib/content/types";
import {
  INDEX_LABELS,
  indexExplain,
  practiceCta,
} from "@/lib/scoring/reportCopy";

type IndexCardProps = {
  indexKey: IndexKey;
  score: number;
  profileId: string;
  reportSessionId: string;
  audience: "child" | "adult";
  highlight?: boolean;
};

export function IndexCard({
  indexKey,
  score,
  profileId,
  reportSessionId,
  audience,
  highlight = false,
}: IndexCardProps) {
  const href = `/practice/${indexKey}?profileId=${encodeURIComponent(profileId)}&sessionId=${encodeURIComponent(reportSessionId)}`;

  return (
    <Link
      href={href}
      data-testid={`index-card-${indexKey}`}
      className={`flex flex-col gap-3 rounded-2xl border p-5 transition hover:border-zinc-400 md:p-6 ${
        highlight
          ? "border-amber-400 bg-amber-50 shadow-sm"
          : "border-zinc-200 bg-white"
      } ${audience === "child" ? "skin-child" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            {indexKey}
          </p>
          <h2 className="text-lg font-semibold text-zinc-900 md:text-xl">
            {INDEX_LABELS[indexKey]}
          </h2>
        </div>
        {highlight && (
          <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-medium text-amber-950">
            {audience === "child" ? "建议多练" : "相对薄弱"}
          </span>
        )}
      </div>
      <p className="text-3xl font-semibold tabular-nums text-zinc-900 md:text-4xl">
        {Math.round(score)}
      </p>
      <p className="text-sm leading-relaxed text-zinc-500">
        {indexExplain(indexKey, audience)}
      </p>
      <p
        data-testid={`practice-cta-${indexKey}`}
        className="text-sm font-medium text-zinc-700"
      >
        {practiceCta(indexKey, audience, highlight)}
      </p>
    </Link>
  );
}

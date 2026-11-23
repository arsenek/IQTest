import { NextResponse } from "next/server";
import { authorizeExportRequest } from "@/lib/export/access";
import { buildRowsForSessions } from "@/lib/export/buildRows";
import { rowsToCsv, rowsToJsonl } from "@/lib/export/format";
import { resolveExportSalt } from "@/lib/export/hashProfile";
import { fetchExportableSessions } from "@/lib/export/query";

export const runtime = "nodejs";

/**
 * Admin/dev-only Stage-A export.
 * Requires ENABLE_RESPONSE_EXPORT=1 (or NODE_ENV=development) and
 * Authorization: Bearer $EXPORT_TOKEN.
 */
export async function GET(request: Request) {
  const auth = authorizeExportRequest(request.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.reason },
      { status: auth.status },
    );
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "jsonl";
  if (format !== "jsonl" && format !== "csv") {
    return NextResponse.json(
      { error: "format must be jsonl or csv" },
      { status: 400 },
    );
  }

  const packId = url.searchParams.get("pack") ?? undefined;
  const includeSim =
    url.searchParams.get("includeSim") === "1" ||
    url.searchParams.get("includeSim") === "true";
  let salt: string;
  try {
    salt = resolveExportSalt();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "salt missing" },
      { status: 500 },
    );
  }

  const { sessions } = await fetchExportableSessions({ packId, includeSim });
  const { rows } = buildRowsForSessions(sessions, salt);

  if (format === "csv") {
    return new NextResponse(rowsToCsv(rows), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="responses.csv"',
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(rowsToJsonl(rows), {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Content-Disposition": 'attachment; filename="responses.jsonl"',
      "Cache-Control": "no-store",
    },
  });
}

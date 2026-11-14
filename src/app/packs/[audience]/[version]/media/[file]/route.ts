import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const ALLOWED_AUDIENCE = new Set(["child", "adult"]);
const ALLOWED_VERSION = new Set(["v1"]);
const SAFE_FILE = /^[a-z0-9][a-z0-9._-]*\.svg$/i;

type RouteParams = {
  params: Promise<{ audience: string; version: string; file: string }>;
};

/**
 * Serve pack SVG media from content/packs/{audience}/{version}/media/.
 * URL: /packs/child/v1/media/pri-01-stem.svg
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { audience, version, file } = await params;

  if (!ALLOWED_AUDIENCE.has(audience) || !ALLOWED_VERSION.has(version)) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!SAFE_FILE.test(file)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const abs = path.join(
    process.cwd(),
    "content",
    "packs",
    audience,
    version,
    "media",
    file,
  );
  const root = path.join(
    process.cwd(),
    "content",
    "packs",
    audience,
    version,
    "media",
  );
  if (!abs.startsWith(root + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const body = await readFile(abs);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

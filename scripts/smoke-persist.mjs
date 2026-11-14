#!/usr/bin/env node
/**
 * Smoke: register → answer → restart DB → login resume.
 * Usage: node scripts/smoke-persist.mjs
 */
import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.IQTEST_BASE_URL ?? "http://127.0.0.1:3000";
const dataDir = path.join(root, ".data", "postgres");
const pgBin =
  ["/opt/homebrew/opt/postgresql@16/bin", "/usr/local/opt/postgresql@16/bin"].find(
    (p) => fs.existsSync(path.join(p, "pg_ctl")),
  ) ?? null;

let prisma = new PrismaClient();
const email = `persist-smoke-${Date.now()}@example.com`;
const password = "password123";

async function refreshPrisma() {
  try {
    await prisma.$disconnect();
  } catch {
    // ignore
  }
  prisma = new PrismaClient();
  await prisma.$connect();
}

function jarCookies(setCookieHeaders) {
  const jar = new Map();
  for (const raw of setCookieHeaders) {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
  return jar;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function jsonFetch(url, { method = "GET", body, jar } = {}) {
  const headers = { "content-type": "application/json" };
  if (jar?.size) headers.cookie = cookieHeader(jar);
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = typeof res.headers.getSetCookie === "function"
    ? res.headers.getSetCookie()
    : res.headers.get("set-cookie")
      ? [res.headers.get("set-cookie")]
      : [];
  if (jar && set.length) {
    for (const [k, v] of jarCookies(set)) jar.set(k, v);
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { res, data };
}

function restartLocalPostgres() {
  if (!pgBin || !fs.existsSync(path.join(dataDir, "PG_VERSION"))) {
    console.log("SKIP_DB_RESTART: no local .data/postgres (Docker volume assumed durable)");
    return;
  }
  const pgCtl = path.join(pgBin, "pg_ctl");
  console.log("Stopping local Postgres…");
  spawnSync(pgCtl, ["-D", dataDir, "stop", "-m", "fast"], { stdio: "inherit" });
  console.log("Starting local Postgres…");
  const start = spawnSync(
    pgCtl,
    ["-D", dataDir, "-l", path.join(dataDir, "server.log"), "-o", "-p 5432", "start"],
    { stdio: "inherit" },
  );
  if (start.status !== 0) {
    throw new Error("Failed to restart local Postgres");
  }
  spawnSync("sleep", ["1"]);
}

const jar = new Map();

console.log("1) register", email);
let { res, data } = await jsonFetch(`${base}/api/auth/register`, {
  method: "POST",
  jar,
  body: { email, password },
});
if (!res.ok) throw new Error(`register failed: ${res.status} ${JSON.stringify(data)}`);

const user = await prisma.user.findUniqueOrThrow({ where: { email } });
const birthDate = new Date();
birthDate.setFullYear(birthDate.getFullYear() - 8);
const profile = await prisma.profile.create({
  data: {
    userId: user.id,
    displayName: "冒烟儿童",
    birthDate,
    kind: "CHILD",
  },
});

console.log("2) create session");
({ res, data } = await jsonFetch(`${base}/api/sessions`, {
  method: "POST",
  jar,
  body: { profileId: profile.id },
}));
if (!res.ok) throw new Error(`create session failed: ${res.status} ${JSON.stringify(data)}`);
const sessionId = data.session.id;
const playlistBefore = data.session.playlistJson;
const flat = [];
for (const sub of playlistBefore.subtests) {
  for (const item of sub.items) flat.push(item);
}
const answeredIds = flat.slice(0, 3).map((i) => i.id);

console.log("3) answer 3 items", answeredIds);
for (let i = 0; i < 3; i++) {
  const item = flat[i];
  ({ res, data } = await jsonFetch(`${base}/api/sessions/${sessionId}/answer`, {
    method: "POST",
    jar,
    body: { answer: item.answer, latencyMs: 700 + i, itemId: item.id },
  }));
  if (!res.ok) throw new Error(`answer ${i} failed: ${res.status} ${JSON.stringify(data)}`);
}

const mid = await prisma.assessmentSession.findUniqueOrThrow({
  where: { id: sessionId },
  include: { responses: true },
});
if (mid.currentIndex !== 3 || mid.responses.length !== 3) {
  throw new Error(`expected index=3 responses=3, got ${mid.currentIndex}/${mid.responses.length}`);
}

console.log("4) restart DB");
restartLocalPostgres();
await refreshPrisma();

console.log("5) login again + resume");
jar.clear();
for (let attempt = 1; attempt <= 5; attempt++) {
  ({ res, data } = await jsonFetch(`${base}/api/auth/login`, {
    method: "POST",
    jar,
    body: { email, password },
  }));
  if (res.ok) break;
  if (attempt === 5) {
    throw new Error(`login failed: ${res.status} ${JSON.stringify(data)}`);
  }
  await new Promise((r) => setTimeout(r, 500 * attempt));
}

let resumed;
for (let attempt = 1; attempt <= 5; attempt++) {
  try {
    resumed = await prisma.assessmentSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { responses: true },
    });
    break;
  } catch (err) {
    if (attempt === 5) throw err;
    await refreshPrisma();
    await new Promise((r) => setTimeout(r, 400 * attempt));
  }
}
const afterIds = [];
for (const sub of resumed.playlistJson.subtests) {
  for (const item of sub.items) afterIds.push(item.id);
}
if (JSON.stringify(afterIds.slice(0, 5)) !== JSON.stringify(flat.slice(0, 5).map((i) => i.id))) {
  throw new Error("playlist order changed after DB restart");
}
if (resumed.currentIndex !== 3 || resumed.responses.length !== 3) {
  throw new Error("progress lost after DB restart");
}

const page = await fetch(`${base}/assess/${sessionId}`, {
  headers: { cookie: cookieHeader(jar) },
  redirect: "manual",
});
if (page.status !== 200) {
  throw new Error(`assess page status ${page.status}`);
}
const html = await page.text();
if (!html.includes(flat[3].id) && !html.includes("进度")) {
  // Soft check: page should render assessment shell
  if (!html.includes("assess-root") && !html.includes("测评")) {
    throw new Error("assess page missing expected content");
  }
}

console.log("SMOKE_OK", {
  email,
  sessionId,
  currentIndex: resumed.currentIndex,
  responses: resumed.responses.length,
  nextItemId: flat[3].id,
});

await prisma.$disconnect();

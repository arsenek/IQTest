/**
 * One-shot: seed a trial report, open it authenticated, screenshot badges.
 * Usage: node scripts/screenshot-report-trial.mjs [outPath]
 */
import { createHmac } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const outPath =
  process.argv[2] ||
  path.join(
    process.env.HOME,
    "Library/Application Support/Cursor/AgentStores/cursor_agent_stores/bc-e22a3235-f008-4a39-a63b-b7459f265980/files/media/report-trial-badge.png",
  );

const AUTH_SECRET =
  process.env.AUTH_SECRET ?? "dev-insecure-auth-secret-change-me";
const SESSION_COOKIE = "iqtest_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14;

function sealSessionToken(userId) {
  const payload = {
    uid: userId,
    exp: Date.now() + SESSION_MAX_AGE_SEC * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const sig = createHmac("sha256", AUTH_SECRET)
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${sig}`;
}

const prisma = new PrismaClient();

async function main() {
  const email = `shot-${Date.now()}@iqtest.local`;
  const passwordHash = await bcrypt.hash("password12", 10);
  const birth = new Date();
  birth.setFullYear(birth.getFullYear() - 10);

  const user = await prisma.user.create({
    data: { email, passwordHash },
  });
  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      displayName: "试运行徽章",
      birthDate: birth,
      kind: "CHILD",
    },
  });
  const session = await prisma.assessmentSession.create({
    data: {
      profileId: profile.id,
      packId: "child/v1",
      normVersion: "placeholder/v1",
      status: "SUBMITTED",
      currentIndex: 4,
      submittedAt: new Date(),
    },
  });
  await prisma.report.create({
    data: {
      sessionId: session.id,
      vci: 102,
      pri: 98,
      wmi: 94,
      psi: 100,
      composite: 98.5,
      narrative: "WMI",
      scoringStage: "trial",
      normVersion: "placeholder/v1",
      algorithmVersion: "scale-z/v1",
    },
  });

  mkdirSync(path.dirname(outPath), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: sealSessionToken(user.id),
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:3000/report/${session.id}`, {
    waitUntil: "networkidle",
  });
  await page.getByTestId("report-stage-badge").waitFor({ state: "visible" });
  await page.getByTestId("report-nonstandard-badge").waitFor({ state: "visible" });
  await page.locator("header").screenshot({ path: outPath });
  console.log(`wrote ${outPath}`);
  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});

/**
 * List synthetic examinees in the preview DB.
 *
 *   npm run sim:list
 */
import { prisma } from "../src/lib/db";
import { listSimExaminees } from "../src/lib/sim/list";

async function main() {
  const rows = await listSimExaminees();
  if (rows.length === 0) {
    console.log("sim examinees: 0");
    return;
  }
  console.log(`sim examinees: ${rows.length}`);
  for (const r of rows) {
    console.log(
      [
        r.personaId ?? "?",
        r.email,
        r.kind ?? "-",
        r.sessionStatus ?? "no-session",
        `responses=${r.responseCount}`,
        r.hasReport ? `composite=${r.composite?.toFixed(1)}` : "no-report",
        r.submittedAt ?? "",
      ].join("\t"),
    );
  }
}

main()
  .catch((err) => {
    console.error("error:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Delete synthetic examinees only (sim-*@iqtest.local).
 *
 *   npm run sim:purge -- --persona sim-c01
 *   npm run sim:purge -- --all-sim
 */
import { prisma } from "../src/lib/db";
import { purgeSimUsers } from "../src/lib/sim/purge";

function parseArgs(argv: string[]) {
  const out: { personaId?: string; allSim?: boolean; help?: boolean } = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--persona" && next) {
      out.personaId = next;
      i++;
    } else if (a === "--all-sim") {
      out.allSim = true;
    } else if (a === "--help" || a === "-h") {
      out.help = true;
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.personaId && !args.allSim)) {
    console.log(`Usage: npm run sim:purge -- --persona <id> | --all-sim

  Only deletes users with email sim-*@iqtest.local and their
  profiles / sessions / responses / reports. Real users are untouched.`);
    process.exit(args.help ? 0 : 1);
  }

  const result = await purgeSimUsers({
    personaId: args.personaId,
    allSim: args.allSim,
  });
  console.log(
    `purged: users=${result.deletedUsers} profiles=${result.deletedProfiles} sessions=${result.deletedSessions} responses=${result.deletedResponses} reports=${result.deletedReports}`,
  );
  for (const email of result.emails) {
    console.log(`deleted: ${email}`);
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

/**
 * Idempotent synthetic examinee seed (IQT-40).
 * Detect existing sim email → skip; else full SUBMITTED + Report.
 *
 *   npm run sim:seed -- --count 50
 *   npm run sim:seed -- --persona sim-c01
 */
import { prisma } from "../src/lib/db";
import { loadPersonasFile, selectPersonas } from "../src/lib/sim/personas";
import { seedOnePersona } from "../src/lib/sim/seedOne";

function parseArgs(argv: string[]) {
  const out: { count?: number; personaIds?: string[]; help?: boolean } = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--count" && next) {
      out.count = Number(next);
      i++;
    } else if (a === "--persona" && next) {
      out.personaIds = out.personaIds ?? [];
      out.personaIds.push(next);
      i++;
    } else if (a === "--help" || a === "-h") {
      out.help = true;
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: npm run sim:seed -- [--count N] [--persona id ...]

  Idempotent: same persona id / sim-*@iqtest.local email will not re-seed
  if a SUBMITTED session with Report already exists.

  ⚠️ Synthetic data only — not human norms; reports remain trial.`);
    process.exit(0);
  }

  const file = loadPersonasFile();
  console.log(`personas: ${file.version} (${file.count})`);
  console.log(`disclaimer: ${file.disclaimer}`);

  const selected = selectPersonas(file.personas, {
    count: args.count,
    personaIds: args.personaIds,
  });

  let added = 0;
  let skip = 0;
  for (const persona of selected) {
    const result = await seedOnePersona(persona);
    if (result.status === "added") {
      added += 1;
      console.log(
        `added: ${result.personaId} ${result.email} session=${result.sessionId} composite=${result.composite.toFixed(1)} correct=${result.correctCount}/${result.totalItems}`,
      );
    } else {
      skip += 1;
      console.log(
        `skip: ${result.personaId} ${result.email} (${result.reason})`,
      );
    }
  }

  console.log(`done: added=${added} skip=${skip} total=${selected.length}`);
}

main()
  .catch((err) => {
    console.error("error:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

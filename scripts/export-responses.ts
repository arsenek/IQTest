/**
 * Stage-A response export for CTT/IRT calibration prep.
 *
 * Human Stage A (default — excludes sim-*@iqtest.local):
 *   npm run export:responses -- --out ./tmp/stage-a-live-human-export --format both --cohort stage-a-pilot
 *
 * Sim pipeline comparison only:
 *   npm run export:responses -- --out ./tmp/stage-a-sim-export --include-sim
 */
import fs from "node:fs";
import path from "node:path";
import { buildRowsForSessions } from "../src/lib/export/buildRows";
import { rowsToCsv, rowsToJsonl } from "../src/lib/export/format";
import { resolveExportSalt } from "../src/lib/export/hashProfile";
import { buildExportMeta } from "../src/lib/export/meta";
import { fetchExportableSessions } from "../src/lib/export/query";
import { prisma } from "../src/lib/db";

type Format = "csv" | "jsonl" | "both";

function parseArgs(argv: string[]) {
  const out: {
    outDir: string;
    format: Format;
    packId?: string;
    since?: string;
    until?: string;
    includeSim: boolean;
    cohort?: string;
  } = {
    outDir: "./tmp/stage-a-export",
    format: "both",
    includeSim: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--out" && next) {
      out.outDir = next;
      i++;
    } else if (a === "--format" && next) {
      if (next !== "csv" && next !== "jsonl" && next !== "both") {
        throw new Error(`Invalid --format: ${next}`);
      }
      out.format = next;
      i++;
    } else if (a === "--pack" && next) {
      out.packId = next;
      i++;
    } else if (a === "--since" && next) {
      out.since = next;
      i++;
    } else if (a === "--until" && next) {
      out.until = next;
      i++;
    } else if (a === "--include-sim") {
      out.includeSim = true;
    } else if (a === "--cohort" && next) {
      out.cohort = next;
      i++;
    } else if (a === "--help" || a === "-h") {
      console.log(`Usage: npm run export:responses -- [options]
  --out <dir>       Output directory (default ./tmp/stage-a-export)
  --format <kind>   csv | jsonl | both (default both)
  --pack <id>       Filter by content pack id
  --since <ISO>     submittedAt >=
  --until <ISO>     submittedAt <=
  --include-sim     Include sim-*@iqtest.local (default: exclude)
  --cohort <label>  Pilot cohort label written to meta.json (docs convention)`);
      process.exit(0);
    }
  }
  return out;
}

function parseDate(label: string, value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return d;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const salt = resolveExportSalt();
  const {
    sessions,
    matchedBeforeSimFilter,
    excludedSimSessions,
  } = await fetchExportableSessions({
    packId: args.packId,
    since: parseDate("--since", args.since),
    until: parseDate("--until", args.until),
    includeSim: args.includeSim,
  });

  const { rows, skippedResponses, warnings } = buildRowsForSessions(
    sessions,
    salt,
  );

  const absOut = path.resolve(args.outDir);
  fs.mkdirSync(absOut, { recursive: true });

  const written: string[] = [];
  if (args.format === "csv" || args.format === "both") {
    const file = path.join(absOut, "responses.csv");
    fs.writeFileSync(file, rowsToCsv(rows), "utf8");
    written.push(file);
  }
  if (args.format === "jsonl" || args.format === "both") {
    const file = path.join(absOut, "responses.jsonl");
    fs.writeFileSync(file, rowsToJsonl(rows), "utf8");
    written.push(file);
  }

  const meta = buildExportMeta({
    pilotCohort: args.cohort,
    includeSim: args.includeSim,
    sessions: sessions.length,
    rows: rows.length,
    skippedResponses,
    warningCount: warnings.length,
    matchedBeforeSimFilter,
    excludedSimSessions,
  });
  const metaFile = path.join(absOut, "meta.json");
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2) + "\n", "utf8");
  written.push(metaFile);

  for (const w of warnings) {
    console.warn(`[warn] ${w}`);
  }

  console.log(JSON.stringify({ ...meta, written }, null, 2));
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });

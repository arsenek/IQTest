/**
 * Stage-A pilot CTT analysis (difficulty / discrimination / latency).
 * NOT standardized IQ — internal item QC only.
 *
 *   npm run analyze:stage-a -- --in ./tmp/stage-a-export --out ./tmp/stage-a-analysis
 *   npm run analyze:stage-a -- --in tests/fixtures/stage-a-export --min-n 20
 */
import fs from "node:fs";
import path from "node:path";
import {
  groupSummariesToCsv,
  itemStatsToCsv,
  toPrettyJson,
} from "../src/lib/analyze/formatReport";
import { loadExportRows } from "../src/lib/analyze/parseInput";
import { runAnalysis } from "../src/lib/analyze/runAnalysis";
import {
  DEFAULT_ANALYZE_OPTIONS,
  PILOT_DISCLAIMER,
  type AnalyzeOptions,
} from "../src/lib/analyze/types";

type Format = "csv" | "json" | "both";

function parseArgs(argv: string[]) {
  const out: {
    inPath: string;
    outDir: string;
    format: Format;
    options: Partial<AnalyzeOptions>;
  } = {
    inPath: "./tmp/stage-a-export",
    outDir: "./tmp/stage-a-analysis",
    format: "both",
    options: {},
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--in" && next) {
      out.inPath = next;
      i++;
    } else if (a === "--out" && next) {
      out.outDir = next;
      i++;
    } else if (a === "--format" && next) {
      if (next !== "csv" && next !== "json" && next !== "both") {
        throw new Error(`Invalid --format: ${next}`);
      }
      out.format = next;
      i++;
    } else if (a === "--min-n" && next) {
      out.options.minN = Number(next);
      i++;
    } else if (a === "--easy" && next) {
      out.options.easyThreshold = Number(next);
      i++;
    } else if (a === "--hard" && next) {
      out.options.hardThreshold = Number(next);
      i++;
    } else if (a === "--min-r" && next) {
      out.options.minPointBiserial = Number(next);
      i++;
    } else if (a === "--help" || a === "-h") {
      console.log(`Usage: npm run analyze:stage-a -- [options]

  ${PILOT_DISCLAIMER}

  --in <path>     Export dir or .csv/.jsonl (default ./tmp/stage-a-export)
  --out <dir>     Output directory (default ./tmp/stage-a-analysis)
  --format <k>    csv | json | both (default both)
  --min-n <n>     Min n before non-low_n flags (default ${DEFAULT_ANALYZE_OPTIONS.minN})
  --easy <p>      too_easy if p >= (default ${DEFAULT_ANALYZE_OPTIONS.easyThreshold})
  --hard <p>      too_hard if p <= (default ${DEFAULT_ANALYZE_OPTIONS.hardThreshold})
  --min-r <r>     low_disc if pointBiserial < (default ${DEFAULT_ANALYZE_OPTIONS.minPointBiserial})`);
      process.exit(0);
    }
  }
  return out;
}

function writePair(
  absOut: string,
  basename: string,
  csvBody: string,
  jsonBody: unknown,
  format: Format,
  written: string[],
) {
  if (format === "csv" || format === "both") {
    const file = path.join(absOut, `${basename}.csv`);
    fs.writeFileSync(file, csvBody, "utf8");
    written.push(file);
  }
  if (format === "json" || format === "both") {
    const file = path.join(absOut, `${basename}.json`);
    fs.writeFileSync(file, toPrettyJson(jsonBody), "utf8");
    written.push(file);
  }
}

function main() {
  console.error(`[analyze:stage-a] ${PILOT_DISCLAIMER}`);

  const args = parseArgs(process.argv.slice(2));
  const rows = loadExportRows(args.inPath);
  const result = runAnalysis(rows, args.options);

  const absOut = path.resolve(args.outDir);
  fs.mkdirSync(absOut, { recursive: true });

  const written: string[] = [];
  writePair(
    absOut,
    "item-stats",
    itemStatsToCsv(result.itemStats),
    result.itemStats,
    args.format,
    written,
  );
  writePair(
    absOut,
    "group-summary",
    groupSummariesToCsv(result.groupSummaries),
    result.groupSummaries,
    args.format,
    written,
  );
  writePair(
    absOut,
    "red-flags",
    itemStatsToCsv(result.redFlags),
    result.redFlags,
    args.format,
    written,
  );

  const metaFile = path.join(absOut, "meta.json");
  fs.writeFileSync(metaFile, toPrettyJson(result.meta), "utf8");
  written.push(metaFile);

  console.log(
    JSON.stringify(
      {
        ...result.meta,
        items: result.itemStats.length,
        redFlags: result.redFlags.length,
        groups: result.groupSummaries.length,
        written,
      },
      null,
      2,
    ),
  );
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
}

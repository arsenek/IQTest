/**
 * Regenerates synthetic Stage-A export for analyze tests.
 * Run: node tests/fixtures/stage-a-export/build-fixture.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const N = 24;

function base(sessionId, itemId, overrides) {
  return {
    sessionId,
    profileIdHash: `hash-${sessionId}`,
    profileKind: "ADULT",
    ageMonths: 300,
    itemId,
    subtestId: "vci-vocab",
    indexKey: "VCI",
    correct: true,
    rawScore: 1,
    latencyMs: 2000,
    inferredSkipped: false,
    inferredTimedOut: false,
    contentPackVersion: "adult/v1",
    normVersion: "placeholder/v1",
    scoringStage: "trial",
    algorithmVersion: "scale-z/v1",
    submittedAt: "2026-11-23T00:00:00.000Z",
    deviceClass: "",
    isChildData: false,
    ...overrides,
  };
}

const rows = [];

for (let i = 0; i < N; i++) {
  const sid = `sess-${String(i + 1).padStart(2, "0")}`;
  const high = i >= N / 2;

  // item-easy: nearly always correct → too_easy
  rows.push(
    base(sid, "item-easy", {
      correct: i === 0 ? false : true,
      rawScore: i === 0 ? 0 : 1,
      latencyMs: 800,
    }),
  );

  // item-hard: nearly always wrong → too_hard
  rows.push(
    base(sid, "item-hard", {
      correct: i === N - 1 ? true : false,
      rawScore: i === N - 1 ? 1 : 0,
      latencyMs: 5000,
    }),
  );

  // Ability-tracking fillers so rest-score differs for disc item
  rows.push(
    base(sid, "item-track-a", {
      correct: high,
      rawScore: high ? 1 : 0,
      latencyMs: 2200,
    }),
  );
  rows.push(
    base(sid, "item-track-b", {
      correct: high,
      rawScore: high ? 1 : 0,
      latencyMs: 2300,
    }),
  );

  // item-disc: tracks ability; rest includes track-a/b → strong point-biserial
  rows.push(
    base(sid, "item-disc", {
      correct: high,
      rawScore: high ? 1 : 0,
      latencyMs: 2500,
    }),
  );

  // item-noise: alternating, orthogonal to ability half-split → low_disc
  const noiseCorrect = i % 2 === 0;
  rows.push(
    base(sid, "item-noise", {
      correct: noiseCorrect,
      rawScore: noiseCorrect ? 1 : 0,
      latencyMs: 3000,
    }),
  );
}

// Skipped / timed-out rows must be excluded from n/p
rows.push(
  base("sess-01", "item-skip", {
    correct: false,
    rawScore: 0,
    inferredSkipped: true,
    latencyMs: 100,
  }),
  base("sess-01", "item-timeout", {
    correct: false,
    rawScore: 0,
    inferredTimedOut: true,
    latencyMs: 60000,
  }),
);

// CHILD rows for profileKind summary (small n → low_n)
for (let i = 0; i < 4; i++) {
  const sid = `child-${i + 1}`;
  rows.push(
    base(sid, "item-child-only", {
      profileKind: "CHILD",
      isChildData: true,
      ageMonths: 120,
      contentPackVersion: "child/v1",
      indexKey: "PRI",
      subtestId: "pri-matrix",
      correct: i < 2,
      rawScore: i < 2 ? 1 : 0,
      latencyMs: 4000,
    }),
  );
}

const jsonl = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
fs.writeFileSync(path.join(__dirname, "responses.jsonl"), jsonl, "utf8");
console.log(`Wrote ${rows.length} rows`);

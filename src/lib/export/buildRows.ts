import { contentPackSchema } from "@/lib/content/schemas";
import { ageMonthsAt } from "@/lib/session/machine";
import { hashProfileId } from "@/lib/export/hashProfile";
import { inferFlags } from "@/lib/export/inferFlags";
import type { ExportRow } from "@/lib/export/types";

export type ExportResponseInput = {
  itemId: string;
  subtestId: string;
  answerJson: unknown;
  correct: boolean | null;
  rawScore: number | null;
  latencyMs: number;
  createdAt?: Date;
};

export type ExportReportInput = {
  scoringStage: string;
  normVersion: string;
  algorithmVersion: string;
} | null;

export type ExportSessionInput = {
  id: string;
  packId: string;
  normVersion: string;
  playlistJson: unknown;
  status: string;
  submittedAt: Date | null;
  startedAt: Date;
  profile: {
    id: string;
    kind: "CHILD" | "ADULT";
    birthDate: Date;
  };
  report: ExportReportInput;
  responses: ExportResponseInput[];
};

export type BuildRowsResult = {
  rows: ExportRow[];
  skippedResponses: number;
  warnings: string[];
};

type ItemMeta = {
  indexKey: string;
  timeLimitMs?: number;
  itemType?: string;
};

function indexPlaylist(
  playlistJson: unknown,
  sessionId: string,
  warnings: string[],
): Map<string, ItemMeta> | null {
  if (playlistJson == null) {
    warnings.push(`session ${sessionId}: missing playlistJson`);
    return null;
  }
  const parsed = contentPackSchema.safeParse(playlistJson);
  if (!parsed.success) {
    warnings.push(`session ${sessionId}: invalid playlistJson`);
    return null;
  }
  const map = new Map<string, ItemMeta>();
  for (const sub of parsed.data.subtests) {
    for (const item of sub.items) {
      map.set(item.id, {
        indexKey: sub.indexKey,
        timeLimitMs: item.timeLimitMs,
        itemType: item.type,
      });
    }
  }
  return map;
}

/** Map one SUBMITTED session (+ responses) into export rows. */
export function buildRowsForSession(
  session: ExportSessionInput,
  profileSalt: string,
): BuildRowsResult {
  const warnings: string[] = [];
  const rows: ExportRow[] = [];
  let skippedResponses = 0;

  const metaByItem = indexPlaylist(
    session.playlistJson,
    session.id,
    warnings,
  );
  if (!metaByItem) {
    return {
      rows: [],
      skippedResponses: session.responses.length,
      warnings,
    };
  }

  const at = session.submittedAt ?? session.startedAt;
  const ageMonths = ageMonthsAt(session.profile.birthDate, at);
  const profileIdHash = hashProfileId(session.profile.id, profileSalt);
  const isChildData = session.profile.kind === "CHILD";
  const report = session.report;

  for (const r of session.responses) {
    const meta = metaByItem.get(r.itemId);
    if (!meta) {
      skippedResponses += 1;
      warnings.push(
        `session ${session.id}: item ${r.itemId} not in playlist — skipped`,
      );
      continue;
    }

    // Prefer subtest's indexKey from playlist; also verify subtest exists
    const flags = inferFlags({
      answerJson: r.answerJson,
      latencyMs: r.latencyMs,
      timeLimitMs: meta.timeLimitMs,
      itemType: meta.itemType,
    });

    rows.push({
      sessionId: session.id,
      profileIdHash,
      profileKind: session.profile.kind,
      ageMonths,
      itemId: r.itemId,
      subtestId: r.subtestId,
      indexKey: meta.indexKey,
      correct: r.correct,
      rawScore: r.rawScore,
      latencyMs: r.latencyMs,
      inferredSkipped: flags.inferredSkipped,
      inferredTimedOut: flags.inferredTimedOut,
      contentPackVersion: session.packId,
      normVersion: report?.normVersion ?? session.normVersion,
      scoringStage: report?.scoringStage ?? "",
      algorithmVersion: report?.algorithmVersion ?? "",
      submittedAt: session.submittedAt
        ? session.submittedAt.toISOString()
        : null,
      deviceClass: "",
      isChildData,
    });
  }

  return { rows, skippedResponses, warnings };
}

export function buildRowsForSessions(
  sessions: ExportSessionInput[],
  profileSalt: string,
): BuildRowsResult {
  const rows: ExportRow[] = [];
  const warnings: string[] = [];
  let skippedResponses = 0;
  for (const s of sessions) {
    const part = buildRowsForSession(s, profileSalt);
    rows.push(...part.rows);
    skippedResponses += part.skippedResponses;
    warnings.push(...part.warnings);
  }
  return { rows, skippedResponses, warnings };
}

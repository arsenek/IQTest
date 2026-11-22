import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildRowsForSession,
  type ExportSessionInput,
} from "@/lib/export/buildRows";
import { EXPORT_COLUMNS } from "@/lib/export/types";
import { hashProfileId } from "@/lib/export/hashProfile";

const SALT = "test-export-salt";

function miniPlaylist() {
  const mk = (indexKey: "VCI" | "PRI" | "WMI" | "PSI", id: string) => ({
    id: `st-${indexKey}`,
    indexKey,
    title: indexKey,
    items: [
      {
        id,
        type: "mcq" as const,
        prompt: "q",
        choices: ["A", "B"],
        answer: "A",
        timeLimitMs: 60_000,
      },
    ],
  });
  return {
    id: "child/fixture",
    audience: "child" as const,
    title: "fixture",
    subtests: [
      mk("VCI", "item-vci-1"),
      mk("PRI", "item-pri-1"),
      mk("WMI", "item-wmi-1"),
      mk("PSI", "item-psi-1"),
    ],
  };
}

function baseSession(
  overrides: Partial<ExportSessionInput> = {},
): ExportSessionInput {
  const birth = new Date("2016-01-15T00:00:00.000Z");
  const submittedAt = new Date("2026-11-23T04:00:00.000Z");
  return {
    id: "sess-1",
    packId: "child/v1",
    normVersion: "placeholder/v1",
    playlistJson: miniPlaylist(),
    status: "SUBMITTED",
    submittedAt,
    startedAt: new Date("2026-11-23T03:00:00.000Z"),
    profile: {
      id: "prof-raw-secret",
      kind: "CHILD",
      birthDate: birth,
    },
    report: {
      scoringStage: "trial",
      normVersion: "placeholder/v1",
      algorithmVersion: "scale-z/v1",
    },
    responses: [
      {
        itemId: "item-vci-1",
        subtestId: "st-VCI",
        answerJson: "A",
        correct: true,
        rawScore: 1,
        latencyMs: 1200,
      },
      {
        itemId: "item-pri-1",
        subtestId: "st-PRI",
        answerJson: "",
        correct: false,
        rawScore: 0,
        latencyMs: 60_000,
      },
    ],
    ...overrides,
  };
}

describe("buildRowsForSession", () => {
  it("emits required columns and hashes profileId", () => {
    const { rows, skippedResponses, warnings } = buildRowsForSession(
      baseSession(),
      SALT,
    );
    expect(skippedResponses).toBe(0);
    expect(warnings).toEqual([]);
    expect(rows).toHaveLength(2);

    for (const col of EXPORT_COLUMNS) {
      expect(rows[0]).toHaveProperty(col);
    }

    const expectedHash = createHmac("sha256", SALT)
      .update("prof-raw-secret", "utf8")
      .digest("hex");
    expect(rows[0].profileIdHash).toBe(expectedHash);
    expect(rows[0].profileIdHash).toBe(hashProfileId("prof-raw-secret", SALT));
    expect(JSON.stringify(rows)).not.toContain("prof-raw-secret");
    expect(JSON.stringify(rows)).not.toContain("@");

    expect(rows[0].indexKey).toBe("VCI");
    expect(rows[0].isChildData).toBe(true);
    expect(rows[0].deviceClass).toBe("");
    expect(rows[0].scoringStage).toBe("trial");
    expect(rows[0].algorithmVersion).toBe("scale-z/v1");
    expect(rows[0].contentPackVersion).toBe("child/v1");

    expect(rows[1].inferredSkipped).toBe(true);
    expect(rows[1].inferredTimedOut).toBe(true);
  });

  it("skips responses whose itemId is missing from playlist", () => {
    const { rows, skippedResponses, warnings } = buildRowsForSession(
      baseSession({
        responses: [
          {
            itemId: "ghost",
            subtestId: "st-VCI",
            answerJson: "A",
            correct: true,
            rawScore: 1,
            latencyMs: 100,
          },
        ],
      }),
      SALT,
    );
    expect(rows).toHaveLength(0);
    expect(skippedResponses).toBe(1);
    expect(warnings.some((w) => w.includes("ghost"))).toBe(true);
  });
});

/**
 * Infer skip / timeout flags from stored answer + latency.
 * Response has no explicit skipped/timedOut columns (Stage A).
 */

export type InferInput = {
  answerJson: unknown;
  latencyMs: number;
  /** From playlist item; undefined → cannot assert timeout. */
  timeLimitMs?: number | null;
  itemType?: string | null;
};

function normalizeAnswerBlob(answerJson: unknown): string {
  if (answerJson == null) return "";
  if (typeof answerJson === "string") return answerJson.trim();
  if (typeof answerJson === "number") return String(answerJson);
  if (Array.isArray(answerJson)) {
    if (answerJson.length === 0) return "";
    return answerJson.map(String).join("-");
  }
  // Prisma Json may be object — stringify for emptiness check only
  if (typeof answerJson === "object") {
    try {
      return JSON.stringify(answerJson);
    } catch {
      return "";
    }
  }
  return String(answerJson).trim();
}

/** Empty-ish answers (UI timeout fallback uses "" or -1 for symbol_search). */
export function isEmptyishAnswer(
  answerJson: unknown,
  itemType?: string | null,
): boolean {
  if (Array.isArray(answerJson) && answerJson.length === 0) return true;
  if (answerJson === "" || answerJson === null || answerJson === undefined) {
    return true;
  }
  if (itemType === "symbol_search" && answerJson === -1) return true;
  const normalized = normalizeAnswerBlob(answerJson);
  if (normalized === "" || normalized === '""') return true;
  if (itemType === "symbol_search" && normalized === "-1") return true;
  return false;
}

export function inferTimedOut(input: InferInput): boolean {
  const limit = input.timeLimitMs;
  if (limit == null || !Number.isFinite(limit) || limit <= 0) return false;
  return input.latencyMs >= limit;
}

export function inferSkipped(input: InferInput): boolean {
  return isEmptyishAnswer(input.answerJson, input.itemType);
}

export function inferFlags(input: InferInput): {
  inferredSkipped: boolean;
  inferredTimedOut: boolean;
} {
  return {
    inferredSkipped: inferSkipped(input),
    inferredTimedOut: inferTimedOut(input),
  };
}

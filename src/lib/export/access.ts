/**
 * Gate for the admin export HTTP endpoint.
 * CLI does not use this — it is a local ops tool with DATABASE_URL.
 */

export type ExportAccessEnv = {
  NODE_ENV?: string;
  ENABLE_RESPONSE_EXPORT?: string;
  EXPORT_TOKEN?: string;
};

export type ExportAccessResult =
  | { ok: true }
  | { ok: false; status: 401 | 404; reason: string };

/** True when export API is allowed to exist (dev or explicit enable). */
export function isExportApiEnabled(env: ExportAccessEnv = process.env): boolean {
  if (env.ENABLE_RESPONSE_EXPORT === "1") return true;
  return env.NODE_ENV === "development";
}

/**
 * Validate Authorization: Bearer <EXPORT_TOKEN>.
 * Missing/empty EXPORT_TOKEN → treat endpoint as disabled (404).
 */
export function authorizeExportRequest(
  authHeader: string | null | undefined,
  env: ExportAccessEnv = process.env,
): ExportAccessResult {
  if (!isExportApiEnabled(env)) {
    return { ok: false, status: 404, reason: "export_disabled" };
  }
  const token = env.EXPORT_TOKEN?.trim() ?? "";
  if (!token) {
    return { ok: false, status: 404, reason: "export_token_unset" };
  }
  const expected = `Bearer ${token}`;
  if (!authHeader || authHeader !== expected) {
    return { ok: false, status: 401, reason: "unauthorized" };
  }
  return { ok: true };
}

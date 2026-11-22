import { createHmac } from "node:crypto";

/**
 * Resolve salt for profile pseudonymization.
 * Prefer EXPORT_PROFILE_SALT; fall back to AUTH_SECRET.
 */
export function resolveExportSalt(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const salt =
    env.EXPORT_PROFILE_SALT?.trim() || env.AUTH_SECRET?.trim() || "";
  if (!salt) {
    throw new Error(
      "EXPORT_PROFILE_SALT or AUTH_SECRET is required to hash profileId",
    );
  }
  return salt;
}

/** Stable HMAC-SHA256 hex digest of a profile id. */
export function hashProfileId(profileId: string, salt: string): string {
  return createHmac("sha256", salt).update(profileId, "utf8").digest("hex");
}

/** Email domain + prefix that mark synthetic examinees. Never use for real users. */
export const SIM_EMAIL_DOMAIN = "iqtest.local";
export const SIM_EMAIL_PREFIX = "sim-";

/** Fixed password for sim accounts (local preview only; not for login UX). */
export const SIM_PASSWORD = "sim-password-local-only";

export const PERSONAS_PATH = "content/sim/personas-v1.json";

export function simEmailForPersona(personaId: string): string {
  const slug = personaId.replace(/^sim-/, "").toLowerCase();
  return `${SIM_EMAIL_PREFIX}${slug}@${SIM_EMAIL_DOMAIN}`;
}

export function isSimEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return e.startsWith(SIM_EMAIL_PREFIX) && e.endsWith(`@${SIM_EMAIL_DOMAIN}`);
}

export function personaIdFromSimEmail(email: string): string | null {
  if (!isSimEmail(email)) return null;
  const local = email.trim().toLowerCase().slice(SIM_EMAIL_PREFIX.length, -(SIM_EMAIL_DOMAIN.length + 1));
  return `sim-${local}`;
}

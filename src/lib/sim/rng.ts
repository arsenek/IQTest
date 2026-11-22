/** Deterministic mulberry32 PRNG from a 32-bit seed. */
export function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable numeric seed from persona id string. */
export function seedFromPersonaId(personaId: string): number {
  let h = 2166136261;
  for (let i = 0; i < personaId.length; i++) {
    h ^= personaId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

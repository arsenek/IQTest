/** Pure state machine for digit_span encode → mask → answer flow. */

export type MemoryMaskPhase = "encoding" | "answering";

export type MemoryMaskConfig = {
  encodeMs?: number;
  maskStem?: boolean;
};

export type MemoryMaskState = {
  phase: MemoryMaskPhase;
  remainingEncodeMs: number;
  maskStem: boolean;
};

export function createMemoryMaskState(
  config: MemoryMaskConfig,
): MemoryMaskState {
  const encodeMs =
    typeof config.encodeMs === "number" && config.encodeMs > 0
      ? config.encodeMs
      : 0;
  const maskStem = Boolean(config.maskStem);

  if (encodeMs > 0) {
    return { phase: "encoding", remainingEncodeMs: encodeMs, maskStem };
  }

  // No encode window: jump straight to answering (stem masked if requested).
  return { phase: "answering", remainingEncodeMs: 0, maskStem };
}

export function tickMemoryMask(
  state: MemoryMaskState,
  deltaMs: number,
): MemoryMaskState {
  if (state.phase !== "encoding") return state;
  const next = Math.max(0, state.remainingEncodeMs - Math.max(0, deltaMs));
  if (next > 0) {
    return { ...state, remainingEncodeMs: next };
  }
  return { phase: "answering", remainingEncodeMs: 0, maskStem: state.maskStem };
}

export function canAnswerMemoryMask(state: MemoryMaskState): boolean {
  return state.phase === "answering";
}

export function isStemMasked(state: MemoryMaskState): boolean {
  return state.phase === "answering" && state.maskStem;
}

export function isStemVisible(state: MemoryMaskState): boolean {
  return !isStemMasked(state);
}

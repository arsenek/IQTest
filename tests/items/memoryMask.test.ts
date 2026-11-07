import { describe, expect, it } from "vitest";
import {
  canAnswerMemoryMask,
  createMemoryMaskState,
  isStemMasked,
  isStemVisible,
  tickMemoryMask,
} from "@/lib/items/memoryMask";

describe("memoryMask state machine", () => {
  it("starts encoding when encodeMs is set", () => {
    const state = createMemoryMaskState({ encodeMs: 3000, maskStem: true });
    expect(state.phase).toBe("encoding");
    expect(state.remainingEncodeMs).toBe(3000);
    expect(canAnswerMemoryMask(state)).toBe(false);
    expect(isStemVisible(state)).toBe(true);
    expect(isStemMasked(state)).toBe(false);
  });

  it("transitions to answering with masked stem after encode elapses", () => {
    let state = createMemoryMaskState({ encodeMs: 1000, maskStem: true });
    state = tickMemoryMask(state, 400);
    expect(state.phase).toBe("encoding");
    expect(state.remainingEncodeMs).toBe(600);
    expect(canAnswerMemoryMask(state)).toBe(false);

    state = tickMemoryMask(state, 600);
    expect(state.phase).toBe("answering");
    expect(canAnswerMemoryMask(state)).toBe(true);
    expect(isStemMasked(state)).toBe(true);
    expect(isStemVisible(state)).toBe(false);
  });

  it("allows immediate answer when no encode window", () => {
    const state = createMemoryMaskState({ maskStem: true });
    expect(state.phase).toBe("answering");
    expect(canAnswerMemoryMask(state)).toBe(true);
    expect(isStemMasked(state)).toBe(true);
  });

  it("keeps stem visible after encode when maskStem is false", () => {
    let state = createMemoryMaskState({ encodeMs: 500, maskStem: false });
    state = tickMemoryMask(state, 500);
    expect(state.phase).toBe("answering");
    expect(canAnswerMemoryMask(state)).toBe(true);
    expect(isStemMasked(state)).toBe(false);
  });

  it("is idempotent once answering", () => {
    let state = createMemoryMaskState({ encodeMs: 100, maskStem: true });
    state = tickMemoryMask(state, 100);
    const next = tickMemoryMask(state, 999);
    expect(next).toEqual(state);
  });
});

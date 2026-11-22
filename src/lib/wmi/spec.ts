import type { WmiDirection, WmiSpec } from "./types";

export function span(def: {
  id: string;
  digits: number[];
  direction: WmiDirection;
  encodeMs: number;
  timeLimitMs?: number;
  ruleText?: string;
}): WmiSpec {
  const dirZh = def.direction === "forward" ? "正向" : "反向";
  return {
    id: def.id,
    digits: def.digits,
    direction: def.direction,
    encodeMs: def.encodeMs,
    timeLimitMs: def.timeLimitMs ?? 45_000,
    ruleText: def.ruleText ?? `${dirZh}复述长度 ${def.digits.length} 的数字序列。`,
  };
}

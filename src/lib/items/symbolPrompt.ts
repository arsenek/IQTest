/** Pull target + sequence glyphs from Chinese symbol_search prompts. */
export function parseSymbolPrompt(prompt: string): {
  target?: string;
  sequence: string[];
} {
  const targetMatch = prompt.match(/目标\s*([^\s。．.]+)/);
  const seqMatch = prompt.match(/在\s*(.+?)\s*中/);
  const target = targetMatch?.[1]?.trim();
  const sequence = seqMatch?.[1]
    ? Array.from(seqMatch[1].replace(/\s+/g, ""))
    : [];
  return { target, sequence };
}

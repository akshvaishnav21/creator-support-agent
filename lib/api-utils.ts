/**
 * Safely parse JSON from Gemini responses.
 * Strips markdown code fences and retries if the initial parse fails.
 */
export function safeParseJSON<T>(text: string): T {
  // First attempt: direct parse
  try {
    return JSON.parse(text);
  } catch {
    // Strip markdown fences and retry
    const stripped = text
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();
    return JSON.parse(stripped);
  }
}

/** Max allowed lengths for user-supplied inputs (in characters). */
export const INPUT_LIMITS = {
  captions: 15000,
  comments: 15000,
  concept: 1000,
  message: 5000,
  brandName: 200,
} as const;

/** Truncate a string to the given character limit. */
export function truncate(s: string | undefined, limit: number): string {
  if (!s) return "";
  return s.length > limit ? s.slice(0, limit) : s;
}

/**
 * Defensive JSON cleanup for Claude API responses.
 *
 * Handles common issues: markdown code fences, smart quotes, em/en dashes,
 * trailing commas, control characters, and preamble/postamble text.
 *
 * Shared across all API routes that parse JSON from Claude.
 */
export function cleanJsonResponse(raw: string): string {
  let text = raw.trim();
  // Strip markdown code fences
  text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  // Strip any preamble before the first {
  const firstBrace = text.indexOf("{");
  if (firstBrace > 0) text = text.slice(firstBrace);
  // Strip anything after the last }
  const lastBrace = text.lastIndexOf("}");
  if (lastBrace >= 0) text = text.slice(0, lastBrace + 1);
  // Smart quotes to straight
  text = text.replace(/[\u201C\u201D]/g, '"');
  text = text.replace(/[\u2018\u2019]/g, "'");
  // Em/en dash to hyphen
  text = text.replace(/\u2014/g, "-");
  text = text.replace(/\u2013/g, "-");
  // Trailing commas
  text = text.replace(/,\s*}/g, "}");
  text = text.replace(/,\s*]/g, "]");
  // Control characters (except newline/tab)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  return text;
}

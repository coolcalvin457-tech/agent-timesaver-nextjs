export function stripEmDashes(text: string): string {
  return text.replace(/[\u2013\u2014]/g, "-");
}

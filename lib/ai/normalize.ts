/**
 * Pipeline Step 1: Lowercase, trim, collapse spaces, remove punctuation
 * except hyphens and dots in names.
 */
export function normalizeQuery(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

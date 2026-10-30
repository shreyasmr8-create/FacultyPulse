const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "that",
  "this",
  "some",
  "something",
  "event",
  "events",
  "i",
  "my",
  "me",
  "we",
  "at",
  "in",
  "on",
  "to",
  "for",
  "of",
  "by",
  "with",
  "from",
  "last",
  "was",
  "were",
  "had",
  "have",
  "did",
  "find",
  "show",
  "search",
  "about",
  "where",
  "when",
  "what",
]);

function bigrams(str: string): Set<string> {
  const s = str.toLowerCase().trim();
  const result = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) {
    result.add(s.slice(i, i + 2));
  }
  return result;
}

export function diceSimilarity(a: string, b: string): number {
  const cleanA = a.toLowerCase().trim();
  const cleanB = b.toLowerCase().trim();
  if (cleanA === cleanB) return 1;
  if (cleanA.length < 2 || cleanB.length < 2) return 0;

  const bgA = bigrams(cleanA);
  const bgB = bigrams(cleanB);
  let intersection = 0;
  for (const gram of bgA) {
    if (bgB.has(gram)) intersection += 1;
  }
  return (2 * intersection) / (bgA.size + bgB.size);
}

/**
 * Pipeline Step 4: Match against faculty member's previously used locations (fuzzy match >= 0.8).
 */
export function extractLocation(
  normalized: string,
  knownLocations: string[]
): { location?: string; matchedPhrase?: string } {
  const sortedLocations = [...knownLocations]
    .filter((l) => l.trim().length > 0)
    .sort((a, b) => b.length - a.length);

  for (const loc of sortedLocations) {
    const normLoc = loc.toLowerCase().trim();
    if (normalized.includes(normLoc)) {
      return { location: loc, matchedPhrase: normLoc };
    }

    const locWords = normLoc.split(/\s+/);
    const queryWords = normalized.split(/\s+/);
    const windowSize = locWords.length;

    if (queryWords.length >= windowSize) {
      for (let i = 0; i <= queryWords.length - windowSize; i++) {
        const candidate = queryWords.slice(i, i + windowSize).join(" ");
        if (diceSimilarity(candidate, normLoc) >= 0.8) {
          return { location: loc, matchedPhrase: candidate };
        }
      }
    }
  }

  return {};
}

/**
 * Pipeline Step 5: Remove stopwords and matched date, type, and location phrases; keep the rest.
 */
export function extractKeywords(
  normalized: string,
  phrasesToRemove: string[]
): string[] {
  let working = ` ${normalized} `;
  for (const phrase of phrasesToRemove) {
    if (!phrase) continue;
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    working = working.replace(new RegExp(`\\b${escaped}\\b`, "gi"), " ");
  }

  const tokens = working
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));

  return Array.from(new Set(tokens));
}

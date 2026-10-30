import { StructuredAiFilter } from "@/lib/validation/ai";
import { normalizeQuery } from "./normalize";
import { detectEventType } from "./detect-type";
import { extractDateRange } from "./extract-date";
import { extractLocation, extractKeywords } from "./extract-keywords";

/**
 * Pipeline Step 6: Orchestrate steps 1–5 to build a structured filter.
 */
export function parseSearchQueryRuleBased(
  rawMessage: string,
  knownLocations: string[],
  referenceNow: Date = new Date()
): StructuredAiFilter {
  const normalized = normalizeQuery(rawMessage);
  if (!normalized) {
    return { keywords: [] };
  }

  const typeResult = detectEventType(normalized);
  const dateResult = extractDateRange(normalized, referenceNow);
  const locationResult = extractLocation(normalized, knownLocations);

  const phrasesToStrip = [
    ...typeResult.matchedPhrases,
    ...dateResult.matchedPhrases,
    ...(locationResult.matchedPhrase ? [locationResult.matchedPhrase] : []),
  ];

  const keywords = extractKeywords(normalized, phrasesToStrip);

  return {
    type: typeResult.type,
    from: dateResult.from,
    to: dateResult.to,
    dateLabel: dateResult.label,
    location: locationResult.location,
    keywords,
  };
}

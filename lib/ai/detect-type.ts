import { EventType } from "@prisma/client";

const TYPE_PATTERNS: Array<{ type: EventType; phrases: string[] }> = [
  {
    type: EventType.HOSTED,
    phrases: ["hosted", "host", "organized", "conducted", "chaired"],
  },
  {
    type: EventType.ATTENDED,
    phrases: ["attended", "went to", "joined", "participated"],
  },
  {
    type: EventType.BUSY,
    phrases: ["busy days", "busy day", "busy", "occupied", "meetings"],
  },
];

/**
 * Pipeline Step 2: Detect event type and return matched phrases so they can be
 * stripped from keyword extraction.
 */
export function detectEventType(normalized: string): {
  type?: EventType;
  matchedPhrases: string[];
} {
  for (const group of TYPE_PATTERNS) {
    for (const phrase of group.phrases) {
      const regex = new RegExp(`\\b${phrase.replace(/\s+/g, "\\s+")}\\b`, "i");
      if (regex.test(normalized)) {
        return { type: group.type, matchedPhrases: [phrase] };
      }
    }
  }
  return { matchedPhrases: [] };
}

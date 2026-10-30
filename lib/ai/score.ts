import { Event } from "@prisma/client";
import { StructuredAiFilter } from "@/lib/validation/ai";

export interface ScoredEventResult {
  event: Event;
  score: number;
  matchReasons: string[];
}

/**
 * Pipeline Step 8: Score and rank candidate events.
 * - Date falls inside range: +40
 * - Each keyword found in title: +15; in description, organizer, or location: +5
 * - Type matches: +10
 * - Location matches: +15
 * - Results with score 0 are excluded. Return top 5.
 */
export function scoreAndRankEvents(
  events: Event[],
  filter: StructuredAiFilter
): ScoredEventResult[] {
  const scored: ScoredEventResult[] = [];

  for (const ev of events) {
    let score = 0;
    const reasons: string[] = [];

    if (filter.from && filter.to) {
      if (ev.startAt >= filter.from && ev.startAt <= filter.to) {
        score += 40;
        reasons.push(filter.dateLabel || "date range");
      }
    }

    if (filter.type && ev.type === filter.type) {
      score += 10;
      reasons.push(filter.type.toLowerCase());
    }

    if (
      filter.location &&
      ev.location &&
      ev.location.toLowerCase().includes(filter.location.toLowerCase())
    ) {
      score += 15;
      reasons.push(filter.location);
    }

    const titleLower = ev.title.toLowerCase();
    const secondaryBlob = [
      ev.description,
      ev.organizer,
      ev.location,
      ev.department,
      ev.role,
      ev.attachmentUrl,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const fileQueryKeywords = new Set([
      "file",
      "files",
      "attachment",
      "attachments",
      "document",
      "documents",
      "certificate",
      "slides",
      "pdf",
    ]);

    for (const kw of filter.keywords) {
      const kwLower = kw.toLowerCase();
      let matchedKw = false;

      if (fileQueryKeywords.has(kwLower) && ev.attachmentUrl) {
        score += 20;
        reasons.push("has attached file");
        matchedKw = true;
      }

      if (titleLower.includes(kwLower)) {
        score += 15;
        matchedKw = true;
      }
      if (secondaryBlob.includes(kwLower)) {
        score += 5;
        matchedKw = true;
      }
      if (matchedKw && !fileQueryKeywords.has(kwLower)) {
        reasons.push(kw);
      }
    }

    if (score > 0) {
      scored.push({
        event: ev,
        score,
        matchReasons: Array.from(new Set(reasons)),
      });
    }
  }

  return scored
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.event.startAt.getTime() - a.event.startAt.getTime();
    })
    .slice(0, 5);
}

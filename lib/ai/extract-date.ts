import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { APP_CONFIG } from "@/config/constants";
import { getCurrentSemesterRange } from "@/lib/time";

const MONTH_MAP: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

export interface ExtractedDateResult {
  from?: Date;
  to?: Date;
  label?: string;
  matchedPhrases: string[];
}

/**
 * Pipeline Step 3: Extract date range (Absolute, Relative, Seasons, Semester).
 */
export function extractDateRange(
  normalized: string,
  referenceNow: Date = new Date()
): ExtractedDateResult {
  const tz = APP_CONFIG.timezone;
  const zonedNow = toZonedTime(referenceNow, tz);
  const currentYear = zonedNow.getFullYear();
  const currentMonth = zonedNow.getMonth();

  const toUtcRange = (startLocal: Date, endLocal: Date) => ({
    from: fromZonedTime(startOfDay(startLocal), tz),
    to: fromZonedTime(endOfDay(endLocal), tz),
  });

  if (/\btoday\b/.test(normalized)) {
    return {
      ...toUtcRange(zonedNow, zonedNow),
      label: "today",
      matchedPhrases: ["today"],
    };
  }

  if (/\byesterday\b/.test(normalized)) {
    const yest = subDays(zonedNow, 1);
    return {
      ...toUtcRange(yest, yest),
      label: "yesterday",
      matchedPhrases: ["yesterday"],
    };
  }

  if (/\bthis week\b/.test(normalized)) {
    return {
      ...toUtcRange(
        startOfWeek(zonedNow, { weekStartsOn: 1 }),
        endOfWeek(zonedNow, { weekStartsOn: 1 })
      ),
      label: "this week",
      matchedPhrases: ["this week"],
    };
  }

  if (/\blast week\b/.test(normalized)) {
    const lw = subWeeks(zonedNow, 1);
    return {
      ...toUtcRange(
        startOfWeek(lw, { weekStartsOn: 1 }),
        endOfWeek(lw, { weekStartsOn: 1 })
      ),
      label: "last week",
      matchedPhrases: ["last week"],
    };
  }

  const lastNMonthsMatch = normalized.match(/\blast\s+(\d+)\s+months?\b/);
  if (lastNMonthsMatch) {
    const n = Number(lastNMonthsMatch[1]);
    return {
      ...toUtcRange(subMonths(zonedNow, n), zonedNow),
      label: lastNMonthsMatch[0],
      matchedPhrases: [lastNMonthsMatch[0]],
    };
  }

  if (/\bthis month\b/.test(normalized)) {
    return {
      ...toUtcRange(startOfMonth(zonedNow), endOfMonth(zonedNow)),
      label: "this month",
      matchedPhrases: ["this month"],
    };
  }

  if (/\blast month\b/.test(normalized)) {
    const lm = subMonths(zonedNow, 1);
    return {
      ...toUtcRange(startOfMonth(lm), endOfMonth(lm)),
      label: "last month",
      matchedPhrases: ["last month"],
    };
  }

  if (/\bthis year\b/.test(normalized)) {
    return {
      ...toUtcRange(startOfYear(zonedNow), endOfYear(zonedNow)),
      label: "this year",
      matchedPhrases: ["this year"],
    };
  }

  if (/\blast year\b/.test(normalized)) {
    const ly = subYears(zonedNow, 1);
    return {
      ...toUtcRange(startOfYear(ly), endOfYear(ly)),
      label: "last year",
      matchedPhrases: ["last year"],
    };
  }

  if (/\bthis semester\b/.test(normalized)) {
    const sem = getCurrentSemesterRange(referenceNow);
    return {
      from: sem.from,
      to: sem.to,
      label: "this semester",
      matchedPhrases: ["this semester"],
    };
  }

  if (/\blast semester\b/.test(normalized)) {
    const currentSem = getCurrentSemesterRange(referenceNow);
    const prevRef = subDays(currentSem.from, 10);
    const prevSem = getCurrentSemesterRange(prevRef);
    return {
      from: prevSem.from,
      to: prevSem.to,
      label: "last semester",
      matchedPhrases: ["last semester"],
    };
  }

  const seasonMatch = normalized.match(
    /\b(?:(last|this)\s+)?(spring|summer|autumn|fall|winter)(?:\s+(20\d{2}))?\b/
  );
  if (seasonMatch) {
    const modifier = seasonMatch[1];
    const season = seasonMatch[2];
    const explicitYear = seasonMatch[3] ? Number(seasonMatch[3]) : undefined;

    const seasonMonths: Record<string, [number, number]> = {
      spring: [2, 4],
      summer: [5, 7],
      autumn: [8, 10],
      fall: [8, 10],
      winter: [11, 1],
    };

    const [startM, endM] = seasonMonths[season];
    let targetYear = explicitYear ?? currentYear;

    if (!explicitYear) {
      if (modifier === "last") {
        targetYear = currentYear - 1;
      } else if (modifier !== "this") {
        if (currentMonth <= endM) {
          targetYear = currentYear - 1;
        }
      }
    }

    if (season === "winter") {
      const startLocal = new Date(targetYear, 11, 1);
      const endLocal = endOfMonth(new Date(targetYear + 1, 1, 1));
      return {
        ...toUtcRange(startLocal, endLocal),
        label: seasonMatch[0],
        matchedPhrases: [seasonMatch[0]],
      };
    } else {
      const startLocal = new Date(targetYear, startM, 1);
      const endLocal = endOfMonth(new Date(targetYear, endM, 1));
      return {
        ...toUtcRange(startLocal, endLocal),
        label: seasonMatch[0],
        matchedPhrases: [seasonMatch[0]],
      };
    }
  }

  const monthNamesPattern = Object.keys(MONTH_MAP).join("|");
  const dmyRegex = new RegExp(
    `\\b(\\d{1,2})\\s+(${monthNamesPattern})\\s+(20\\d{2})\\b`
  );
  const dmyMatch = normalized.match(dmyRegex);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const monthIdx = MONTH_MAP[dmyMatch[2]];
    const year = Number(dmyMatch[3]);
    const specificDate = new Date(year, monthIdx, day);
    return {
      ...toUtcRange(specificDate, specificDate),
      label: dmyMatch[0],
      matchedPhrases: [dmyMatch[0]],
    };
  }

  const myRegex = new RegExp(`\\b(${monthNamesPattern})\\s+(20\\d{2})\\b`);
  const myMatch = normalized.match(myRegex);
  if (myMatch) {
    const monthIdx = MONTH_MAP[myMatch[1]];
    const year = Number(myMatch[2]);
    const mStart = new Date(year, monthIdx, 1);
    const mEnd = endOfMonth(mStart);
    return {
      ...toUtcRange(mStart, mEnd),
      label: myMatch[0],
      matchedPhrases: [myMatch[0]],
    };
  }

  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    const yStart = new Date(year, 0, 1);
    const yEnd = new Date(year, 11, 31);
    return {
      ...toUtcRange(yStart, yEnd),
      label: yearMatch[1],
      matchedPhrases: [yearMatch[0]],
    };
  }

  return { matchedPhrases: [] };
}

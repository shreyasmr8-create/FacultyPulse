import { Event, EventType } from "@prisma/client";
import { subMonths, startOfMonth, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { APP_CONFIG } from "@/config/constants";
import {
  formatMonthKeyInAppTz,
  formatYearKeyInAppTz,
  getCalendarDaysBetween,
} from "@/lib/time";
import { evaluateBadges, EvaluatedBadge } from "./badges";

export interface AchievementsResult {
  metrics: {
    totalHosted: number;
    totalAttended: number;
    totalBusyDays: number;
    totalEvents: number;
    busiestMonth: { month: string; count: number } | null;
    activeMonthsStreak: number;
    departmentsEngaged: number;
  };
  eventsPerYear: Array<{ year: string; count: number }>;
  eventsPerMonthLast12: Array<{
    month: string;
    label: string;
    ATTENDED: number;
    HOSTED: number;
    BUSY: number;
    total: number;
  }>;
  typeBreakdown: Array<{ type: EventType; count: number }>;
  badges: EvaluatedBadge[];
  topBadge: EvaluatedBadge | null;
}

function computeLongestMonthStreak(sortedMonthKeys: string[]): number {
  if (sortedMonthKeys.length === 0) return 0;
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedMonthKeys.length; i++) {
    const [prevY, prevM] = sortedMonthKeys[i - 1].split("-").map(Number);
    const [currY, currM] = sortedMonthKeys[i].split("-").map(Number);

    const prevTotalMonths = prevY * 12 + prevM;
    const currTotalMonths = currY * 12 + currM;

    if (currTotalMonths === prevTotalMonths + 1) {
      currentStreak += 1;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else if (currTotalMonths > prevTotalMonths + 1) {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

export function calculateAchievementsFromEvents(
  events: Array<
    Pick<Event, "type" | "startAt" | "endAt" | "department">
  >,
  referenceNow: Date = new Date()
): AchievementsResult {
  let totalHosted = 0;
  let totalAttended = 0;
  let totalBusyEvents = 0;

  const busyDaySet = new Set<string>();
  const departmentsSet = new Set<string>();
  const yearCounts = new Map<string, number>();
  const monthCounts = new Map<string, number>();
  const monthsByYear = new Map<string, Set<string>>();

  for (const ev of events) {
    if (ev.type === EventType.HOSTED) totalHosted += 1;
    if (ev.type === EventType.ATTENDED) totalAttended += 1;
    if (ev.type === EventType.BUSY) {
      totalBusyEvents += 1;
      for (const dayStr of getCalendarDaysBetween(ev.startAt, ev.endAt)) {
        busyDaySet.add(dayStr);
      }
    }

    if (ev.department?.trim()) {
      departmentsSet.add(ev.department.trim().toLowerCase());
    }

    const yearKey = formatYearKeyInAppTz(ev.startAt);
    const monthKey = formatMonthKeyInAppTz(ev.startAt);

    yearCounts.set(yearKey, (yearCounts.get(yearKey) ?? 0) + 1);
    monthCounts.set(monthKey, (monthCounts.get(monthKey) ?? 0) + 1);

    if (!monthsByYear.has(yearKey)) {
      monthsByYear.set(yearKey, new Set());
    }
    monthsByYear.get(yearKey)!.add(monthKey);
  }

  let busiestMonth: { month: string; count: number } | null = null;
  for (const [month, count] of monthCounts.entries()) {
    if (
      !busiestMonth ||
      count > busiestMonth.count ||
      (count === busiestMonth.count && month > busiestMonth.month)
    ) {
      busiestMonth = { month, count };
    }
  }

  const sortedDistinctMonths = Array.from(monthCounts.keys()).sort();
  const activeMonthsStreak = computeLongestMonthStreak(sortedDistinctMonths);

  let hasFullCalendarYear = false;
  for (const monthSet of monthsByYear.values()) {
    if (monthSet.size === 12) {
      hasFullCalendarYear = true;
      break;
    }
  }

  const zonedNow = toZonedTime(referenceNow, APP_CONFIG.timezone);
  const eventsPerMonthLast12: AchievementsResult["eventsPerMonthLast12"] = [];
  const last12Map = new Map<
    string,
    {
      month: string;
      label: string;
      ATTENDED: number;
      HOSTED: number;
      BUSY: number;
      total: number;
    }
  >();

  for (let i = 11; i >= 0; i--) {
    const mDate = startOfMonth(subMonths(zonedNow, i));
    const key = format(mDate, "yyyy-MM");
    const label = format(mDate, "MMM yyyy");
    const entry = { month: key, label, ATTENDED: 0, HOSTED: 0, BUSY: 0, total: 0 };
    eventsPerMonthLast12.push(entry);
    last12Map.set(key, entry);
  }

  for (const ev of events) {
    const mKey = formatMonthKeyInAppTz(ev.startAt);
    const bucket = last12Map.get(mKey);
    if (bucket) {
      bucket[ev.type] += 1;
      bucket.total += 1;
    }
  }

  const eventsPerYear = Array.from(yearCounts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year));

  const { badges, topBadge } = evaluateBadges({
    totalHosted,
    totalAttended,
    distinctMonthsCount: sortedDistinctMonths.length,
    departmentsEngaged: departmentsSet.size,
    hasFullCalendarYear,
  });

  return {
    metrics: {
      totalHosted,
      totalAttended,
      totalBusyDays: busyDaySet.size,
      totalEvents: events.length,
      busiestMonth,
      activeMonthsStreak,
      departmentsEngaged: departmentsSet.size,
    },
    eventsPerYear,
    eventsPerMonthLast12,
    typeBreakdown: [
      { type: EventType.ATTENDED, count: totalAttended },
      { type: EventType.HOSTED, count: totalHosted },
      { type: EventType.BUSY, count: totalBusyEvents },
    ],
    badges,
    topBadge,
  };
}

import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  eachDayOfInterval,
  format,
} from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { APP_CONFIG } from "@/config/constants";

export function formatInAppTz(date: Date, pattern = "dd MMM yyyy, hh:mm a"): string {
  return formatInTimeZone(date, APP_CONFIG.timezone, pattern);
}

export function formatDateKeyInAppTz(date: Date): string {
  return formatInTimeZone(date, APP_CONFIG.timezone, "yyyy-MM-dd");
}

export function formatMonthKeyInAppTz(date: Date): string {
  return formatInTimeZone(date, APP_CONFIG.timezone, "yyyy-MM");
}

export function formatYearKeyInAppTz(date: Date): string {
  return formatInTimeZone(date, APP_CONFIG.timezone, "yyyy");
}

export function getCalendarDaysBetween(startAt: Date, endAt: Date): string[] {
  const tz = APP_CONFIG.timezone;
  const zonedStart = startOfDay(toZonedTime(startAt, tz));
  const zonedEnd = endOfDay(toZonedTime(endAt, tz));
  if (zonedEnd < zonedStart) return [format(zonedStart, "yyyy-MM-dd")];

  return eachDayOfInterval({ start: zonedStart, end: zonedEnd }).map((d) =>
    format(d, "yyyy-MM-dd")
  );
}

export function getAcademicYearRange(referenceDate: Date = new Date()): {
  from: Date;
  to: Date;
} {
  const tz = APP_CONFIG.timezone;
  const zonedNow = toZonedTime(referenceDate, tz);
  const startMonthIdx = APP_CONFIG.academicYearStartMonth - 1; // 0-indexed (July = 6)
  const currentYear = zonedNow.getFullYear();
  const currentMonth = zonedNow.getMonth();

  const startYear = currentMonth >= startMonthIdx ? currentYear : currentYear - 1;
  const startLocal = new Date(startYear, startMonthIdx, 1, 0, 0, 0, 0);
  const endLocal = endOfMonth(new Date(startYear + 1, startMonthIdx - 1, 1));

  return {
    from: fromZonedTime(startLocal, tz),
    to: fromZonedTime(endLocal, tz),
  };
}

export function getCurrentSemesterRange(referenceDate: Date = new Date()): {
  from: Date;
  to: Date;
} {
  const tz = APP_CONFIG.timezone;
  const zonedNow = toZonedTime(referenceDate, tz);
  const startMonthIdx = APP_CONFIG.academicYearStartMonth - 1; // e.g., 6 for July
  const secondSemMonthIdx = (startMonthIdx + 6) % 12; // e.g., 0 for Jan
  const year = zonedNow.getFullYear();
  const month = zonedNow.getMonth();

  let semStartLocal: Date;
  let semEndLocal: Date;

  if (startMonthIdx < secondSemMonthIdx) {
    if (month >= startMonthIdx && month < secondSemMonthIdx) {
      semStartLocal = new Date(year, startMonthIdx, 1, 0, 0, 0, 0);
      semEndLocal = endOfMonth(new Date(year, secondSemMonthIdx - 1, 1));
    } else {
      const sYear = month >= secondSemMonthIdx ? year : year - 1;
      semStartLocal = new Date(sYear, secondSemMonthIdx, 1, 0, 0, 0, 0);
      semEndLocal = endOfMonth(new Date(sYear + 1, startMonthIdx - 1, 1));
    }
  } else {
    // e.g., July (6) to Dec (11) and Jan (0) to June (5)
    if (month >= startMonthIdx) {
      semStartLocal = new Date(year, startMonthIdx, 1, 0, 0, 0, 0);
      semEndLocal = endOfMonth(new Date(year, 11, 1));
    } else if (month < startMonthIdx && month >= secondSemMonthIdx) {
      semStartLocal = new Date(year, secondSemMonthIdx, 1, 0, 0, 0, 0);
      semEndLocal = endOfMonth(new Date(year, startMonthIdx - 1, 1));
    } else {
      semStartLocal = new Date(year - 1, startMonthIdx, 1, 0, 0, 0, 0);
      semEndLocal = endOfMonth(new Date(year, secondSemMonthIdx - 1, 1));
    }
  }

  return {
    from: fromZonedTime(semStartLocal, tz),
    to: fromZonedTime(semEndLocal, tz),
  };
}

export function getPresetDateRange(
  preset:
    | "this_week"
    | "this_month"
    | "last_3_months"
    | "last_6_months"
    | "academic_year",
  now: Date = new Date()
): { from: Date; to: Date } {
  const tz = APP_CONFIG.timezone;
  const zonedNow = toZonedTime(now, tz);

  switch (preset) {
    case "this_week":
      return {
        from: fromZonedTime(startOfWeek(zonedNow, { weekStartsOn: 1 }), tz),
        to: fromZonedTime(endOfWeek(zonedNow, { weekStartsOn: 1 }), tz),
      };
    case "this_month":
      return {
        from: fromZonedTime(startOfMonth(zonedNow), tz),
        to: fromZonedTime(endOfMonth(zonedNow), tz),
      };
    case "last_3_months":
      return {
        from: fromZonedTime(startOfDay(subMonths(zonedNow, 3)), tz),
        to: fromZonedTime(endOfDay(zonedNow), tz),
      };
    case "last_6_months":
      return {
        from: fromZonedTime(startOfDay(subMonths(zonedNow, 6)), tz),
        to: fromZonedTime(endOfDay(zonedNow), tz),
      };
    case "academic_year":
      return getAcademicYearRange(now);
  }
}

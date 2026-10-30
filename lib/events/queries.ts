import { EventType, Prisma } from "@prisma/client";
import { addDays, endOfDay, startOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { APP_CONFIG } from "@/config/constants";
import { SEED_DEPARTMENTS } from "@/config/departments";
import { getPresetDateRange } from "@/lib/time";

export interface EventListFilters {
  preset?:
    | "this_week"
    | "this_month"
    | "last_3_months"
    | "last_6_months"
    | "academic_year";
  from?: Date;
  to?: Date;
  type?: string;
  department?: string;
  q?: string;
  page: number;
  pageSize: number;
}

export function parseEventTypesParam(typeParam?: string): EventType[] {
  if (!typeParam) return [];
  const valid = new Set<string>(Object.values(EventType));
  return typeParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is EventType => valid.has(s));
}

export function normalizeAllDayDates(
  startAt: Date,
  endAt: Date,
  allDay: boolean
): { startAt: Date; endAt: Date } {
  if (!allDay) return { startAt, endAt };
  const tz = APP_CONFIG.timezone;
  const zonedStart = startOfDay(toZonedTime(startAt, tz));
  const zonedEnd = endOfDay(toZonedTime(endAt, tz));
  return {
    startAt: fromZonedTime(zonedStart, tz),
    endAt: fromZonedTime(zonedEnd, tz),
  };
}

export function buildEventWhereClause(
  facultyId: string,
  filters: Omit<EventListFilters, "page" | "pageSize">
): Prisma.EventWhereInput {
  // SEC1: Every query includes facultyId in the where clause
  const where: Prisma.EventWhereInput = { facultyId };

  let rangeFrom = filters.from;
  let rangeTo = filters.to;

  if (filters.preset && !rangeFrom && !rangeTo) {
    const presetRange = getPresetDateRange(filters.preset);
    rangeFrom = presetRange.from;
    rangeTo = presetRange.to;
  }

  if (rangeFrom || rangeTo) {
    where.startAt = {
      ...(rangeFrom ? { gte: rangeFrom } : {}),
      ...(rangeTo ? { lte: rangeTo } : {}),
    };
  }

  const parsedTypes = parseEventTypesParam(filters.type);
  if (parsedTypes.length === 1) {
    where.type = parsedTypes[0];
  } else if (parsedTypes.length > 1) {
    where.type = { in: parsedTypes };
  }

  if (filters.department) {
    where.department = {
      equals: filters.department,
      mode: "insensitive",
    };
  }

  if (filters.q) {
    const q = filters.q;
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { organizer: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listFacultyEvents(
  facultyId: string,
  filters: EventListFilters
) {
  const where = buildEventWhereClause(facultyId, filters);
  const skip = (filters.page - 1) * filters.pageSize;

  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { startAt: "desc" },
      skip,
      take: filters.pageSize,
    }),
    prisma.event.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export async function getFacultyEventById(facultyId: string, eventId: string) {
  // SEC1 & SEC2: Filtered by both id and facultyId; caller returns 404 if null
  return prisma.event.findFirst({
    where: {
      id: eventId,
      facultyId,
    },
  });
}

export async function createFacultyEvent(
  facultyId: string,
  input: {
    title: string;
    type: EventType;
    startAt: Date;
    endAt: Date;
    allDay: boolean;
    location?: string | null;
    department?: string | null;
    organizer?: string | null;
    role?: string | null;
    description?: string | null;
    attachmentUrl?: string | null;
  }
) {
  const { startAt, endAt } = normalizeAllDayDates(
    input.startAt,
    input.endAt,
    input.allDay
  );

  return prisma.event.create({
    data: {
      facultyId,
      title: input.title,
      type: input.type,
      startAt,
      endAt,
      allDay: input.allDay,
      location: input.location ?? null,
      department: input.department ?? null,
      organizer: input.organizer ?? null,
      role: input.role ?? null,
      description: input.description ?? null,
      attachmentUrl: input.attachmentUrl ?? null,
    },
  });
}

export async function updateFacultyEvent(
  facultyId: string,
  eventId: string,
  patch: Partial<{
    title: string;
    type: EventType;
    startAt: Date;
    endAt: Date;
    allDay: boolean;
    location: string | null;
    department: string | null;
    organizer: string | null;
    role: string | null;
    description: string | null;
    attachmentUrl: string | null;
  }>
) {
  const existing = await getFacultyEventById(facultyId, eventId);
  if (!existing) return null;

  const nextAllDay = patch.allDay ?? existing.allDay;
  const rawStart = patch.startAt ?? existing.startAt;
  const rawEnd = patch.endAt ?? existing.endAt;

  if (rawEnd < rawStart) {
    throw new Error("INVALID_DATE_ORDER");
  }

  const { startAt, endAt } = normalizeAllDayDates(rawStart, rawEnd, nextAllDay);

  return prisma.event.update({
    where: { id: existing.id },
    data: {
      ...patch,
      startAt,
      endAt,
      allDay: nextAllDay,
    },
  });
}

export async function deleteFacultyEvent(
  facultyId: string,
  eventId: string
): Promise<boolean> {
  const result = await prisma.event.deleteMany({
    where: {
      id: eventId,
      facultyId, // SEC1
    },
  });
  return result.count > 0;
}

export async function duplicateFacultyEvent(
  facultyId: string,
  eventId: string,
  newStartAt?: Date
) {
  const source = await getFacultyEventById(facultyId, eventId);
  if (!source) return null;

  const durationMs = source.endAt.getTime() - source.startAt.getTime();
  const targetStart = newStartAt ?? addDays(source.startAt, 7); // F2.7: Default +7 days
  const targetEnd = new Date(targetStart.getTime() + durationMs);

  return prisma.event.create({
    data: {
      facultyId,
      title: source.title,
      type: source.type,
      startAt: targetStart,
      endAt: targetEnd,
      allDay: source.allDay,
      location: source.location,
      department: source.department,
      organizer: source.organizer,
      role: source.role,
      description: source.description,
      attachmentUrl: source.attachmentUrl,
    },
  });
}

export async function getFacultyDepartmentsList(
  facultyId: string
): Promise<string[]> {
  const usedRows = await prisma.event.findMany({
    where: {
      facultyId,
      department: { not: null },
    },
    select: { department: true },
    distinct: ["department"],
  });

  const merged = new Set<string>(SEED_DEPARTMENTS);
  for (const row of usedRows) {
    if (row.department?.trim()) {
      merged.add(row.department.trim());
    }
  }
  return Array.from(merged).sort((a, b) => a.localeCompare(b));
}

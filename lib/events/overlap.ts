import { prisma } from "@/lib/db";

export interface OverlappingEventSummary {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
}

/**
 * F2.8 & Section 15.1: Returns true for partial and full overlap, false for adjacent events.
 */
export function intervalsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  if (startA.getTime() === endA.getTime() && startB.getTime() === endB.getTime()) {
    return startA.getTime() === startB.getTime();
  }
  return startA < endB && endA > startB;
}

export async function findOverlappingEvents(params: {
  facultyId: string;
  startAt: Date;
  endAt: Date;
  excludeId?: string;
}): Promise<OverlappingEventSummary[]> {
  const { facultyId, startAt, endAt, excludeId } = params;

  const candidates = await prisma.event.findMany({
    where: {
      facultyId, // SEC1: Mandatory scoping
      ...(excludeId ? { id: { not: excludeId } } : {}),
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: {
      id: true,
      title: true,
      startAt: true,
      endAt: true,
    },
    orderBy: { startAt: "asc" },
  });

  return candidates.filter((c) =>
    intervalsOverlap(startAt, endAt, c.startAt, c.endAt)
  );
}

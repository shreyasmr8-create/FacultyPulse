import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/db";
import { authProvider } from "@/lib/auth/provider";
import { buildEventWhereClause } from "@/lib/events/queries";
import { formatDateKeyInAppTz } from "@/lib/time";
import { apiError, handleZodError, logRequest } from "@/lib/api-response";

const calendarQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
    type: z.string().optional(),
    department: z.string().optional(),
    q: z.string().optional(),
  })
  .strict();

export async function GET(req: NextRequest) {
  const startMs = Date.now();
  const path = "/api/calendar";

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  try {
    const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filters = calendarQuerySchema.parse(rawParams);

    const where = buildEventWhereClause(session.facultyId, filters);
    const events = await prisma.event.findMany({
      where,
      orderBy: { startAt: "asc" },
    });

    const groupedByDate: Record<string, typeof events> = {};
    for (const ev of events) {
      const dateKey = formatDateKeyInAppTz(ev.startAt);
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(ev);
    }

    logRequest(path, 200, startMs);
    return NextResponse.json({
      events,
      groupedByDate,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      logRequest(path, 400, startMs);
      return handleZodError(err);
    }
    logRequest(path, 500, startMs);
    return apiError("INTERNAL_ERROR", "Failed to load calendar events.", 500);
  }
}

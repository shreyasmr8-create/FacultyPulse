import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/db";
import { authProvider } from "@/lib/auth/provider";
import { buildEventWhereClause } from "@/lib/events/queries";
import { calculateAchievementsFromEvents } from "@/lib/achievements/metrics";
import { apiError, handleZodError, logRequest } from "@/lib/api-response";

const achievementsQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    type: z.string().optional(),
    department: z.string().optional(),
  })
  .strict();

export async function GET(req: NextRequest) {
  const startMs = Date.now();
  const path = "/api/achievements";

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  try {
    const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filters = achievementsQuerySchema.parse(rawParams);

    const where = buildEventWhereClause(session.facultyId, filters);
    const events = await prisma.event.findMany({
      where,
      select: {
        type: true,
        startAt: true,
        endAt: true,
        department: true,
      },
      orderBy: { startAt: "asc" },
    });

    const data = calculateAchievementsFromEvents(events);
    logRequest(path, 200, startMs);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof ZodError) {
      logRequest(path, 400, startMs);
      return handleZodError(err);
    }
    logRequest(path, 500, startMs);
    return apiError("INTERNAL_ERROR", "Failed to calculate achievements.", 500);
  }
}

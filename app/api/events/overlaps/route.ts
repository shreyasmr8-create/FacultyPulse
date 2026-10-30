import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { authProvider } from "@/lib/auth/provider";
import { findOverlappingEvents } from "@/lib/events/overlap";
import { apiError, handleZodError, logRequest } from "@/lib/api-response";

const overlapQuerySchema = z
  .object({
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    excludeId: z.string().optional(),
  })
  .strict();

export async function GET(req: NextRequest) {
  const startMs = Date.now();
  const path = "/api/events/overlaps";

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  try {
    const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const { startAt, endAt, excludeId } = overlapQuerySchema.parse(rawParams);

    const overlaps = await findOverlappingEvents({
      facultyId: session.facultyId,
      startAt,
      endAt,
      excludeId,
    });

    logRequest(path, 200, startMs);
    return NextResponse.json({
      overlaps,
      warning:
        overlaps.length > 0
          ? `This overlaps with '${overlaps[0].title}'.`
          : null,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      logRequest(path, 400, startMs);
      return handleZodError(err);
    }
    logRequest(path, 500, startMs);
    return apiError("INTERNAL_ERROR", "Failed to check overlaps.", 500);
  }
}

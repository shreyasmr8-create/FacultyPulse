import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { addDays } from "date-fns";
import { authProvider } from "@/lib/auth/provider";
import { duplicateEventSchema } from "@/lib/validation/event";
import { duplicateFacultyEvent, getFacultyEventById } from "@/lib/events/queries";
import { findOverlappingEvents } from "@/lib/events/overlap";
import { apiError, handleZodError, logRequest } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const startMs = Date.now();
  const { id } = await context.params;
  const path = `/api/events/${id}/duplicate`;

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { startAt } = duplicateEventSchema.parse(body);

    const source = await getFacultyEventById(session.facultyId, id);
    if (!source) {
      logRequest(path, 404, startMs);
      return apiError("NOT_FOUND", "Event not found.", 404);
    }

    const durationMs = source.endAt.getTime() - source.startAt.getTime();
    const targetStart = startAt ?? addDays(source.startAt, 7);
    const targetEnd = new Date(targetStart.getTime() + durationMs);

    const overlaps = await findOverlappingEvents({
      facultyId: session.facultyId,
      startAt: targetStart,
      endAt: targetEnd,
    });
    const warning =
      overlaps.length > 0
        ? `This overlaps with '${overlaps[0].title}'.`
        : null;

    const duplicated = await duplicateFacultyEvent(
      session.facultyId,
      id,
      startAt
    );

    if (!duplicated) {
      logRequest(path, 404, startMs);
      return apiError("NOT_FOUND", "Event not found.", 404);
    }

    logRequest(path, 201, startMs);
    return NextResponse.json(
      {
        event: duplicated,
        overlaps,
        warning,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ZodError) {
      logRequest(path, 400, startMs);
      return handleZodError(err);
    }
    logRequest(path, 500, startMs);
    return apiError("INTERNAL_ERROR", "Failed to duplicate event.", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { authProvider } from "@/lib/auth/provider";
import {
  createEventSchema,
  listEventsQuerySchema,
} from "@/lib/validation/event";
import {
  createFacultyEvent,
  listFacultyEvents,
} from "@/lib/events/queries";
import { findOverlappingEvents } from "@/lib/events/overlap";
import { apiError, handleZodError, logRequest } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const startMs = Date.now();
  const path = "/api/events";

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  try {
    const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filters = listEventsQuerySchema.parse(rawParams);
    const result = await listFacultyEvents(session.facultyId, filters);

    logRequest(path, 200, startMs);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      logRequest(path, 400, startMs);
      return handleZodError(err);
    }
    logRequest(path, 500, startMs);
    return apiError("INTERNAL_ERROR", "Failed to load events.", 500);
  }
}

export async function POST(req: NextRequest) {
  const startMs = Date.now();
  const path = "/api/events";

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  try {
    const body = await req.json();
    const input = createEventSchema.parse(body);

    const overlaps = await findOverlappingEvents({
      facultyId: session.facultyId,
      startAt: input.startAt,
      endAt: input.endAt,
    });

    const created = await createFacultyEvent(session.facultyId, input);

    logRequest(path, 201, startMs);
    return NextResponse.json(
      {
        event: created,
        overlaps,
        warning:
          overlaps.length > 0
            ? `This overlaps with '${overlaps[0].title}'.`
            : null,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ZodError) {
      logRequest(path, 400, startMs);
      return handleZodError(err);
    }
    logRequest(path, 500, startMs);
    return apiError("INTERNAL_ERROR", "Failed to create event.", 500);
  }
}

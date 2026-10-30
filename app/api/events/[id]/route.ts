import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { authProvider } from "@/lib/auth/provider";
import { updateEventSchema } from "@/lib/validation/event";
import {
  getFacultyEventById,
  updateFacultyEvent,
  deleteFacultyEvent,
} from "@/lib/events/queries";
import { apiError, handleZodError, logRequest } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const startMs = Date.now();
  const { id } = await context.params;
  const path = `/api/events/${id}`;

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  const event = await getFacultyEventById(session.facultyId, id);
  if (!event) {
    logRequest(path, 404, startMs);
    return apiError("NOT_FOUND", "Event not found.", 404);
  }

  logRequest(path, 200, startMs);
  return NextResponse.json({ event });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const startMs = Date.now();
  const { id } = await context.params;
  const path = `/api/events/${id}`;

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  try {
    const body = await req.json();
    const patch = updateEventSchema.parse(body);

    const updated = await updateFacultyEvent(session.facultyId, id, patch);
    if (!updated) {
      logRequest(path, 404, startMs);
      return apiError("NOT_FOUND", "Event not found.", 404);
    }

    logRequest(path, 200, startMs);
    return NextResponse.json({ event: updated });
  } catch (err) {
    if (err instanceof ZodError) {
      logRequest(path, 400, startMs);
      return handleZodError(err);
    }
    if (err instanceof Error && err.message === "INVALID_DATE_ORDER") {
      logRequest(path, 400, startMs);
      return apiError(
        "VALIDATION_ERROR",
        "End time must be after or equal to start time.",
        400,
        { endAt: "End time must be after or equal to start time." }
      );
    }
    logRequest(path, 500, startMs);
    return apiError("INTERNAL_ERROR", "Failed to update event.", 500);
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const startMs = Date.now();
  const { id } = await context.params;
  const path = `/api/events/${id}`;

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  const deleted = await deleteFacultyEvent(session.facultyId, id);
  if (!deleted) {
    logRequest(path, 404, startMs);
    return apiError("NOT_FOUND", "Event not found.", 404);
  }

  logRequest(path, 204, startMs);
  return new NextResponse(null, { status: 204 });
}

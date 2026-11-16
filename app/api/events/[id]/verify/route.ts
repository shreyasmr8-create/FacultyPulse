import { NextRequest, NextResponse } from "next/server";
import { authProvider } from "@/lib/auth/provider";
import { getFacultyEventById, verifyFacultyEvent } from "@/lib/events/queries";
import { apiError, logRequest } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const startMs = Date.now();
  const { id } = await context.params;
  const path = `/api/events/${id}/verify`;

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  const existing = await getFacultyEventById(session.facultyId, id);
  if (!existing) {
    logRequest(path, 404, startMs);
    return apiError("NOT_FOUND", "Event not found.", 404);
  }

  let verify = true;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body.verify === "boolean") {
      verify = body.verify;
    }
  } catch {
    // default to true
  }

  const verifierName = `${session.facultyCode} (Faculty Verified)`;
  const updated = await verifyFacultyEvent(
    session.facultyId,
    id,
    verifierName,
    verify
  );

  logRequest(path, 200, startMs);
  return NextResponse.json({
    success: true,
    event: updated,
    message: verify
      ? "Event verified and approved successfully. It is now locked against edits."
      : "Event verification revoked.",
  });
}

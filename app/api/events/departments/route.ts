import { NextResponse } from "next/server";
import { authProvider } from "@/lib/auth/provider";
import { getFacultyDepartmentsList } from "@/lib/events/queries";
import { apiError, logRequest } from "@/lib/api-response";

export async function GET() {
  const startMs = Date.now();
  const path = "/api/events/departments";

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  const departments = await getFacultyDepartmentsList(session.facultyId);
  logRequest(path, 200, startMs);
  return NextResponse.json({ departments });
}

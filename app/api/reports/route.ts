import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { authProvider } from "@/lib/auth/provider";
import { reportQuerySchema } from "@/lib/validation/report";
import { buildFacultyReport } from "@/lib/reports/build";
import { apiError, handleZodError, logRequest } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const startMs = Date.now();
  const path = "/api/reports";

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  try {
    const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = reportQuerySchema.parse(rawParams);

    const report = await buildFacultyReport({
      facultyId: session.facultyId,
      from: parsed.from,
      to: parsed.to,
      type: parsed.type,
      department: parsed.department,
      title: parsed.title,
    });

    logRequest(path, 200, startMs);
    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof ZodError) {
      logRequest(path, 400, startMs);
      return handleZodError(err);
    }
    logRequest(path, 500, startMs);
    return apiError("INTERNAL_ERROR", "Failed to generate report.", 500);
  }
}

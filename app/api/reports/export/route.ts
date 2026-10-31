import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { authProvider } from "@/lib/auth/provider";
import { reportQuerySchema } from "@/lib/validation/report";
import { buildFacultyReport } from "@/lib/reports/build";
import { generateReportCsv } from "@/lib/reports/csv";
import { generateReportXlsx } from "@/lib/reports/xlsx";
import { generateReportDocx } from "@/lib/reports/docx";
import { apiError, handleZodError, logRequest } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const startMs = Date.now();
  const path = "/api/reports/export";

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  try {
    const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = reportQuerySchema.parse(rawParams);
    const format = parsed.format ?? "csv";

    const report = await buildFacultyReport({
      facultyId: session.facultyId,
      from: parsed.from,
      to: parsed.to,
      type: parsed.type,
      department: parsed.department,
      title: parsed.title,
    });

    const baseFileName = `FacultyPulse_${report.header.facultyCode}_${report.header.from}_to_${report.header.to}`;

    if (format === "docx") {
      const buffer = await generateReportDocx(report);
      logRequest(path, 200, startMs);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${baseFileName}.docx"`,
        },
      });
    }

    if (format === "xlsx") {
      const buffer = generateReportXlsx(report);
      logRequest(path, 200, startMs);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${baseFileName}.xlsx"`,
        },
      });
    }

    const csvContent = generateReportCsv(report);
    logRequest(path, 200, startMs);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseFileName}.csv"`,
      },
    });
  } catch (err) {
    console.error("REPORTS_EXPORT_ERROR:", err);
    if (err instanceof ZodError) {
      logRequest(path, 400, startMs);
      return handleZodError(err);
    }
    logRequest(path, 500, startMs);
    return apiError("INTERNAL_ERROR", "Failed to export report.", 500);
  }
}

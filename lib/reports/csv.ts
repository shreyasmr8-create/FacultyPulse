import { ReportPayload } from "./build";

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? "");
  const sanitized = /^[=+\-@]/.test(str) ? `'${str}` : str;
  if (/[",\r\n]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

/**
 * F5.4: UTF-8 with BOM so Excel opens it correctly.
 */
export function generateReportCsv(report: ReportPayload): string {
  const BOM = "\uFEFF";
  const lines: string[] = [];

  lines.push(
    ["Report Title", report.header.title].map(escapeCsvCell).join(","),
    ["Faculty Name", report.header.facultyName].map(escapeCsvCell).join(","),
    ["Faculty ID", report.header.facultyCode].map(escapeCsvCell).join(","),
    ["Department", report.header.department].map(escapeCsvCell).join(","),
    ["Period", `${report.header.from} to ${report.header.to}`]
      .map(escapeCsvCell)
      .join(","),
    ["Generated On", report.header.generatedDate].map(escapeCsvCell).join(","),
    "",
    ["Total Events", report.summary.totalEvents].map(escapeCsvCell).join(","),
    ["Total Hosted", report.summary.totalHosted].map(escapeCsvCell).join(","),
    ["Total Attended", report.summary.totalAttended]
      .map(escapeCsvCell)
      .join(","),
    ["Total Busy Days", report.summary.totalBusyDays]
      .map(escapeCsvCell)
      .join(","),
    [
      "Departments Involved",
      report.summary.departmentsInvolved.join("; ") || "None",
    ]
      .map(escapeCsvCell)
      .join(","),
    "",
    [
      "Date",
      "Title",
      "Type",
      "Role",
      "Organizer",
      "Location",
      "Department",
    ]
      .map(escapeCsvCell)
      .join(",")
  );

  for (const ev of report.events) {
    lines.push(
      [
        ev.dateFormatted,
        ev.title,
        ev.type,
        ev.role,
        ev.organizer,
        ev.location,
        ev.department,
      ]
        .map(escapeCsvCell)
        .join(",")
    );
  }

  lines.push("", escapeCsvCell(report.footer));
  return BOM + lines.join("\r\n");
}

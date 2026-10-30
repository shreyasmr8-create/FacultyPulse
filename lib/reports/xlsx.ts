import * as XLSX from "xlsx";
import { ReportPayload } from "./build";

/**
 * F5.5: Two sheets: "Summary" and "Events". Columns auto-sized, header row bold and frozen.
 */
export function generateReportXlsx(report: ReportPayload): Buffer {
  const wb = XLSX.utils.book_new();

  const summaryRows = [
    ["Metric", "Value"],
    ["Report Title", report.header.title],
    ["Faculty Name", report.header.facultyName],
    ["Faculty ID", report.header.facultyCode],
    ["Department", report.header.department],
    ["Period From", report.header.from],
    ["Period To", report.header.to],
    ["Generated Date", report.header.generatedDate],
    ["Total Events", report.summary.totalEvents],
    ["Total Hosted", report.summary.totalHosted],
    ["Total Attended", report.summary.totalAttended],
    ["Total Busy Days", report.summary.totalBusyDays],
    [
      "Departments Involved",
      report.summary.departmentsInvolved.join(", ") || "None",
    ],
    ["Disclaimer", report.footer],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 24 }, { wch: 55 }];
  wsSummary["!freeze"] = { xSplit: 0, ySplit: 1 };

  const eventsHeader = [
    "Date",
    "Title",
    "Type",
    "Role",
    "Organizer",
    "Location",
    "Department",
  ];

  const eventsData = report.events.map((ev) => [
    ev.dateFormatted,
    ev.title,
    ev.type,
    ev.role,
    ev.organizer,
    ev.location,
    ev.department,
  ]);

  const allEventRows = [eventsHeader, ...eventsData];
  const wsEvents = XLSX.utils.aoa_to_sheet(allEventRows);

  wsEvents["!cols"] = eventsHeader.map((header, colIdx) => {
    let maxLen = header.length;
    for (const row of eventsData) {
      const cellStr = String(row[colIdx] ?? "");
      if (cellStr.length > maxLen) maxLen = cellStr.length;
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
  });

  wsEvents["!freeze"] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
  XLSX.utils.book_append_sheet(wb, wsEvents, "Events");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  HeightRule,
} from "docx";
import { ReportPayload } from "./build";

export async function generateReportDocx(report: ReportPayload): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  // 1. University Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: (report.header.universityName || "DAYANANDA SAGAR UNIVERSITY").toUpperCase(),
          bold: true,
          size: 32, // 16pt
          color: "1e3a8a", // Navy
          font: "Arial",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: "FACULTY SEMESTER ACTIVITY & ACCREDITATION DOSSIER",
          bold: true,
          size: 24, // 12pt
          color: "0f172a",
          font: "Arial",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `Reporting Period: ${report.header.from} to ${report.header.to}  |  Generated on: ${report.header.generatedDate}`,
          italics: true,
          size: 18, // 9pt
          color: "64748b",
          font: "Arial",
        }),
      ],
    })
  );

  // 2. Faculty Profile Table
  const profileTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Faculty Name: ", bold: true, size: 20 }),
                  new TextRun({ text: report.header.facultyName, size: 20 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Faculty Code: ", bold: true, size: 20 }),
                  new TextRun({ text: report.header.facultyCode, size: 20 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Department: ", bold: true, size: 20 }),
                  new TextRun({ text: report.header.department, size: 20 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Institution: ", bold: true, size: 20 }),
                  new TextRun({ text: report.header.universityName, size: 20 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  children.push(profileTable);

  children.push(new Paragraph({ spacing: { before: 200, after: 120 } }));

  // 3. Executive Metrics Summary Table
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 160, after: 120 },
      children: [
        new TextRun({
          text: "1. Executive Summary & Workload Metrics",
          bold: true,
          size: 22,
          color: "1e3a8a",
        }),
      ],
    })
  );

  const metricsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "f1f5f9" },
            children: [new Paragraph({ children: [new TextRun({ text: "Metric Category", bold: true, size: 18 })] })],
          }),
          new TableCell({
            shading: { fill: "f1f5f9" },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Recorded Count", bold: true, size: 18 })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total Academic Events Recorded", size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: String(report.summary.totalEvents), bold: true, size: 18 })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Sessions & Workshops Hosted (Organized)", size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: String(report.summary.totalHosted), bold: true, size: 18, color: "2563eb" })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Conferences & Seminars Attended", size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: String(report.summary.totalAttended), bold: true, size: 18, color: "059669" })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Duty / Busy Blocked Days", size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: String(report.summary.totalBusyDays), bold: true, size: 18, color: "d97706" })] })] }),
        ],
      }),
    ],
  });
  children.push(metricsTable);

  children.push(new Paragraph({ spacing: { before: 200, after: 120 } }));

  // 4. Itemized Event Details (One by One)
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: `2. Itemized Event Dossier (${report.events.length} Events)`,
          bold: true,
          size: 22,
          color: "1e3a8a",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 180 },
      children: [
        new TextRun({
          text: "Chronological detailed listing of all academic commitments, sessions, and conferences including exact faculty notes and descriptions filed during recording.",
          italics: true,
          size: 16,
          color: "64748b",
        }),
      ],
    })
  );

  report.events.forEach((ev, idx) => {
    const typeLabel =
      ev.type === "HOSTED"
        ? "HOSTED (Organized)"
        : ev.type === "ATTENDED"
        ? "ATTENDED (Participant)"
        : "BUSY (Slot Blocked)";

    const typeColor =
      ev.type === "HOSTED" ? "1d4ed8" : ev.type === "ATTENDED" ? "047857" : "b45309";

    const eventTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Event Title & Type Banner
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              shading: { fill: "f8fafc" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `Event #${idx + 1}: `, bold: true, size: 20, color: "334155" }),
                    new TextRun({ text: ev.title, bold: true, size: 20, color: "0f172a" }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 40 },
                  children: [
                    new TextRun({ text: `Type: ${typeLabel}   |   Date: ${ev.dateFormatted}`, bold: true, size: 16, color: typeColor }),
                  ],
                }),
              ],
            }),
          ],
        }),
        // Metadata Grid
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Department: ", bold: true, size: 16 }),
                    new TextRun({ text: ev.department || "—", size: 16 }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Venue / Location: ", bold: true, size: 16 }),
                    new TextRun({ text: ev.location || "—", size: 16 }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Organizer: ", bold: true, size: 16 }),
                    new TextRun({ text: ev.organizer || "—", size: 16 }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Faculty Role: ", bold: true, size: 16 }),
                    new TextRun({ text: ev.role || "—", size: 16 }),
                  ],
                }),
              ],
            }),
          ],
        }),
        // Description / Notes Row
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Description & Academic Notes:", bold: true, size: 16, color: "475569" })],
                }),
                new Paragraph({
                  spacing: { before: 60, after: 60 },
                  children: [
                    new TextRun({
                      text: ev.description || "No additional notes filed for this event.",
                      italics: !ev.description,
                      size: 16,
                      color: ev.description ? "1e293b" : "94a3b8",
                    }),
                  ],
                }),
                ...(ev.attachmentUrl
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Attached Document Link: ", bold: true, size: 16, color: "2563eb" }),
                          new TextRun({ text: ev.attachmentUrl, size: 16, color: "2563eb" }),
                        ],
                      }),
                    ]
                  : []),
              ],
            }),
          ],
        }),
      ],
    });

    children.push(eventTable);
    children.push(new Paragraph({ spacing: { after: 160 } }));
  });

  // 5. Signature Section
  children.push(
    new Paragraph({
      spacing: { before: 400, after: 120 },
      children: [
        new TextRun({
          text: "3. Institutional Signatures & Verification",
          bold: true,
          size: 20,
          color: "1e3a8a",
        }),
      ],
    })
  );

  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: "_______________________", size: 18 })] }),
              new Paragraph({ children: [new TextRun({ text: "Faculty Member Signature", bold: true, size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: `Date: ${report.header.generatedDate}`, size: 14, color: "64748b" })] }),
            ],
          }),
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: "_______________________", size: 18 })] }),
              new Paragraph({ children: [new TextRun({ text: "Head of Department (HOD)", bold: true, size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: "Seal & Date", size: 14, color: "64748b" })] }),
            ],
          }),
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: "_______________________", size: 18 })] }),
              new Paragraph({ children: [new TextRun({ text: "Dean / Principal Approval", bold: true, size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: "Academic Council Seal", size: 14, color: "64748b" })] }),
            ],
          }),
        ],
      }),
    ],
  });
  children.push(signatureTable);

  // 6. Footer Disclaimer
  children.push(
    new Paragraph({
      spacing: { before: 300 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: report.footer,
          italics: true,
          size: 14,
          color: "94a3b8",
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

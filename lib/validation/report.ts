import { z } from "zod";
import { differenceInCalendarDays } from "date-fns";
import { APP_CONFIG } from "@/config/constants";

export const reportQuerySchema = z
  .object({
    from: z.coerce.date({
      errorMap: () => ({ message: "Start date (from) is required." }),
    }),
    to: z.coerce.date({
      errorMap: () => ({ message: "End date (to) is required." }),
    }),
    type: z.string().optional(),
    department: z.string().trim().max(100).optional(),
    title: z
      .string()
      .trim()
      .max(150)
      .default("Semester Activity Report"),
    format: z.enum(["csv", "xlsx", "docx", "pdf", "html"]).optional(),
  })
  .strict()
  .refine((d) => d.to >= d.from, {
    message: "End date must be on or after start date.",
    path: ["to"],
  })
  .refine(
    (d) => differenceInCalendarDays(d.to, d.from) <= APP_CONFIG.maxReportDays,
    {
      message: "Report date range cannot exceed 366 days.",
      path: ["to"],
    }
  );

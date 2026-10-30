import { z } from "zod";
import { EventType } from "@prisma/client";

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null));

const baseEventFields = {
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(150, "Title must be 150 characters or fewer."),
  type: z.nativeEnum(EventType, {
    errorMap: () => ({ message: "Type must be ATTENDED, HOSTED, or BUSY." }),
  }),
  startAt: z.coerce.date({
    errorMap: () => ({ message: "Valid start date and time required." }),
  }),
  endAt: z.coerce.date({
    errorMap: () => ({ message: "Valid end date and time required." }),
  }),
  allDay: z.boolean().default(false),
  location: optionalText(200, "Location"),
  department: optionalText(100, "Department"),
  organizer: optionalText(150, "Organizer"),
  role: optionalText(100, "Role"),
  description: optionalText(2000, "Description"),
  attachmentUrl: optionalText(500, "Attachment URL"),
};

export const createEventSchema = z
  .object(baseEventFields)
  .strict()
  .refine((data) => data.endAt >= data.startAt, {
    message: "End time must be after or equal to start time.",
    path: ["endAt"],
  });

export const updateEventSchema = z
  .object(baseEventFields)
  .partial()
  .strict()
  .refine(
    (data) => {
      if (data.startAt && data.endAt) {
        return data.endAt >= data.startAt;
      }
      return true;
    },
    {
      message: "End time must be after or equal to start time.",
      path: ["endAt"],
    }
  );

export const duplicateEventSchema = z
  .object({
    startAt: z.coerce.date().optional(),
  })
  .strict();

export const listEventsQuerySchema = z
  .object({
    preset: z
      .enum([
        "this_week",
        "this_month",
        "last_3_months",
        "last_6_months",
        "academic_year",
      ])
      .optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    type: z.string().optional(),
    department: z.string().trim().max(100).optional(),
    q: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

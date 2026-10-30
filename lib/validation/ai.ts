import { z } from "zod";
import { EventType } from "@prisma/client";

export const aiSearchRequestSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, "Please enter a search message.")
      .max(300, "Search message must be 300 characters or fewer."),
  })
  .strict();

export const parsedFilterSchema = z
  .object({
    type: z.nativeEnum(EventType).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    keywords: z.array(z.string()).default([]),
    location: z.string().optional(),
    organizer: z.string().optional(),
    dateLabel: z.string().optional(),
  })
  .strict();

export type StructuredAiFilter = z.infer<typeof parsedFilterSchema>;

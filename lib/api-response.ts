import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export function apiError(
  code: ErrorCode,
  message: string,
  status: number,
  fields?: Record<string, string>
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(fields ? { fields } : {}),
      },
    },
    { status }
  );
}

export function handleZodError(error: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "root";
    if (!fields[key]) {
      fields[key] = issue.message;
    }
  }
  const firstMessage = error.issues[0]?.message || "Invalid input provided.";
  return apiError("VALIDATION_ERROR", firstMessage, 400, fields);
}

/**
 * SEC9: No event data written to logs. Log only request path, status, and duration.
 */
export function logRequest(path: string, status: number, startTimeMs: number) {
  const durationMs = Date.now() - startTimeMs;
  console.info(`[API] path=${path} status=${status} duration=${durationMs}ms`);
}

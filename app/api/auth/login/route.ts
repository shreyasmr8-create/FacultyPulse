import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { loginSchema } from "@/lib/validation/auth";
import {
  authProvider,
  setSessionCookie,
} from "@/lib/auth/provider";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
} from "@/lib/auth/rate-limit";
import { apiError, handleZodError, logRequest } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const startMs = Date.now();
  const path = "/api/auth/login";

  try {
    const body = await req.json();
    const { facultyCode, password } = loginSchema.parse(body);

    const rateCheck = checkLoginRateLimit(facultyCode);
    if (!rateCheck.allowed) {
      logRequest(path, 429, startMs);
      return apiError(
        "RATE_LIMITED",
        "Too many attempts, try again later.",
        429
      );
    }

    const result = await authProvider.signIn(facultyCode, password);
    if (!result) {
      recordFailedLogin(facultyCode);
      logRequest(path, 401, startMs);
      return apiError(
        "UNAUTHORIZED",
        "Faculty ID or password is incorrect.",
        401
      );
    }

    clearLoginRateLimit(facultyCode);
    const res = NextResponse.json({ faculty: result.profile }, { status: 200 });
    setSessionCookie(res, result.token);
    logRequest(path, 200, startMs);
    return res;
  } catch (err) {
    if (err instanceof ZodError) {
      logRequest(path, 400, startMs);
      return handleZodError(err);
    }
    logRequest(path, 500, startMs);
    return apiError("INTERNAL_ERROR", "Unable to sign in.", 500);
  }
}

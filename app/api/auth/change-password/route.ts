import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { authProvider } from "@/lib/auth/provider";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { changePasswordSchema } from "@/lib/validation/auth";
import { apiError, handleZodError, logRequest } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const startMs = Date.now();
  const path = "/api/auth/change-password";

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const faculty = await prisma.faculty.findUnique({
      where: { id: session.facultyId },
    });
    if (!faculty) {
      logRequest(path, 401, startMs);
      return apiError("UNAUTHORIZED", "Account not found.", 401);
    }

    const matches = await verifyPassword(currentPassword, faculty.passwordHash);
    if (!matches) {
      logRequest(path, 400, startMs);
      return apiError(
        "VALIDATION_ERROR",
        "Current password is incorrect.",
        400,
        { currentPassword: "Current password is incorrect." }
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.faculty.update({
      where: { id: session.facultyId },
      data: { passwordHash },
    });

    logRequest(path, 200, startMs);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    if (err instanceof ZodError) {
      logRequest(path, 400, startMs);
      return handleZodError(err);
    }
    logRequest(path, 500, startMs);
    return apiError("INTERNAL_ERROR", "Unable to change password.", 500);
  }
}

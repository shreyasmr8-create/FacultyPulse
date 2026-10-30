import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { authProvider, toPublicProfile } from "@/lib/auth/provider";
import {
  updateProfileSchema,
  deleteAccountSchema,
} from "@/lib/validation/auth";
import { apiError, handleZodError, logRequest } from "@/lib/api-response";

export async function GET() {
  const startMs = Date.now();
  const path = "/api/auth/me";

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  const faculty = await prisma.faculty.findUnique({
    where: { id: session.facultyId },
  });

  if (!faculty) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Session is no longer valid.", 401);
  }

  logRequest(path, 200, startMs);
  return NextResponse.json({ faculty: toPublicProfile(faculty) });
}

export async function PATCH(req: NextRequest) {
  const startMs = Date.now();
  const path = "/api/auth/me";

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  try {
    const body = await req.json();
    const patch = updateProfileSchema.parse(body);

    if (patch.email) {
      const emailOwner = await prisma.faculty.findUnique({
        where: { email: patch.email },
      });
      if (emailOwner && emailOwner.id !== session.facultyId) {
        logRequest(path, 409, startMs);
        return apiError("CONFLICT", "Email is already in use.", 409, {
          email: "Email is already in use by another account.",
        });
      }
    }

    const updated = await prisma.faculty.update({
      where: { id: session.facultyId },
      data: patch,
    });

    logRequest(path, 200, startMs);
    return NextResponse.json({ faculty: toPublicProfile(updated) });
  } catch (err) {
    if (err instanceof ZodError) {
      logRequest(path, 400, startMs);
      return handleZodError(err);
    }
    logRequest(path, 500, startMs);
    return apiError("INTERNAL_ERROR", "Unable to update profile.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const startMs = Date.now();
  const path = "/api/auth/me";

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  try {
    const body = await req.json();
    const { confirmFacultyCode } = deleteAccountSchema.parse(body);

    if (confirmFacultyCode.toUpperCase() !== session.facultyCode) {
      logRequest(path, 400, startMs);
      return apiError(
        "VALIDATION_ERROR",
        "Faculty ID confirmation does not match your account.",
        400,
        { confirmFacultyCode: "Must match your exact Faculty ID." }
      );
    }

    await prisma.faculty.delete({
      where: { id: session.facultyId },
    });

    const res = NextResponse.json({ deleted: true }, { status: 200 });
    authProvider.signOut(res);
    logRequest(path, 200, startMs);
    return res;
  } catch (err) {
    if (err instanceof ZodError) {
      logRequest(path, 400, startMs);
      return handleZodError(err);
    }
    logRequest(path, 500, startMs);
    return apiError("INTERNAL_ERROR", "Unable to delete account.", 500);
  }
}

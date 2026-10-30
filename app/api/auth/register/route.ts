import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { signSessionToken } from "@/lib/auth/jwt";
import { setSessionCookie, toPublicProfile } from "@/lib/auth/provider";
import { apiError, handleZodError, logRequest } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const startMs = Date.now();
  const path = "/api/auth/register";

  try {
    const body = await req.json();
    const parsed = registerSchema.parse(body);

    const existing = await prisma.faculty.findFirst({
      where: {
        OR: [{ facultyCode: parsed.facultyCode }, { email: parsed.email }],
      },
    });

    if (existing) {
      const isCodeDup = existing.facultyCode === parsed.facultyCode;
      logRequest(path, 409, startMs);
      return apiError(
        "CONFLICT",
        isCodeDup
          ? "A faculty member with this Faculty ID already exists."
          : "An account with this email already exists.",
        409,
        isCodeDup
          ? { facultyCode: "Faculty ID is already registered." }
          : { email: "Email is already registered." }
      );
    }

    const passwordHash = await hashPassword(parsed.password);
    const created = await prisma.faculty.create({
      data: {
        facultyCode: parsed.facultyCode,
        fullName: parsed.fullName,
        email: parsed.email,
        department: parsed.department,
        passwordHash,
      },
    });

    const token = await signSessionToken({
      facultyId: created.id,
      facultyCode: created.facultyCode,
      email: created.email,
    });

    const res = NextResponse.json(
      { faculty: toPublicProfile(created) },
      { status: 201 }
    );
    setSessionCookie(res, token);
    logRequest(path, 201, startMs);
    return res;
  } catch (err) {
    if (err instanceof ZodError) {
      logRequest(path, 400, startMs);
      return handleZodError(err);
    }
    logRequest(path, 500, startMs);
    return apiError("INTERNAL_ERROR", "Unable to complete registration.", 500);
  }
}

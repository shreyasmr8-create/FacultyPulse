import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { APP_CONFIG } from "@/config/constants";
import { hashPassword, verifyPassword } from "./password";
import {
  signSessionToken,
  verifySessionToken,
  SessionPayload,
} from "./jwt";

export interface PublicFacultyProfile {
  id: string;
  facultyCode: string;
  fullName: string;
  email: string;
  department: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthProvider {
  signIn(
    facultyCode: string,
    passwordPlain: string
  ): Promise<{ profile: PublicFacultyProfile; token: string } | null>;
  getSession(): Promise<SessionPayload | null>;
  signOut(response: NextResponse): void;
}

export function toPublicProfile(faculty: {
  id: string;
  facultyCode: string;
  fullName: string;
  email: string;
  department: string;
  createdAt: Date;
  updatedAt: Date;
}): PublicFacultyProfile {
  return {
    id: faculty.id,
    facultyCode: faculty.facultyCode,
    fullName: faculty.fullName,
    email: faculty.email,
    department: faculty.department,
    createdAt: faculty.createdAt,
    updatedAt: faculty.updatedAt,
  };
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(APP_CONFIG.sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: APP_CONFIG.sessionDays * 24 * 60 * 60,
  });
}

class CredentialsAuthProvider implements AuthProvider {
  async signIn(facultyCode: string, passwordPlain: string) {
    const normalizedCode = facultyCode.trim().toUpperCase();
    const faculty = await prisma.faculty.findUnique({
      where: { facultyCode: normalizedCode },
    });

    if (!faculty) {
      await hashPassword(passwordPlain);
      return null;
    }

    const isValid = await verifyPassword(passwordPlain, faculty.passwordHash);
    if (!isValid) return null;

    const token = await signSessionToken({
      facultyId: faculty.id,
      facultyCode: faculty.facultyCode,
      email: faculty.email,
    });

    return {
      profile: toPublicProfile(faculty),
      token,
    };
  }

  async getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(APP_CONFIG.sessionCookieName)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  }

  signOut(response: NextResponse): void {
    response.cookies.set(APP_CONFIG.sessionCookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}

export const authProvider: AuthProvider = new CredentialsAuthProvider();

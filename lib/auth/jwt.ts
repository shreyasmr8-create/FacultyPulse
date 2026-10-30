import { SignJWT, jwtVerify } from "jose";
import { APP_CONFIG } from "@/config/constants";

export interface SessionPayload {
  facultyId: string;
  facultyCode: string;
  email: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${APP_CONFIG.sessionDays}d`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.facultyId === "string" &&
      typeof payload.facultyCode === "string" &&
      typeof payload.email === "string"
    ) {
      return {
        facultyId: payload.facultyId,
        facultyCode: payload.facultyCode,
        email: payload.email,
      };
    }
    return null;
  } catch {
    return null;
  }
}

import { NextResponse } from "next/server";
import { authProvider } from "@/lib/auth/provider";
import { logRequest } from "@/lib/api-response";

export async function POST() {
  const startMs = Date.now();
  const res = NextResponse.json({ ok: true }, { status: 200 });
  authProvider.signOut(res);
  logRequest("/api/auth/logout", 200, startMs);
  return res;
}

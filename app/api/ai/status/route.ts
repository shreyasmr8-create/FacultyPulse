import { NextResponse } from "next/server";
import { authProvider } from "@/lib/auth/provider";
import { isLlmModeEnabled } from "@/lib/ai/llm-adapter";
import { apiError, logRequest } from "@/lib/api-response";

export async function GET() {
  const startMs = Date.now();
  const path = "/api/ai/status";

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  logRequest(path, 200, startMs);
  return NextResponse.json({
    mode: isLlmModeEnabled() ? "llm" : "rule-based",
  });
}

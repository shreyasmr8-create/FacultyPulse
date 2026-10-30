import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { authProvider } from "@/lib/auth/provider";
import { consumeAiRateLimit } from "@/lib/auth/rate-limit";
import { aiSearchRequestSchema } from "@/lib/validation/ai";
import { parseSearchQueryRuleBased } from "@/lib/ai/parse";
import { parseQueryWithLlm, isLlmModeEnabled } from "@/lib/ai/llm-adapter";
import { scoreAndRankEvents } from "@/lib/ai/score";
import { apiError, handleZodError, logRequest } from "@/lib/api-response";

const EXAMPLE_PROMPTS = [
  "that AI workshop last spring",
  "something in the seminar hall in March 2026",
  "events I hosted last month",
  "busy days this semester",
];

export async function POST(req: NextRequest) {
  const startMs = Date.now();
  const path = "/api/ai/search";

  const session = await authProvider.getSession();
  if (!session) {
    logRequest(path, 401, startMs);
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  const rateLimit = consumeAiRateLimit(session.facultyId);
  if (!rateLimit.allowed) {
    logRequest(path, 429, startMs);
    return apiError(
      "RATE_LIMITED",
      "Rate limit reached (30 searches per hour). Please try again later.",
      429
    );
  }

  try {
    const body = await req.json();
    const { message } = aiSearchRequestSchema.parse(body);

    const locationRows = await prisma.event.findMany({
      where: {
        facultyId: session.facultyId,
        location: { not: null },
      },
      select: { location: true },
      distinct: ["location"],
    });
    const knownLocations = locationRows
      .map((r) => r.location)
      .filter((l): l is string => Boolean(l));

    let understood = isLlmModeEnabled()
      ? await parseQueryWithLlm(message)
      : null;

    if (!understood) {
      understood = parseSearchQueryRuleBased(message, knownLocations);
    }

    const hasAnyClue = Boolean(
      understood.type ||
        understood.from ||
        understood.to ||
        understood.location ||
        understood.keywords.length > 0
    );

    if (!hasAnyClue) {
      logRequest(path, 200, startMs);
      return NextResponse.json({
        understood,
        results: [],
        needsConfirmation: false,
        suggestions: EXAMPLE_PROMPTS,
        message:
          "I couldn't find specific keywords, dates, or places in your message. Try queries like: 'that AI workshop last spring' or 'events I hosted last month'.",
      });
    }

    const candidateEvents = await prisma.event.findMany({
      where: { facultyId: session.facultyId },
      orderBy: { startAt: "desc" },
    });

    const ranked = scoreAndRankEvents(candidateEvents, understood);
    const results = ranked.map((r) => ({
      ...r.event,
      score: r.score,
      matchReasons: r.matchReasons,
    }));

    if (results.length === 0) {
      logRequest(path, 200, startMs);
      return NextResponse.json({
        understood,
        results: [],
        needsConfirmation: false,
        suggestions: [
          "Try removing the date filter",
          "Search using a single keyword from the title",
        ],
        message:
          "No matching events were found in your records. Try broadening your search by removing the date or using a single keyword.",
      });
    }

    const needsConfirmation = results.length > 1;
    const replyMessage = needsConfirmation
      ? `I found ${results.length} matching events in your records. Is one of these the event you were looking for?`
      : `I found 1 matching event in your records.`;

    logRequest(path, 200, startMs);
    return NextResponse.json({
      understood,
      results,
      needsConfirmation,
      message: replyMessage,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      logRequest(path, 400, startMs);
      return handleZodError(err);
    }
    logRequest(path, 500, startMs);
    return apiError("INTERNAL_ERROR", "Search assistant failed.", 500);
  }
}

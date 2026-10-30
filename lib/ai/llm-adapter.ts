import { parsedFilterSchema, StructuredAiFilter } from "@/lib/validation/ai";

export function isLlmModeEnabled(): boolean {
  return Boolean(
    process.env.AI_PROVIDER?.trim() && process.env.AI_API_KEY?.trim()
  );
}

/**
 * Stretch S1: Optional LLM query parser with strict 8-second timeout and Zod validation.
 */
export async function parseQueryWithLlm(
  message: string,
  referenceNow: Date = new Date()
): Promise<StructuredAiFilter | null> {
  if (!isLlmModeEnabled()) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const apiKey = process.env.AI_API_KEY!;
    const systemPrompt = [
      `Today is ${referenceNow.toISOString()}.`,
      `Convert the user's event search query into a JSON object with optional keys:`,
      `type ("ATTENDED" | "HOSTED" | "BUSY"), from (ISO string), to (ISO string), keywords (string array), location (string), dateLabel (string).`,
      `Return ONLY valid JSON.`,
    ].join(" ");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0,
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const data = await res.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) return null;

    const parsedJson = JSON.parse(rawContent);
    return parsedFilterSchema.parse(parsedJson);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

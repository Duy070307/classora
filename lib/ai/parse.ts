import type { StructuredExam } from "@/lib/exam-types";

export function extractJsonObject(text: string): unknown | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseAIText(text: string) {
  const parsed = extractJsonObject(text);
  if (!isRecord(parsed)) return { content: text };
  const content = typeof parsed.content === "string" ? parsed.content : text;
  const title = typeof parsed.title === "string" ? parsed.title : undefined;
  const structuredExam = isRecord(parsed.structuredExam)
    ? (parsed.structuredExam as unknown as StructuredExam)
    : undefined;
  return { title, content, structuredExam };
}

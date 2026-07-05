import type { StructuredExam } from "@/lib/exam-types";
import { extractJson, looksLikeRawJson, stripCodeFences } from "@/lib/ai/extract-json";

export function extractJsonObject(text: string): unknown | null {
  const result = extractJson(text);
  return result.ok ? result.value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseAIText(text: string) {
  const parsed = extractJsonObject(text);
  const cleanText = stripCodeFences(text);
  if (!isRecord(parsed)) return { content: looksLikeRawJson(cleanText) ? "" : cleanText };
  const content = typeof parsed.content === "string"
    ? stripCodeFences(parsed.content)
    : looksLikeRawJson(cleanText) ? "" : cleanText;
  const title = typeof parsed.title === "string" ? parsed.title : undefined;
  const structuredExam = isRecord(parsed.structuredExam)
    ? (parsed.structuredExam as unknown as StructuredExam)
    : undefined;
  return { title, content, structuredExam };
}

export type JsonExtractionResult =
  | { ok: true; value: unknown; source: "strict" | "fenced" | "balanced" | "stringified" }
  | { ok: false; error: string };

function tryParse(candidate: string): unknown | null {
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function parseMaybeStringified(value: unknown): JsonExtractionResult | null {
  if (typeof value !== "string") return null;
  const parsed = tryParse(value.trim());
  if (parsed === null) return null;
  return { ok: true, value: parsed, source: "stringified" };
}

function extractFenced(text: string) {
  const matches = Array.from(text.matchAll(/```(?:json|JSON)?\s*([\s\S]*?)```/g));
  return matches.map((match) => match[1]?.trim()).filter((value): value is string => Boolean(value));
}

function extractBalancedObject(text: string) {
  const start = text.indexOf("{");
  if (start < 0) return "";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "\"") {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return text.slice(start, index + 1);
  }
  return "";
}

export function extractJson(text: string): JsonExtractionResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "empty_text" };

  const strict = tryParse(trimmed);
  if (strict !== null) return parseMaybeStringified(strict) ?? { ok: true, value: strict, source: "strict" };

  for (const fenced of extractFenced(trimmed)) {
    const parsed = tryParse(fenced);
    if (parsed !== null) return parseMaybeStringified(parsed) ?? { ok: true, value: parsed, source: "fenced" };
    const balancedInFence = extractBalancedObject(fenced);
    if (balancedInFence) {
      const balancedParsed = tryParse(balancedInFence);
      if (balancedParsed !== null) return { ok: true, value: balancedParsed, source: "fenced" };
    }
  }

  const balanced = extractBalancedObject(trimmed);
  if (balanced) {
    const parsed = tryParse(balanced);
    if (parsed !== null) return parseMaybeStringified(parsed) ?? { ok: true, value: parsed, source: "balanced" };
  }

  return { ok: false, error: "json_parse_failed" };
}

export function stripCodeFences(text: string) {
  return text.replace(/```(?:json|JSON)?\s*([\s\S]*?)```/g, "$1").trim();
}

export function looksLikeRawJson(text: string) {
  const trimmed = stripCodeFences(text).trim();
  return /^[[{]/.test(trimmed) && /["']?(title|content|structuredExam|exam)["']?\s*:/.test(trimmed);
}

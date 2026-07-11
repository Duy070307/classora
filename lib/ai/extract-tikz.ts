export type TikzExtractionResult = {
  ok: true;
  tikzCode: string;
  standaloneLatex: string;
  warnings: string[];
} | {
  ok: false;
  error: string;
  warnings: string[];
};

const invalidTikzMessage = "Chưa tạo được mã TikZ hợp lệ. Vui lòng thử lại với ảnh rõ hơn và cắt sát phần hình.";

export function buildStandaloneTikzDocument(tikzCode: string) {
  return [
    "\\documentclass[tikz,border=5pt]{standalone}",
    "\\usepackage{tikz}",
    "\\usetikzlibrary{calc,angles,quotes,intersections,patterns,decorations.pathreplacing}",
    "",
    "\\begin{document}",
    tikzCode.trim(),
    "\\end{document}",
  ].join("\n");
}

function stripMarkdownFence(text: string): string {
  let next = text.trim();
  const fence = next.match(/^```(?:json|latex|tex|tikz)?\s*([\s\S]*?)\s*```$/i);
  if (fence) next = fence[1].trim();
  return next;
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = stripMarkdownFence(text);
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    const starts = [...cleaned.matchAll(/\{/g)].map((match) => match.index ?? -1).filter((index) => index >= 0);
    const ends = [...cleaned.matchAll(/\}/g)].map((match) => match.index ?? -1).filter((index) => index >= 0).reverse();
    for (const start of starts) {
      for (const end of ends) {
        if (end <= start) continue;
        try {
          const parsed = JSON.parse(cleaned.slice(start, end + 1));
          return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
        } catch {
          // Try the next brace pair.
        }
      }
    }
    return null;
  }
}

function extractTikzPicture(text: string): string {
  const cleaned = stripMarkdownFence(text);
  const match = cleaned.match(/\\begin\{tikzpicture\}(?:\[[^\]]*\])?[\s\S]*?\\end\{tikzpicture\}/i);
  return match?.[0]?.trim() || "";
}

function hasRawJsonKeys(text: string): boolean {
  return /"type"\s*:|"tikz(?:Code)?"\s*:|"standalone(?:Latex)?"\s*:/.test(text);
}

export function validateTikzCode(tikzCode: string) {
  const code = stripMarkdownFence(tikzCode);
  const warnings: string[] = [];
  if (!code.includes("\\begin{tikzpicture}")) return { ok: false, warnings: [invalidTikzMessage] };
  if (!code.includes("\\end{tikzpicture}")) return { ok: false, warnings: [invalidTikzMessage] };
  if (hasRawJsonKeys(code)) return { ok: false, warnings: [invalidTikzMessage] };
  if (/```/.test(code)) return { ok: false, warnings: [invalidTikzMessage] };
  const beginIndex = code.indexOf("\\begin{tikzpicture}");
  const endIndex = code.lastIndexOf("\\end{tikzpicture}");
  if (endIndex <= beginIndex) return { ok: false, warnings: [invalidTikzMessage] };
  if (code.trim().endsWith("\\") || code.trim().endsWith("{") || code.trim().endsWith("[")) {
    warnings.push("Mã TikZ có thể chưa hoàn chỉnh. Vui lòng kiểm tra trước khi sử dụng.");
  }
  return { ok: true, warnings };
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? stripMarkdownFence(value) : "";
}

export function extractTikzFromAIOutput(raw: string): TikzExtractionResult {
  const parsed = parseJsonObject(raw);
  const parsedTikz = stringValue(parsed?.tikzCode) || stringValue(parsed?.tikz) || stringValue(parsed?.code);
  const parsedLatex = stringValue(parsed?.latex);
  const parsedStandalone = stringValue(parsed?.standaloneLatex) || stringValue(parsed?.standalone);

  const candidates = [
    parsedTikz,
    extractTikzPicture(parsedLatex),
    extractTikzPicture(parsedStandalone),
    extractTikzPicture(raw),
    stripMarkdownFence(raw),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const tikzCode = extractTikzPicture(candidate) || candidate.trim();
    const validation = validateTikzCode(tikzCode);
    if (validation.ok) {
      return {
        ok: true,
        tikzCode,
        standaloneLatex: buildStandaloneTikzDocument(tikzCode),
        warnings: validation.warnings,
      };
    }
  }

  return { ok: false, error: invalidTikzMessage, warnings: [invalidTikzMessage] };
}

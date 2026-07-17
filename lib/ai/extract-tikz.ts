export type TikzExtractionResult = {
  ok: true;
  tikzCode: string;
  standaloneLatex: string;
  warnings: string[];
} | {
  ok: false;
  error: string;
  tikzCode: string;
  standaloneLatex: string;
  warnings: string[];
};

const invalidTikzMessage = "Chưa tạo được mã TikZ hợp lệ. Vui lòng thử lại với ảnh rõ hơn và cắt sát phần hình.";

const internalVisibleNamePattern = /\b(?:upper_slanted_intersection|lower_slanted_intersection|line_transversal|line_horizontal_top|line_horizontal_bottom|line_vertical_left)\b/i;

function canonicalTikzElement(line: string) {
  return line.trim().replace(/\s+/g, " ").replace(/\s*%.*$/, "");
}

export function dedupeTikzElements(tikzCode: string) {
  const seen = new Set<string>();
  return tikzCode.split(/\r?\n/).filter((line) => {
    const canonical = canonicalTikzElement(line);
    if (!/^\\(?:node|fill|draw|path)\b/.test(canonical) || !canonical.endsWith(";")) return true;
    if (seen.has(canonical)) return false;
    seen.add(canonical);
    return true;
  }).join("\n");
}

export function sanitizeTikzCode(tikzCode: string) {
  const withoutInternalLabels = tikzCode.split(/\r?\n/).filter((line) => {
    if (/\\node\b/.test(line) && internalVisibleNamePattern.test(line)) return false;
    return true;
  }).map((line) => internalVisibleNamePattern.test(line) && /%/.test(line) ? line.replace(/\s*%.*$/, "") : line);
  return dedupeTikzElements(withoutInternalLabels.join("\n")).trim();
}

export function requiredTikzLibraries(tikzCode: string) {
  const libraries = new Set<string>();
  if (/name intersections|name path/.test(tikzCode)) libraries.add("intersections");
  if (/\\pic\b|right angle\s*=|angle\s*=/.test(tikzCode)) { libraries.add("angles"); libraries.add("quotes"); }
  if (/\$\([^)]*\)\$|\\(?:coordinate|node)\b[^;]*\bat\s*\(\$|\\pgfmath|\\path\s+let\b/.test(tikzCode)) libraries.add("calc");
  if (/\bpattern\s*=/.test(tikzCode)) libraries.add("patterns");
  if (/\bdecoration\s*=|decorate\b/.test(tikzCode)) libraries.add("decorations.pathreplacing");
  if (/Stealth|Latex\b|Triangle\b|>=\s*(?:stealth|latex)/i.test(tikzCode)) libraries.add("arrows.meta");
  if (/\b(?:above|below|left|right)\s*=\s*of\b|node distance\s*=/.test(tikzCode)) libraries.add("positioning");
  if (/\b(?:diamond|ellipse|trapezium|regular polygon)\b/.test(tikzCode)) libraries.add("shapes.geometric");
  if (/\bplot mark\b|mark\s*=/.test(tikzCode)) libraries.add("plotmarks");
  if (/on background layer|pgfonlayer/.test(tikzCode)) libraries.add("backgrounds");
  if (/\\matrix\b|matrix of nodes/.test(tikzCode)) libraries.add("matrix");
  return [...libraries];
}

export function buildStandaloneTikzDocument(tikzCode: string) {
  const cleanTikz = sanitizeTikzCode(tikzCode);
  const libraries = requiredTikzLibraries(cleanTikz);
  return [
    "\\documentclass[tikz,border=5pt]{standalone}",
    "\\usepackage{tikz}",
    ...(libraries.length ? [`\\usetikzlibrary{${libraries.join(",")}}`] : []),
    "",
    "\\begin{document}",
    cleanTikz,
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
  const code = sanitizeTikzCode(stripMarkdownFence(tikzCode));
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
    const cleanTikzCode = sanitizeTikzCode(tikzCode);
    const validation = validateTikzCode(cleanTikzCode);
    if (validation.ok) {
      return {
        ok: true,
        tikzCode: cleanTikzCode,
        standaloneLatex: buildStandaloneTikzDocument(cleanTikzCode),
        warnings: validation.warnings,
      };
    }
  }

  return { ok: false, error: invalidTikzMessage, tikzCode: "", standaloneLatex: "", warnings: [invalidTikzMessage] };
}

export type ImageToLatexMode = "auto" | "formula" | "geometry";

export type ImageToLatexResult = {
  type: "latex" | "tikz";
  latex: string;
  displayLatex?: string;
  tikzCode?: string;
  standaloneLatex?: string;
  explanation?: string;
  confidence?: "high" | "medium" | "low";
  warnings?: string[];
  provider: "gemini";
  model: string;
};

type GeminiImageResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

const modeLabels: Record<ImageToLatexMode, string> = {
  auto: "Tự động nhận diện công thức hoặc hình học",
  formula: "Công thức → LaTeX",
  geometry: "Hình học → TikZ",
};

function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = stripMarkdownFence(text);
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(cleaned.slice(start, end + 1));
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function stripMarkdownFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json|latex|tex|tikz)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractEnvironmentBlock(text: string, environment: string): string {
  const cleaned = stripMarkdownFence(text);
  const pattern = new RegExp(`\\\\begin\\{${environment}\\}[\\s\\S]*?\\\\end\\{${environment}\\}`, "i");
  return cleaned.match(pattern)?.[0]?.trim() || "";
}

function extractStandaloneLatex(text: string): string {
  const cleaned = stripMarkdownFence(text);
  return /\\documentclass/i.test(cleaned) ? cleaned : "";
}

function sanitizeTikzOutput(raw: string, parsed: Record<string, unknown> | null) {
  const parsedLatex = typeof parsed?.latex === "string" ? stripMarkdownFence(parsed.latex) : "";
  const parsedTikz = typeof parsed?.tikzCode === "string" ? stripMarkdownFence(parsed.tikzCode) : "";
  const parsedStandalone = typeof parsed?.standaloneLatex === "string" ? stripMarkdownFence(parsed.standaloneLatex) : "";
  const rawClean = stripMarkdownFence(raw);

  const standaloneLatex = parsedStandalone || extractStandaloneLatex(parsedLatex) || extractStandaloneLatex(rawClean);
  const tikzCode =
    parsedTikz ||
    extractEnvironmentBlock(parsedLatex, "tikzpicture") ||
    extractEnvironmentBlock(standaloneLatex, "tikzpicture") ||
    extractEnvironmentBlock(rawClean, "tikzpicture") ||
    (/\\draw|\\node|\\coordinate|\\path/i.test(rawClean) ? rawClean : "");

  const standalone = standaloneLatex || (tikzCode
    ? `\\documentclass[tikz,border=5pt]{standalone}
\\usepackage{tikz}
\\begin{document}
${tikzCode}
\\end{document}`
    : "");

  return {
    tikzCode,
    standaloneLatex: standalone,
    latex: tikzCode || parsedLatex || "",
  };
}

function sanitizeLatexOutput(raw: string, parsed: Record<string, unknown> | null) {
  const parsedLatex = typeof parsed?.latex === "string" ? stripMarkdownFence(parsed.latex) : "";
  const parsedDisplay = typeof parsed?.displayLatex === "string" ? stripMarkdownFence(parsed.displayLatex) : "";
  const rawClean = stripMarkdownFence(raw);
  const fallback = extractEnvironmentBlock(rawClean, "tikzpicture") || rawClean;
  return {
    latex: parsedLatex || fallback,
    displayLatex: parsedDisplay || parsedLatex || fallback,
  };
}

function normalizeConfidence(value: unknown): "high" | "medium" | "low" {
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}

function normalizeWarnings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").slice(0, 5);
}

export async function generateLatexFromImage({
  imageBase64,
  mimeType,
  mode,
}: {
  imageBase64: string;
  mimeType: string;
  mode: ImageToLatexMode;
}): Promise<ImageToLatexResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini chưa được cấu hình nên Soạn Lab chưa thể nhận diện ảnh công thức.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const maxTokens = Number(process.env.AI_MAX_OUTPUT_TOKENS || 4000);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const wantsTikz = mode === "geometry";
  const prompt = wantsTikz ? `Bạn là trợ lý vẽ lại hình học bằng TikZ/LaTeX cho giáo viên Việt Nam.

Nhiệm vụ:
- Phân tích ảnh như một hình vẽ hình học đã được cắt gọn.
- Nhận diện các yếu tố nhìn thấy được: điểm, đường thẳng, đoạn thẳng, tia, đường tròn, cung tròn, dấu vuông góc, dấu góc vuông, dấu đoạn bằng nhau, dấu góc, nét đứt, nhãn và số đo.
- Tạo mã TikZ sạch để vẽ lại hình.
- Dùng hệ tọa độ đơn giản, dễ chỉnh sửa.
- Giữ nhãn điểm đúng như trong ảnh.
- Giữ số đo độ dài/góc nếu nhìn thấy trong ảnh.
- Dùng nét đứt nếu hình gốc có nét đứt.
- Dùng ký hiệu góc vuông nếu hình gốc có dấu góc vuông.
- Dùng cung tròn nhỏ cho ký hiệu góc nếu hình gốc có dấu góc.
- Không bịa giá trị ẩn, không suy luận lời giải, không giải bài toán.
- Không đưa đề bài, lời giải hoặc chữ ngoài hình vào output.
- Chỉ vẽ lại hình.
- Nếu ảnh mờ/khó đọc, đặt confidence là "low", thêm warning và vẫn cố tạo TikZ xấp xỉ đơn giản nếu có thể.
- Không dùng markdown fence.
- Mã TikZ cần nằm trong môi trường tikzpicture, dễ copy vào tài liệu LaTeX.

Chế độ người dùng chọn: ${modeLabels[mode]}.

Trả về đúng JSON:
{
  "type": "tikz",
  "tikzCode": "\\\\begin{tikzpicture}[scale=1]\\\\n...\\\\n\\\\end{tikzpicture}",
  "standaloneLatex": "\\\\documentclass[tikz,border=5pt]{standalone}\\\\n\\\\usepackage{tikz}\\\\n\\\\begin{document}\\\\n...\\\\n\\\\end{document}",
  "explanation": "Mô tả ngắn các yếu tố đã nhận diện.",
  "confidence": "high",
  "warnings": []
}` : `Bạn là trợ lý chuyển ảnh công thức Toán/hình học sang LaTeX cho giáo viên Việt Nam.

Yêu cầu:
- Chỉ nhận diện nội dung chính trong ảnh đã được cắt gọn.
- Trả về LaTeX sạch, có thể copy vào Word, đề kiểm tra hoặc tài liệu.
- Nếu là công thức, ưu tiên LaTeX toán học chuẩn.
- Nếu là hình học và người dùng chưa chọn chế độ hình học, có thể trả về TikZ đơn giản nhưng vẫn ưu tiên công thức nếu ảnh là biểu thức.
- Không bịa nội dung ngoài ảnh.
- Nếu ảnh lẫn nhiều chữ thừa hoặc quá mờ, thêm cảnh báo.
- Không dùng markdown fence.

Chế độ người dùng chọn: ${modeLabels[mode]}.

Trả về đúng JSON:
{
  "latex": "mã LaTeX chính",
  "displayLatex": "mã LaTeX để render nếu phù hợp",
  "explanation": "ghi chú ngắn bằng tiếng Việt",
  "confidence": "high|medium|low",
  "warnings": ["cảnh báo nếu có"]
}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini chưa nhận diện được ảnh lúc này (${response.status}).`);
  }

  const data = await response.json() as GeminiImageResponse;
  const raw = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim();
  if (!raw) throw new Error("Gemini không trả về nội dung LaTeX.");

  const parsed = extractJson(raw);
  const tikz = sanitizeTikzOutput(raw, parsed);
  const formula = sanitizeLatexOutput(raw, parsed);
  const type = parsed?.type === "tikz" || wantsTikz || Boolean(tikz.tikzCode) ? "tikz" : "latex";
  const latex = type === "tikz" ? tikz.latex : formula.latex;

  return {
    type,
    latex,
    displayLatex: type === "tikz" ? undefined : formula.displayLatex,
    tikzCode: type === "tikz" ? tikz.tikzCode || latex : undefined,
    standaloneLatex: type === "tikz" ? tikz.standaloneLatex : undefined,
    explanation: typeof parsed?.explanation === "string" ? parsed.explanation.trim() : "",
    confidence: normalizeConfidence(parsed?.confidence),
    warnings: normalizeWarnings(parsed?.warnings),
    provider: "gemini",
    model,
  };
}

export type ImageToLatexMode = "auto" | "formula" | "diagram";

export type ImageToLatexResult = {
  latex: string;
  displayLatex?: string;
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
  formula: "Công thức Toán",
  diagram: "Hình học / sơ đồ",
};

function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
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
  const prompt = `Bạn là trợ lý chuyển ảnh công thức Toán/hình học sang LaTeX cho giáo viên Việt Nam.

Yêu cầu:
- Chỉ nhận diện nội dung chính trong ảnh đã được cắt gọn.
- Trả về LaTeX sạch, có thể copy vào Word, đề kiểm tra hoặc tài liệu.
- Nếu là công thức, ưu tiên LaTeX toán học chuẩn.
- Nếu là hình học/sơ đồ, mô tả bằng LaTeX/TikZ đơn giản nếu có thể; nếu không chắc, trả về mô tả ngắn và các ký hiệu chính bằng LaTeX.
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
  const latex = typeof parsed?.latex === "string" && parsed.latex.trim() ? parsed.latex.trim() : raw;
  const displayLatex = typeof parsed?.displayLatex === "string" && parsed.displayLatex.trim()
    ? parsed.displayLatex.trim()
    : latex;

  return {
    latex,
    displayLatex,
    explanation: typeof parsed?.explanation === "string" ? parsed.explanation.trim() : "",
    confidence: normalizeConfidence(parsed?.confidence),
    warnings: normalizeWarnings(parsed?.warnings),
    provider: "gemini",
    model,
  };
}

import { extractTikzFromAIOutput } from "@/lib/ai/extract-tikz";
import { getSchoolDiagramPreset, isKnownSchoolDiagramPattern, validateKnownSchoolDiagramTikz } from "@/lib/ai/geometry-tikz-presets";

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

const geometryAccuracyRules = `Quy tắc tăng độ chính xác khi vẽ lại hình học:
- Redraw the visible figure only. Do not solve the problem.
- Preserve visual style: solid lines stay solid, dashed lines stay dashed, black lines stay black unless color is clearly meaningful.
- Do not arbitrarily make main geometry lines blue.
- Do not arbitrarily make solid slanted lines dashed.
- Do not invent hidden lines.
- Use simple, stable TikZ coordinates.
- If the image shows a baseline/ground, draw it as a horizontal reference line.
- If there is a gray ground strip or shaded ground/area, approximate it with gray fill below the baseline.
- If a point lies on the baseline, place it on y=0.
- If a point is vertically above another point, use the same x-coordinate.
- If a segment is visibly vertical, draw it vertical.
- If a segment is visibly slanted and solid, draw it as a solid black segment.
- Measurements should be placed near the corresponding segment.
- Labels should stay near their original positions.

Common school diagram pattern:
- If the image has A above A', B above B', M on A'B', and a broken path A-M-B:
  - A' and B' are on the ground/baseline.
  - A is vertically above A'.
  - B is vertically above B'.
  - M lies between A' and B'.
  - Draw AA' and BB' as vertical solid segments.
  - Draw A-M and M-B as solid black slanted segments.
  - Draw A'-B' as dashed horizontal baseline.
  - Draw gray ground strip below A', M, B'.
  - Put 500(m) beside AA' if shown.
  - Put 600(m) beside BB' if shown.
  - Put 2200(m) near segment M-B if shown.
  - Never draw A-M or M-B as blue dashed lines unless the original image clearly shows that exact style.`;

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

function sanitizeLatexOutput(raw: string, parsed: Record<string, unknown> | null) {
  const parsedLatex = typeof parsed?.latex === "string" ? stripMarkdownFence(parsed.latex) : "";
  const parsedDisplay = typeof parsed?.displayLatex === "string" ? stripMarkdownFence(parsed.displayLatex) : "";
  const rawClean = stripMarkdownFence(raw);
  const fallback = rawClean;
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
- Return JSON only, không thêm chữ ngoài JSON.
- tikzCode chỉ được chứa \\begin{tikzpicture}...\\end{tikzpicture}.
- standaloneLatex là tùy chọn; nếu trả về thì phải là tài liệu .tex hợp lệ, không chứa JSON bên trong.
- Không đặt JSON bên trong LaTeX.
- Không escape TikZ hai lần nếu có thể.
- Không cắt cụt output.
- Dùng lệnh TikZ đơn giản: \\coordinate, \\draw, \\node, \\fill, \\pic cho góc vuông nếu cần, [dashed] cho nét đứt.
- Nếu chưa chắc, tạo một hình TikZ xấp xỉ nhưng hợp lệ.

${geometryAccuracyRules}

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
  if (wantsTikz) {
    let extraction = extractTikzFromAIOutput(raw);
    if (!extraction.ok) {
      const repairPrompt = `Convert the following output into valid TikZ only.
Return JSON only with this shape:
{
  "type": "tikz",
  "tikzCode": "\\\\begin{tikzpicture}[scale=1]\\\\n...\\\\n\\\\end{tikzpicture}",
  "explanation": "Mô tả ngắn bằng tiếng Việt.",
  "confidence": "low",
  "warnings": ["Nếu cần"]
}
Do not include markdown fences.
Do not include explanation outside JSON.
Do not put JSON inside LaTeX.
tikzCode must contain only a complete tikzpicture block.

Provider output to repair:
${raw.slice(0, 12000)}`;
      const repairResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: repairPrompt }] }],
          generationConfig: {
            temperature: 0.05,
            maxOutputTokens: maxTokens,
            responseMimeType: "application/json",
          },
        }),
      });
      if (repairResponse.ok) {
        const repairData = await repairResponse.json() as GeminiImageResponse;
        const repairRaw = repairData.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim() || "";
        extraction = extractTikzFromAIOutput(repairRaw);
      }
    }
    if (!extraction.ok) {
      throw new Error(extraction.error);
    }

    const patternText = [
      raw,
      extraction.tikzCode,
      typeof parsed?.explanation === "string" ? parsed.explanation : "",
    ].join("\n");
    const isSchoolDiagram = isKnownSchoolDiagramPattern(patternText);
    if (isSchoolDiagram) {
      const validation = validateKnownSchoolDiagramTikz(extraction.tikzCode);
      if (!validation.ok) {
        const repairPrompt = `Your TikZ output does not match the diagram.
The image shows A vertically above A', B vertically above B', M on the baseline A'B', solid black segments A-M and M-B, vertical solid segments A-A' and B-B', dashed horizontal baseline A'-B', gray ground strip below the baseline, labels 500(m), 600(m), 2200(m).
Rewrite the TikZ code only.

Hard rules:
- Main segments A-M and M-B must be solid black, not blue and not dashed.
- A-A' and B-B' must be vertical solid segments.
- A'-B' must be a dashed horizontal baseline.
- M must lie on the baseline between A' and B'.
- The gray ground strip must be below the baseline.
- Labels and measurements must be included near their visible positions.
- Return JSON only, no markdown fences.
- tikzCode must contain only \\begin{tikzpicture}...\\end{tikzpicture}.

Current invalid TikZ:
${extraction.tikzCode.slice(0, 12000)}

Validation issues:
${validation.reasons.join(", ")}`;
        const repairResponse = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: repairPrompt },
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
              temperature: 0.05,
              maxOutputTokens: maxTokens,
              responseMimeType: "application/json",
            },
          }),
        });
        if (repairResponse.ok) {
          const repairData = await repairResponse.json() as GeminiImageResponse;
          const repairRaw = repairData.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim() || "";
          const repaired = extractTikzFromAIOutput(repairRaw);
          if (repaired.ok && validateKnownSchoolDiagramTikz(repaired.tikzCode).ok) {
            extraction = repaired;
          } else {
            const preset = getSchoolDiagramPreset();
            extraction = {
              ok: true,
              tikzCode: preset.tikzCode,
              standaloneLatex: preset.standaloneLatex,
              warnings: [...preset.warnings, "Soạn Lab đã dùng bố cục TikZ chuẩn cho mẫu hình học phổ thông này để tránh sai nét/nhãn."],
            };
          }
        } else {
          const preset = getSchoolDiagramPreset();
          extraction = {
            ok: true,
            tikzCode: preset.tikzCode,
            standaloneLatex: preset.standaloneLatex,
            warnings: [...preset.warnings, "Soạn Lab đã dùng bố cục TikZ chuẩn cho mẫu hình học phổ thông này để tránh sai nét/nhãn."],
          };
        }
      }
    }

    return {
      type: "tikz",
      latex: extraction.tikzCode,
      tikzCode: extraction.tikzCode,
      standaloneLatex: extraction.standaloneLatex,
      explanation: typeof parsed?.explanation === "string" ? parsed.explanation.trim() : "",
      confidence: normalizeConfidence(parsed?.confidence),
      warnings: [...normalizeWarnings(parsed?.warnings), ...extraction.warnings],
      provider: "gemini",
      model,
    };
  }

  const formula = sanitizeLatexOutput(raw, parsed);

  return {
    type: "latex",
    latex: formula.latex,
    displayLatex: formula.displayLatex,
    explanation: typeof parsed?.explanation === "string" ? parsed.explanation.trim() : "",
    confidence: normalizeConfidence(parsed?.confidence),
    warnings: normalizeWarnings(parsed?.warnings),
    provider: "gemini",
    model,
  };
}

import { extractTikzFromAIOutput } from "@/lib/ai/extract-tikz";
import { getGeometryPreset, isKnownSchoolDiagramPattern, validateGenericGeometryTikz, validateKnownSchoolDiagramTikz } from "@/lib/ai/geometry-tikz-presets";
import { GrokRequestError, requestGrokVision } from "@/lib/ai/providers/grok";
import { OpenAICompatibleError, requestOpenAICompatibleVision } from "@/lib/ai/providers/openai-provider";
import { generateValidatedTikz, parseGeometryStructure, type GeometryDiagnostic } from "@/lib/ai/geometry-validator";

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
  provider: "openai" | "gemini" | "grok";
  model: string;
  geometryDiagnostic?: GeometryDiagnostic;
  geometryStructure?: unknown;
};

export class VisionCapabilityError extends Error {
  constructor() {
    super("vision_not_supported");
    this.name = "VisionCapabilityError";
  }
}

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

const geometryAccuracyRules = `General geometry recognition rules:
- First identify visible geometric primitives: points, labels, line segments, rays, full lines, dashed lines, circles, arcs, angle marks, right-angle marks, equal-length marks, parallel marks, perpendicular marks, shaded regions, coordinate axes, text measurements, and visible numeric labels.
- Supported school diagrams include triangles, quadrilaterals, circles, coordinate geometry diagrams, perpendicular lines, angle marks, dashed auxiliary lines, parallel lines, intersections, polygons, altitudes, medians, angle bisectors, tangents, and secants.
- Redraw the visible figure only. Do not solve the problem.
- Preserve visual style: solid lines stay solid, dashed lines stay dashed, black lines stay black unless color is clearly meaningful.
- Do not arbitrarily make main geometry lines blue.
- Do not arbitrarily make solid slanted lines dashed.
- Do not invent hidden lines, hidden points, or hidden values.
- Use simple, stable TikZ coordinates.
- If the image shows a baseline/ground, draw it as a horizontal reference line.
- If there is a gray ground strip or shaded area, approximate it with gray fill.
- If a point lies on a baseline, place it on that line.
- If a point is vertically above another point, use the same x-coordinate.
- If a segment is visibly vertical, draw it vertical.
- If a segment is visibly slanted and solid, draw it as a solid black segment.
- Measurements should be placed near the corresponding segment.
- Labels should stay near their original positions.
- Preserve right-angle markers, angle arcs, circles, coordinate axes, and dashed auxiliary lines when visible.
- Do not include problem statement text.

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
  - Never draw A-M or M-B as blue dashed lines unless the original image clearly shows that exact style.

Return a structured JSON object. The final UI will show only clean TikZ, but your JSON should include:
{
  "type": "tikz",
  "diagramType": "triangle|circle|coordinate|polygon|mixed|unknown",
  "points": [{ "name": "A", "x": 0, "y": 0, "labelPosition": "below" }],
  "segments": [{ "from": "A", "to": "B", "style": "solid|dashed", "thick": true }],
  "circles": [{ "center": "O", "radius": 2, "style": "solid" }],
  "arcs": [],
  "angles": [],
  "rightAngles": [],
  "measurements": [{ "text": "5 cm", "near": "AB" }],
  "shadedRegions": [],
  "tikzCode": "\\begin{tikzpicture}[scale=1]\\n...\\n\\end{tikzpicture}",
  "standaloneLatex": "\\documentclass[tikz,border=5pt]{standalone}\\n\\usepackage{tikz}\\n\\begin{document}\\n...\\n\\end{document}",
  "explanation": "Short Vietnamese description of visible primitives.",
  "confidence": "high|medium|low",
  "warnings": []
}`;

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
  if (typeof value === "number") return value >= 0.8 ? "high" : value >= 0.5 ? "medium" : "low";
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}

function createVisionRequester(imageBase64: string, mimeType: string) {
  const provider = (process.env.AI_VISION_PROVIDER || process.env.AI_PROVIDER || "local").trim().toLowerCase();
  const model = provider === "openai"
    ? process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini"
    : provider === "grok" ? process.env.GROK_MODEL || "grok-4.3" : process.env.GEMINI_MODEL || "gemini-2.5-flash";
  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) throw new VisionCapabilityError();
    return {
      provider: "openai" as const,
      model,
      request: async (prompt: string, includeImage = true) => {
        try {
          return await requestOpenAICompatibleVision({ prompt, imageBase64, mimeType, includeImage });
        } catch (error) {
          if (error instanceof OpenAICompatibleError && error.diagnostic === "unsupported_vision") {
            throw new VisionCapabilityError();
          }
          throw error;
        }
      },
    };
  }
  if (provider === "grok") {
    return {
      provider: "grok" as const,
      model,
      request: async (prompt: string, includeImage = true) => {
        try {
          return await requestGrokVision({ prompt, imageBase64, mimeType, includeImage });
        } catch (error) {
          if (error instanceof GrokRequestError && error.reason === "unsupported_vision") throw new VisionCapabilityError();
          throw error;
        }
      },
    };
  }
  if (provider !== "gemini" || !process.env.GEMINI_API_KEY) throw new VisionCapabilityError();
  const apiKey = process.env.GEMINI_API_KEY;
  const maxTokens = Number(process.env.AI_MAX_OUTPUT_TOKENS || 4000);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  return {
    provider: "gemini" as const,
    model,
    request: async (prompt: string, includeImage = true) => {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: prompt }];
      if (includeImage) parts.push({ inlineData: { mimeType, data: imageBase64 } });
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { temperature: 0.15, maxOutputTokens: maxTokens, responseMimeType: "application/json" } }),
      });
      if (!response.ok) throw new Error("vision_request_failed");
      const data = await response.json() as GeminiImageResponse;
      const raw = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim();
      if (!raw) throw new Error("vision_empty_response");
      return raw;
    },
  };
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
  const requester = createVisionRequester(imageBase64, mimeType);
  const { provider, model } = requester;
  const wantsTikz = mode === "geometry";
  const legacyPrompt = wantsTikz ? `Bạn là trợ lý vẽ lại hình học bằng TikZ/LaTeX cho giáo viên Việt Nam.

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
  "mode": "geometry",
  "tikz": "\\\\begin{tikzpicture}[scale=1]\\\\n...\\\\n\\\\end{tikzpicture}",
  "standalone": "\\\\documentclass[tikz,border=5pt]{standalone}\\\\n\\\\usepackage{tikz}\\\\n\\\\begin{document}\\\\n...\\\\n\\\\end{document}",
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
  "mode": "formula",
  "latex": "mã LaTeX chính",
  "displayLatex": "mã LaTeX để render nếu phù hợp",
  "explanation": "ghi chú ngắn bằng tiếng Việt",
  "confidence": 0.0,
  "warnings": ["cảnh báo nếu có"]
}`;

  const structurePrompt = `Phân tích topology của ảnh hình học đã cắt gọn và chỉ trả về JSON cấu trúc. Không tạo TikZ, không giải bài toán cho đến khi cấu trúc hình học đã rõ.
Ưu tiên tính đúng đắn hình học hơn độ giống pixel. Nhận diện figureType như triangle, quadrilateral, parallelogram, trapezoid, rectangle, square, circle, pyramid, prism, cuboid hoặc unknown.
Giữ nguyên chính xác mọi nhãn điểm nhìn thấy, gồm chữ hoa và dấu phẩy. Không đổi O thành 0, H thành M, I thành U; không thêm điểm thay thế.
Phân loại riêng solidEdges và dashedEdges theo đúng ảnh; hidden/auxiliary edge dùng dashedEdges. Không suy diễn cạnh ẩn.
Phân tích base/apex, intersection, pointOnSegment và perpendicular trước khi vẽ. Chỉ ghi vuông góc khi có ký hiệu rõ; nếu mơ hồ đặt certain=false và thêm warning.

Trả về JSON theo đúng dạng:
{
  "figureType": "pyramid|triangle|circle|quadrilateral|unknown",
  "points": [{"label":"A","relativePosition":"left-bottom|bottom|right|upper-right|top|center"}],
  "solidEdges": [["A","B"]],
  "dashedEdges": [["A","C"]],
  "relations": [
    {"type":"base","points":["A","B","C","D"]},
    {"type":"intersection","point":"O","lines":[["A","C"],["B","D"]]},
    {"type":"pointOnSegment","point":"I","segment":["B","C"],"between":true},
    {"type":"perpendicular","segment1":["A","I"],"segment2":["B","C"],"vertex":"I","certain":true}
  ],
  "parallelRelations": [],
  "equalLengthRelations": [],
  "visibleLabels": ["A","B","C"],
  "warnings": []
}
Không markdown fence. Có thể bỏ trống mảng nếu ảnh không thể hiện quan hệ đó.`;
  const prompt = wantsTikz ? structurePrompt : legacyPrompt;
  const raw = await requester.request(prompt, true);

  const parsed = extractJson(raw);
  if (wantsTikz) {
    const structure = parseGeometryStructure(raw);
    if (structure) {
      const generated = generateValidatedTikz(structure);
      const accuracyNotice = generated.diagnostic.valid
        ? "SOẠN LAB đã kiểm tra các quan hệ điểm thẳng hàng và vuông góc phát hiện được. Với hình phức tạp, thầy cô vẫn nên rà soát lại mã TikZ trước khi sử dụng."
        : "Bản vẽ đã được tạo, nhưng một số quan hệ hình học chưa được xác nhận chính xác.";
      return {
        type: "tikz",
        latex: generated.tikzCode,
        tikzCode: generated.tikzCode,
        standaloneLatex: generated.standaloneLatex,
        explanation: accuracyNotice,
        confidence: generated.diagnostic.valid ? "high" : "low",
        warnings: [...generated.diagnostic.warnings, "Bản vẽ là bản nháp TikZ, thầy cô nên kiểm tra trước khi dùng chính thức."],
        provider,
        model,
        geometryDiagnostic: generated.diagnostic,
        geometryStructure: structure,
      };
    }
    throw new Error("geometry_structure_parse_failed");
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
      try {
        const repairRaw = await requester.request(repairPrompt, false);
        extraction = extractTikzFromAIOutput(repairRaw);
      } catch { /* Giữ lỗi parse ban đầu để trả thông báo kiểm soát. */ }
    }
    if (!extraction.ok) {
      throw new Error("geometry_structure_parse_failed");
    }

    const patternText = [
      raw,
      extraction.tikzCode,
      typeof parsed?.diagramType === "string" ? parsed?.diagramType : "",
      typeof parsed?.explanation === "string" ? parsed?.explanation : "",
    ].join("\n");

    const applyPresetIfAvailable = (reason: string) => {
      const preset = getGeometryPreset(patternText);
      if (!preset) return false;
      extraction = {
        ok: true,
        tikzCode: preset.tikzCode,
        standaloneLatex: preset.standaloneLatex,
        warnings: [...preset.warnings, `So?n Lab ?? d?ng b? c?c TikZ g?i ? (${preset.name}) sau khi ki?m tra ${reason}.`],
      };
      return true;
    };

    const genericValidation = validateGenericGeometryTikz(extraction.tikzCode);
    if (!genericValidation.ok) {
      const repairPrompt = `Convert this geometry interpretation into clean valid TikZ only.
Return JSON only with this shape:
{
  "type": "tikz",
  "diagramType": "triangle|circle|coordinate|polygon|mixed|unknown",
  "tikzCode": "\\begin{tikzpicture}[scale=1]\\n...\\n\\end{tikzpicture}",
  "explanation": "M? t? ng?n b?ng ti?ng Vi?t.",
  "confidence": "low",
  "warnings": []
}
Rules:
- Use valid TikZ only inside tikzCode.
- Preserve visible labels, solid/dashed style, measurements, circles, arcs, right-angle marks and shaded regions.
- Use black lines by default and gray fill only for shaded areas.
- Do not solve the problem and do not include the problem statement.
- Do not include markdown fences or raw JSON inside TikZ.

Validation issues:
${genericValidation.reasons.join(", ")}

Original AI output:
${raw.slice(0, 12000)}

Extracted TikZ:
${extraction.tikzCode.slice(0, 12000)}`;
      try {
        const repairRaw = await requester.request(repairPrompt, false);
        const repaired = extractTikzFromAIOutput(repairRaw);
        if (repaired.ok && validateGenericGeometryTikz(repaired.tikzCode).ok) {
          extraction = repaired;
        } else {
          applyPresetIfAvailable("generic TikZ repair");
        }
      } catch {
        applyPresetIfAvailable("generic TikZ validation");
      }
    }

    if (isKnownSchoolDiagramPattern(patternText)) {
      const schoolValidation = validateKnownSchoolDiagramTikz(extraction.tikzCode);
      if (!schoolValidation.ok) {
        const repairPrompt = `Your TikZ output does not match the school geometry diagram regression case.
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
- tikzCode must contain only \begin{tikzpicture}...\end{tikzpicture}.

Current invalid TikZ:
${extraction.tikzCode.slice(0, 12000)}

Validation issues:
${schoolValidation.reasons.join(", ")}`;
        try {
          const repairRaw = await requester.request(repairPrompt, true);
          const repaired = extractTikzFromAIOutput(repairRaw);
          if (repaired.ok && validateKnownSchoolDiagramTikz(repaired.tikzCode).ok) {
            extraction = repaired;
          } else {
            applyPresetIfAvailable("school diagram regression validation");
          }
        } catch {
          applyPresetIfAvailable("school diagram regression validation");
        }
      }
    }

    return {
      type: "tikz",
      latex: extraction.tikzCode,
      tikzCode: extraction.tikzCode,
      standaloneLatex: extraction.standaloneLatex,
      explanation: typeof parsed?.explanation === "string" ? String(parsed?.explanation).trim() : "",
      confidence: normalizeConfidence(parsed?.confidence),
      warnings: [...normalizeWarnings(parsed?.warnings), ...extraction.warnings],
      provider,
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
    provider,
    model,
  };
}

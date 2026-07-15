import "server-only";
import { extractJson } from "@/lib/ai/extract-json";
import { requestOpenAICompatibleVision } from "@/lib/ai/providers/openai-provider";
import { requestGrokVision } from "@/lib/ai/providers/grok";
import { stableHash } from "@/lib/answer-solutions/hash";
import { rebuildBlockRelations, textToRecognitionBlocks } from "@/lib/document-recognition/layout";
import type { RecognitionBlock, RecognitionBlockType, RecognitionConfidence } from "@/lib/document-recognition/types";

const blockTypes = new Set<RecognitionBlockType>(["document_header", "school_header", "exam_title", "metadata", "instruction", "section_heading", "question", "option", "true_false_statement", "short_answer_area", "essay_question", "answer_key", "paragraph", "formula", "table", "image", "graph", "geometric_figure", "page_number", "footer", "watermark", "unknown"]);
const confidences = new Set<RecognitionConfidence>(["high", "medium", "low"]);

function cleanText(value: unknown, max = 6000) {
  return typeof value === "string" ? value.replace(/\u0000/g, "").trim().slice(0, max) : "";
}

function box(value: unknown) {
  const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const clamp = (number: unknown, fallback: number) => Math.max(0, Math.min(1, Number.isFinite(Number(number)) ? Number(number) : fallback));
  return { x: clamp(item.x, 0.05), y: clamp(item.y, 0.05), width: clamp(item.width, 0.9), height: clamp(item.height, 0.05) };
}

function normalizeTable(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const rows = Array.isArray((value as { rows?: unknown }).rows) ? (value as { rows: unknown[] }).rows.flatMap((row) => Array.isArray(row) ? [row.map((cell) => cleanText(cell, 1000)).slice(0, 30)] : []).slice(0, 100) : [];
  return rows.length ? { rows, mergedCellHints: Array.isArray((value as { mergedCellHints?: unknown }).mergedCellHints) ? ((value as { mergedCellHints: unknown[] }).mergedCellHints.map((item) => cleanText(item, 160)).filter(Boolean).slice(0, 30)) : undefined } : undefined;
}

export function normalizeVisionBlocks(value: unknown, pageNumber: number): RecognitionBlock[] {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const rows = Array.isArray(root.blocks) ? root.blocks : [];
  const blocks = rows.flatMap((row, index): RecognitionBlock[] => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    const type = cleanText(item.type, 40) as RecognitionBlockType;
    const confidence = cleanText(item.confidence, 20) as RecognitionConfidence;
    if (!blockTypes.has(type)) return [];
    const text = cleanText(item.text);
    const latex = cleanText(item.latex, 3000) || undefined;
    const id = `p${pageNumber}-${stableHash(`${index}:${type}:${text}:${latex || ""}`)}`;
    const warnings = Array.isArray(item.warnings) ? item.warnings.map((warning) => cleanText(warning, 400)).filter(Boolean).slice(0, 8) : [];
    return [{ id, pageNumber, type, text, latex, table: normalizeTable(item.table), boundingBox: box(item.boundingBox), confidence: confidences.has(confidence) ? confidence : "low", readingOrder: Number.isFinite(Number(item.readingOrder)) ? Number(item.readingOrder) : index, parentBlockId: cleanText(item.parentBlockId, 120) || undefined, questionId: cleanText(item.questionId, 120) || undefined, warnings: confidence === "low" && !warnings.length ? ["SOẠN LAB chưa đọc chắc chắn phần này."] : warnings, reviewed: confidence === "high", excluded: false }];
  }).slice(0, 500);
  return rebuildBlockRelations(blocks);
}

async function requestGemini(prompt: string, imageBase64: string, mimeType: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("vision_unavailable");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: imageBase64 } }] }], generationConfig: { temperature: 0.1, maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS || 6000), responseMimeType: "application/json" } }) });
  if (!response.ok) throw new Error("vision_failed");
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim();
  if (!text) throw new Error("vision_empty");
  return text;
}

async function requestVision(prompt: string, imageBase64: string, mimeType: string) {
  const provider = (process.env.AI_VISION_PROVIDER || process.env.AI_PROVIDER || "local").toLowerCase();
  if (provider === "openai") return requestOpenAICompatibleVision({ prompt, imageBase64, mimeType });
  if (provider === "grok") return requestGrokVision({ prompt, imageBase64, mimeType });
  if (provider === "gemini") return requestGemini(prompt, imageBase64, mimeType);
  throw new Error("vision_unavailable");
}

export async function recognizeExamPage(input: { imageBase64: string; mimeType: string; pageNumber: number; extractedText?: string }) {
  const prompt = `Bạn nhận dạng một trang đề kiểm tra tiếng Việt cho giáo viên. Chỉ đọc nội dung nhìn thấy; không giải bài, không tự sửa thuật ngữ, không bịa phần bị cắt. Giữ nguyên dấu tiếng Việt, dấu phẩy thập phân, dấu trừ, số mũ, chỉ số và chiều bất đẳng thức. Phân tích bố cục trước, không dồn cả trang thành một đoạn. Nhận biết thứ tự đọc một hoặc hai cột, câu hỏi nhiều trang, A/B/C/D, mệnh đề a/b/c/d, bảng, công thức, đồ thị và hình học. Nếu mờ, viết tay, che khuất, công thức mất dấu hoặc thứ tự cột không chắc chắn: confidence=low và thêm cảnh báo. Không nêu hạ tầng kỹ thuật. Trả JSON duy nhất, không markdown:
{"blocks":[{"type":"document_header|school_header|exam_title|metadata|instruction|section_heading|question|option|true_false_statement|short_answer_area|essay_question|answer_key|paragraph|formula|table|image|graph|geometric_figure|page_number|footer|watermark|unknown","text":"...","latex":"... nếu là công thức","table":{"rows":[["..."]],"mergedCellHints":[]},"boundingBox":{"x":0.0,"y":0.0,"width":1.0,"height":0.1},"confidence":"high|medium|low","readingOrder":0,"parentBlockId":"","questionId":"","warnings":[]}],"handwritingLikely":false,"warnings":[]}.
Trang: ${input.pageNumber}. Lớp chữ đã trích (có thể rỗng, chỉ dùng để đối chiếu): ${JSON.stringify((input.extractedText || "").slice(0, 12000))}`;
  try {
    const raw = await requestVision(prompt, input.imageBase64, input.mimeType);
    const parsed = extractJson(raw);
    if (!parsed.ok) throw new Error("vision_parse_failed");
    const blocks = normalizeVisionBlocks(parsed.value, input.pageNumber);
    if (!blocks.length && input.extractedText?.trim()) return { blocks: textToRecognitionBlocks(input.extractedText, input.pageNumber), warnings: ["Trang được giữ theo lớp chữ vì chưa nhận dạng được bố cục hình ảnh."], handwritingLikely: false };
    if (!blocks.length) throw new Error("vision_empty");
    const root = parsed.value && typeof parsed.value === "object" ? parsed.value as Record<string, unknown> : {};
    return { blocks, warnings: Array.isArray(root.warnings) ? root.warnings.map((warning) => cleanText(warning, 400)).filter(Boolean).slice(0, 8) : [], handwritingLikely: root.handwritingLikely === true };
  } catch (error) {
    if (input.extractedText?.trim()) return { blocks: textToRecognitionBlocks(input.extractedText, input.pageNumber), warnings: ["Chưa thể bổ sung nhận dạng hình ảnh; lớp chữ đã trích vẫn được giữ lại."], handwritingLikely: false };
    throw error;
  }
}


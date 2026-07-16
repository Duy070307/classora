import type { Slide, SlideBlock, SlideGenerationSettings } from "@/lib/lesson-slides/types";
import { localBlocksForSlide } from "@/lib/lesson-slides/outline";
import { makeStableId, normalizeBlock } from "@/lib/lesson-slides/normalize";

function stripFence(value: string) {
  return value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function extractObject(value: string) {
  const clean = stripFence(value);
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  return start >= 0 && end > start ? clean.slice(start, end + 1) : clean;
}

function blockFromUnknown(value: unknown): SlideBlock | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const type = typeof raw.type === "string" ? raw.type : "text";
  const base = { id: typeof raw.id === "string" ? raw.id : makeStableId("block"), region: ["title", "subtitle", "main", "left", "right", "footer"].includes(String(raw.region)) ? raw.region as SlideBlock["region"] : "main" as const, alignment: ["left", "center", "right"].includes(String(raw.alignment)) ? raw.alignment as SlideBlock["alignment"] : "left" as const };
  if (type === "bullets") return normalizeBlock({ ...base, type, content: Array.isArray(raw.content) ? raw.content.map(String) : String(raw.content || "").split(/\n+/).filter(Boolean) });
  if (type === "formula") return normalizeBlock({ ...base, type, content: String(raw.content || "Công thức"), latex: String(raw.latex || raw.content || "") });
  if (type === "tikz") return normalizeBlock({ ...base, type, content: String(raw.content || "Hình TikZ"), tikz: String(raw.tikz || raw.content || "") });
  if (type === "table") {
    const headers = Array.isArray(raw.headers) ? raw.headers.map(String) : [];
    const rows = Array.isArray(raw.rows) ? raw.rows.filter(Array.isArray).map((row) => (row as unknown[]).map(String)) : [];
    return normalizeBlock({ ...base, type, content: String(raw.content || "Bảng"), headers, rows });
  }
  if (type === "question") return normalizeBlock({ ...base, type, content: String(raw.content || ""), questionType: ["multiple_choice", "true_false", "short_response", "discussion", "quick_check", "exit_ticket"].includes(String(raw.questionType)) ? raw.questionType as "quick_check" : "quick_check", options: Array.isArray(raw.options) ? raw.options.map(String) : undefined, answer: typeof raw.answer === "string" ? raw.answer : undefined, explanation: typeof raw.explanation === "string" ? raw.explanation : undefined, answerMode: ["teacher_notes", "answer_slide", "immediate", "hidden"].includes(String(raw.answerMode)) ? raw.answerMode as "teacher_notes" : "teacher_notes" });
  if (type === "callout") return normalizeBlock({ ...base, type, content: String(raw.content || ""), label: typeof raw.label === "string" ? raw.label : undefined });
  if (type === "process") return normalizeBlock({ ...base, type, content: String(raw.content || "Quy trình"), steps: Array.isArray(raw.steps) ? raw.steps.map(String) : [] });
  return normalizeBlock({ ...base, type: "text", content: String(raw.content || "") });
}

export function parseGeneratedSlide(raw: string, outline: Slide, settings: SlideGenerationSettings, sourceText: string): Slide {
  try {
    const data = JSON.parse(extractObject(raw)) as Record<string, unknown>;
    const blocks = Array.isArray(data.blocks) ? data.blocks.map(blockFromUnknown).filter((block): block is SlideBlock => Boolean(block)) : [];
    if (!blocks.length) throw new Error("empty_blocks");
    return {
      ...outline,
      title: typeof data.title === "string" && data.title.trim() ? data.title.trim().slice(0, 180) : outline.title,
      subtitle: typeof data.subtitle === "string" ? data.subtitle.trim().slice(0, 240) : outline.subtitle,
      blocks,
      teacherNotes: typeof data.teacherNotes === "string" ? data.teacherNotes.trim().slice(0, 6000) : undefined,
      generationStatus: "ready",
      generationError: undefined,
    };
  } catch {
    const local = localBlocksForSlide(outline, settings, sourceText);
    return { ...outline, ...local, generationStatus: "ready", generationError: undefined };
  }
}

export function buildSlidePrompt(slide: Slide, settings: SlideGenerationSettings, sourceText: string, action?: string) {
  const actionText = ({ shorter: "Viết ngắn hơn nhưng giữ đúng ý.", simpler: "Viết dễ hiểu hơn cho đúng đối tượng học sinh.", example: "Thêm một ví dụ ngắn, không bịa số liệu.", regenerate: "Tạo lại nội dung với cách diễn đạt khác." } as Record<string, string>)[action || ""] || "";
  return `Bạn đang tạo DUY NHẤT một slide bài giảng tiếng Việt cho giáo viên. Trả về JSON thuần, không markdown, không giải thích ngoài JSON.

Thông tin: môn ${settings.subject || "chưa nêu"}; lớp ${settings.grade || "chưa nêu"}; chủ đề ${settings.topic || "chưa nêu"}; mục đích ${settings.purpose}; đối tượng ${settings.audience}; mức chi tiết ${settings.detailLevel}.
Slide số ${slide.order}: loại ${slide.type}; tiêu đề "${slide.title || ""}"; mục đích "${slide.purpose || ""}"; nội dung mong đợi "${slide.expectedContent || ""}".
${actionText}

Nguồn giáo viên đã cung cấp (chỉ dùng thông tin liên quan, không bịa):
${sourceText.slice(0, 12000)}

Quy tắc: một ý chính; tiêu đề tối đa 12 từ; 3-6 bullet, mỗi bullet tối đa 18 từ; tổng tối đa 80 từ. Toán giữ LaTeX, ký hiệu, hàm và bước biến đổi. Vật lí phải có công thức và đơn vị. Hóa học giữ phương trình/điều kiện nhưng không tạo hướng dẫn thí nghiệm nguy hiểm. Ngữ văn/ngôn ngữ chỉ dùng trích đoạn ngắn do giáo viên cung cấp. Lịch sử/Địa lí phân biệt mốc thời gian, nguyên nhân và hệ quả; không tạo ảnh hoặc bản đồ giả. Không chép dài văn bản có bản quyền; không bịa trích dẫn, thống kê hay dữ kiện. Đáp án mặc định chỉ trong teacherNotes. Không nhắc hệ thống, nhà cung cấp hay mô hình.

Schema:
{"title":"...","subtitle":"...","blocks":[{"type":"bullets|text|formula|tikz|table|question|callout|process","content":"chuỗi hoặc mảng với bullets","latex":"nếu có","tikz":"nếu có","headers":[],"rows":[],"questionType":"quick_check","options":[],"answer":"...","explanation":"...","answerMode":"teacher_notes","region":"main","alignment":"left"}],"teacherNotes":"Gợi ý giảng dạy, đáp án và lỗi thường gặp"}`;
}

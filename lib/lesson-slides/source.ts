import type { GeneratedDocument } from "@/lib/types";
import type { SlideGenerationSettings, SlideSource, SlideSourceType } from "@/lib/lesson-slides/types";

export const LESSON_SLIDES_SOURCE_KEY = "soanlab-lesson-slides-source";

function extractLessonPlanStructure(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/^#{1,4}\s*|^[-*•\d.)\s]+/, "").trim()).filter(Boolean);
  const stages = lines.filter((line) => /khởi động|hình thành kiến thức|khám phá|luyện tập|vận dụng|đánh giá|tổng kết|dặn dò/i.test(line)).slice(0, 16);
  const objectiveIndex = lines.findIndex((line) => /mục tiêu|yêu cầu cần đạt/i.test(line));
  const objectives = objectiveIndex >= 0 ? lines.slice(objectiveIndex + 1, objectiveIndex + 7).filter((line) => !/chuẩn bị|thiết bị|tiến trình|hoạt động/i.test(line)) : [];
  return { objectives, stages, slideTitles: lines.filter((line) => /^(mục tiêu|khởi động|hoạt động|nội dung|luyện tập|vận dụng|tổng kết|bài tập|dặn dò)/i.test(line)).slice(0, 20) };
}

export function settingsFromDocument(document: GeneratedDocument): Partial<SlideGenerationSettings> {
  return {
    subject: document.examMeta?.subject || document.generationMeta?.subject || "",
    grade: document.examMeta?.grade || document.generationMeta?.grade || "",
    topic: document.examMeta?.topic || document.generationMeta?.topic || document.title,
    purpose: document.type === "exam" ? "review" : document.type === "worksheet" ? "solution" : "new_lesson",
  };
}

export function sourceFromDocument(document: GeneratedDocument): SlideSource {
  const recognizedConfirmed = document.type !== "document-recognition" || document.recognitionDraft?.reviewStatus === "confirmed";
  return {
    type: document.type === "lesson-plan" ? "lesson_plan" : "saved_content",
    title: document.title,
    text: recognizedConfirmed ? document.content : "",
    sourceDocumentId: document.id,
    confirmed: recognizedConfirmed,
    contentHash: document.generationMeta?.sourceContentHash || document.generationMeta?.recognitionDocumentHash,
    warnings: recognizedConfirmed ? [] : ["Tài liệu vẫn còn nội dung chưa được xác nhận. Vui lòng hoàn tất rà soát trước khi tạo slide."],
    extracted: document.type === "lesson-plan" ? extractLessonPlanStructure(document.content) : undefined,
  };
}

export function openLessonSlides(document: GeneratedDocument, purpose?: SlideGenerationSettings["purpose"]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LESSON_SLIDES_SOURCE_KEY, JSON.stringify({ source: sourceFromDocument(document), settings: { ...settingsFromDocument(document), purpose } }));
  window.location.assign("/tools/lesson-slides");
}

export function sourceTypeLabel(type: SlideSourceType) {
  return ({ manual: "Nhập chủ đề", lesson_plan: "Từ giáo án", document: "Từ tài liệu", saved_content: "Từ nội dung đã lưu", existing_presentation: "Từ PowerPoint" } as const)[type];
}

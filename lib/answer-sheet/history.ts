import type { AnswerSheetLayout, AnswerSheetTemplate } from "@/lib/answer-sheet/types";
import type { GeneratedDocument } from "@/lib/types";

export function answerSheetToDocument(template: AnswerSheetTemplate, layout: AnswerSheetLayout): GeneratedDocument {
  const counts = template.sections.map((section) => `${section.title}: ${section.questions.length}`).join(" · ");
  return {
    id: template.recognition.templateId,
    title: `Phiếu trả lời · ${template.title}${template.variantCode ? ` · Mã ${template.variantCode}` : ""}`,
    type: "answer-sheet",
    content: `PHIẾU TRẢ LỜI\n\n${template.title}\n${template.subject || ""}${template.grade ? ` · Khối ${template.grade}` : ""}${template.variantCode ? ` · Mã đề ${template.variantCode}` : ""}\n${counts}\n${layout.pages.length} trang · Phiên bản mẫu ${template.recognition.templateVersion}`,
    createdAt: template.metadata.createdAt,
    folder: "Đề kiểm tra",
    answerSheetTemplate: template,
    answerSheetLayout: layout,
    structuredExam: template.metadata.sourceExam,
    examMeta: { schoolName: template.schoolName, teacherName: template.teacherName, subject: template.subject, grade: template.grade, duration: template.durationMinutes ? `${template.durationMinutes} phút` : undefined, examCode: template.variantCode },
  };
}

import { structuredExamToText } from "@/lib/mock-exam-generator";
import type { ExamVariant, ExamVariantSet } from "@/lib/exam-mixer/types";
import type { ExamInput, GeneratedDocument } from "@/lib/types";

function inputFromVariant(variant: ExamVariant): ExamInput {
  const exam = variant.exam;
  const counts = Object.fromEntries(exam.parts.map((part) => [part.type, part.questions.length]));
  return {
    schoolName: exam.metadata.schoolName || "",
    teacherName: "",
    subject: exam.metadata.subject,
    grade: exam.metadata.grade,
    bookSeries: "",
    topic: exam.parts.flatMap((part) => part.questions.map((question) => question.topic)).filter(Boolean).join(", "),
    duration: exam.metadata.duration,
    examType: "Kết hợp",
    examStyle: /THPTQG|tốt nghiệp/i.test(exam.metadata.examStyle) ? "THPTQG / tốt nghiệp" : "Kiểm tra thường",
    trueFalseCount: counts.true_false || 0,
    shortAnswerCount: counts.short_answer || 0,
    examCode: variant.code,
    multipleChoiceCount: counts.multiple_choice || 0,
    essayCount: 0,
    totalScore: exam.metadata.totalScore || variant.auditResult.totalScore,
    level: "Trung bình",
    recognitionRate: 40,
    understandingRate: 30,
    applicationRate: 20,
    advancedRate: 10,
    includeAnswers: true,
    includeRubric: true,
    includeMatrix: true,
    includeSpecification: true,
    extraRequirements: "",
  };
}

export function variantToDocument(set: ExamVariantSet, variant: ExamVariant): GeneratedDocument {
  const input = inputFromVariant(variant);
  return {
    id: `${set.id}-${variant.code}`,
    title: `${set.sourceExamTitle} - Mã ${variant.code}`,
    type: "exam",
    content: structuredExamToText(variant.exam, input),
    createdAt: set.createdAt,
    folder: "Đề kiểm tra",
    structuredExam: variant.exam,
    examMeta: {
      schoolName: variant.exam.metadata.schoolName,
      subject: variant.exam.metadata.subject,
      grade: variant.exam.metadata.grade,
      duration: variant.exam.metadata.duration,
      examCode: variant.code,
      examStyle: variant.exam.metadata.examStyle,
    },
    generationMeta: { mode: "exam-mixer" },
  };
}

export function variantSetToHistoryDocument(set: ExamVariantSet): GeneratedDocument {
  return {
    id: set.id,
    title: `Bộ mã đề - ${set.sourceExamTitle}`,
    type: "exam-shuffler",
    content: `BỘ MÃ ĐỀ\n\nĐề gốc: ${set.sourceExamTitle}\nSố mã: ${set.variantCount}\nCác mã: ${set.variants.map((variant) => variant.code).join(", ")}\nHạt trộn: ${set.seed}`,
    createdAt: set.createdAt,
    folder: "Đề kiểm tra",
    structuredExam: set.sourceExamSnapshot,
    examVariantSet: set,
  };
}

export function variantSetAnswerKeyDocument(set: ExamVariantSet, codes?: string[]): GeneratedDocument {
  const variants = codes?.length ? set.variants.filter((variant) => codes.includes(variant.code)) : set.variants;
  const content = variants.map((variant) => {
    const sections = variant.exam.parts.map((part) => `${part.title}\n${part.questions.map((question) => `Câu ${question.number}: ${question.answer}`).join("\n")}`).join("\n\n");
    return `MÃ ĐỀ: ${variant.code}\n\n${sections}`;
  }).join("\n\n--------------------\n\n");
  return { id: `${set.id}-answer-keys`, title: `Đáp án tổng hợp - ${set.sourceExamTitle}`, type: "answer-key", content, createdAt: set.createdAt, folder: "Đề kiểm tra" };
}

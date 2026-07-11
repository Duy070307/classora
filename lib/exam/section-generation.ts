import type { ExamPartType, ExamQuestion, StructuredExam } from "@/lib/exam-types";
import { sanitizeExamStructure } from "@/lib/exam/exam-structure";

export const examSectionTypes = ["multiple_choice", "true_false", "short_answer"] as const;

export function requestedCountForSection(input: Record<string, unknown>, type: ExamPartType) {
  const field = type === "multiple_choice" ? "multipleChoiceCount" : type === "true_false" ? "trueFalseCount" : "shortAnswerCount";
  const value = Number(input[field] ?? 0);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function sectionChunkSize(type: ExamPartType, remaining: number) {
  const preferred = type === "multiple_choice" ? 6 : type === "true_false" ? 4 : 6;
  return Math.min(preferred, Math.max(0, remaining));
}

export function minimumUsableExamCount(requestedCount: number) {
  if (requestedCount <= 0) return 0;
  return requestedCount >= 10 ? Math.ceil(requestedCount * 0.8) : Math.max(1, Math.ceil(requestedCount * 0.8));
}

export function isUsableExamCount(requestedCount: number, finalCount: number) {
  return finalCount >= minimumUsableExamCount(requestedCount);
}

export function buildSectionOnlyInput(
  input: Record<string, unknown>,
  type: ExamPartType,
  count: number,
  existingStems: string[],
) {
  const questionType = type === "multiple_choice" ? "Trắc nghiệm" : type === "true_false" ? "Đúng/Sai" : "Trả lời ngắn";
  return {
    ...input,
    multipleChoiceCount: type === "multiple_choice" ? count : 0,
    trueFalseCount: type === "true_false" ? count : 0,
    shortAnswerCount: type === "short_answer" ? count : 0,
    essayCount: 0,
    questionType,
    questionCount: count,
    existingQuestionStems: existingStems.slice(-60),
  };
}

export function buildExamSectionPrompt(
  input: Record<string, unknown>,
  type: ExamPartType,
  count: number,
  existingStems: string[],
) {
  const schema = type === "multiple_choice"
    ? `[{"stem":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"correctAnswer":"A","explanation":"...","difficulty":"Nhận biết","topic":"${String(input.topic || "")}","conceptsUsed":["..."]}]`
    : type === "true_false"
      ? `[{"stem":"...","statements":[{"label":"a","text":"...","answer":true,"explanation":"..."},{"label":"b","text":"...","answer":false,"explanation":"..."},{"label":"c","text":"...","answer":true,"explanation":"..."},{"label":"d","text":"...","answer":false,"explanation":"..."}],"difficulty":"Thông hiểu","topic":"${String(input.topic || "")}","conceptsUsed":["..."]}]`
      : `[{"stem":"...","shortAnswer":"...","explanation":"...","difficulty":"Vận dụng","topic":"${String(input.topic || "")}","conceptsUsed":["..."]}]`;
  const partName = type === "multiple_choice" ? "PHẦN I trắc nghiệm A/B/C/D" : type === "true_false" ? "PHẦN II đúng/sai với đúng bốn ý a,b,c,d" : "PHẦN III trả lời ngắn";
  const diversity = /toán/i.test(String(input.subject || "")) && /hàm số/i.test(String(input.topic || ""))
    ? "Phân tán câu hỏi qua tập xác định, đạo hàm, đồng biến/nghịch biến, cực trị, GTLN/GTNN, tiệm cận, bảng biến thiên, đồ thị và tương giao; không lặp cùng biểu thức hàm số."
    : "Mỗi câu phải kiểm tra một khái niệm cụ thể và không lặp cách hỏi.";
  return `Tạo đúng ${count} câu cho ${partName} của đề ${String(input.subject || "")} lớp ${String(input.grade || "")}, chủ đề “${String(input.topic || "")}”.
Chỉ trả về MỘT JSON array, không markdown fence, không văn bản ngoài JSON.
Schema chính xác: ${schema}
Yêu cầu:
- Đúng môn, lớp và chủ đề; không chuyển sang chương khác.
- Mức độ chung: ${String(input.level || "Trung bình")}. Phân bố toàn đề: Nhận biết ${Number(input.recognitionRate ?? 30)}%, Thông hiểu ${Number(input.understandingRate ?? 40)}%, Vận dụng ${Number(input.applicationRate ?? 20)}%, Vận dụng cao ${Number(input.advancedRate ?? 10)}%.
- Yêu cầu bổ sung của giáo viên: ${String(input.extraRequirements || "Không có")}.
- ${diversity}
- Không tạo câu meta/chung chung; đáp án và giải thích phải cụ thể.
- Trường topic của từng câu phải là “${String(input.topic || "")}”.
- Không lặp các câu hoặc biểu thức đã có sau đây:
${existingStems.length ? existingStems.slice(-40).map((stem, index) => `${index + 1}. ${stem}`).join("\n") : "(chưa có)"}`;
}

function partTitle(type: ExamPartType) {
  return type === "multiple_choice" ? "PHẦN I" : type === "true_false" ? "PHẦN II" : "PHẦN III";
}

export function assembleSectionedExam(
  input: Record<string, unknown>,
  sections: Partial<Record<ExamPartType, ExamQuestion[]>>,
): StructuredExam {
  const parts = examSectionTypes
    .filter((type) => requestedCountForSection(input, type) > 0)
    .map((type) => ({
      type,
      title: partTitle(type),
      instruction: type === "multiple_choice" ? "Chọn một phương án đúng." : type === "true_false" ? "Chọn Đúng hoặc Sai cho từng ý a), b), c), d)." : "Ghi đáp án ngắn gọn.",
      questions: (sections[type] || []).slice(0, requestedCountForSection(input, type)).map((question, index) => ({ ...question, part: type, number: index + 1 })),
    }));
  const allQuestions = parts.flatMap((part) => part.questions.map((question) => `${part.title} - Câu ${question.number}: ${question.answer}`));
  return {
    metadata: {
      title: `Đề kiểm tra ${String(input.subject || "")} lớp ${String(input.grade || "")}`,
      examStyle: String(input.examStyle || "Kiểm tra thường"),
      subject: String(input.subject || ""),
      grade: String(input.grade || ""),
      duration: String(input.duration || ""),
      examCode: String(input.examCode || "0101").padStart(4, "0"),
      schoolName: String(input.schoolName || ""),
    },
    parts,
    teacherOnly: {
      scoringGuide: allQuestions.join("\n") || "Giáo viên rà soát đáp án trước khi sử dụng.",
      matrix: "Ma trận được đồng bộ theo cấu trúc đề sau khi kiểm tra số lượng câu.",
      specification: "Bản đặc tả được đồng bộ theo cấu trúc đề sau khi kiểm tra số lượng câu.",
      notes: "Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra, chỉnh sửa trước khi sử dụng chính thức.",
    },
  };
}

export function sectionCounts(exam: StructuredExam) {
  return {
    partI: exam.parts.find((part) => part.type === "multiple_choice")?.questions.length || 0,
    partII: exam.parts.find((part) => part.type === "true_false")?.questions.length || 0,
    partIII: exam.parts.find((part) => part.type === "short_answer")?.questions.length || 0,
  };
}

export type ExamSectionCollectionDiagnostics = {
  requested: { partI: number; partII: number; partIII: number };
  generatedRaw: { partI: number; partII: number; partIII: number };
  valid: { partI: number; partII: number; partIII: number };
  duplicateRemoved: number;
  regeneratedCount: number;
  attempts: { partI: number; partII: number; partIII: number };
  final: { partI: number; partII: number; partIII: number };
  finalTotal: number;
};

export type ExamSectionChunkRequest = {
  type: ExamPartType;
  count: number;
  remaining: number;
  attempt: number;
  existingStems: string[];
  input: Record<string, unknown>;
  prompt: string;
};

function partKey(type: ExamPartType): "partI" | "partII" | "partIII" {
  return type === "multiple_choice" ? "partI" : type === "true_false" ? "partII" : "partIII";
}

export async function collectExamSections(
  input: Record<string, unknown>,
  generateChunk: (request: ExamSectionChunkRequest) => Promise<{ questions: ExamQuestion[]; rawCount?: number; warnings?: string[] } | null>,
) {
  const requested = {
    partI: requestedCountForSection(input, "multiple_choice"),
    partII: requestedCountForSection(input, "true_false"),
    partIII: requestedCountForSection(input, "short_answer"),
  };
  const sections: Partial<Record<ExamPartType, ExamQuestion[]>> = {};
  const warnings: string[] = [];
  const diagnostics: ExamSectionCollectionDiagnostics = {
    requested,
    generatedRaw: { partI: 0, partII: 0, partIII: 0 },
    valid: { partI: 0, partII: 0, partIII: 0 },
    duplicateRemoved: 0,
    regeneratedCount: 0,
    attempts: { partI: 0, partII: 0, partIII: 0 },
    final: { partI: 0, partII: 0, partIII: 0 },
    finalTotal: 0,
  };

  for (const type of examSectionTypes) {
    const target = requestedCountForSection(input, type);
    if (!target) continue;
    const key = partKey(type);
    const preferredChunk = sectionChunkSize(type, target) || 1;
    const maxAttempts = Math.ceil(target / preferredChunk) + 2;
    for (let attempt = 0; attempt < maxAttempts && (sections[type]?.length || 0) < target; attempt += 1) {
      diagnostics.attempts[key] += 1;
      const existingStems = examSectionTypes.flatMap((sectionType) => (sections[sectionType] || []).map((question) => question.stem));
      const remaining = target - (sections[type]?.length || 0);
      const count = sectionChunkSize(type, remaining);
      const sectionInput = buildSectionOnlyInput(input, type, count, existingStems);
      try {
        const generated = await generateChunk({ type, count, remaining, attempt, existingStems, input: sectionInput, prompt: buildExamSectionPrompt(input, type, count, existingStems) });
        if (!generated) continue;
        diagnostics.generatedRaw[key] += generated.rawCount ?? generated.questions.length;
        if (!generated.questions.length) continue;
        if (attempt > 0) diagnostics.regeneratedCount += generated.questions.length;
        warnings.push(...(generated.warnings || []));
        const existing = sections[type] || [];
        const candidates = generated.questions.map((question, index) => ({
          ...question,
          id: `${type}-${existing.length + index + 1}-${attempt + 1}`,
          part: type,
          topic: question.topic || String(input.topic || ""),
        }));
        const audit = sanitizeExamStructure(assembleSectionedExam(input, { ...sections, [type]: [...existing, ...candidates] }), input);
        diagnostics.duplicateRemoved += audit.duplicateRemovedCount;
        for (const sectionType of examSectionTypes) sections[sectionType] = audit.exam.parts.find((part) => part.type === sectionType)?.questions || [];
        diagnostics.valid[key] = sections[type]?.length || 0;
      } catch {
        // Thử lại đúng phần đang thiếu và giữ nguyên các phần đã đạt.
      }
    }
  }

  const audit = sanitizeExamStructure(assembleSectionedExam(input, sections), input);
  diagnostics.duplicateRemoved += audit.duplicateRemovedCount;
  diagnostics.final = sectionCounts(audit.exam);
  diagnostics.finalTotal = audit.finalCount;
  return { audit, diagnostics, warnings: [...new Set(warnings)] };
}

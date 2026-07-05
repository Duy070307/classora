import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";
import type { ExamInput } from "@/lib/types";

export type ExamValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

const fenceOrJsonPattern = /```|^\s*[{}[\]]|\\n|"\s*:\s*"/;

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 && !fenceOrJsonPattern.test(value.trim());
}

function isQuestion(value: unknown): value is ExamQuestion {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const question = value as Partial<ExamQuestion>;
  return (
    typeof question.number === "number" &&
    hasText(question.stem) &&
    hasText(question.answer) &&
    typeof question.score === "number"
  );
}

function partQuestions(exam: StructuredExam, type: "multiple_choice" | "true_false" | "short_answer") {
  return exam.parts.find((part) => part.type === type)?.questions ?? [];
}

function repeatedAnswers(questions: ExamQuestion[]) {
  if (questions.length < 4) return false;
  const answers = questions.map((question) => question.answer.trim().toUpperCase());
  return new Set(answers).size === 1;
}

export function validateStructuredExam(exam: unknown, input?: Partial<ExamInput>): ExamValidationResult {
  if (!exam || typeof exam !== "object" || Array.isArray(exam)) return { ok: false, reason: "not_object" };
  const candidate = exam as StructuredExam;
  if (!candidate.metadata || typeof candidate.metadata !== "object") return { ok: false, reason: "missing_metadata" };
  if (!hasText(candidate.metadata.title)) return { ok: false, reason: "missing_title" };
  if (!hasText(candidate.metadata.subject)) return { ok: false, reason: "missing_subject" };
  if (!Array.isArray(candidate.parts) || candidate.parts.length === 0) return { ok: false, reason: "missing_parts" };

  const mc = partQuestions(candidate, "multiple_choice");
  const tf = partQuestions(candidate, "true_false");
  const short = partQuestions(candidate, "short_answer");
  if (!mc.length && !tf.length && !short.length) return { ok: false, reason: "missing_student_questions" };

  const requestedMc = Number(input?.multipleChoiceCount ?? 0);
  const requestedTf = Number(input?.trueFalseCount ?? 0);
  const requestedShort = Number(input?.shortAnswerCount ?? 0);
  if (requestedMc > 0 && mc.length === 0) return { ok: false, reason: "missing_part_i" };
  if (requestedTf > 0 && tf.length === 0) return { ok: false, reason: "missing_part_ii" };
  if (requestedShort > 0 && short.length === 0) return { ok: false, reason: "missing_part_iii" };

  for (const question of [...mc, ...tf, ...short]) {
    if (!isQuestion(question)) return { ok: false, reason: "invalid_question" };
    if (/đáp án|answer key|phần dành cho giáo viên|hướng dẫn chấm/i.test(question.stem)) return { ok: false, reason: "teacher_content_in_student_part" };
  }

  for (const question of mc) {
    if (!question.options || !["A", "B", "C", "D"].every((key) => hasText(question.options?.[key as "A"]))) {
      return { ok: false, reason: "invalid_multiple_choice_options" };
    }
  }

  for (const question of tf) {
    if (!question.trueFalseItems || question.trueFalseItems.length !== 4) return { ok: false, reason: "invalid_true_false_items" };
  }

  if (repeatedAnswers(mc) || repeatedAnswers(short)) return { ok: false, reason: "repeated_placeholder_answers" };
  if (!candidate.teacherOnly || !hasText(candidate.teacherOnly.scoringGuide)) return { ok: false, reason: "missing_teacher_key" };

  return { ok: true };
}

export function hasStudentQuestions(exam: StructuredExam | undefined) {
  return Boolean(exam?.parts.some((part) => part.questions.length > 0));
}

import { extractJson, looksLikeRawJson, stripCodeFences } from "@/lib/ai/extract-json";
import type { ExamPartType, ExamQuestion, StructuredExam } from "@/lib/exam-types";
import { structuredExamToText } from "@/lib/mock-exam-generator";
import type { ExamInput, QuestionDifficulty } from "@/lib/types";
import { validateStructuredExam } from "@/lib/exam/validate-structured-exam";

type NormalizeResult =
  | { ok: true; title?: string; content: string; structuredExam: StructuredExam }
  | { ok: false; reason: string; cleanContent: string };

const difficultyFallback: QuestionDifficulty = "Thông hiểu";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? stripCodeFences(value).trim() : fallback;
}

function number(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeDifficulty(value: unknown): QuestionDifficulty {
  return ["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"].includes(String(value)) ? value as QuestionDifficulty : difficultyFallback;
}

function normalizeQuestion(value: unknown, part: ExamPartType, index: number): ExamQuestion | null {
  if (!isRecord(value)) return null;
  const stem = text(value.stem ?? value.question ?? value.prompt ?? value.content);
  const answer = text(value.answer ?? value.correctAnswer ?? value.correct_answer);
  if (!stem || !answer) return null;

  const optionsValue = value.options;
  let options: ExamQuestion["options"];
  if (part === "multiple_choice" && isRecord(optionsValue)) {
    options = {
      A: text(optionsValue.A ?? optionsValue.a),
      B: text(optionsValue.B ?? optionsValue.b),
      C: text(optionsValue.C ?? optionsValue.c),
      D: text(optionsValue.D ?? optionsValue.d),
    };
  }

  const rawItems = Array.isArray(value.trueFalseItems) ? value.trueFalseItems : Array.isArray(value.statements) ? value.statements : [];
  const labels = ["a", "b", "c", "d"] as const;
  const trueFalseItems = part === "true_false"
    ? labels.map((label, itemIndex) => {
        const source = rawItems[itemIndex];
        const sourceRecord = isRecord(source) ? source : {};
        return {
          label,
          text: text(sourceRecord.text ?? sourceRecord.statement ?? sourceRecord.content ?? source),
          answer: Boolean(sourceRecord.answer ?? sourceRecord.correct ?? sourceRecord.isTrue)
        };
      })
    : undefined;

  return {
    id: text(value.id, `${part}-${index + 1}`),
    part,
    number: number(value.number, index + 1),
    stem,
    options,
    trueFalseItems,
    answer,
    explanation: text(value.explanation ?? value.scoringNote ?? value.rationale, "Giáo viên rà soát đáp án và cách chấm."),
    score: number(value.score, part === "multiple_choice" ? 0.25 : 1),
    difficulty: normalizeDifficulty(value.difficulty),
    topic: text(value.topic, "Nội dung kiểm tra")
  };
}

function normalizeParts(value: unknown): StructuredExam["parts"] {
  if (!Array.isArray(value)) return [];
  const normalized = value.map((partValue) => {
    if (!isRecord(partValue)) return null;
    const rawType = text(partValue.type);
    const type: ExamPartType = rawType === "true_false" || /II/i.test(text(partValue.title))
      ? "true_false"
      : rawType === "short_answer" || /III/i.test(text(partValue.title))
        ? "short_answer"
        : "multiple_choice";
    const questions = Array.isArray(partValue.questions)
      ? partValue.questions.map((question, index) => normalizeQuestion(question, type, index)).filter((question): question is ExamQuestion => Boolean(question))
      : [];
    return {
      type,
      title: text(partValue.title, type === "multiple_choice" ? "PHẦN I" : type === "true_false" ? "PHẦN II" : "PHẦN III"),
      instruction: text(partValue.instruction, ""),
      questions
    };
  }).filter((part): part is StructuredExam["parts"][number] => Boolean(part));
  const merged = new Map<ExamPartType, StructuredExam["parts"][number]>();
  for (const part of normalized) {
    const existing = merged.get(part.type);
    if (!existing) merged.set(part.type, part);
    else existing.questions.push(...part.questions.map((question, index) => ({ ...question, number: existing.questions.length + index + 1 })));
  }
  return [...merged.values()];
}

function pickStructuredCandidate(value: unknown): unknown {
  if (!isRecord(value)) return value;
  return value.structuredExam ?? value.exam ?? value;
}

function normalizeObjectToStructured(value: unknown, input: ExamInput): StructuredExam | null {
  const candidate = pickStructuredCandidate(value);
  const directQuestions = Array.isArray(candidate)
    ? candidate
    : isRecord(candidate) && Array.isArray(candidate.questions) ? candidate.questions : null;
  if (directQuestions) {
    const questions = directQuestions.map((question, index) => normalizeQuestion(question, "multiple_choice", index)).filter((question): question is ExamQuestion => Boolean(question));
    return questions.length ? {
      metadata: { title: `Đề kiểm tra ${input.subject} lớp ${input.grade}`, examStyle: input.examStyle, subject: input.subject, grade: input.grade, duration: input.duration, examCode: input.examCode.padStart(4, "0"), schoolName: input.schoolName },
      parts: [{ type: "multiple_choice", title: "PHẦN I", instruction: "Chọn phương án đúng nhất.", questions }],
      teacherOnly: { scoringGuide: questions.map((question) => `Câu ${question.number}: ${question.answer}`).join("\n"), matrix: "", specification: "", notes: "Nội dung là bản nháp hỗ trợ giáo viên." },
    } : null;
  }
  if (!isRecord(candidate)) return null;
  const metadata = isRecord(candidate.metadata) ? candidate.metadata : candidate;
  const parts = normalizeParts(candidate.parts ?? candidate.sections);
  const teacher = isRecord(candidate.teacherOnly) ? candidate.teacherOnly : isRecord(candidate.teacher) ? candidate.teacher : {};
  return {
    metadata: {
      title: text(metadata.title, `Đề kiểm tra ${input.subject} lớp ${input.grade}`),
      examStyle: text(metadata.examStyle, input.examStyle),
      subject: text(metadata.subject, input.subject),
      grade: text(metadata.grade, input.grade),
      duration: text(metadata.duration, input.duration),
      examCode: text(metadata.examCode, input.examCode).padStart(4, "0"),
      schoolName: text(metadata.schoolName, input.schoolName),
    },
    parts,
    teacherOnly: {
      scoringGuide: text(teacher.scoringGuide ?? teacher.scoring ?? teacher.rubric, "Giáo viên rà soát thang điểm trước khi sử dụng."),
      matrix: text(teacher.matrix, ""),
      specification: text(teacher.specification, ""),
      notes: text(teacher.notes, "Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra, chỉnh sửa trước khi sử dụng chính thức."),
    }
  };
}

export function normalizeAIExamOutput(rawText: string, input: ExamInput): NormalizeResult {
  const extraction = extractJson(rawText);
  if (!extraction.ok) {
    const cleanContent = stripCodeFences(rawText);
    if (looksLikeRawJson(cleanContent)) return { ok: false, reason: "raw_json_text", cleanContent: "" };
    return { ok: false, reason: "plain_text_without_structured_exam", cleanContent };
  }

  const value = extraction.value;
  const structuredExam = normalizeObjectToStructured(value, input);
  if (!structuredExam) return { ok: false, reason: "missing_structured_exam", cleanContent: "" };
  const validation = validateStructuredExam(structuredExam, input);
  if (!validation.ok) {
    const content = isRecord(value) ? text(value.content ?? value.studentContent) : "";
    return { ok: false, reason: validation.reason, cleanContent: looksLikeRawJson(content) ? "" : content };
  }
  const parsedTitle = isRecord(value) ? text(value.title) : undefined;
  return {
    ok: true,
    title: parsedTitle || structuredExam.metadata.title,
    content: structuredExamToText(structuredExam, input),
    structuredExam
  };
}

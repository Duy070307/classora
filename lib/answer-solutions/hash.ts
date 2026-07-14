import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";

export function stableHash(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(36);
}

export function questionSolutionHash(question: ExamQuestion) {
  return stableHash({ stem: question.stem, options: question.options, statements: question.trueFalseItems, answer: question.answer, visuals: question.visuals });
}

export function examSolutionHash(exam: StructuredExam) {
  return stableHash(exam.parts.flatMap((part) => part.questions.map((question) => ({ id: question.id, hash: questionSolutionHash(question) }))));
}


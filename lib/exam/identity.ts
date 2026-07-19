import { stableHash } from "@/lib/answer-solutions/hash";
import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";

function safeIdPart(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) || "question";
}

export function ensureStableStatementIds(question: ExamQuestion): ExamQuestion {
  if (!question.trueFalseItems) return question;
  const seen = new Set<string>();
  return {
    ...question,
    trueFalseItems: question.trueFalseItems.map((item, index) => {
      const preferred = item.id?.trim();
      const base = preferred || `${question.id}:statement-${stableHash({ text: item.text, originalIndex: index })}`;
      let id = base;
      let suffix = 2;
      while (seen.has(id)) id = `${base}-${suffix++}`;
      seen.add(id);
      return { ...item, id };
    }),
  };
}

/** Preserve every valid ID and repair only missing/colliding identities deterministically. */
export function ensureStableExamIdentity(exam: StructuredExam): StructuredExam {
  const seen = new Set<string>();
  return {
    ...exam,
    parts: exam.parts.map((part) => ({
      ...part,
      questions: part.questions.map((question, index) => {
        const preferred = question.id?.trim();
        const fingerprint = stableHash({ part: part.type, stem: question.stem, index });
        const base = preferred && !seen.has(preferred)
          ? preferred
          : `${part.type}-${safeIdPart(question.topic)}-${fingerprint}`;
        let id = base;
        let suffix = 2;
        while (seen.has(id)) id = `${base}-${suffix++}`;
        seen.add(id);
        return ensureStableStatementIds({ ...question, id, part: part.type });
      }),
    })),
  };
}

export function duplicateExamQuestionIds(exam: StructuredExam) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  exam.parts.flatMap((part) => part.questions).forEach((question) => {
    if (!question.id || seen.has(question.id)) duplicates.add(question.id || "(trống)");
    seen.add(question.id);
  });
  return [...duplicates];
}

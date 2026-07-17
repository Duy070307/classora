import type { QuestionBankItem, QuestionCollection } from "@/lib/question-bank-core/types";

export function canMutateQuestion(item: QuestionBankItem, userId?: string | null, isAdmin = false) {
  return isAdmin || (item.scope === "user" && (!item.ownerId || item.ownerId === userId));
}

export function bulkPatchOwnedQuestions(items: QuestionBankItem[], ids: string[], patch: Partial<QuestionBankItem>, userId?: string | null, isAdmin = false) {
  return items.map((item) => ids.includes(item.id) && canMutateQuestion(item, userId, isAdmin) ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item);
}

export function addQuestionsToCollection(collection: QuestionCollection, ids: string[]) {
  return { ...collection, questionIds: [...new Set([...collection.questionIds, ...ids])], updatedAt: new Date().toISOString() };
}

export function removeQuestionFromCollection(collection: QuestionCollection, id: string) {
  return { ...collection, questionIds: collection.questionIds.filter((value) => value !== id), updatedAt: new Date().toISOString() };
}

export function markExplanationVerified(item: QuestionBankItem, explanation: string) {
  return { ...item, explanation, quality: { ...item.quality, reviewStatus: "verified" as const, status: item.quality.status === "invalid" ? "needs_review" as const : item.quality.status }, updatedAt: new Date().toISOString() };
}

export function markQuestionUsed(item: QuestionBankItem, documentId: string, resultStatus?: string) {
  return { ...item, usage: { count: item.usage.count + 1, lastUsedAt: new Date().toISOString(), documentIds: [...new Set([...item.usage.documentIds, documentId])], lastResultStatus: resultStatus }, updatedAt: new Date().toISOString() };
}

export function questionToWorksheetActivity(item: QuestionBankItem) {
  const type = item.type === "multiple_choice" ? "multiple_choice" : item.type === "true_false" ? "true_false" : item.type === "short_answer" ? "short_answer" : item.type === "fill_blank" ? "fill_blank" : item.type === "matching" ? "matching" : item.type === "ordering" ? "ordering" : item.type === "table_completion" ? "table_completion" : "problem_solving";
  return { id: item.id, type, prompt: item.prompt, score: item.score, answer: item.answer || item.correctOptionIds.join(","), acceptedAlternatives: item.acceptedAnswers, explanation: item.explanation, learningOutcome: item.learningOutcome, sourceQuestionId: item.id };
}

export function lessonPlanQuestionLink(item: QuestionBankItem) {
  return { questionId: item.id, title: item.prompt.slice(0, 100), subject: item.subject, grade: item.grade, topic: item.topic, objective: item.learningOutcome };
}

export function gradingRules(item: QuestionBankItem) {
  return { questionId: item.id, answer: item.answer || item.correctOptionIds.join(","), acceptedAnswers: item.acceptedAnswers, unit: item.unit, tolerance: item.tolerance, rubric: item.essayRubric, score: item.score };
}

export function selectBlueprintAllocation(items: QuestionBankItem[], request: { subject: string; grade: string; topic: string; type: QuestionBankItem["type"]; difficulty: QuestionBankItem["difficulty"]; count: number }) {
  const matching = items.filter((item) => item.subject === request.subject && item.grade === request.grade && item.topic === request.topic && item.type === request.type && item.difficulty === request.difficulty && item.quality.status !== "invalid");
  return { selected: matching.slice(0, request.count), required: request.count, available: matching.length, shortage: Math.max(0, request.count - matching.length) };
}

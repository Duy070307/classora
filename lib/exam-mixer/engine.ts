import type { ExamPartType, ExamQuestion, StructuredExam } from "@/lib/exam-types";
import { auditStructuredExam } from "@/lib/exam-audit/audit";
import { createSeededRandom, seededShuffle } from "@/lib/exam-mixer/rng";
import type { CreateExamVariantsInput, ExamMixingOptions, ExamVariant, ExamVariantSet, VariantAuditResult } from "@/lib/exam-mixer/types";

const letters = ["A", "B", "C", "D"] as const;
type OptionRecord = Record<(typeof letters)[number], string>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizedOptions(value: unknown): OptionRecord | null {
  if (Array.isArray(value) && value.length === 4) {
    const entries = value.map((item) => typeof item === "string" ? item : item && typeof item === "object" ? String((item as Record<string, unknown>).text ?? (item as Record<string, unknown>).content ?? (item as Record<string, unknown>).value ?? "") : "");
    return entries.every((item) => item.trim()) ? Object.fromEntries(entries.map((item, index) => [letters[index], item])) as OptionRecord : null;
  }
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const result = Object.fromEntries(letters.map((letter) => [letter, typeof source[letter] === "string" ? source[letter] : ""])) as OptionRecord;
  return letters.every((letter) => result[letter].trim()) ? result : null;
}

function optionSignature(question: ExamQuestion) {
  const options = normalizedOptions(question.options);
  return options ? letters.map((letter) => options[letter]).sort() : [];
}

function groupKey(question: ExamQuestion, keepGroups: boolean) {
  if (!keepGroups) return question.id;
  const metadata = question.sourceMetadata || {};
  const explicit = metadata.sharedContextId || metadata.groupId || metadata.parentQuestionId;
  if (typeof explicit === "string" && explicit.trim()) return `explicit:${explicit.trim()}`;
  const visual = question.visuals?.map((item) => `${item.type}:${item.content || item.alt || ""}`).filter((item) => item.length > 8).join("|");
  return visual ? `visual:${visual}` : question.id;
}

function groupedUnits(questions: ExamQuestion[], keepGroups: boolean) {
  const order: string[] = [];
  const groups = new Map<string, ExamQuestion[]>();
  for (const question of questions) {
    const key = groupKey(question, keepGroups);
    if (!groups.has(key)) { groups.set(key, []); order.push(key); }
    groups.get(key)?.push(question);
  }
  return order.map((key) => groups.get(key) || []);
}

function maxStreak(sequence: string[]) {
  let current = 0;
  let best = 0;
  let previous = "";
  for (const value of sequence) {
    current = value === previous ? current + 1 : 1;
    previous = value;
    best = Math.max(best, current);
  }
  return best;
}

function repeatedPattern(sequence: string[]) {
  if (sequence.length < 8) return false;
  const text = sequence.join("");
  return /^(.{4})\1+$/.test(text) || /ABCDABCD|DCBADCBA/.test(text);
}

function balancedTargets(count: number, random: () => number, previous: string[][]) {
  const base = letters.flatMap((letter, index) => Array.from({ length: Math.floor(count / 4) + (index < count % 4 ? 1 : 0) }, () => letter));
  let best = [...base];
  let bestScore = Number.POSITIVE_INFINITY;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const candidate = seededShuffle(base, random);
    const duplicate = previous.some((item) => item.join("") === candidate.join(""));
    const score = maxStreak(candidate) * 10 + (repeatedPattern(candidate) ? 30 : 0) + (duplicate ? 100 : 0);
    if (score < bestScore) { best = candidate; bestScore = score; }
    if (score <= 20) break;
  }
  return best;
}

function shuffleMcqOptions(question: ExamQuestion, random: () => number, target?: typeof letters[number]) {
  const sourceOptions = normalizedOptions(question.options);
  if (!sourceOptions || !letters.includes(question.answer.trim().toUpperCase() as typeof letters[number])) return question;
  const originalAnswer = question.answer.trim().toUpperCase() as typeof letters[number];
  const entries = letters.map((label) => ({ originalLabel: label, value: sourceOptions[label] }));
  const shuffled = seededShuffle(entries, random);
  if (target) {
    const answerIndex = shuffled.findIndex((item) => item.originalLabel === originalAnswer);
    const targetIndex = letters.indexOf(target);
    [shuffled[answerIndex], shuffled[targetIndex]] = [shuffled[targetIndex], shuffled[answerIndex]];
  }
  const options = Object.fromEntries(shuffled.map((item, index) => [letters[index], item.value])) as ExamQuestion["options"];
  const answerIndex = shuffled.findIndex((item) => item.originalLabel === originalAnswer);
  return {
    ...question,
    options,
    answer: letters[answerIndex],
    sourceMetadata: { ...(question.sourceMetadata || {}), optionMap: Object.fromEntries(shuffled.map((item, index) => [item.originalLabel, letters[index]])) },
  };
}

function shuffleTrueFalseStatements(question: ExamQuestion, random: () => number) {
  if (!question.trueFalseItems || question.trueFalseItems.length !== 4) return question;
  const items = seededShuffle(question.trueFalseItems, random).map((item, index) => ({ ...item, label: (["a", "b", "c", "d"] as const)[index] }));
  return { ...question, trueFalseItems: items, answer: items.map((item) => item.answer ? "Đúng" : "Sai").join(", ") };
}

function shouldShuffleQuestions(type: ExamPartType, options: ExamMixingOptions) {
  if (type === "multiple_choice") return options.shuffleMultipleChoiceQuestions;
  if (type === "true_false") return options.shuffleTrueFalseQuestions;
  return options.shuffleShortAnswerQuestions;
}

function sourceCounts(exam: StructuredExam) {
  return {
    partI: exam.parts.find((part) => part.type === "multiple_choice")?.questions.length || 0,
    partII: exam.parts.find((part) => part.type === "true_false")?.questions.length || 0,
    partIII: exam.parts.find((part) => part.type === "short_answer")?.questions.length || 0,
  };
}

function totalScore(exam: StructuredExam) {
  return Number(exam.parts.flatMap((part) => part.questions).reduce((sum, question) => sum + Number(question.score || 0), 0).toFixed(4));
}

function answerDistribution(exam: StructuredExam) {
  const result = { A: 0, B: 0, C: 0, D: 0 };
  exam.parts.find((part) => part.type === "multiple_choice")?.questions.forEach((question) => {
    const answer = question.answer.trim().toUpperCase() as keyof typeof result;
    if (answer in result) result[answer] += 1;
  });
  return result;
}

function validateVariant(source: StructuredExam, variant: StructuredExam, code: string, options: ExamMixingOptions): VariantAuditResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sourceQuestions = source.parts.flatMap((part) => part.questions);
  const questions = variant.parts.flatMap((part) => part.questions);
  const sourceIds = sourceQuestions.map((question) => question.id).sort();
  const ids = questions.map((question) => question.id).sort();
  if (questions.length !== sourceQuestions.length) errors.push("Số câu không khớp đề gốc.");
  if (new Set(ids).size !== ids.length) errors.push("Có mã câu hỏi bị lặp.");
  if (JSON.stringify(sourceIds) !== JSON.stringify(ids)) errors.push("Tập câu hỏi không tương đương đề gốc.");
  const expectedCounts = sourceCounts(source);
  if (JSON.stringify(expectedCounts) !== JSON.stringify(sourceCounts(variant))) errors.push("Số câu trong các phần không khớp đề gốc.");
  if (Math.abs(totalScore(source) - totalScore(variant)) > 0.0001) errors.push("Tổng điểm không khớp đề gốc.");
  for (const sourceQuestion of sourceQuestions) {
    const question = questions.find((item) => item.id === sourceQuestion.id);
    if (!question) continue;
    if (sourceQuestion.stem !== question.stem || sourceQuestion.explanation !== question.explanation || sourceQuestion.score !== question.score || sourceQuestion.topic !== question.topic || sourceQuestion.difficulty !== question.difficulty || JSON.stringify(sourceQuestion.visuals || []) !== JSON.stringify(question.visuals || [])) errors.push(`Câu ${sourceQuestion.number} bị thay đổi nội dung hoặc metadata.`);
    if (sourceQuestion.options && question.options && JSON.stringify(optionSignature(sourceQuestion)) !== JSON.stringify(optionSignature(question))) errors.push(`Câu ${sourceQuestion.number} bị thay đổi nội dung phương án.`);
    if (sourceQuestion.options && (!normalizedOptions(question.options) || !letters.includes(question.answer as typeof letters[number]))) errors.push(`Câu ${sourceQuestion.number} có ánh xạ đáp án không hợp lệ.`);
    if (sourceQuestion.trueFalseItems) {
      const original = sourceQuestion.trueFalseItems.map((item) => `${item.text}:${item.answer}`).sort();
      const current = (question.trueFalseItems || []).map((item) => `${item.text}:${item.answer}`).sort();
      if (JSON.stringify(original) !== JSON.stringify(current)) errors.push(`Câu ${sourceQuestion.number} bị thay đổi mệnh đề Đúng/Sai.`);
    }
  }
  variant.parts.forEach((part) => part.questions.forEach((question, index) => { if (question.number !== index + 1) errors.push(`${part.title} có số câu không liên tục.`); }));
  if (options.keepGroups) {
    for (const part of variant.parts) {
      const positions = new Map<string, number[]>();
      part.questions.forEach((question, index) => { const key = groupKey(question, true); positions.set(key, [...(positions.get(key) || []), index]); });
      for (const indexes of positions.values()) if (indexes.length > 1 && indexes[indexes.length - 1] - indexes[0] + 1 !== indexes.length) errors.push("Nhóm câu hỏi dùng chung dữ kiện bị tách rời.");
    }
  }
  const deterministicAudit = auditStructuredExam(variant, { expectedSectionCounts: expectedCounts, totalScore: source.metadata.totalScore ?? totalScore(source), requireFourOptions: true, numericShortAnswers: /THPTQG|tốt nghiệp/iu.test(source.metadata.examStyle) });
  deterministicAudit.issues.filter((issue) => issue.code === "missing_visual" || issue.code === "missing_visual_dependency" || issue.code === "malformed_notation").forEach((issue) => (issue.severity === "error" ? errors : warnings).push(issue.description));
  const distribution = answerDistribution(variant);
  const values = Object.values(distribution);
  if (options.balanceAnswers && values.length && Math.max(...values) - Math.min(...values) > 1) warnings.push("Phân bố đáp án chưa cân bằng hoàn toàn.");
  const sequence = variant.parts.find((part) => part.type === "multiple_choice")?.questions.map((question) => question.answer) || [];
  if (maxStreak(sequence) > 2) warnings.push("Có chuỗi đáp án giống nhau dài hơn hai câu.");
  return { code, valid: errors.length === 0, errors: [...new Set(errors)], warnings: [...new Set(warnings)], answerDistribution: distribution, questionCount: questions.length, totalScore: totalScore(variant), equivalence: errors.length ? "invalid" : warnings.length ? "warning" : "equivalent" };
}

export function validateSourceExamForMixing(exam: StructuredExam) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const questions = exam.parts.flatMap((part) => part.questions);
  if (!exam.parts.some((part) => part.questions.length)) errors.push("Đề chưa có phần câu hỏi hợp lệ.");
  if (new Set(questions.map((question) => question.id)).size !== questions.length) errors.push("Đề có mã câu hỏi bị trùng.");
  for (const part of exam.parts) {
    part.questions.forEach((question, index) => {
      if (question.number !== index + 1) errors.push(`${part.title} có số câu không hợp lệ.`);
      if (!question.answer.trim()) errors.push(`${part.title} - Câu ${question.number} chưa có đáp án.`);
      if (part.type === "multiple_choice" && (!normalizedOptions(question.options) || !letters.includes(question.answer.trim().toUpperCase() as typeof letters[number]))) errors.push(`${part.title} - Câu ${question.number} có phương án hoặc đáp án không hợp lệ.`);
      if (part.type === "true_false" && (question.trueFalseItems?.length !== 4 || question.trueFalseItems.some((item) => !item.text.trim() || typeof item.answer !== "boolean"))) errors.push(`${part.title} - Câu ${question.number} chưa đủ bốn mệnh đề Đúng/Sai hợp lệ.`);
    });
  }
  const normalizedExam = clone(exam);
  normalizedExam.parts.filter((part) => part.type === "multiple_choice").forEach((part) => part.questions.forEach((question) => {
    const normalized = normalizedOptions(question.options);
    if (normalized) question.options = normalized;
  }));
  const audit = auditStructuredExam(normalizedExam, { expectedSectionCounts: sourceCounts(normalizedExam), totalScore: normalizedExam.metadata.totalScore ?? totalScore(normalizedExam), requireFourOptions: true, numericShortAnswers: /THPTQG|tốt nghiệp/iu.test(normalizedExam.metadata.examStyle) });
  audit.issues.forEach((issue) => {
    if (["missing_score", "total_score_mismatch"].includes(issue.code)) warnings.push(issue.description);
    else if (issue.severity === "error") errors.push(issue.description);
    else if (issue.severity === "warning") warnings.push(issue.description);
  });
  return { valid: errors.length === 0, errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

function createVariant(source: StructuredExam, code: string, variantSeed: string, options: ExamMixingOptions, previousAnswerSequences: string[][]): ExamVariant {
  const random = createSeededRandom(variantSeed);
  const sourceClone = clone(source);
  const mcCount = sourceClone.parts.find((part) => part.type === "multiple_choice")?.questions.length || 0;
  const targets = options.shuffleMultipleChoiceOptions && options.balanceAnswers ? balancedTargets(mcCount, random, previousAnswerSequences) : [];
  let mcIndex = 0;
  const questionMap: ExamVariant["questionMap"] = [];
  sourceClone.parts = sourceClone.parts.map((part) => {
    const units = groupedUnits(part.questions, options.keepGroups);
    const orderedUnits = shouldShuffleQuestions(part.type, options) ? seededShuffle(units, random) : units;
    const questions = orderedUnits.flat().map((sourceQuestion, index) => {
      let question = clone(sourceQuestion);
      if (part.type === "multiple_choice") {
        const normalized = normalizedOptions(question.options);
        if (normalized) question.options = normalized;
      }
      if (part.type === "multiple_choice" && options.shuffleMultipleChoiceOptions) question = shuffleMcqOptions(question, random, targets[mcIndex++]);
      if (part.type === "true_false" && options.shuffleTrueFalseStatements) question = shuffleTrueFalseStatements(question, random);
      question.number = index + 1;
      questionMap.push({ originalQuestionId: sourceQuestion.id, originalNumber: sourceQuestion.number, variantNumber: question.number, sectionId: part.type });
      return question;
    });
    return { ...part, questions };
  });
  sourceClone.metadata = { ...sourceClone.metadata, examCode: code };
  const answerKey = sourceClone.parts.flatMap((part) => part.questions.map((question) => ({ questionId: question.id, sectionId: part.type, number: question.number, answer: question.answer })));
  const auditResult = validateVariant(source, sourceClone, code, options);
  return { code, variantSeed, exam: sourceClone, questionMap, answerKey, auditResult };
}

export function createExamVariants(input: CreateExamVariantsInput): ExamVariantSet {
  const validation = validateSourceExamForMixing(input.exam);
  if (!validation.valid) throw new Error("source_exam_invalid");
  const variantCount = Math.min(20, Math.max(2, Math.floor(input.variantCount)));
  const startingCode = Math.max(1, Math.floor(input.startingCode));
  const previousAnswerSequences: string[][] = [];
  const variants = Array.from({ length: variantCount }, (_, index) => {
    const code = String(startingCode + index);
    const variant = createVariant(input.exam, code, `${input.seed}:${code}`, input.options, previousAnswerSequences);
    previousAnswerSequences.push(variant.exam.parts.find((part) => part.type === "multiple_choice")?.questions.map((question) => question.answer) || []);
    return variant;
  });
  return {
    id: `variant-set-${input.sourceExamId || "session"}-${input.seed}-${startingCode}`,
    sourceExamId: input.sourceExamId,
    sourceExamTitle: input.sourceExamTitle || input.exam.metadata.title,
    sourceExamSnapshot: clone(input.exam), seed: input.seed, startingCode, variantCount, mixingOptions: clone(input.options), createdAt: new Date().toISOString(), variants,
  };
}

export function regenerateExamVariant(set: ExamVariantSet, variantIndex: number, regenerationIndex = 1) {
  const current = set.variants[variantIndex];
  if (!current) return set;
  const otherSequences = set.variants.filter((_, index) => index !== variantIndex).map((variant) => variant.exam.parts.find((part) => part.type === "multiple_choice")?.questions.map((question) => question.answer) || []);
  let attempt = regenerationIndex;
  let replacement = createVariant(set.sourceExamSnapshot, current.code, `${set.seed}:${current.code}:regen:${attempt}`, set.mixingOptions, otherSequences);
  const signatures = new Set(set.variants.filter((_, index) => index !== variantIndex).map((variant) => variant.exam.parts.map((part) => part.questions.map((question) => `${question.id}:${question.answer}`).join("|")).join("||")));
  while (attempt < regenerationIndex + 10 && signatures.has(replacement.exam.parts.map((part) => part.questions.map((question) => `${question.id}:${question.answer}`).join("|")).join("||"))) {
    attempt += 1;
    replacement = createVariant(set.sourceExamSnapshot, current.code, `${set.seed}:${current.code}:regen:${attempt}`, set.mixingOptions, otherSequences);
  }
  return { ...set, variants: set.variants.map((variant, index) => index === variantIndex ? replacement : variant) };
}

export function variantComparisonRows(set: ExamVariantSet) {
  const source = set.sourceExamSnapshot.parts.flatMap((part) => part.questions.map((question) => ({ id: question.id, label: `${part.type}:${question.number}` })));
  return source.map((question) => ({ original: question.label, variants: Object.fromEntries(set.variants.map((variant) => [variant.code, variant.questionMap.find((item) => item.originalQuestionId === question.id)?.variantNumber || 0])) }));
}

export function variantAnswerRows(set: ExamVariantSet) {
  const max = Math.max(...set.variants.map((variant) => variant.answerKey.length), 0);
  return Array.from({ length: max }, (_, index) => ({ number: index + 1, variants: Object.fromEntries(set.variants.map((variant) => [variant.code, variant.answerKey[index]?.answer || "—"])) }));
}

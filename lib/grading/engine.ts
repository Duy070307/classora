import { stableHash } from "@/lib/answer-solutions/hash";
import { auditStructuredExam } from "@/lib/exam-audit/audit";
import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";
import type { GeneratedDocument } from "@/lib/types";
import { DEFAULT_GRADING_SETTINGS, type GradingExamSource, type GradingJob, type GradingSettings, type GradingSubmission, type QuestionGradingResult, type RecognizedAnswer, type SubmissionGradingResult } from "@/lib/grading/types";

export const GRADING_VERSION = "1.0.0";

const optionPattern = /^[A-D]$/;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeDecimal(value: string) {
  return value.replace(/\s+/g, "").replace(/,/g, ".");
}

function parseNumeric(value: unknown): { value: number; unit?: string } | null {
  const text = normalizeDecimal(clean(value)).replace(/[−–]/g, "-");
  const fraction = text.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)(?:\s*([\p{L}Ω°/%]+))?$/u);
  if (fraction && Number(fraction[2]) !== 0) return { value: Number(fraction[1]) / Number(fraction[2]), unit: fraction[3] };
  const match = text.match(/^(-?\d+(?:\.\d+)?)(?:\s*([\p{L}Ω°/%]+))?$/u);
  return match && Number.isFinite(Number(match[1])) ? { value: Number(match[1]), unit: match[2] } : null;
}

function sameNumeric(expected: unknown, actual: unknown, settings: GradingSettings) {
  const left = parseNumeric(expected); const right = parseNumeric(actual);
  if (!left || !right) return null;
  const distance = Math.abs(left.value - right.value);
  const matches = settings.numericTolerance === "absolute" ? distance <= Math.max(0, settings.toleranceValue)
    : settings.numericTolerance === "percentage" ? distance <= Math.abs(left.value) * Math.max(0, settings.toleranceValue) / 100
      : distance <= 1e-9;
  const unitMissing = Boolean(settings.requireUnit && left.unit && !right.unit);
  const unitMismatch = Boolean(settings.requireUnit && left.unit && right.unit && left.unit.toLowerCase() !== right.unit.toLowerCase());
  return { matches, unitMissing, unitMismatch };
}

function normalizeBooleanSequence(value: unknown): boolean[] | null {
  if (Array.isArray(value)) {
    const mapped = value.map((item) => typeof item === "boolean" ? item : /^(?:đ|d|true|1)$/i.test(clean(item)) ? true : /^(?:s|false|0)$/i.test(clean(item)) ? false : null);
    return mapped.every((item) => item !== null) ? mapped as boolean[] : null;
  }
  const parts = clean(value).split(/[;,|/\s]+/).filter(Boolean);
  if (!parts.length) return null;
  const mapped = parts.map((item) => /^(?:đ|d|true|1)$/i.test(item) ? true : /^(?:s|false|0)$/i.test(item) ? false : null);
  return mapped.every((item) => item !== null) ? mapped as boolean[] : null;
}

function roundScore(value: number, mode: GradingSettings["rounding"]) {
  if (mode === "one_decimal") return Math.round(value * 10) / 10;
  if (mode === "two_decimals") return Math.round(value * 100) / 100;
  if (mode === "quarter") return Math.round(value * 4) / 4;
  if (mode === "half") return Math.round(value * 2) / 2;
  return value;
}

function scaledTotals(results: QuestionGradingResult[], settings: GradingSettings) {
  const included = results.filter((result) => !settings.excludedQuestionIds.includes(result.questionId));
  const rawMaximum = included.reduce((sum, result) => sum + result.maximumScore, 0); const scale = rawMaximum > 0 ? settings.maximumScore / rawMaximum : 1;
  const sectionScores: Record<string, number> = {};
  for (const result of included) sectionScores[result.sectionId] = roundScore((sectionScores[result.sectionId] || 0) + result.awardedScore * scale, settings.rounding);
  return { totalScore: roundScore(included.reduce((sum, result) => sum + result.awardedScore, 0) * scale, settings.rounding), sectionScores };
}

export function validateGradingSource(document: GeneratedDocument): GradingExamSource {
  const exam = document.structuredExam || document.examVariantSet?.sourceExamSnapshot;
  const warnings: string[] = []; const blockingErrors: string[] = [];
  if (!exam && !document.type.includes("rubric")) blockingErrors.push("Không tìm thấy cấu trúc đề để chấm.");
  if (exam) {
    const questions = exam.parts.flatMap((part) => part.questions);
    if (!questions.length) blockingErrors.push("Đề chưa có câu hỏi hợp lệ.");
    if (questions.some((question) => !question.id)) blockingErrors.push("Đề có câu hỏi chưa có mã ổn định.");
    if (questions.some((question) => question.answer === undefined || clean(question.answer) === "")) blockingErrors.push("Đề còn câu chưa có đáp án.");
    if (questions.some((question) => !Number.isFinite(question.score) || question.score < 0)) blockingErrors.push("Thang điểm của đề chưa hợp lệ.");
    const audit = auditStructuredExam(exam, { totalScore: exam.metadata.totalScore });
    if (audit.summary.errorCount) warnings.push(`Đề còn ${audit.summary.errorCount} lỗi cấu trúc cần giáo viên kiểm tra.`);
  }
  if (document.examVariantSet?.variants.some((variant) => !variant.auditResult.valid)) blockingErrors.push("Bộ mã đề có ánh xạ đáp án chưa hợp lệ.");
  const verified = document.examSolutionSet?.verificationStatus === "verified" || document.auditMeta?.auditStatus === "ready";
  if (exam && !verified) warnings.push("Đáp án của đề chưa được xác minh. Thầy cô nên kiểm tra đáp án trước khi chấm bài.");
  return { documentId: document.id, title: document.title, exam, variantSet: document.examVariantSet, rubric: document.rubric, rubricText: document.type === "rubric" ? document.content : undefined, verified, warnings, blockingErrors };
}

export function sourceFromPastedAnswerKey(title: string, value: string): GradingExamSource {
  const entries = [...value.matchAll(/(?:^|\n)\s*(?:câu\s*)?(\d{1,3})\s*[).:\-]\s*([^\n]+)/giu)].map((match) => ({ number: Number(match[1]), answer: match[2].trim() })).filter((item) => item.number > 0 && item.answer);
  if (!entries.length) return { title, verified: false, warnings: [], blockingErrors: ["Không đọc được đáp án. Hãy nhập theo dạng “1: A”, mỗi câu một dòng."] };
  const score = 10 / entries.length;
  const exam: StructuredExam = { metadata: { title, examStyle: "Đáp án nhập thủ công", subject: "Chưa xác định", grade: "Chưa xác định", duration: "", examCode: "", totalScore: 10 }, parts: [{ type: "multiple_choice", title: "PHẦN I", instruction: "Chọn đáp án đúng.", questions: entries.map((item) => ({ id: `manual-${item.number}`, part: "multiple_choice", number: item.number, stem: `Câu ${item.number}`, options: { A: "A", B: "B", C: "C", D: "D" }, answer: item.answer.toUpperCase(), explanation: "", score, difficulty: "Thông hiểu", topic: "Đáp án nhập thủ công" })) }], teacherOnly: { scoringGuide: "", matrix: "", specification: "", notes: "Đáp án do giáo viên nhập thủ công." } };
  return { title, exam, verified: false, warnings: ["Đáp án được nhập thủ công và chưa được xác minh. Thầy cô cần kiểm tra trước khi chấm."], blockingErrors: [] };
}

export function examForSubmission(source: GradingExamSource, submission: Pick<GradingSubmission, "examCode" | "examCodeConfirmed">) {
  if (!source.variantSet) return source.exam || null;
  if (!submission.examCode || !submission.examCodeConfirmed) return null;
  return source.variantSet.variants.find((variant) => variant.code === submission.examCode)?.exam || null;
}

export function rubricTotalFromText(value: string) {
  const explicit = value.match(/tổng\s*(?:số\s*)?điểm\s*[:：-]\s*(\d+(?:[.,]\d+)?)/iu)?.[1];
  return explicit ? Number(explicit.replace(",", ".")) : null;
}

export function rubricTotalMatches(value: string, assignmentScore: number) {
  const total = rubricTotalFromText(value);
  return total === null ? { known: false, matches: false, total: null } : { known: true, matches: Math.abs(total - assignmentScore) < 0.0001, total };
}

function answerForQuestion(answers: RecognizedAnswer[], question: ExamQuestion, globalIndex: number, duplicateNumbers: Set<number>) {
  const byId = answers.find((answer) => answer.questionId === question.id); if (byId) return byId;
  if (!duplicateNumbers.has(question.number)) return answers.find((answer) => answer.questionNumber === question.number);
  return answers.find((answer) => answer.questionNumber === globalIndex + 1) || answers[globalIndex];
}

function gradeQuestion(question: ExamQuestion, sectionId: string, answer: RecognizedAnswer | undefined, settings: GradingSettings): QuestionGradingResult {
  const base = { questionId: question.id, questionNumber: question.number, sectionId, expectedAnswer: question.answer, studentAnswer: answer?.normalizedValue ?? answer?.rawValue, maximumScore: question.score, confidence: answer?.confidence || "low" as const };
  if (settings.excludedQuestionIds.includes(question.id)) return { ...base, status: "unresolved", awardedScore: 0, explanation: "Câu đã được giáo viên loại khỏi bài chấm." };
  if (!answer || answer.normalizedValue === undefined || clean(answer.normalizedValue) === "") return { ...base, status: "blank", awardedScore: 0 };
  if (answer.confidence === "low" && !answer.teacherConfirmed) return { ...base, status: "needs_teacher_review", awardedScore: 0, explanation: "Câu trả lời nhận dạng chưa đủ chắc chắn." };

  if (question.part === "multiple_choice") {
    const values = Array.isArray(answer.normalizedValue) ? answer.normalizedValue.map(clean) : clean(answer.normalizedValue).toUpperCase().split(/[;,/\s]+/).filter(Boolean);
    if (values.length !== 1 || !optionPattern.test(values[0])) return { ...base, status: "needs_teacher_review", awardedScore: settings.multipleSelectionScore, explanation: "Bài làm có nhiều lựa chọn hoặc phương án không hợp lệ." };
    const accepted = [clean(question.answer).toUpperCase(), ...(settings.acceptedAnswers[question.id] || []).map((value) => value.toUpperCase())];
    const correct = accepted.includes(values[0]);
    return { ...base, status: correct ? "correct" : "incorrect", awardedScore: correct ? question.score : 0 };
  }

  if (question.part === "true_false") {
    const expected = question.trueFalseItems?.map((item) => item.answer) || normalizeBooleanSequence(question.answer);
    const actual = normalizeBooleanSequence(answer.normalizedValue);
    if (!expected || !actual || expected.length !== actual.length) return { ...base, status: "needs_teacher_review", awardedScore: 0, explanation: "Chưa ánh xạ đủ các mệnh đề Đúng/Sai." };
    const correctCount = expected.filter((value, index) => value === actual[index]).length;
    const score = settings.trueFalse === "all_or_nothing" ? correctCount === expected.length ? question.score : 0
      : settings.trueFalse === "custom" && settings.trueFalseCustomScores?.length ? (settings.trueFalseCustomScores[correctCount] ?? 0)
        : question.score * correctCount / expected.length;
    return { ...base, status: correctCount === expected.length ? "correct" : correctCount ? "partial" : "incorrect", awardedScore: score, explanation: `${correctCount}/${expected.length} mệnh đề đúng.` };
  }

  const numeric = sameNumeric(question.answer, answer.normalizedValue, settings);
  if (numeric) {
    if (numeric.unitMismatch) return { ...base, status: "incorrect", awardedScore: 0, explanation: "Đơn vị không khớp yêu cầu." };
    if (numeric.matches && numeric.unitMissing) return { ...base, status: "partial", awardedScore: question.score * settings.missingUnitFactor, explanation: "Giá trị đúng nhưng thiếu đơn vị; áp dụng cấu hình của giáo viên." };
    return { ...base, status: numeric.matches ? "correct" : "incorrect", awardedScore: numeric.matches ? question.score : 0 };
  }
  const accepted = [clean(question.answer), ...(settings.acceptedAnswers[question.id] || [])].map((value) => value.toLocaleLowerCase("vi"));
  const exact = accepted.includes(clean(answer.normalizedValue).toLocaleLowerCase("vi"));
  if (exact) return { ...base, status: "correct", awardedScore: question.score };
  return { ...base, status: "needs_teacher_review", awardedScore: 0, explanation: "Câu trả lời mở cần giáo viên rà soát hoặc chấm theo rubric." };
}

export function gradeSubmission(submission: GradingSubmission, source: GradingExamSource, settings: GradingSettings): SubmissionGradingResult {
  const exam = examForSubmission(source, submission);
  if (!exam && source.rubricText) {
    const textAnswer = submission.recognizedAnswers.map((answer) => answer.rawValue || answer.normalizedValue).filter(Boolean).join("\n");
    const questionResults: QuestionGradingResult[] = [{ questionId: "rubric-response", questionNumber: 1, sectionId: "rubric", expectedAnswer: "Đánh giá theo rubric", studentAnswer: textAnswer, status: textAnswer ? "needs_teacher_review" : "blank", awardedScore: 0, maximumScore: settings.maximumScore, confidence: submission.recognizedAnswers.some((answer) => answer.confidence === "low") ? "low" : "medium", explanation: "Bài tự luận cần giáo viên duyệt điểm theo từng tiêu chí rubric." }];
    return { totalScore: 0, maximumScore: settings.maximumScore, percentage: 0, objectiveScore: 0, assistedScore: 0, sectionScores: { rubric: 0 }, correctCount: 0, incorrectCount: 0, blankCount: textAnswer ? 0 : 1, unresolvedCount: textAnswer ? 1 : 0, questionResults, confirmedByTeacher: false };
  }
  if (!exam) throw new Error(source.variantSet ? "exam_code_confirmation_required" : "grading_source_missing");
  const flatQuestions = exam.parts.flatMap((part) => part.questions.map((question) => ({ part: part.type, question })));
  const counts = new Map<number, number>(); flatQuestions.forEach(({ question }) => counts.set(question.number, (counts.get(question.number) || 0) + 1));
  const duplicateNumbers = new Set([...counts.entries()].filter(([, count]) => count > 1).map(([number]) => number));
  const questionResults = flatQuestions.map(({ part, question }, index) => gradeQuestion(question, part, answerForQuestion(submission.recognizedAnswers, question, index, duplicateNumbers), settings));
  const included = questionResults.filter((result) => !settings.excludedQuestionIds.includes(result.questionId));
  const rawMaximum = included.reduce((sum, result) => sum + result.maximumScore, 0);
  const rawScore = included.reduce((sum, result) => sum + result.awardedScore, 0);
  const scale = rawMaximum > 0 ? settings.maximumScore / rawMaximum : 1;
  const totalScore = roundScore(rawScore * scale, settings.rounding);
  const sectionScores: Record<string, number> = {};
  for (const result of included) sectionScores[result.sectionId] = roundScore((sectionScores[result.sectionId] || 0) + result.awardedScore * scale, settings.rounding);
  return {
    totalScore, maximumScore: settings.maximumScore, percentage: settings.maximumScore ? Math.round(totalScore / settings.maximumScore * 10000) / 100 : 0,
    objectiveScore: totalScore, assistedScore: 0, sectionScores,
    correctCount: included.filter((result) => result.status === "correct").length,
    incorrectCount: included.filter((result) => result.status === "incorrect").length,
    blankCount: included.filter((result) => result.status === "blank").length,
    unresolvedCount: included.filter((result) => ["unresolved", "needs_teacher_review"].includes(result.status)).length,
    questionResults, confirmedByTeacher: false,
  };
}

export function regradeJob(job: GradingJob): GradingJob {
  const submissions = job.submissions.map((submission) => {
    try { return { ...submission, gradingResult: gradeSubmission(submission, job.source, job.settings), reviewStatus: submission.recognizedAnswers.some((answer) => answer.confidence === "low" && !answer.teacherConfirmed) ? "needs_review" as const : submission.reviewStatus }; }
    catch { return { ...submission, gradingResult: undefined, reviewStatus: "needs_review" as const }; }
  });
  return { ...job, submissions, status: submissions.some((item) => item.reviewStatus === "needs_review" || item.gradingResult?.unresolvedCount) ? "needs_review" : "graded", metadata: { ...job.metadata, updatedAt: new Date().toISOString() } };
}

export function overrideQuestionScore(job: GradingJob, submissionId: string, questionId: string, newScore: number, reason?: string) {
  const now = new Date().toISOString();
  return { ...job, submissions: job.submissions.map((submission) => {
    if (submission.id !== submissionId || !submission.gradingResult) return submission;
    const questionResults = submission.gradingResult.questionResults.map((result) => {
      if (result.questionId !== questionId) return result;
      const entry = { previousScore: result.awardedScore, newScore, reason, updatedAt: now };
      return { ...result, awardedScore: Math.max(0, Math.min(result.maximumScore, newScore)), status: "partial" as const, teacherOverride: entry, overrideHistory: [...(result.overrideHistory || []), entry] };
    });
    const totals = scaledTotals(questionResults, job.settings);
    return { ...submission, gradingResult: { ...submission.gradingResult, questionResults, ...totals, percentage: job.settings.maximumScore ? Math.round(totals.totalScore / job.settings.maximumScore * 10000) / 100 : 0, confirmedByTeacher: false }, reviewStatus: "reviewed" as const };
  }), status: "needs_review" as const, metadata: { ...job.metadata, updatedAt: now } };
}

export function regradeAffectedQuestions(job: GradingJob, updatedExam: StructuredExam, affectedQuestionIds: string[]) {
  const affected = new Set(affectedQuestionIds); const source = { ...job.source, exam: updatedExam };
  const submissions = job.submissions.map((submission) => {
    if (!submission.gradingResult) return submission;
    const fresh = gradeSubmission(submission, source, job.settings); const freshById = new Map(fresh.questionResults.map((result) => [result.questionId, result]));
    const questionResults = submission.gradingResult.questionResults.map((result) => affected.has(result.questionId) ? freshById.get(result.questionId) || result : result);
    const totals = scaledTotals(questionResults, job.settings);
    return { ...submission, gradingResult: { ...submission.gradingResult, questionResults, ...totals, percentage: job.settings.maximumScore ? Math.round(totals.totalScore / job.settings.maximumScore * 10000) / 100 : 0, confirmedByTeacher: false }, reviewStatus: "needs_review" as const };
  });
  return { ...job, source, submissions, status: "needs_review" as const, metadata: { ...job.metadata, updatedAt: new Date().toISOString(), examHash: stableHash(updatedExam), answerKeyHash: stableHash(updatedExam.parts.flatMap((part) => part.questions.map((question) => [question.id, question.answer]))) } };
}

export function createGradingJob(source: GradingExamSource): GradingJob {
  const examScore = source.exam?.metadata.totalScore || source.exam?.parts.flatMap((part) => part.questions).reduce((sum, question) => sum + Number(question.score || 0), 0) || 10;
  const rubricCheck = source.rubric ? { known: true, matches: Math.abs(source.rubric.totalScore - examScore) < 0.0001, total: source.rubric.totalScore } : source.rubricText ? rubricTotalMatches(source.rubricText, examScore) : null;
  const normalizedSource = rubricCheck?.known && !rubricCheck.matches ? { ...source, warnings: [...source.warnings, "Tổng điểm rubric chưa khớp với tổng điểm bài. Giáo viên cần sửa hoặc chọn tổng điểm phù hợp trước khi xác nhận."] } : source;
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), examId: source.documentId, variantSetId: source.variantSet?.id, rubricId: source.rubric?.id, title: `Chấm bài · ${source.title}`, gradingMode: (source.rubric || source.rubricText) && !source.exam ? "essay_rubric" : source.variantSet ? "mixed_exam" : "combined", status: "draft", source: normalizedSource, submissions: [], rubricAssessments: {}, settings: { ...DEFAULT_GRADING_SETTINGS, maximumScore: source.rubric?.totalScore || examScore }, metadata: { createdAt: now, updatedAt: now, examHash: source.exam ? stableHash(source.exam) : undefined, answerKeyHash: source.exam ? stableHash(source.exam.parts.flatMap((part) => part.questions.map((question) => [question.id, question.answer]))) : undefined, gradingVersion: GRADING_VERSION } };
}

export function classSummary(job: GradingJob) {
  const graded = job.submissions.filter((item) => item.gradingResult);
  const scores = graded.map((item) => item.gradingResult!.totalScore);
  const questions = new Map<string, { number: number; correct: number; total: number; wrong: Record<string, number> }>();
  for (const submission of graded) for (const result of submission.gradingResult!.questionResults) {
    const item = questions.get(result.questionId) || { number: result.questionNumber, correct: 0, total: 0, wrong: {} };
    item.total += 1; if (result.status === "correct") item.correct += 1;
    else { const answer = clean(result.studentAnswer) || "Bỏ trống"; item.wrong[answer] = (item.wrong[answer] || 0) + 1; }
    questions.set(result.questionId, item);
  }
  return { total: job.submissions.length, graded: graded.length, needsReview: job.submissions.filter((item) => item.reviewStatus === "needs_review" || item.gradingResult?.unresolvedCount).length, average: scores.length ? roundScore(scores.reduce((sum, score) => sum + score, 0) / scores.length, "two_decimals") : 0, highest: scores.length ? Math.max(...scores) : 0, lowest: scores.length ? Math.min(...scores) : 0, questions: [...questions.entries()].map(([questionId, item]) => ({ questionId, ...item, correctPercentage: item.total ? Math.round(item.correct / item.total * 10000) / 100 : 0 })).sort((a, b) => a.correctPercentage - b.correctPercentage) };
}

export function stripGradingAssets(job: GradingJob): GradingJob {
  return { ...job, submissions: job.submissions.map((submission) => ({ ...submission, sourceFiles: submission.sourceFiles.map((asset) => { const clean = { ...asset }; delete clean.previewUrls; return clean; }), recognizedAnswers: submission.recognizedAnswers.map((answer) => { const clean = { ...answer }; delete clean.sourceCrop; return clean; }) })) };
}

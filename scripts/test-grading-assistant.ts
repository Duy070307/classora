import assert from "node:assert/strict";
import { createExamVariants } from "../lib/exam-mixer/engine";
import type { StructuredExam } from "../lib/exam-types";
import { classSummary, createGradingJob, gradeSubmission, overrideQuestionScore, regradeAffectedQuestions, regradeJob, rubricTotalMatches, stripGradingAssets, validateGradingSource } from "../lib/grading/engine";
import { recognizeAnswersFromText } from "../lib/grading/recognition";
import { gradingJobToDocument } from "../lib/grading/history";
import { gradingReportDocument, gradingRows, studentResultDocument } from "../lib/grading/export";
import type { GradingSubmission } from "../lib/grading/types";

const exam: StructuredExam = {
  metadata: { title: "Đề kiểm thử", examStyle: "Kiểm tra", subject: "Toán", grade: "12", duration: "45 phút", examCode: "000", totalScore: 3 },
  parts: [
    { type: "multiple_choice", title: "PHẦN I", instruction: "Chọn đáp án", questions: [{ id: "q1", part: "multiple_choice", number: 1, stem: "Chọn A", options: { A: "Đúng", B: "Sai", C: "Phương án C", D: "Phương án D" }, answer: "A", explanation: "", score: 1, difficulty: "Nhận biết", topic: "Kiểm thử" }] },
    { type: "true_false", title: "PHẦN II", instruction: "Đúng/Sai", questions: [{ id: "q2", part: "true_false", number: 1, stem: "Xét mệnh đề", trueFalseItems: [{ label: "a", text: "a", answer: true }, { label: "b", text: "b", answer: false }, { label: "c", text: "c", answer: true }, { label: "d", text: "d", answer: false }], answer: "Đ; S; Đ; S", explanation: "", score: 1, difficulty: "Thông hiểu", topic: "Kiểm thử" }] },
    { type: "short_answer", title: "PHẦN III", instruction: "Trả lời", questions: [{ id: "q3", part: "short_answer", number: 1, stem: "Tính", answer: "1/2", explanation: "", score: 1, difficulty: "Vận dụng", topic: "Kiểm thử" }] },
  ], teacherOnly: { scoringGuide: "", matrix: "", specification: "", notes: "" },
};

const sourceDocument = { id: "exam-1", title: "Đề kiểm thử", type: "exam" as const, content: "", createdAt: new Date().toISOString(), structuredExam: exam, auditMeta: { auditStatus: "ready" as const, errorCount: 0, warningCount: 0, acceptedWarningIds: [], auditVersion: "1" } };
const source = validateGradingSource(sourceDocument);
assert.equal(source.blockingErrors.length, 0, "StructuredExam đã kiểm tra phải nạp được");
const invalid = structuredClone(sourceDocument); invalid.structuredExam.parts[0].questions[0].answer = "";
assert.ok(validateGradingSource(invalid).blockingErrors.some((item) => item.includes("đáp án")), "Đáp án thiếu phải chặn chấm");

const recognized = recognizeAnswersFromText("Họ và tên: Nguyễn Văn A\nLớp: 12A1\nMã đề: 101\n1: A\n2: Đ S Đ S\n3: 0,5");
assert.equal(recognized.student.displayName, "Nguyễn Văn A"); assert.equal(recognized.examCode, "101"); assert.equal(recognized.answers.length, 3);
function submission(answers = recognized.answers): GradingSubmission { return { id: "s1", student: { displayName: "Nguyễn Văn A" }, examCode: "101", examCodeConfidence: "high", examCodeConfirmed: true, sourceFiles: [], recognizedAnswers: answers, reviewStatus: "reviewed" }; }

const job = createGradingJob(source); job.submissions = [submission()]; job.settings.maximumScore = 3;
const result = gradeSubmission(job.submissions[0], source, job.settings);
assert.equal(result.totalScore, 3, "Thập phân dấu phẩy phải tương đương 1/2"); assert.equal(result.correctCount, 3);
const fractionResult = gradeSubmission(submission(recognizeAnswersFromText("1: A\n2: Đ S Đ S\n3: 2/4").answers), source, job.settings);
assert.equal(fractionResult.totalScore, 3, "Phân số tương đương phải được chấp nhận");
const wrong = gradeSubmission(submission(recognizeAnswersFromText("1: B\n2: S S S S\n3: 0,7").answers), source, job.settings);
assert.ok(wrong.totalScore < 3 && wrong.incorrectCount >= 2, "Đáp án sai phải nhận 0 ở câu tương ứng");
const blank = gradeSubmission(submission(recognizeAnswersFromText("1: A").answers), source, job.settings);
assert.equal(blank.blankCount, 2, "Câu không có câu trả lời phải là bỏ trống");
assert.equal(recognizeAnswersFromText("1: A C").answers[0].confidence, "low", "Nhiều lựa chọn phải bị gắn cờ");
const low = gradeSubmission(submission([{ questionNumber: 1, rawValue: "A?", normalizedValue: "A", confidence: "low", teacherConfirmed: false }]), source, job.settings);
assert.equal(low.questionResults[0].status, "needs_teacher_review", "Nhận dạng thấp phải chờ rà soát");

const unitExam = structuredClone(exam); unitExam.parts[2].questions[0].answer = "0,5 cm";
const unitResult = gradeSubmission(submission(recognizeAnswersFromText("1: A\n2: Đ S Đ S\n3: 0,5").answers), { ...source, exam: unitExam }, { ...job.settings, requireUnit: true, missingUnitFactor: .5 });
assert.equal(unitResult.questionResults.find((item) => item.questionId === "q3")?.status, "partial", "Thiếu đơn vị phải theo cấu hình");

const variants = createExamVariants({ exam, sourceExamId: "exam-1", sourceExamTitle: "Đề kiểm thử", variantCount: 2, startingCode: 101, seed: "grading-test", options: { shuffleMultipleChoiceQuestions: true, shuffleMultipleChoiceOptions: true, shuffleTrueFalseQuestions: true, shuffleTrueFalseStatements: true, shuffleShortAnswerQuestions: true, shuffleEssayQuestions: false, keepGroups: true, balanceAnswers: false } });
const mixedSource = { ...source, variantSet: variants };
for (const variant of variants.variants) { const answer = variant.answerKey.find((item) => item.questionId === "q1")!.answer; const item = submission(recognizeAnswersFromText(`1: ${answer}\n2: Đ S Đ S\n3: 0,5`).answers); item.examCode = variant.code; item.examCodeConfirmed = true; assert.equal(gradeSubmission(item, mixedSource, job.settings).questionResults.find((row) => row.questionId === "q1")?.status, "correct", `Mã ${variant.code} phải dùng đúng ánh xạ`); }
const unresolvedCode = submission(); unresolvedCode.examCode = "999"; unresolvedCode.examCodeConfirmed = false;
assert.throws(() => gradeSubmission(unresolvedCode, mixedSource, job.settings), /exam_code_confirmation_required/);

let gradedJob = regradeJob(job); gradedJob = overrideQuestionScore(gradedJob, "s1", "q1", .5, "Giáo viên chỉnh"); gradedJob = overrideQuestionScore(gradedJob, "s1", "q1", .75, "Chỉnh lần hai");
assert.equal(gradedJob.submissions[0].gradingResult?.questionResults[0].overrideHistory?.length, 2, "Lịch sử override phải được giữ");
const changedExam = structuredClone(exam); changedExam.parts[0].questions[0].answer = "B"; const affected = regradeAffectedQuestions(gradedJob, changedExam, ["q1"]);
assert.equal(affected.submissions[0].gradingResult?.questionResults.find((item) => item.questionId === "q2")?.awardedScore, gradedJob.submissions[0].gradingResult?.questionResults.find((item) => item.questionId === "q2")?.awardedScore, "Đổi đáp án chỉ làm mới câu bị ảnh hưởng");

assert.deepEqual(rubricTotalMatches("Tổng điểm: 10", 10), { known: true, matches: true, total: 10 }); assert.equal(rubricTotalMatches("Tổng điểm: 8", 10).matches, false);
const rubricJob = createGradingJob({ title: "Rubric bài viết", rubricText: "Tổng điểm: 10", verified: true, warnings: [], blockingErrors: [] }); rubricJob.submissions = [submission([{ questionNumber: 1, rawValue: "Bài viết của học sinh", normalizedValue: "Bài viết của học sinh", confidence: "medium" }])]; rubricJob.settings.maximumScore = 10;
const rubricResult = gradeSubmission(rubricJob.submissions[0], rubricJob.source, rubricJob.settings); assert.equal(rubricResult.confirmedByTeacher, false); assert.equal(rubricResult.questionResults[0].status, "needs_teacher_review");

gradedJob = regradeJob(job); gradedJob.submissions[0].gradingResult!.confirmedByTeacher = true;
const rows = gradingRows(gradedJob); assert.equal(rows[0]["Họ và tên"], "Nguyễn Văn A"); assert.ok(Object.keys(rows[0]).includes("Phần I"));
const studentSheet = studentResultDocument(gradedJob, gradedJob.submissions[0]); assert.ok(!studentSheet.content.includes("Đáp án: A"), "Phiếu học sinh mặc định không lộ đáp án");
const report = gradingReportDocument(gradedJob); assert.ok(!report.content.includes("confidence") && !report.content.includes("sourceRegion"), "Báo cáo không lộ chẩn đoán nhận dạng");
gradedJob.submissions[0].sourceFiles = [{ id: "asset", fileName: "private.jpg", mimeType: "image/jpeg", size: 100, pageCount: 1, status: "recognized", previewUrls: ["blob:private"] }]; gradedJob.submissions[0].recognizedAnswers[0].sourceCrop = "data:image/jpeg;base64,private";
const stripped = stripGradingAssets(gradedJob); assert.equal(stripped.submissions[0].sourceFiles[0].previewUrls, undefined); assert.equal(stripped.submissions[0].recognizedAnswers[0].sourceCrop, undefined);
const history = gradingJobToDocument(gradedJob); assert.equal(history.type, "grading-assistant"); assert.ok(history.gradingJob); assert.equal(classSummary(gradedJob).graded, 1);

console.log("Grading Assistant đạt: nguồn đề, mã đề, nhận dạng text, chấm xác định, rubric, override, riêng tư và lịch sử.");

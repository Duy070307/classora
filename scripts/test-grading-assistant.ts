import assert from "node:assert/strict";
import { createExamVariants } from "../lib/exam-mixer/engine";
import type { StructuredExam } from "../lib/exam-types";
import { classSummary, createGradingJob, gradeSubmission, overrideQuestionScore, regradeAffectedQuestions, regradeJob, rubricTotalMatches, stripGradingAssets, validateGradingSource } from "../lib/grading/engine";
import { mergeRecognizedAnswers, recognizeAnswersFromText } from "../lib/grading/recognition";
import { gradingJobToDocument } from "../lib/grading/history";
import { gradingReportDocument, gradingRows, studentResultDocument } from "../lib/grading/export";
import type { GradingSubmission } from "../lib/grading/types";
import JSZip from "jszip";
import { answerSheetChecksum, createQrPayload, isAnswerSheetOwner, parseQrPayload, validateQrPayload } from "../lib/answer-sheet/checksum";
import { buildAnswerSheetLayout, pageSizePoints } from "../lib/answer-sheet/layout";
import { ANSWER_SHEET_FIXTURE_NAMES, renderAnswerSheetFixture } from "../lib/answer-sheet/fixtures";
import { bubblesToRecognizedAnswers, detectPageSet, recognizeAnswerSheetPage, rotateGrayCounterClockwise, shortAnswerRegionsToRecognizedAnswers } from "../lib/answer-sheet/recognition";
import { buildAnswerSheetPdfBlob, buildAnswerSheetZip } from "../lib/answer-sheet/export";
import { configFromExam, createAnswerSheetTemplate, defaultAnswerSheetConfig } from "../lib/answer-sheet/template";

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

const repeatedNumbers = mergeRecognizedAnswers(
  [{ questionId: "part-i-q1", questionNumber: 1, normalizedValue: "A", confidence: "high", sourcePage: 1 }],
  [{ questionId: "part-ii-q1", questionNumber: 1, normalizedValue: [true, false, true, false], confidence: "high", sourcePage: 1 }],
);
assert.deepEqual(repeatedNumbers.map((answer) => answer.questionId), ["part-i-q1", "part-ii-q1"], "Repeated question numbers must remain distinct by questionId");

function repeatedExam(): StructuredExam {
  const next = structuredClone(exam); next.metadata.title = "Đề 12/4/6"; next.metadata.examCode = "101";
  next.parts[0].questions = Array.from({ length: 12 }, (_, index) => ({ ...structuredClone(exam.parts[0].questions[0]), id: `mcq-${index + 1}`, number: index + 1, answer: (["A", "B", "C", "D"] as const)[index % 4] }));
  next.parts[1].questions = Array.from({ length: 4 }, (_, index) => ({ ...structuredClone(exam.parts[1].questions[0]), id: `tf-${index + 1}`, number: index + 1 }));
  next.parts[2].questions = Array.from({ length: 6 }, (_, index) => ({ ...structuredClone(exam.parts[2].questions[0]), id: `short-${index + 1}`, number: index + 1 }));
  return next;
}

const exam1246 = repeatedExam();
const config1246 = configFromExam(exam1246);
const template1246 = createAnswerSheetTemplate({ config: config1246, exam: exam1246, examId: "exam-12-4-6", ownerId: "teacher-a" });
assert.deepEqual(template1246.sections.map((section) => section.questions.length), [12, 4, 6], "Đề 12/4/6 phải tạo đúng ba phần");
assert.equal(config1246.multipleChoiceCount, 12); assert.equal(config1246.trueFalseCount, 4); assert.equal(config1246.shortAnswerCount, 6);
const manual = createAnswerSheetTemplate({ config: { ...defaultAnswerSheetConfig(), multipleChoiceCount: 40, trueFalseCount: 2, shortAnswerCount: 3, essayCount: 1, essaySpace: "short_lines" } });
assert.deepEqual(manual.sections.map((section) => section.type), ["multiple_choice", "true_false", "short_answer", "essay"], "Chế độ thủ công phải giữ đúng phần cấu hình");

const variant101 = variants.variants[0]; const variant102 = variants.variants[1];
const sheet101 = createAnswerSheetTemplate({ config: configFromExam(variant101.exam), variant: variant101, variantSet: variants, examId: "exam-1", ownerId: "teacher-a" });
const sheet102 = createAnswerSheetTemplate({ config: configFromExam(variant102.exam), variant: variant102, variantSet: variants, examId: "exam-1", ownerId: "teacher-a" });
assert.equal(sheet101.variantCode, "101"); assert.equal(sheet102.variantCode, "102");
for (const [sheet, variant] of [[sheet101, variant101], [sheet102, variant102]] as const) {
  const sheetIds = sheet.sections.flatMap((section) => section.questions.map((question) => question.questionId));
  const variantIds = variant.exam.parts.flatMap((part) => part.questions.map((question) => question.id));
  assert.deepEqual(sheetIds, variantIds, `Mã ${variant.code} phải giữ đúng thứ tự câu của biến thể`);
  const tfSheet = sheet.sections.find((section) => section.type === "true_false"); const tfExam = variant.exam.parts.find((part) => part.type === "true_false");
  assert.deepEqual(tfSheet?.questions[0]?.statements.map((item) => item.statementId), tfExam?.questions[0]?.trueFalseItems?.map((item) => `${tfExam.questions[0].id}:${item.label}`), `Mã ${variant.code} phải ánh xạ đúng thứ tự mệnh đề`);
}

const payload = createQrPayload(template1246, 1); const payloadText = JSON.stringify(payload);
assert.equal(payloadText.includes("answer"), false, "QR không được chứa đáp án"); assert.equal(payloadText.includes("student"), false, "QR không được chứa danh tính học sinh");
assert.equal(validateQrPayload(parseQrPayload(payloadText)!, template1246), true, "Checksum QR hợp lệ phải được chấp nhận");
assert.equal(validateQrPayload({ ...payload, checksum: answerSheetChecksum("forged") }, template1246), false, "QR giả mạo phải bị từ chối");
assert.equal(isAnswerSheetOwner(template1246, "teacher-a"), true); assert.equal(isAnswerSheetOwner(template1246, "teacher-b"), false, "Template của giáo viên khác phải bị từ chối");

const layout1246 = buildAnswerSheetLayout(template1246); const firstPage = layout1246.pages[0];
assert.deepEqual({ width: firstPage.width, height: firstPage.height }, pageSizePoints("A4_PORTRAIT"), "Kích thước vật lý A4 phải đúng");
assert.equal(firstPage.recognitionRegions.filter((region) => region.type === "anchor").length, 4, "Mỗi trang phải có bốn anchor");
const mcqRegions = layout1246.pages.flatMap((page) => page.recognitionRegions.filter((region) => region.type === "bubble" && region.questionId?.startsWith("mcq-")));
assert.equal(mcqRegions.length, 12 * 4, "Tọa độ bubble phải khớp bản đồ nhận diện");
assert.equal(new Set(mcqRegions.map((region) => region.id)).size, mcqRegions.length, "Mỗi bubble phải có ID ổn định duy nhất");
const shortRegions = layout1246.pages.flatMap((page) => page.recognitionRegions.filter((region) => region.type === "short_answer"));
assert.equal(shortRegions.length, 6, "Mỗi câu trả lời ngắn phải giữ vùng crop riêng");

const shortPage = layout1246.pages.find((page) => page.recognitionRegions.some((region) => region.type === "short_answer"))!;
const firstShortRegion = shortPage.recognitionRegions.find((region) => region.type === "short_answer")!;
const shortAnswers = shortAnswerRegionsToRecognizedAnswers(shortPage, { [firstShortRegion.id]: "data:image/jpeg;base64,c3ludGhldGlj" });
assert.ok(shortAnswers.length > 0 && shortAnswers[0].sourceCrop?.startsWith("data:image/jpeg;base64,"), "Short answers must retain a source crop for teacher review");
assert.equal(shortAnswers[0].confidence, "low", "Handwritten short answers must not be confirmed automatically");

const firstQuestionRegions = firstPage.recognitionRegions.filter((region) => region.questionId === "mcq-1" && region.type === "bubble");
const regionA = firstQuestionRegions.find((region) => region.optionValue === "A")!; const regionB = firstQuestionRegions.find((region) => region.optionValue === "B")!;
function scan(marks: Parameters<typeof renderAnswerSheetFixture>[1], fixtureOptions: Parameters<typeof renderAnswerSheetFixture>[2] = {}) { const image = renderAnswerSheetFixture(firstPage, marks, fixtureOptions); return recognizeAnswerSheetPage(image, template1246, layout1246, 1, false); }
const clean = scan([]); assert.equal(clean.bubbles.find((bubble) => bubble.regionId === regionA.id)?.state, "blank", "Bubble sạch phải là bỏ trống");
const selectedScan = scan([{ regionId: regionA.id, kind: "selected" }]); const selectedBubble = selectedScan.bubbles.find((bubble) => bubble.regionId === regionA.id); assert.equal(selectedBubble?.state, "selected", `Bubble tô rõ phải được nhận diện: ${JSON.stringify(selectedScan.bubbles.filter((bubble)=>bubble.questionId==='mcq-1'))}`);
const selectedAnswers = bubblesToRecognizedAnswers(template1246, selectedScan.bubbles); assert.equal(selectedAnswers.find((answer) => answer.questionId === "mcq-1")?.normalizedValue, "A"); assert.equal(selectedScan.genericOcrUsed, false, "Phiếu rõ không được gọi OCR tổng quát");
const multipleScan = scan([{ regionId: regionA.id, kind: "selected" }, { regionId: regionB.id, kind: "selected" }]); assert.equal(multipleScan.bubbles.find((bubble) => bubble.regionId === regionA.id)?.state, "multiple_selected", "Tô nhiều phải bị gắn cờ");
const faintScan = scan([{ regionId: regionA.id, kind: "faint" }]); const faintBubble = faintScan.bubbles.find((bubble) => bubble.regionId === regionA.id); assert.notEqual(faintBubble?.confidence, "high", `Dấu tô mờ phải cần rà soát: ${JSON.stringify(faintBubble)}`);
const crossedScan = scan([{ regionId: regionA.id, kind: "cross" }, { regionId: regionB.id, kind: "selected" }]); assert.ok(crossedScan.bubbles.some((bubble) => bubble.state === "crossed_out" || bubble.confidence !== "high"), "Gạch sửa phải cần rà soát");
const tickScan = scan([{ regionId: regionA.id, kind: "tick" }]); assert.notEqual(tickScan.bubbles.find((bubble) => bubble.regionId === regionA.id)?.state, "blank", "Dấu tick phải được phát hiện để rà soát");
assert.equal(scan([{ regionId: regionA.id, kind: "selected" }], { perspective: true }).bubbles.find((bubble) => bubble.regionId === regionA.id)?.state, "selected", "Ảnh méo phối cảnh phải căn được");
assert.ok(scan([], { missingAnchor: 3 }).alignment !== "aligned", "Thiếu anchor phải hạ độ tin cậy");
assert.ok(scan([{ regionId: regionA.id, kind: "selected" }], { shadow: true }).bubbles.length > 0, "Ảnh có bóng vẫn phải được xử lý cục bộ");
assert.ok(scan([{ regionId: regionA.id, kind: "selected" }], { scale: 0.75 }).bubbles.length > 0, "Bản photocopy độ phân giải thấp vẫn phải tạo kết quả rà soát");
const upright = renderAnswerSheetFixture(firstPage, [{ regionId: regionA.id, kind: "selected" }]); const rotatedClockwise = rotateGrayCounterClockwise(rotateGrayCounterClockwise(rotateGrayCounterClockwise(upright)));
assert.equal(recognizeAnswerSheetPage(rotatedClockwise, template1246, layout1246, 1).bubbles.find((bubble) => bubble.regionId === regionA.id)?.state, "selected", "Ảnh xoay 90 độ phải được đưa về đúng chiều");
assert.deepEqual(detectPageSet([1, 2], [1]), { missingPages: [2], duplicatePages: [], unexpectedPages: [] });
assert.deepEqual(detectPageSet([1, 2], [1, 1, 2]), { missingPages: [], duplicatePages: [1], unexpectedPages: [] });
assert.equal(ANSWER_SHEET_FIXTURE_NAMES.length, 16, "Phải khai báo đủ 16 fixture xác định");
const tfPage = layout1246.pages.find((item)=>item.recognitionRegions.some((region)=>region.statementId)); const tfSection = template1246.sections.find((section)=>section.type === "true_false");
assert.ok(tfPage && tfSection && tfSection.type === "true_false");
const firstTf = tfSection!.type === "true_false" ? tfSection!.questions[0] : null;
const tfMarks = firstTf!.statements.map((statement)=>({regionId:tfPage!.recognitionRegions.find((region)=>region.statementId===statement.statementId&&region.optionValue==="true")!.id,kind:"selected" as const}));
const tfImage = renderAnswerSheetFixture(tfPage!,tfMarks); const tfResult = recognizeAnswerSheetPage(tfImage,template1246,layout1246,tfPage!.pageNumber); const tfAnswer = bubblesToRecognizedAnswers(template1246,tfResult.bubbles,tfPage!.pageNumber).find((answer)=>answer.questionId===firstTf!.questionId);
assert.deepEqual(tfAnswer?.normalizedValue,[true,true,true,true],"Đúng/sai phải ánh xạ theo stable statement ID");
const studentVisibleText = layout1246.pages.flatMap((page) => page.primitives.filter((item) => item.kind === "text").map((item) => item.kind === "text" ? item.text : "")).join(" ");
assert.equal(studentVisibleText.includes("Đáp án"), false, "Phiếu học sinh không được lộ đáp án");

async function testAnswerSheetExports() {
  const pdfBlob = await buildAnswerSheetPdfBlob([template1246]); const pdfBytes = Buffer.from(await pdfBlob.arrayBuffer());
  assert.ok(pdfBytes.subarray(0, 5).toString() === "%PDF-", "Xuất phiếu phải tạo PDF thật");
  const pdfHeader = pdfBytes.toString("latin1"); assert.match(pdfHeader, /\/MediaBox\s*\[\s*0\s+0\s+595(?:\.\d+)?\s+841(?:\.\d+)?\s*\]/, "PDF phải giữ đúng MediaBox A4");
  const zipBlob = await buildAnswerSheetZip([sheet101, sheet102]); const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
  assert.equal(Object.keys(zip.files).filter((name) => name.endsWith(".pdf")).length, 3, "ZIP hai mã phải có hai PDF riêng và một PDF gộp");
}

void testAnswerSheetExports().then(() => console.log("Grading Assistant và Phiếu trả lời đạt: cấu trúc 12/4/6, mã đề, QR riêng tư, PDF/ZIP, anchor, bubble, xoay/phối cảnh, rà soát và lịch sử.")).catch((error) => { console.error(error); process.exitCode = 1; });

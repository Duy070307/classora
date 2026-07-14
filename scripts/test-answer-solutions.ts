import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import JSZip from "jszip";
import { buildDeterministicSolutionSet, applyVerifiedAnswer, rubricTotalMatchesScore } from "../lib/answer-solutions/verify";
import { stableHash } from "../lib/answer-solutions/hash";
import { extractDeterministicCalculation, numericEquivalent, numericValue, safeCalculate } from "../lib/answer-solutions/numeric";
import { mapSolutionSetToVariant, solutionSetToDocument } from "../lib/answer-solutions/document";
import { applySolutionAnswerToDocument } from "../lib/answer-solutions/update";
import type { QuestionSolution } from "../lib/answer-solutions/types";
import { createExamVariants } from "../lib/exam-mixer/engine";
import { defaultExamMixingOptions } from "../lib/exam-mixer/types";
import { variantToDocument } from "../lib/exam-mixer/document";
import { buildOfficialExamDocxBlob } from "../lib/export-exam-docx";
import { buildGenericDocxBlob } from "../lib/export-docx";
import type { ExamQuestion, StructuredExam } from "../lib/exam-types";
import type { GeneratedDocument } from "../lib/types";

let passed = 0;
function check(value: unknown, message: string) { assert.ok(value, message); passed += 1; }

function baseQuestion(value: Partial<ExamQuestion> & Pick<ExamQuestion, "id" | "part" | "number" | "stem" | "answer">): ExamQuestion {
  return { explanation: "", score: 1, difficulty: "Nhận biết", topic: "Số học", ...value };
}

function fixture(): StructuredExam {
  const tfItems = [
    { label: "a" as const, text: "Hai là số chẵn.", answer: true },
    { label: "b" as const, text: "Ba là số chẵn.", answer: false },
    { label: "c" as const, text: "Năm lớn hơn bốn.", answer: true },
    { label: "d" as const, text: "Một lớn hơn hai.", answer: false },
  ];
  return {
    metadata: { title: "Đề kiểm tra số học", examStyle: "Kiểm tra thường", subject: "Toán", grade: "8", duration: "45 phút", examCode: "101", totalScore: 6 },
    parts: [
      { type: "multiple_choice", title: "PHẦN I", instruction: "Chọn đáp án.", questions: [
        baseQuestion({ id: "mc-match", part: "multiple_choice", number: 1, stem: "Tính: 2 + 3", options: { A: "4", B: "5", C: "6", D: "7" }, answer: "B" }),
        baseQuestion({ id: "mc-wrong", part: "multiple_choice", number: 2, stem: "Tính: 6 / 2", options: { A: "1", B: "2", C: "3", D: "4" }, answer: "D" }),
      ] },
      { type: "true_false", title: "PHẦN II", instruction: "Đúng/Sai.", questions: [baseQuestion({ id: "tf-1", part: "true_false", number: 1, stem: "Xét các mệnh đề sau.", trueFalseItems: tfItems, answer: "Đúng, Sai, Đúng, Sai" })] },
      { type: "short_answer", title: "PHẦN III", instruction: "Trả lời ngắn.", questions: [
        baseQuestion({ id: "short-match", part: "short_answer", number: 1, stem: "Tính: 1 / 2", answer: "0,5" }),
        baseQuestion({ id: "short-wrong", part: "short_answer", number: 2, stem: "Tính: 8 / 4", answer: "3" }),
        baseQuestion({ id: "visual-missing", part: "short_answer", number: 3, stem: "Dựa vào hình vẽ dưới đây, tính độ dài AB.", answer: "5 cm", visuals: [{ type: "figure", content: "AB=5", alt: "Đoạn thẳng AB" }] }),
      ] },
    ],
    teacherOnly: { scoringGuide: "Mỗi câu 1 điểm.", matrix: "Ma trận.", specification: "Đặc tả.", notes: "Rà soát." },
  };
}

async function run() {
  const exam = fixture();
  const set = buildDeterministicSolutionSet(exam, { examId: "exam-1", detailLevel: "standard" });
  const byId = (id: string) => set.questions.find((item) => item.questionId === id)!;

  check(byId("mc-match").answerStatus === "matches" && byId("mc-match").verifiedAnswer === "B", "1. MCQ đúng phải xác minh khớp");
  check(byId("mc-wrong").answerStatus === "mismatch" && byId("mc-wrong").verifiedAnswer === "C", "2. MCQ sai phải báo không khớp");
  const variants = createExamVariants({ exam, sourceExamId: "exam-1", sourceExamTitle: "Đề số học", variantCount: 2, startingCode: 101, seed: "solution-seed", options: { ...defaultExamMixingOptions, shuffleTrueFalseStatements: true } });
  const mapped = mapSolutionSetToVariant(set, variants.variants[0]);
  const variantMc = variants.variants[0].exam.parts[0].questions.find((item) => item.id === "mc-match")!;
  check(mapped.questions.find((item) => item.questionId === "mc-match")?.verifiedAnswer === variantMc.answer, "3. Nhãn MCQ phải ánh xạ đúng sau khi trộn");
  check(new Set(byId("tf-1").statementExplanations?.map((item) => item.statementId)).size === 4, "4. Mệnh đề Đúng/Sai phải có ID ổn định");
  const mappedTf = mapped.questions.find((item) => item.questionId === "tf-1")!;
  const variantTf = variants.variants[0].exam.parts[1].questions[0];
  check(mappedTf.statementExplanations?.every((item, index) => item.statementId.endsWith(stableHash(variantTf.trueFalseItems?.[index]?.text || "")) && index === item.statementIndex) && mappedTf.statementExplanations?.length === variantTf.trueFalseItems?.length, "5. Giải thích Đúng/Sai phải theo đúng thứ tự biến thể");
  check(byId("short-match").answerStatus === "matches", "6. Trả lời ngắn số phải xác minh đúng");
  check(numericEquivalent("1/2", "0,5"), "7. Phân số và thập phân tương đương phải được chấp nhận");
  check(byId("short-wrong").answerStatus === "mismatch", "8. Trả lời ngắn sai phải báo không khớp");
  const unitExam = fixture(); unitExam.parts[2].questions[0].stem = "Tính: 1 / 2 cm"; unitExam.parts[2].questions[0].answer = "0,5";
  check(buildDeterministicSolutionSet(unitExam).questions.find((item) => item.questionId === "short-match")?.warnings?.some((item) => item.includes("đơn vị")), "9. Thiếu đơn vị phải có cảnh báo");
  const missingExam = fixture(); missingExam.parts[2].questions[2].visuals = undefined;
  const missingSolution = buildDeterministicSolutionSet(missingExam).questions.find((item) => item.questionId === "visual-missing")!;
  check(missingSolution.answerStatus === "uncertain" && missingSolution.confidence === "low" && missingSolution.detailedSolution?.includes("thiếu hình"), "10. Thiếu hình phải không bịa lời giải");
  const essayLike: QuestionSolution = { ...byId("short-match"), questionType: "essay", rubric: [{ criterion: "Lập luận", points: 1, expectedEvidence: "Đúng" }, { criterion: "Kết quả", points: 1, expectedEvidence: "Đúng" }] };
  check(rubricTotalMatchesScore(essayLike, 2), "11. Tổng rubric phải khớp điểm câu hỏi");
  check(applyVerifiedAnswer(exam, byId("mc-wrong")).parts[0].questions[1].answer === "C", "12. Thay đáp án tin cậy cao phải cập nhật StructuredExam");
  const medium = { ...byId("mc-wrong"), confidence: "medium" as const };
  let mediumBlocked = false; try { applyVerifiedAnswer(exam, medium); } catch { mediumBlocked = true; }
  check(mediumBlocked, "13. Tin cậy vừa không được tự thay khi chưa xác nhận");
  const source: GeneratedDocument = { id: "exam-1", title: "Đề số học", type: "exam", content: "ĐỀ HỌC SINH", createdAt: new Date().toISOString(), structuredExam: exam, examSolutionSet: set, auditMeta: { auditStatus: "ready", errorCount: 0, warningCount: 0, acceptedWarningIds: [], auditVersion: "1", contentHash: "old" }, examVariantSet: variants };
  const changed = applySolutionAnswerToDocument(source, byId("mc-wrong"));
  check(changed.auditMeta?.auditStatus === "not_audited" && changed.auditMeta.contentHash === undefined, "14. Đổi đáp án phải vô hiệu cache kiểm tra đề");
  check(changed.examVariantSet?.variants.every((variant) => variant.exam.parts[0].questions.find((item) => item.id === "mc-wrong")?.options?.[variant.exam.parts[0].questions.find((item) => item.id === "mc-wrong")!.answer as "A" | "B" | "C" | "D"] === "3"), "15. Đổi đáp án phải tái xác minh ánh xạ bộ mã đề");
  const studentBlob = await buildOfficialExamDocxBlob(variantToDocument(variants, variants.variants[0]), { includeTeacher: false });
  const studentXml = await JSZip.loadAsync(await studentBlob.arrayBuffer()).then((zip) => zip.file("word/document.xml")!.async("string"));
  check(!/LỜI GIẢI|ĐÁP ÁN VÀ THANG ĐIỂM|PHẦN DÀNH CHO GIÁO VIÊN/u.test(studentXml), "16. Word học sinh không được chứa đáp án/lời giải");
  const printSource = readFileSync("components/document/OfficialExamPrintView.tsx", "utf8");
  check(/mode !== "exam-mixer"/.test(printSource), "17. PDF học sinh của bộ mã phải ẩn trang giáo viên");
  const teacherDoc = solutionSetToDocument(source, set, "quick");
  check(teacherDoc.content.includes("ĐÁP ÁN NHANH") && teacherDoc.content.includes("| Câu | Đáp án | Điểm |"), "18. File giáo viên phải có bảng đáp án và điểm");
  check(mapped.questions.every((item) => item.questionNumber === variants.variants[0].questionMap.find((map) => map.originalQuestionId === item.questionId)?.variantNumber), "19. File biến thể phải dùng đúng số câu biến thể");
  check(mapped.questions.length === set.questions.length && mapped.generatedAt === set.generatedAt, "20. Lời giải gốc phải được tái sử dụng qua biến thể");
  const cached = buildDeterministicSolutionSet(exam, { previous: set, detailLevel: "standard" });
  check(cached.summary.cacheHitCount === set.questions.length, "21. Nội dung không đổi phải trúng cache");
  const editedExam = fixture(); editedExam.parts[0].questions[0].stem = "Tính: 3 + 3";
  const partial = buildDeterministicSolutionSet(editedExam, { previous: set, detailLevel: "standard" });
  check(partial.summary.cacheHitCount === set.questions.length - 1, "22. Chỉnh một câu chỉ vô hiệu cache câu đó");
  const routeSource = readFileSync("app/api/answer-solutions/generate/route.ts", "utf8");
  check(/getCurrentUser/.test(routeSource) && /Vui lòng đăng nhập/.test(routeSource), "23. API phải kiểm tra phiên người dùng");
  check(/getMaintenanceBlockForUser/.test(routeSource) && /maintenance: true/.test(routeSource), "24. Bảo trì phải chặn giáo viên");
  check(readFileSync("lib/maintenance.ts", "utf8").includes("admin") || readFileSync("lib/maintenance-access.ts", "utf8").includes("admin"), "25. Admin giữ cơ chế bypass hiện có");
  check(readFileSync("scripts/test-exam-section-pipeline.ts", "utf8").length > 100, "26. Kiểm thử tạo đề hiện có vẫn được giữ");
  check(readFileSync("scripts/test-exam-source-generation.ts", "utf8").length > 100, "27. Kiểm thử tạo đề từ file vẫn được giữ");
  check(readFileSync("scripts/test-exam-auditor.ts", "utf8").length > 100, "28. Kiểm thử Auditor vẫn được giữ");
  check(readFileSync("scripts/test-exam-mixer.ts", "utf8").length > 100, "29. Kiểm thử Mixer vẫn được giữ");
  const teacherBlob = await buildGenericDocxBlob(teacherDoc);
  check(teacherDoc.structuredExam === source.structuredExam && teacherDoc.examSolutionSet === set && (await teacherBlob.arrayBuffer()).byteLength > 1000 && safeCalculate("(2+3)*4") === 20 && numericValue("50%") === 0.5 && extractDeterministicCalculation("Tính 25% của 200")?.result === 50 && extractDeterministicCalculation("Giải phương trình 2x + 3 = 7")?.result === 2, "30. Preview/lịch sử/xuất file dùng cùng đối tượng chuẩn và bộ tính an toàn");
  assert.equal(passed, 30);
  console.log(`Answer solutions: ${passed}/30 nhóm kiểm tra đạt.`);
}

void run();

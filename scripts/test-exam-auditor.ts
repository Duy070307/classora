import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ExamPartType, ExamQuestion, StructuredExam } from "../lib/exam-types";
import { auditStructuredExam, isValidNumericShortAnswer } from "../lib/exam-audit/audit";
import { applySafeFixes, verifySafeFixMeaning } from "../lib/exam-audit/fixes";
import { documentWithExam } from "../lib/exam-audit/normalize";
import type { GeneratedDocument } from "../lib/types";

function question(part: ExamPartType, number: number, answer: string): ExamQuestion {
  const stems = {
    multiple_choice: `Câu hỏi trắc nghiệm độc lập số ${number} về đại lượng M${number}?`,
    true_false: `Xét bốn nhận định độc lập của tình huống T${number}.`,
    short_answer: `Tính ${100 + number} + ${number}.`,
  };
  const patterns = [[true, true, false, false], [false, true, true, false], [true, false, false, true], [false, false, true, true]];
  return {
    id: `${part}-${number}`,
    part,
    number,
    stem: stems[part],
    options: part === "multiple_choice" ? { A: `${number} đơn vị`, B: `${number + 20} đơn vị`, C: `${number + 40} đơn vị`, D: `${number + 60} đơn vị` } : undefined,
    trueFalseItems: part === "true_false" ? patterns[number - 1].map((value, index) => ({ label: (["a", "b", "c", "d"] as const)[index], text: `Nhận định ${index + 1} của tình huống ${number} có dữ kiện riêng.`, answer: value })) : undefined,
    answer,
    explanation: part === "short_answer" ? `${100 + number} + ${number} = ${100 + 2 * number}.` : "Đối chiếu dữ kiện và chọn đáp án phù hợp.",
    score: 0,
    difficulty: number % 4 === 1 ? "Nhận biết" : number % 4 === 2 ? "Thông hiểu" : number % 4 === 3 ? "Vận dụng" : "Vận dụng cao",
    topic: `Chủ đề ${part}`,
  };
}

function validExam(): StructuredExam {
  const mcqAnswers = ["A", "B", "C", "D", "A", "B", "C", "D", "A", "B", "C", "D"];
  const parts: StructuredExam["parts"] = [
    { type: "multiple_choice", title: "PHẦN I", instruction: "Chọn một phương án.", questions: mcqAnswers.map((answer, index) => question("multiple_choice", index + 1, answer)) },
    { type: "true_false", title: "PHẦN II", instruction: "Chọn đúng hoặc sai.", questions: [1, 2, 3, 4].map((number) => { const item = question("true_false", number, ""); item.answer = item.trueFalseItems!.map((statement) => `${statement.label} ${statement.answer ? "Đúng" : "Sai"}`).join("; "); return item; }) },
    { type: "short_answer", title: "PHẦN III", instruction: "Ghi đáp án số.", questions: [1, 2, 3, 4, 5, 6].map((number) => question("short_answer", number, String(100 + 2 * number))) },
  ];
  const questions = parts.flatMap((part) => part.questions);
  let assigned = 0;
  questions.forEach((item, index) => { item.score = index === questions.length - 1 ? Number((10 - assigned).toFixed(2)) : 0.45; assigned += item.score; });
  return { metadata: { title: "Đề chuẩn", examStyle: "THPTQG / tốt nghiệp", subject: "Toán", grade: "12", duration: "90 phút", examCode: "0101", totalScore: 10, requestedSectionCounts: { partI: 12, partII: 4, partIII: 6 } }, parts, teacherOnly: { scoringGuide: "Có", matrix: "Có", specification: "Có", notes: "" } };
}

const config = { expectedSectionCounts: { partI: 12, partII: 4, partIII: 6 }, totalScore: 10, numericShortAnswers: true };
const structuralCodes = new Set(["section_count_mismatch", "question_count_mismatch", "duplicate_section", "invalid_question_number", "question_number_gap"]);

const valid = validExam();
const validResult = auditStructuredExam(valid, config);
assert.equal(validResult.issues.filter((issue) => structuralCodes.has(issue.code)).length, 0, "1. Đề 12/4/6 hợp lệ không được có lỗi cấu trúc");

const missing = validExam();
missing.parts[0].questions.pop();
assert.ok(auditStructuredExam(missing, config).issues.some((issue) => issue.code === "question_count_mismatch" && issue.section === "PHẦN I"), "2. Phải báo thiếu câu PHẦN I");

const duplicateOption = validExam();
duplicateOption.parts[0].questions[0].options!.B = duplicateOption.parts[0].questions[0].options!.A;
assert.ok(auditStructuredExam(duplicateOption, config).issues.some((issue) => issue.code === "duplicate_options"), "3. Phải phát hiện phương án trùng");

const unbalanced = validExam();
unbalanced.parts[0].questions.forEach((item) => { item.answer = "A"; });
const unbalancedResult = auditStructuredExam(unbalanced, config);
assert.ok(unbalancedResult.issues.some((issue) => issue.code === "unbalanced_mcq_answers"), "4. Phải cảnh báo phân bố đáp án lệch");
const distributionIssue = unbalancedResult.issues.find((issue) => issue.code === "unbalanced_mcq_answers")!;
const reordered = applySafeFixes(unbalanced, unbalancedResult.issues, [distributionIssue.id], config);
reordered.parts[0].questions.forEach((item, index) => assert.equal(item.options?.[item.answer as "A" | "B" | "C" | "D"], `${index + 1} đơn vị`, "5. Đổi vị trí phải cập nhật khóa đúng"));

const tfPattern = validExam();
tfPattern.parts[1].questions[0].trueFalseItems = [true, false, true, false].map((answer, index) => ({ label: (["a", "b", "c", "d"] as const)[index], text: `Mệnh đề ${index + 1} khác nhau.`, answer }));
tfPattern.parts[1].questions[0].answer = "a Đúng; b Sai; c Đúng; d Sai";
assert.ok(auditStructuredExam(tfPattern, config).issues.some((issue) => issue.code === "robotic_true_false_pattern"), "6. Phải cảnh báo mẫu đúng/sai máy móc");

assert.equal(isValidNumericShortAnswer("(1; +∞)"), false, "7. Khoảng không phải đáp án số");
assert.equal(isValidNumericShortAnswer("7/4"), true, "8. Phân số là đáp án số hợp lệ");

const missingVisual = validExam();
missingVisual.parts[0].questions[0].stem = "Dựa vào đồ thị dưới đây, chọn kết luận đúng.";
assert.ok(auditStructuredExam(missingVisual, config).issues.some((issue) => issue.code === "missing_visual"), "9. Phải báo tham chiếu hình bị thiếu");
const formulaGraph = validExam();
formulaGraph.parts[0].questions[0].stem = "Cho hàm số y = x^2 - 2x + 1. Chọn kết luận đúng.";
assert.equal(auditStructuredExam(formulaGraph, config).issues.some((issue) => issue.code === "missing_visual"), false, "10. Hàm số định nghĩa bằng công thức không cần hình");

const duplicate = validExam();
duplicate.parts[0].questions[1].stem = duplicate.parts[0].questions[0].stem;
assert.ok(auditStructuredExam(duplicate, config).issues.some((issue) => issue.code === "duplicate_question"), "11. Phải phát hiện câu trùng");

const badScore = validExam();
badScore.parts[2].questions[5].score += 1;
assert.ok(auditStructuredExam(badScore, config).issues.some((issue) => issue.code === "total_score_mismatch"), "12. Phải phát hiện tổng điểm lệch");

const before = validExam();
const beforeResult = auditStructuredExam(before, config);
const after = applySafeFixes(before, beforeResult.issues, beforeResult.issues.filter((issue) => issue.canAutoFix).map((issue) => issue.id), config);
assert.equal(verifySafeFixMeaning(before, after), true, "13. Safe fix không được đổi nghĩa stem");

const documentStore = readFileSync(resolve("lib/data/documents-store.ts"), "utf8");
assert.match(documentStore, /getCloudClientForUser\(\)/, "14. Lịch sử phải dùng client gắn với người dùng");
assert.match(documentStore, /\.eq\("id", id\)/, "14. Truy vấn đề phải giới hạn theo id dưới RLS");

const middleware = readFileSync(resolve("middleware.ts"), "utf8");
assert.match(middleware, /getMaintenanceSettings\(\)/, "15. Middleware phải dùng trạng thái bảo trì chuẩn");
assert.match(middleware, /decision === "redirect"/, "15. Bảo trì phải chặn trang giáo viên");
assert.match(middleware, /isMaintenanceBypassed\(identity\)/, "16. Admin phải được bypass bảo trì");

const baseDocument: GeneratedDocument = { id: "exam-test", title: "Đề chuẩn", type: "exam", content: "cũ", createdAt: new Date(0).toISOString(), structuredExam: validExam() };
const canonical = documentWithExam(baseDocument, validExam());
assert.equal(canonical.structuredExam, canonical.structuredExam, "17. Preview/history/export dùng cùng tham chiếu structuredExam trên document cuối");
assert.match(readFileSync(resolve("components/OutputPreview.tsx"), "utf8"), /document\.structuredExam/, "17. Preview phải đọc structuredExam");
assert.match(readFileSync(resolve("lib/export-exam-docx.ts"), "utf8"), /document\.structuredExam/, "17. Word phải đọc structuredExam");
assert.match(readFileSync(resolve("lib/print-document.ts"), "utf8"), /document/, "17. PDF/print phải nhận document cuối");

console.log("Exam auditor: 17/17 trường hợp đạt.");

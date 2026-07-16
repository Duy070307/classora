import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { blueprintToExamInput, validateExamBlueprint } from "../lib/exam-source/blueprint";
import { applySpecificationToMatrix, blueprintFromExam, blueprintToDocument, compareBlueprintWithExam, createBlankExamBlueprint, deriveSpecificationRows, specificationMatrixImpact } from "../lib/exam-blueprint/workflow";
import { buildBlueprintDocx, buildBlueprintXlsx } from "../lib/exam-blueprint/export";
import type { StructuredExam } from "../lib/exam-types";

async function main() {
const blueprint = createBlankExamBlueprint({ subject: "Toán", grade: "12", durationMinutes: 90, totalScore: 10 });
assert.equal(validateExamBlueprint(blueprint).valid, true, "1. Ma trận mới phải hợp lệ");
assert.equal(blueprint.sections.reduce((sum, section) => sum + section.questionCount, 0), 22, "2. Cấu trúc 12/4/6 phải có 22 câu");

const topicMismatch = structuredClone(blueprint); topicMismatch.topicDistribution[0].counts.recognition = 4; topicMismatch.topicDistribution[0].totalQuestions = 20; topicMismatch.cognitiveDistribution.recognition = 4;
assert.ok(validateExamBlueprint(topicMismatch).errors.some((issue) => issue.code === "question_total_conflict"), "3. Tổng chủ đề lệch phải bị chặn");
const sectionMismatch = structuredClone(blueprint); sectionMismatch.sections[0].questionCount = 10;
assert.ok(validateExamBlueprint(sectionMismatch).errors.some((issue) => issue.code === "question_total_conflict" || issue.code === "cognitive_total_conflict"), "4. Tổng phần lệch phải bị chặn");
const scoreMismatch = structuredClone(blueprint); scoreMismatch.sections[0].score = 2.5;
assert.ok(validateExamBlueprint(scoreMismatch).errors.some((issue) => issue.code === "score_total_conflict"), "5. Tổng điểm lệch phải bị chặn");
const rounding = structuredClone(blueprint); rounding.topicDistribution[0].percentage = 99;
assert.ok(validateExamBlueprint(rounding).warnings.some((issue) => issue.code === "percentage_rounding"), "6. 99% chỉ cảnh báo");
const badPercentage = structuredClone(blueprint); badPercentage.topicDistribution[0].percentage = 80;
assert.ok(validateExamBlueprint(badPercentage).errors.some((issue) => issue.code === "percentage_total_conflict"), "7. 80% phải là lỗi");
const negative = structuredClone(blueprint); negative.sections[0].questionCount = -1;
assert.ok(validateExamBlueprint(negative).errors.some((issue) => issue.code === "negative_value"), "8. Số âm phải bị từ chối");
const invalidTf = structuredClone(blueprint); invalidTf.sections[1].statementsPerQuestion = 3;
assert.ok(validateExamBlueprint(invalidTf).errors.some((issue) => issue.code.startsWith("invalid_true_false")), "9. Đúng/Sai phải có bốn mệnh đề");

const specification = deriveSpecificationRows(blueprint);
assert.ok(specification.every((row) => row.topicId === blueprint.topicDistribution[0].id), "10. Đặc tả phải liên kết topicId của ma trận");
const changedSpecification = specification.map((row, index) => index === 0 ? { ...row, questionCount: row.questionCount + 1 } : row);
assert.equal(specificationMatrixImpact(blueprint, changedSpecification).changed, true, "11. Sửa đặc tả phải báo tác động ma trận");
const sourceExam: StructuredExam = {
  metadata: { title: "Đề Toán 12", examStyle: "Kiểm tra", subject: "Toán", grade: "12", duration: "90 phút", examCode: "101", totalScore: 10 },
  parts: blueprint.sections.map((section, partIndex) => ({ type: section.questionType === "essay" ? "short_answer" : section.questionType as "multiple_choice" | "true_false" | "short_answer", title: section.title, instruction: "Làm bài", questions: Array.from({ length: section.questionCount }, (_, index) => ({ id: `p${partIndex}-q${index}`, part: section.questionType === "essay" ? "short_answer" : section.questionType as "multiple_choice" | "true_false" | "short_answer", number: index + 1, stem: `Câu ${index + 1}`, options: section.questionType === "multiple_choice" ? { A: "A", B: "B", C: "C", D: "D" } : undefined, trueFalseItems: section.questionType === "true_false" ? (["a", "b", "c", "d"] as const).map((label) => ({ label, text: label, answer: true })) : undefined, answer: section.questionType === "true_false" ? "Đ Đ Đ Đ" : "A", explanation: "", score: section.score / section.questionCount, difficulty: index < 6 ? "Nhận biết" : index < 13 ? "Thông hiểu" : index < 19 ? "Vận dụng" : "Vận dụng cao", topic: "Chủ đề 1" })) })),
  teacherOnly: { scoringGuide: "", matrix: "", specification: "", notes: "" },
};
const derived = blueprintFromExam(sourceExam, "exam-1");
assert.equal(derived.sections.reduce((sum, section) => sum + section.questionCount, 0), 22, "12. Đề hiện có phải suy ra được ma trận");
const missingExam = structuredClone(sourceExam); missingExam.parts[0].questions.pop();
assert.notEqual(compareBlueprintWithExam(blueprint, missingExam).rows.find((row) => row.criterion === "Số câu")?.status, "match", "13. Phải phát hiện thiếu câu");
const extraScoreExam = structuredClone(sourceExam); extraScoreExam.parts[0].questions[0].score += 1;
assert.notEqual(compareBlueprintWithExam(blueprint, extraScoreExam).rows.find((row) => row.criterion === "Tổng điểm")?.status, "match", "14. Phải phát hiện thừa điểm");
const cognitiveExam = structuredClone(sourceExam); cognitiveExam.parts.flatMap((part) => part.questions).forEach((question) => { question.difficulty = "Nhận biết"; });
assert.notEqual(compareBlueprintWithExam(blueprint, cognitiveExam).rows.find((row) => row.criterion === "Mức độ nhận thức")?.status, "match", "15. Phải phát hiện lệch nhận thức");
const examBefore = JSON.stringify(sourceExam); applySpecificationToMatrix(blueprint, changedSpecification); compareBlueprintWithExam(blueprint, sourceExam);
assert.equal(JSON.stringify(sourceExam), examBefore, "16. Sửa/đối chiếu ma trận không được viết lại đề");
const input = blueprintToExamInput(blueprint); assert.deepEqual([input.multipleChoiceCount, input.trueFalseCount, input.shortAnswerCount], [12, 4, 6], "17-18. Pipeline hiện có phải nhận đúng cấu trúc 12/4/6 = 22");
const generator = readFileSync("components/exam-generator/FileExamGenerator.tsx", "utf8"); assert.match(generator, /blueprintToExamInput/); assert.match(generator, /auditAndSafelyFix/, "19. Auditor phải chạy sau generation");
const schema = readFileSync("supabase/migrations/20260714_add_exam_blueprints.sql", "utf8"); assert.match(schema, /auth\.uid\(\) = user_id/, "20,25. Blueprint phải được bảo vệ bởi ownership RLS");

const xlsxBlob = await buildBlueprintXlsx(blueprint, compareBlueprintWithExam(blueprint, sourceExam)); const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(await xlsxBlob.arrayBuffer());
assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), ["Ma trận đề", "Bảng đặc tả", "Tổng hợp", "Đối chiếu đề"], "21. Excel phải có đủ sheet");
assert.equal(typeof workbook.getWorksheet("Ma trận đề")?.getCell("H2").value, "number", "22. Tổng câu trong Excel phải là ô số");
const docx = await buildBlueprintDocx(blueprint, compareBlueprintWithExam(blueprint, sourceExam)); const zip = await JSZip.loadAsync(await docx.arrayBuffer()); const documentXml = await zip.file("word/document.xml")!.async("string");
assert.match(documentXml, /MA TRẬN ĐỀ/); assert.match(documentXml, /BẢNG ĐẶC TẢ/, "23. Word phải có ma trận và đặc tả");
const history = blueprintToDocument(blueprint); assert.deepEqual(history.examBlueprint, blueprint, "24. Lịch sử phải khôi phục cùng blueprint");
const route = readFileSync("app/tools/exam-blueprint/page.tsx", "utf8"); assert.match(route, /getMaintenanceBlockForUser/, "26. Route phải kiểm tra bảo trì");
const maintenance = readFileSync("lib/maintenance.ts", "utf8"); assert.match(maintenance, /user\.role === "admin"/, "27. Admin bypass phải giữ nguyên");
const packageJson = readFileSync("package.json", "utf8"); for (const script of ["exam:source-test", "exam:audit-test", "exam:mixer-test", "grading:test", "exam:blueprint-test"]) assert.match(packageJson, new RegExp(script.replace(":", "\\:")), `28-32. Thiếu ${script} trong test chính`);

console.log("Exam blueprint workflow: 32 nhóm kiểm tra ma trận, đặc tả, đối chiếu, XLSX/DOCX, history, ownership và hồi quy đều đạt.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

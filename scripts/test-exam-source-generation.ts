import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import JSZip from "jszip";
import { createExamBlueprint, validateExamBlueprint, blueprintToExamInput } from "../lib/exam-source/blueprint";
import { detectExamSourceType } from "../lib/exam-source/detect";
import { parseExamSourceBuffer } from "../lib/exam-source/file-parser";
import { compareQuestionSimilarity, filterPreviousExamDuplicates } from "../lib/exam-source/similarity";
import type { ExamBlueprint } from "../lib/exam-source/types";
import { validateVisualDependency } from "../lib/exam/exam-quality";

function xml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function worksheetXml(rows: string[][], merges: string[] = []) {
  const rowXml = rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((cell, columnIndex) => {
    let column = columnIndex + 1;
    let letters = "";
    while (column) { const remainder = (column - 1) % 26; letters = String.fromCharCode(65 + remainder) + letters; column = Math.floor((column - 1) / 26); }
    return `<c r="${letters}${rowIndex + 1}" t="inlineStr"><is><t>${xml(cell)}</t></is></c>`;
  }).join("")}</row>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowXml}</sheetData>${merges.length ? `<mergeCells count="${merges.length}">${merges.map((range) => `<mergeCell ref="${range}"/>`).join("")}</mergeCells>` : ""}</worksheet>`;
}

async function xlsxFixture(rows: string[][], merges: string[] = []) {
  const zip = new JSZip();
  zip.file("xl/workbook.xml", `<?xml version="1.0"?><workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Ma trận" sheetId="1" r:id="rId1"/></sheets></workbook>`);
  zip.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0"?><Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>`);
  zip.file("xl/worksheets/sheet1.xml", worksheetXml(rows, merges));
  return Buffer.from(await zip.generateAsync({ type: "uint8array" }));
}

async function docxFixture(rows: string[][]) {
  const zip = new JSZip();
  const table = `<w:tbl>${rows.map((row) => `<w:tr>${row.map((cell) => `<w:tc><w:p><w:r><w:t>${xml(cell)}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr>`).join("")}</w:tbl>`;
  zip.file("word/document.xml", `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>MA TRẬN ĐỀ KIỂM TRA MÔN TOÁN LỚP 12</w:t></w:r></w:p>${table}</w:body></w:document>`);
  return Buffer.from(await zip.generateAsync({ type: "uint8array" }));
}

async function main() {
const standardRows = [
  ["Môn: Toán", "Lớp: 12", "PHẦN I 12 câu", "PHẦN II 4 câu", "PHẦN III 6 câu"],
  ["Chủ đề", "Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao", "Số câu", "Số điểm", "Tỉ lệ %"],
  ["Hàm số", "3", "3", "2", "1", "9", "4", "40%"],
  ["Xác suất", "2", "3", "2", "1", "8", "3", "30%"],
  ["Nguyên hàm", "1", "2", "1", "1", "5", "3", "30%"],
];

const parsedXlsx = await parseExamSourceBuffer({ name: "ma-tran-12-4-6.xlsx", buffer: await xlsxFixture(standardRows), sourceType: "matrix" });
assert.equal(parsedXlsx.tables.length, 1, "1. XLSX chuẩn phải giữ bảng");
assert.equal(parsedXlsx.metadata?.selectedSheet, "Ma trận");
const blueprintXlsx = createExamBlueprint(parsedXlsx, "matrix");
assert.equal(blueprintXlsx.topicDistribution.length, 3);

const mergedRows = [
  ["Chủ đề", "Mức độ", "", "", "", "Số câu"],
  ["", "Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao", ""],
  ["Hàm số", "2", "2", "1", "1", "6"],
];
const parsedMerged = await parseExamSourceBuffer({ name: "merged.xlsx", buffer: await xlsxFixture(mergedRows, ["A1:A2", "B1:E1", "F1:F2"]), sourceType: "matrix" });
assert.equal(parsedMerged.tables[0].rows[1][0], "Chủ đề", "2. Ô gộp dọc phải được lan truyền");
assert.equal(createExamBlueprint(parsedMerged, "matrix").topicDistribution[0].topic, "Hàm số");

const csv = Buffer.from("Chủ đề;Nhận biết;Thông hiểu;Vận dụng;Số câu;Số điểm\nHàm số;2;2;1;5;5\nXác suất;1;2;2;5;5", "utf8");
const parsedCsv = await parseExamSourceBuffer({ name: "matrix.csv", buffer: csv, sourceType: "matrix" });
assert.equal(parsedCsv.tables[0].rows[1][0], "Hàm số", "3. CSV dấu chấm phẩy phải được đọc");

const parsedDocx = await parseExamSourceBuffer({ name: "matrix.docx", buffer: await docxFixture(standardRows.slice(1)), sourceType: "matrix" });
assert.equal(parsedDocx.tables[0].rows.length, 4, "4. Bảng DOCX phải được giữ theo hàng/cột");

const parsedPdf = await parseExamSourceBuffer({ name: "exam.pdf", buffer: readFileSync("node_modules/pdf-parse/test/data/01-valid.pdf") });
assert.ok(parsedPdf.text.length > 1000, "5. PDF text-layer phải có nội dung");
const imagePdf = await parseExamSourceBuffer({ name: "scan.pdf", buffer: readFileSync("node_modules/pdf-parse/test/data/05-versions-space.pdf") });
assert.match(imagePdf.warnings.join(" "), /bản quét hình ảnh/, "6. PDF ảnh phải cảnh báo trung thực");

assert.equal(detectExamSourceType("Chủ đề Nhận biết Thông hiểu Vận dụng Số câu Số điểm Tỉ lệ").sourceType, "matrix", "7. Nhận diện ma trận");
assert.equal(detectExamSourceType("Yêu cầu cần đạt Đơn vị kiến thức Mức độ đánh giá Dạng câu hỏi Năng lực Mô tả").sourceType, "specification", "8. Nhận diện đặc tả");
assert.equal(detectExamSourceType("PHẦN I Câu 1\nA. 1\nB. 2\nC. 3\nD. 4\nĐáp án\nThời gian làm bài").sourceType, "previous_exam", "9. Nhận diện đề cũ");
assert.equal(detectExamSourceType("Bài học Mục tiêu Kiến thức Khái niệm Ví dụ Bài tập Công thức").sourceType, "lesson_material", "10. Nhận diện tài liệu");
assert.equal(detectExamSourceType("Một đoạn ngắn không có cấu trúc rõ ràng").sourceType, "unknown", "11. Nguồn mơ hồ phải yêu cầu chọn");

const validBlueprint: ExamBlueprint = {
  sourceType: "matrix", subject: "Toán", grade: "12", totalScore: 10,
  sections: [
    { id: "i", title: "PHẦN I", questionType: "multiple_choice", questionCount: 12, score: 3 },
    { id: "ii", title: "PHẦN II", questionType: "true_false", questionCount: 4, score: 4, statementsPerQuestion: 4 },
    { id: "iii", title: "PHẦN III", questionType: "short_answer", questionCount: 6, score: 3 },
  ],
  topicDistribution: [{ topic: "Hàm số", counts: { recognition: 6, comprehension: 7, application: 6, advancedApplication: 3 }, totalQuestions: 22, totalScore: 10, percentage: 100 }],
  cognitiveDistribution: { recognition: 6, comprehension: 7, application: 6, advancedApplication: 3 }, confidence: { overall: 0.9, fields: {} }, warnings: [],
};
assert.equal(validateExamBlueprint(validBlueprint).valid, true, "12. Tổng blueprint hợp lệ");
const conflict = structuredClone(validBlueprint); conflict.topicDistribution[0].totalQuestions = 20;
assert.ok(validateExamBlueprint(conflict).errors.some((issue) => issue.code === "question_total_conflict"), "13. Xung đột số câu phải báo lỗi");
const rounding = structuredClone(validBlueprint); rounding.topicDistribution = [{ ...rounding.topicDistribution[0], percentage: 99 }];
assert.ok(validateExamBlueprint(rounding).warnings.some((issue) => issue.code === "percentage_rounding") && validateExamBlueprint(rounding).valid, "14. 99% chỉ cảnh báo");

const examInput = blueprintToExamInput(validBlueprint);
assert.deepEqual([examInput.multipleChoiceCount, examInput.trueFalseCount, examInput.shortAnswerCount], [12, 4, 6], "15. Blueprint sinh đúng từng phần");
assert.equal(examInput.multipleChoiceCount + examInput.trueFalseCount + examInput.shortAnswerCount, 22, "16. 12/4/6 phải là 22 câu");
assert.equal(compareQuestionSimilarity("Cho hàm số y=x^2. Tính đạo hàm.", "Cho hàm số y=x^2. Tính đạo hàm.").exact, true, "17. Phát hiện sao chép chính xác");
assert.equal(compareQuestionSimilarity("Cho hàm số y=x^3. Tính đạo hàm.", "Cho hàm số y=x^2. Tính đạo hàm.").numericVariant, true, "18. Phát hiện chỉ thay số");
assert.equal(filterPreviousExamDuplicates(["Cho hàm số y=x^3. Tính đạo hàm."], ["Cho hàm số y=x^2. Tính đạo hàm."], (value) => value).accepted.length, 0);
assert.equal(validateVisualDependency({ stem: "Quan sát hình bên dưới và chọn đáp án đúng." }).valid, false, "19. Thiếu hình phải bị loại");

const component = readFileSync("components/exam-generator/FileExamGenerator.tsx", "utf8");
assert.match(component, /auditAndSafelyFix/, "20. Kết quả phải tự vào Auditor");
assert.match(component, /structuredExamToText\(audited\.exam/);
assert.match(component, /next\.structuredExam = audited\.exam/, "21. Preview/history/export phải dùng cùng StructuredExam");
const questionStore = readFileSync("lib/data/question-bank-store.ts", "utf8");
const schema = readFileSync("supabase/schema.sql", "utf8");
assert.match(questionStore, /getCloudClientForUser/, "22. Question bank lấy user hiện tại");
assert.match(schema, /question_bank_select_system_own_or_admin[\s\S]*user_id = auth\.uid\(\)/, "22. RLS question bank");
const migration = readFileSync("supabase/migrations/20260714_add_exam_blueprints.sql", "utf8");
assert.match(migration, /auth\.uid\(\) = user_id/, "23. Blueprint ownership phải có RLS");
const route = readFileSync("app/api/exam-source/parse/route.ts", "utf8");
assert.match(route, /getMaintenanceBlockForUser/, "24. API parse phải chặn bảo trì");
assert.match(route, /maintenance:\s*true/, "24. API phải trả trạng thái bảo trì");
const maintenance = readFileSync("lib/maintenance.ts", "utf8");
assert.match(maintenance, /user\.role === "admin"/, "25. Admin bypass giữ nguyên");
const generator = readFileSync("app/tools/exam-generator/page.tsx", "utf8");
assert.match(generator, /creationMode === "file" \? <FileExamGenerator \/> : \(/, "26. Chế độ cấu hình cũ vẫn tồn tại");
assert.match(readFileSync("package.json", "utf8"), /exam:audit-test/, "27. Bộ test Auditor vẫn nằm trong test chính");

console.log("Exam source generation: 27 nhóm kiểm thử parser, blueprint, chống sao chép, auditor, ownership, maintenance và hồi quy đều đạt.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

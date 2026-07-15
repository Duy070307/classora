import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import JSZip from "jszip";
import { buildOfficialExamDocxBlob } from "../lib/export-exam-docx";
import { textToRecognitionBlocks } from "../lib/document-recognition/layout";
import { examQuestionsToBankItems, filterDuplicateBankItems, mergeRecognitionBlocks, normalizeRecognitionDocument, recognitionText, splitRecognitionBlock, validateRecognitionForFinalization } from "../lib/document-recognition/normalize";
import type { RecognitionBlock, RecognitionDocument, RecognitionPage } from "../lib/document-recognition/types";
import { classifyPdfPage, finalizationIssues, hasBrokenFormula, isBlankPixelSample, RECOGNITION_MAX_IMAGE_SIZE, validateRecognitionFile } from "../lib/document-recognition/validation";
import { maintenanceAccessDecision } from "../lib/maintenance-access";
import type { GeneratedDocument } from "../lib/types";

let passed = 0;
async function check(name: string, assertion: () => void | Promise<void>) {
  await assertion(); passed += 1; console.log(`✓ ${passed}. ${name}`);
}

function block(input: Partial<RecognitionBlock> & Pick<RecognitionBlock, "id" | "type" | "text" | "readingOrder">): RecognitionBlock {
  return { pageNumber: 1, boundingBox: { x: 0.05, y: input.readingOrder / 20, width: 0.9, height: 0.04 }, confidence: "high", warnings: [], reviewed: true, excluded: false, ...input };
}

function page(blocks: RecognitionBlock[], overrides: Partial<RecognitionPage> = {}): RecognitionPage {
  return { pageNumber: 1, type: "text_layer", textLength: blocks.reduce((sum, item) => sum + item.text.length, 0), imageCoverage: 0, recognitionRequired: false, warnings: [], blocks, rotation: 0, status: "recognized", ...overrides };
}

function documentOf(pages: RecognitionPage[]): RecognitionDocument {
  return { id: "fixture-doc", sourceType: pages.some((item) => item.recognitionRequired) ? "mixed_pdf" : "text_pdf", sourceFileName: "de-kiem-tra.pdf", pageCount: pages.length, pages, reviewStatus: "draft", documentHash: "hash", createdAt: "2026-07-15T00:00:00.000Z", updatedAt: "2026-07-15T00:00:00.000Z" };
}

const mcqText = `TRƯỜNG THPT SOẠN LAB
ĐỀ KIỂM TRA TOÁN 12
PHẦN I. Câu trắc nghiệm
Câu 1. Giá trị nhỏ nhất của (x-1)^2 là
A. -1
B. 0
C. 1
D. 2`;
const mcqBlocks = textToRecognitionBlocks(mcqText, 1);
const base = documentOf([page(mcqBlocks)]);

async function run() {
await check("PDF có lớp chữ dùng trích xuất quyết định", () => assert.equal(classifyPdfPage({ pageNumber: 1, extractedText: mcqText.repeat(2), imageObjectCount: 0, width: 595, height: 842, textObjectCount: 12 }).type, "text_layer"));
await check("Trang PDF quét được phát hiện", () => assert.equal(classifyPdfPage({ pageNumber: 1, extractedText: "", imageObjectCount: 1, imageCoverage: 0.95 }).type, "scanned_image"));
await check("PDF hỗn hợp phân loại độc lập", () => assert.deepEqual([classifyPdfPage({ pageNumber: 1, extractedText: mcqText.repeat(2), imageObjectCount: 0 }).type, classifyPdfPage({ pageNumber: 2, extractedText: "Câu 2", imageObjectCount: 2, imageCoverage: 0.7 }).type], ["text_layer", "scanned_image"]));
await check("Tiền xử lý ảnh có sửa hướng EXIF và xoay bốn góc", () => { const source = readFileSync("lib/document-recognition/client.ts", "utf8"); assert.match(source, /imageOrientation:\s*"from-image"/); assert.match(source, /0 \| 90 \| 180 \| 270/); });
await check("Trang trắng được phát hiện", () => assert.equal(isBlankPixelSample(new Uint8ClampedArray(400).fill(255)), true));
await check("Ảnh hỏng bị từ chối rõ ràng", () => assert.throws(() => validateRecognitionFile({ name: "de.png", type: "image/png", size: 100, bytes: new Uint8Array([1, 2, 3, 4]) }), /corrupt_file/));
await check("File quá dung lượng bị từ chối", () => assert.throws(() => validateRecognitionFile({ name: "de.jpg", type: "image/jpeg", size: RECOGNITION_MAX_IMAGE_SIZE + 1 }), /file_too_large/));
await check("Dấu tiếng Việt được giữ nguyên", () => assert.ok(recognitionText(base).includes("Giá trị nhỏ nhất")));
await check("Thứ tự đọc hai cột tôn trọng readingOrder", () => { const blocks = [block({ id: "right", type: "question", text: "Cột phải", readingOrder: 2, boundingBox: { x: .6, y: .1, width: .3, height: .1 } }), block({ id: "left", type: "question", text: "Cột trái", readingOrder: 1, boundingBox: { x: .1, y: .1, width: .3, height: .1 } })]; assert.match(recognitionText(documentOf([page(blocks)])), /^Cột trái\nCột phải$/); });
await check("Câu trắc nghiệm và A/B/C/D được nhóm", () => { const normalized = normalizeRecognitionDocument(base).exam; const question = normalized.parts.flatMap((part) => part.questions)[0]; assert.equal(Object.keys(question.options || {}).length, 4); });
await check("Mệnh đề Đúng/Sai được gắn với câu", () => { const blocks = textToRecognitionBlocks("PHẦN II\nCâu 1. Xét các phát biểu\na) Mệnh đề một\nb) Mệnh đề hai\nc) Mệnh đề ba\nd) Mệnh đề bốn", 1); assert.ok(blocks.filter((item) => item.type === "true_false_statement").every((item) => item.questionId)); });
await check("Câu trả lời ngắn được nhận dạng trong PHẦN III", () => { const exam = normalizeRecognitionDocument(documentOf([page(textToRecognitionBlocks("PHẦN III. TRẢ LỜI NGẮN\nCâu 1. Tính 2+2.", 1))])).exam; assert.equal(exam.parts[0]?.type, "short_answer"); });
await check("Quan hệ câu hỏi nhiều trang được giữ qua nội dung", () => { const p1 = page(textToRecognitionBlocks("PHẦN I\nCâu 1. Dữ kiện ở trang trước", 1)); const p2 = page(textToRecognitionBlocks("A. Một\nB. Hai\nC. Ba\nD. Bốn", 2), { pageNumber: 2 }); assert.match(recognitionText(documentOf([p1, p2])), /Dữ kiện[\s\S]*A\. Một/); });
await check("Vùng công thức ánh xạ sang khối LaTeX", () => { const formula = block({ id: "f", type: "formula", text: "phân số", latex: "\\frac{1}{2}", readingOrder: 1 }); assert.equal(recognitionText(documentOf([page([formula])])), "$\\frac{1}{2}$"); });
await check("Công thức hỏng được đánh dấu", () => assert.equal(hasBrokenFormula("\\frac{1}{2"), true));
await check("Bảng giữ cấu trúc hàng/cột có thể chỉnh sửa", () => { const table = block({ id: "t", type: "table", text: "Bảng", table: { rows: [["Nhóm", "A"], ["Số lượng", "12"]], mergedCellHints: ["Ô tiêu đề"] }, readingOrder: 1 }); assert.deepEqual(table.table?.rows[1], ["Số lượng", "12"]); });
await check("Hình được gắn đúng câu hỏi", () => { const blocks = [...mcqBlocks, block({ id: "figure", type: "geometric_figure", text: "Hình tam giác ABC", sourceCrop: "data:image/png;base64,AA==", questionId: mcqBlocks.find((item) => item.type === "question")?.id, readingOrder: 8 })]; const exam = normalizeRecognitionDocument(documentOf([page(blocks)])).exam; assert.equal(exam.parts[0].questions[0].visuals?.[0]?.type, "figure"); });
await check("Tham chiếu hình thiếu tài sản bị chặn", () => { const visual = block({ id: "v", type: "image", text: "Hình", readingOrder: 9 }); const issues = finalizationIssues(documentOf([page([...mcqBlocks, visual])])).join(" "); assert.match(issues, /dữ liệu ảnh/); });
await check("Khối tin cậy thấp buộc xác nhận", () => { const low = { ...mcqBlocks[0], confidence: "low" as const, reviewed: false }; assert.match(finalizationIssues(documentOf([page([low, ...mcqBlocks.slice(1)])])).join(" "), /tin cậy thấp/); });
await check("Giáo viên sửa/gộp/tách khối cập nhật StructuredExam draft", () => { const edited = structuredClone(base); const question = edited.pages[0].blocks.find((item) => item.type === "question")!; question.text = "Câu 1. Nội dung đã được giáo viên sửa"; const optionIds = edited.pages[0].blocks.filter((item) => item.type === "option").slice(0, 2).map((item) => item.id); const merged = mergeRecognitionBlocks(edited.pages[0].blocks, optionIds); const mergedBlock = merged.find((item) => item.id.endsWith("-merged")); assert.ok(mergedBlock); assert.ok(splitRecognitionBlock({ ...mergedBlock, text: "A. Một\nB. Hai" }).length === 2); assert.match(normalizeRecognitionDocument(edited).exam.parts[0].questions[0].stem, /giáo viên sửa/); });
await check("Số câu trùng bị chặn trước khi xác nhận", () => { const duplicate = documentOf([page(textToRecognitionBlocks("PHẦN I\nCâu 1. Câu thứ nhất\nA. A\nB. B\nC. C\nD. D\nCâu 1. Câu thứ hai\nA. A\nB. B\nC. C\nD. D", 1))]); assert.match(validateRecognitionForFinalization(duplicate).issues.join(" "), /số câu bị trùng/); });
await check("Bản nháp nhận dạng mở lại được", () => { const reopened = JSON.parse(JSON.stringify(base)) as RecognitionDocument; assert.equal(reopened.documentHash, base.documentHash); assert.equal(reopened.pages[0].blocks.length, base.pages[0].blocks.length); });
await check("Câu hợp lệ được chuyển vào Ngân hàng câu hỏi", () => { const exam = normalizeRecognitionDocument(base).exam; const items = examQuestionsToBankItems(exam, [exam.parts[0].questions[0].id]); assert.equal(items.length, 1); assert.equal(items[0].type, "Trắc nghiệm"); });
await check("Câu trùng ngân hàng bị loại và cảnh báo đếm được", () => { const item = { question: "Câu hỏi giống nhau" }; const result = filterDuplicateBankItems([item], [item]); assert.equal(result.accepted.length, 0); assert.equal(result.duplicates.length, 1); });
await check("Word học sinh không chứa metadata độ tin cậy", async () => { const exam = normalizeRecognitionDocument(base).exam; const doc: GeneratedDocument = { id: "word", title: "Đề kiểm tra", type: "exam", content: recognitionText(base), createdAt: new Date().toISOString(), structuredExam: exam }; const blob = await buildOfficialExamDocxBlob(doc); const zip = await JSZip.loadAsync(await blob.arrayBuffer()); const xml = await zip.file("word/document.xml")?.async("string") || ""; assert.doesNotMatch(xml, /recognitionConfidence|lowConfidence|boundingBox|readingOrder/); });
await check("Bản in/PDF không render nhãn nhận dạng nội bộ", () => { const source = readFileSync("components/document/OfficialExamPrintView.tsx", "utf8"); assert.doesNotMatch(source, /recognitionConfidence|boundingBox|readingOrder/); });
await check("API không tin user_id và draft dùng RLS của người hiện tại", () => { const route = readFileSync("app/api/document-recognition/page/route.ts", "utf8"); const store = readFileSync("lib/data/documents-store.ts", "utf8"); assert.match(route, /getCurrentUser/); assert.doesNotMatch(route, /form\.get\("user_id"\)/); assert.match(store, /getCloudClientForUser/); });
await check("Bảo trì chặn giáo viên và API trước nhận dạng", () => { assert.equal(maintenanceAccessDecision({ pathname: "/tools/document-recognition", enabled: true, authenticated: true, role: "teacher" }), "redirect"); const route = readFileSync("app/api/document-recognition/page/route.ts", "utf8"); assert.ok(route.indexOf("getMaintenanceBlockForUser") < route.indexOf("request.formData")); });
await check("Admin được bỏ qua bảo trì theo chính sách hiện tại", () => assert.equal(maintenanceAccessDecision({ pathname: "/tools/document-recognition", enabled: true, authenticated: true, role: "admin" }), "allow"));
await check("Tạo đề từ file cũ vẫn có parser riêng", () => { assert.ok(existsSync("app/api/exam-source/parse/route.ts")); assert.match(readFileSync("components/exam-generator/FileExamGenerator.tsx", "utf8"), /\/api\/exam-source\/parse/); });
await check("Exam Auditor vẫn được tích hợp", () => { const source = readFileSync("components/document-recognition/DocumentRecognitionWorkspace.tsx", "utf8"); assert.match(source, /auditStructuredExam/); assert.match(source, /EXAM_AUDIT_SESSION_INPUT/); });
await check("Exam Mixer vẫn được tích hợp", () => assert.match(readFileSync("components/document-recognition/DocumentRecognitionWorkspace.tsx", "utf8"), /openExamMixer/));
await check("Lời giải chi tiết vẫn được tích hợp", () => assert.match(readFileSync("components/document-recognition/DocumentRecognitionWorkspace.tsx", "utf8"), /openAnswerSolutions/));
await check("DOCX/PDF export vẫn đi qua pipeline hiện có", () => { const source = readFileSync("components/document-recognition/DocumentRecognitionWorkspace.tsx", "utf8"); assert.match(source, /DocumentExportMenu/); assert.match(readFileSync("components/tools/DocumentExportMenu.tsx", "utf8"), /exportDocx/); assert.match(readFileSync("components/tools/DocumentExportMenu.tsx", "utf8"), /printGeneratedDocument/); });

await check("Mười fixture cục bộ tồn tại và không rỗng", () => { const root = "tests/fixtures/document-recognition"; const names = ["01-clear-phone-photo.png", "02-rotated-page.png", "03-perspective-photo.png", "04-two-column-page.png", "05-formulas-page.png", "06-data-table-page.png", "07-geometric-figure-page.png", "08-text-layer.pdf", "09-image-only-scan.pdf", "10-mixed.pdf"]; assert.equal(names.filter((name) => existsSync(`${root}/${name}`) && statSync(`${root}/${name}`).size > 500).length, 10); });

assert.equal(passed, 35);
console.log(`Document recognition: ${passed} kiểm tra đạt; trong đó 34 yêu cầu hồi quy và 1 kiểm tra bộ fixture.`);
}

void run();

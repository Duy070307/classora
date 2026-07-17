import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { auditStructuredExam } from "@/lib/exam-audit/audit";
import { buildReviewPackDocx, buildReviewPackZip } from "@/lib/review-pack/export";
import { createReviewOutline, createReviewPackDraft, duplicatePromptKeys, generateReviewSection, normalizeReviewPack, reviewPackToDocument, reviewPackToText, reviewSourceFromDocument } from "@/lib/review-pack/workflow";
import type { ReviewPack, ReviewSourcePreview } from "@/lib/review-pack/types";
import type { GeneratedDocument } from "@/lib/types";

const root = process.cwd();
let passed = 0;
function test(name: string, run: () => void | Promise<void>) { return Promise.resolve().then(run).then(() => { passed += 1; console.log(`✓ ${name}`); }); }
function source(text: string): ReviewSourcePreview { return { title: "Nguồn đã xác nhận", sourceType: "document", text, objectives: [], keyKnowledge: text.split("\n"), confirmed: true, warnings: [] }; }
function complete(seed = createReviewPackDraft({ subject: "Toán", grade: "12", topic: "Hàm số" }), input?: ReviewSourcePreview) { let pack = normalizeReviewPack({ ...seed, outline: createReviewOutline(seed, input) }); for (const item of pack.outline) pack = generateReviewSection(pack, item.id, input); return pack; }

const base = createReviewPackDraft({ subject: "Toán", grade: "12", topic: "Hàm số" });
const pack = complete(base, source("Đạo hàm mô tả tốc độ biến thiên.\ny=f(x)\ny'=f'(x)\nVí dụ xét tính đơn điệu của hàm số."));

async function main() {
await test("1. Chủ đề thủ công tạo dàn ý hợp lệ", () => assert.ok(createReviewOutline(base).length >= 8));
await test("2. Giới hạn nguồn không đưa kiến thức ngoài nguồn", () => { const p = complete(createReviewPackDraft({ topic: "Định luật Ohm", settings: { ...base.settings, sourceOnly: true } }), source("U = I.R\nĐiện trở có đơn vị ôm.")); assert.equal(reviewPackToText(p, "student").includes("quang hợp"), false); });
await test("3. Giáo án chỉ ánh xạ hoạt động được chọn", () => { const document = { id: "lp", title: "Giáo án", type: "lesson-plan", content: "", createdAt: new Date().toISOString(), lessonPlan: { subject: "Vật lí", grade: "11", topic: "Dòng điện", objectives: [{ id: "o", category: "knowledge", content: "Hiểu định luật", evidence: "" }], keyKnowledge: ["U=IR"], periods: [{ id: "p", periodNumber: 1, durationMinutes: 45, activities: [{ id: "a1", order: 1, phase: "knowledge", title: "Ohm", durationMinutes: 20, objectiveIds: ["o"], content: "U=IR", steps: [], teacherActions: [], studentActions: [], workMode: "individual", generationStatus: "ready" }, { id: "a2", order: 2, phase: "practice", title: "Khác", durationMinutes: 20, objectiveIds: [], content: "Ngoài phạm vi", steps: [], teacherActions: [], studentActions: [], workMode: "individual", generationStatus: "ready" }], metadata: {} }], settings: {}, metadata: {} } } as unknown as GeneratedDocument; const preview = reviewSourceFromDocument(document, ["a1"]); assert.match(preview.text, /U=IR/); assert.doesNotMatch(preview.text, /Ngoài phạm vi/); });
await test("4. Slide loại ghi chú chỉ dành cho giáo viên", () => { const document = { id: "s", title: "Slide", type: "lesson-slides", content: "", createdAt: new Date().toISOString(), slideDeck: { subject: "Toán", grade: "8", topic: "Tam giác", slides: [{ hidden: false, blocks: [{ type: "text", content: "Định lý", teacherOnly: false }, { type: "text", content: "Đáp án bí mật", teacherOnly: true }] }] } } as unknown as GeneratedDocument; const preview = reviewSourceFromDocument(document); assert.match(preview.text, /Định lý/); assert.doesNotMatch(preview.text, /bí mật/); });
await test("5. Củng cố sau chấm chỉ dùng kết quả đã xác nhận", () => { const document = { id: "g", title: "Chấm", type: "grading-assistant", content: "", createdAt: new Date().toISOString(), gradingJob: { submissions: [{ gradingResult: { confirmedByTeacher: true, questionResults: [{ questionNumber: 1, status: "incorrect", explanation: "Sai dấu" }] } }, { gradingResult: { confirmedByTeacher: false, questionResults: [{ questionNumber: 2, status: "incorrect", explanation: "Không được dùng" }] } }] } } as unknown as GeneratedDocument; const preview = reviewSourceFromDocument(document); assert.match(preview.text, /Sai dấu/); assert.doesNotMatch(preview.text, /Không được dùng/); assert.equal(preview.confirmed, false); });
await test("6. Chuẩn hóa giữ ID phần kiến thức", () => { const id = pack.knowledgeSections[0].id; assert.equal(normalizeReviewPack(pack).knowledgeSections[0].id, id); });
await test("7. LaTeX công thức được giữ nguyên", () => { const formula = "\\frac{a}{b}=c"; const changed = { ...pack, formulaSections: [{ ...pack.formulaSections[0], latex: formula }] }; assert.match(reviewPackToText(changed, "formula"), /\\frac\{a\}\{b\}=c/); });
await test("8. Ví dụ mẫu có đáp án và các bước giải", () => assert.ok(pack.workedExamples.every((item) => item.finalAnswer && item.steps.length)));
await test("9. Bài luyện tập dùng WorksheetActivity canonical", () => assert.ok(pack.practiceActivities.every((item) => item.id && item.type && item.level && typeof item.prompt === "string")));
await test("10. Quyền sở hữu ngân hàng được thực thi", () => { const code = fs.readFileSync(path.join(root, "lib/data/question-bank-store.ts"), "utf8"); assert.match(code, /getCloudClientForUser|user_id/); });
await test("11. Phát hiện câu hỏi trùng", () => { const clone = { ...pack, practiceActivities: [...pack.practiceActivities, { ...pack.practiceActivities[0], id: "duplicate" }] }; assert.ok(duplicatePromptKeys(clone).length > 0); });
await test("12. Các mức phân hóa không phải cùng một câu đổi nhãn", () => assert.ok(new Set(pack.practiceActivities.map((item) => item.prompt)).size > 1));
await test("13. Bài kiểm tra nhanh dùng StructuredExam", () => assert.ok(pack.quickQuiz?.metadata && Array.isArray(pack.quickQuiz.parts)));
await test("14. Bài kiểm tra nhanh chạy Exam Auditor", () => { const result = auditStructuredExam(pack.quickQuiz!, { totalScore: 10 }); assert.equal(typeof result.summary.errorCount, "number"); });
await test("15. Tạo lại một phần giữ nguyên phần khác", () => { const first = pack.outline[0]; const other = pack.outline[1].id; const snapshot = JSON.stringify(pack.formulaSections); const next = generateReviewSection(pack, first.id, source("Nội dung mới"), true); assert.equal(next.outline[1].id, other); assert.equal(JSON.stringify(next.formulaSections), snapshot); });
await test("16. Không ghi đè chỉnh sửa giáo viên âm thầm", () => { const target = pack.knowledgeSections[0]; const edited: ReviewPack = { ...pack, knowledgeSections: pack.knowledgeSections.map((item) => item.id === target.id ? { ...item, summary: "Giáo viên đã sửa", teacherEdited: true } : item) }; const next = generateReviewSection(edited, target.id, source("Nội dung khác")); assert.equal(next.knowledgeSections.find((item) => item.id === target.id)?.summary, "Giáo viên đã sửa"); });
await test("17. Bản học sinh không chứa đáp án", () => assert.doesNotMatch(reviewPackToText(pack, "student"), /Đáp án:/));
await test("18. Bản học sinh/PDF không chứa ghi chú giáo viên", () => { const p = { ...pack, teacherNotes: ["GHI CHÚ BÍ MẬT"] }; assert.doesNotMatch(reviewPackToText(p, "student"), /GHI CHÚ BÍ MẬT/); });
await test("19. Bản giáo viên chứa lời giải", () => assert.match(reviewPackToText(pack, "teacher"), /Đáp án:|Giải thích:/));
await test("20. Mở lại lịch sử phục hồi cùng ReviewPack", () => { const document = reviewPackToDocument(pack); const restored = JSON.parse(JSON.stringify(document)) as GeneratedDocument; assert.deepEqual(restored.reviewPack?.outline.map((item) => item.id), pack.outline.map((item) => item.id)); });
await test("21. Giáo viên không đọc pack người khác ở tầng lưu trữ", () => { const code = fs.readFileSync(path.join(root, "lib/data/documents-store.ts"), "utf8"); assert.match(code, /getCloudClientForUser/); assert.doesNotMatch(code, /service_role/i); });
await test("22. Route công cụ chặn giáo viên khi bảo trì", () => { const code = fs.readFileSync(path.join(root, "app/tools/review-pack/page.tsx"), "utf8"); assert.match(code, /getMaintenanceBlockForUser/); assert.match(code, /redirect\("\/maintenance"\)/); });
await test("23. Chính sách bảo trì còn admin bypass", () => { const code = fs.readFileSync(path.join(root, "lib/maintenance.ts"), "utf8"); assert.match(code, /admin/i); });
await test("24. Bộ test Worksheet vẫn có trong pipeline", () => assert.match(fs.readFileSync(path.join(root, "package.json"), "utf8"), /worksheet:test/));
await test("25. Bộ test Question Bank vẫn có trong pipeline", () => assert.match(fs.readFileSync(path.join(root, "package.json"), "utf8"), /question-bank:test/));
await test("26. Bộ test Exam vẫn có trong pipeline", () => assert.match(fs.readFileSync(path.join(root, "package.json"), "utf8"), /exam:audit-test/));
await test("27. Bộ test Answer Solutions vẫn có trong pipeline", () => assert.match(fs.readFileSync(path.join(root, "package.json"), "utf8"), /answer:solutions-test/));
await test("28. Bộ test Lesson Plan/Slides vẫn có trong pipeline", () => { const code = fs.readFileSync(path.join(root, "package.json"), "utf8"); assert.match(code, /lesson:plan-test/); assert.match(code, /lesson:slides-test/); });
await test("29. DOCX và ZIP tạo được tệp có dữ liệu", async () => { const docx = await buildReviewPackDocx(pack, "student"); const zip = await buildReviewPackZip(pack); assert.ok(docx.size > 1000); assert.ok(zip.size > docx.size); });

console.log(`Review Pack: ${passed}/29 kiểm thử đạt.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

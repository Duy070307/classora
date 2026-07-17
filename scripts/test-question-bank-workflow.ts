import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
import { auditAndUpdate, detectDuplicates } from "../lib/question-bank-core/audit";
import { createQuestionCollection } from "../lib/question-bank-core/collections";
import { questionCollectionText } from "../lib/question-bank-core/export";
import { importRowsFromDelimited, importRowsFromTable, importRowsFromText } from "../lib/question-bank-core/import";
import { questionBankToExam } from "../lib/question-bank-core/integration";
import { createCanonicalQuestion, fromLegacyQuestion, toLegacyQuestion } from "../lib/question-bank-core/normalize";
import { buildSmartSet } from "../lib/question-bank-core/query";
import { addQuestionsToCollection, bulkPatchOwnedQuestions, canMutateQuestion, gradingRules, lessonPlanQuestionLink, markExplanationVerified, markQuestionUsed, questionToWorksheetActivity, selectBlueprintAllocation } from "../lib/question-bank-core/workflow";
import { parseExamSourceBuffer } from "../lib/exam-source/file-parser";
import { maintenanceAccessDecision } from "../lib/maintenance-access";
import type { QuestionBankItem } from "../lib/question-bank-core/types";
import type { QuestionItem } from "../lib/types";

let passed = 0;
async function check(name: string, run: () => void | Promise<void>) { await run(); passed += 1; console.log(`✓ ${name}`); }
function q(patch: Partial<QuestionBankItem> = {}) { return createCanonicalQuestion({ subject: "Toán", grade: "12", topic: "Hàm số", prompt: "Giá trị của hàm số tại x = 1 là bao nhiêu?", type: "multiple_choice", difficulty: "Nhận biết", options: ["A", "B", "C", "D"].map((label, index) => ({ id: label, label, text: String(index + 1) })), correctOptionIds: ["A"], answer: "", score: 0.25, quality: { status: "valid", reviewStatus: "teacher_confirmed", issues: [], ignoredIssueCodes: [] }, ...patch }); }

async function main() {
await check("1. Existing questions remain readable", () => { const old: QuestionItem = { id: "old", subject: "Toán", grade: "8", topic: "Đại số", question: "2+2=?", type: "Trắc nghiệm", difficulty: "Nhận biết", answer: "B", explanation: "", createdAt: "2026-01-01", options: { A: "3", B: "4", C: "5", D: "6" } }; assert.equal(fromLegacyQuestion(old).prompt, "2+2=?"); });
await check("2. Existing MCQ records normalize safely", () => assert.equal(toLegacyQuestion(fromLegacyQuestion({ ...toLegacyQuestion(q()), metadata: {} })).type, "Trắc nghiệm"));
await check("3. MCQ validates correct option mapping", () => assert.equal(auditAndUpdate(q()).quality.status, "valid"));
await check("4. True/false stable statement IDs work", () => { const item = auditAndUpdate(q({ type: "true_false", options: [], correctOptionIds: [], trueFalseStatements: [{ id: "s1", label: "a", text: "Mệnh đề", answer: true }] })); assert.notEqual(item.quality.status, "invalid"); });
await check("5. Numeric accepted alternatives work", () => { const item = auditAndUpdate(q({ type: "short_answer", options: [], correctOptionIds: [], answer: "2", acceptedAnswers: ["2,0", "2.0"] })); assert.equal(item.acceptedAnswers.length, 2); });
await check("6. Essay rubric data is preserved", () => { const item = toLegacyQuestion(q({ type: "essay", options: [], correctOptionIds: [], answer: "", essayRubric: [{ id: "r", criterion: "Lập luận", maxScore: 1, guidance: "Đúng" }] })); assert.equal(fromLegacyQuestion(item).essayRubric[0].criterion, "Lập luận"); });
await check("7. XLSX MCQ template import works", async () => { const parsed = await parseExamSourceBuffer({ name: "mcq.xlsx", buffer: await readFile("public/templates/mau-ngan-hang-cau-hoi-trac-nghiem.xlsx") }); assert.equal(parsed.tables.flatMap((table) => importRowsFromTable(table.rows)).length, 1); });
await check("8. XLSX true/false template import works", async () => { const parsed = await parseExamSourceBuffer({ name: "tf.xlsx", buffer: await readFile("public/templates/mau-ngan-hang-cau-hoi-dung-sai.xlsx") }); const rows = parsed.tables.flatMap((table) => importRowsFromTable(table.rows)); assert.equal(rows[0].item.trueFalseStatements[0].answer, true); });
await check("9. Semicolon CSV import works", () => assert.equal(importRowsFromDelimited("Môn;Lớp;Chủ đề;Dạng câu;Câu hỏi;A;B;C;D;Đáp án\nToán;12;Hàm số;Trắc nghiệm;Câu hỏi;1;2;3;4;A").length, 1));
await check("10. DOCX question parsing works", async () => { const zip = new JSZip(); zip.file("word/document.xml", '<w:document xmlns:w="x"><w:body><w:p><w:r><w:t>Câu 1. 2+2=?</w:t></w:r></w:p><w:p><w:r><w:t>A. 3</w:t></w:r></w:p><w:p><w:r><w:t>B. 4</w:t></w:r></w:p></w:body></w:document>'); const buffer = Buffer.from(await zip.generateAsync({ type: "uint8array" })); const parsed = await parseExamSourceBuffer({ name: "test.docx", buffer }); assert.match(parsed.text, /2\+2/); });
await check("11. Text-layer PDF import works", async () => { const buffer = await readFile("node_modules/pdf-parse/test/data/01-valid.pdf"); const parsed = await parseExamSourceBuffer({ name: "text.pdf", buffer }); assert.ok(parsed.text.length > 1000); });
await check("12. Scanned PDF routes to Document Recognition", async () => { const buffer = await readFile("node_modules/pdf-parse/test/data/05-versions-space.pdf"); const parsed = await parseExamSourceBuffer({ name: "scan.pdf", buffer }); assert.match(parsed.warnings.join(" "), /bản quét hình ảnh/); });
await check("13. Import review blocks invalid questions", () => assert.equal(importRowsFromText("Câu 1. X?")[0].selected, false));
await check("14. Bulk metadata edit respects ownership", () => { const changed = bulkPatchOwnedQuestions([q({ id: "a", ownerId: "u" }), q({ id: "b", ownerId: "v" })], ["a", "b"], { topic: "Mới" }, "u"); assert.deepEqual(changed.map((item) => item.topic), ["Mới", "Hàm số"]); });
await check("15. Exact duplicates are detected", () => assert.equal(detectDuplicates([q({ id: "a" }), q({ id: "b" })])[0].kind, "reordered_options"));
await check("16. Reordered-option duplicates are detected", () => { const a = q({ id: "a" }); const b = q({ id: "b", options: [...a.options].reverse() }); assert.equal(detectDuplicates([a, b])[0].kind, "reordered_options"); });
await check("17. Near duplicates produce warnings", () => { const matches = detectDuplicates([q({ id: "a", prompt: "Tính giá trị của hàm số y tại x bằng một" }), q({ id: "b", prompt: "Hãy tính giá trị hàm số y khi x bằng một" })]); assert.ok(matches.some((item) => item.kind === "near" || item.kind === "expression_variant")); });
await check("18. Duplicate decisions do not auto-delete", () => { const source = [q({ id: "a" }), q({ id: "b" })]; detectDuplicates(source); assert.equal(source.length, 2); });
await check("19. Collection references questions", () => assert.deepEqual(createQuestionCollection("Ôn tập", ["a"]).questionIds, ["a"]));
await check("20. One question belongs to multiple collections", () => { const a = createQuestionCollection("A", ["q"]); const b = createQuestionCollection("B", ["q"]); assert.equal(a.questionIds[0], b.questionIds[0]); });
await check("21. Smart set respects count", () => assert.equal(buildSmartSet([q({ id: "1" }), q({ id: "2" }), q({ id: "3" })], { topics: [], types: [], count: 2, seed: "x" }).selected.length, 2));
await check("22. Same seed produces same set", () => { const items = [q({ id: "1" }), q({ id: "2" }), q({ id: "3" })]; const config = { topics: [], types: [], count: 2, seed: "same" }; assert.deepEqual(buildSmartSet(items, config).selected.map((item) => item.id), buildSmartSet(items, config).selected.map((item) => item.id)); });
await check("23. Recently used exclusion works", () => { const result = buildSmartSet([q({ id: "used", usage: { count: 1, lastUsedAt: new Date().toISOString(), documentIds: [] } }), q({ id: "fresh" })], { topics: [], types: [], count: 2, seed: "x", excludeRecentlyUsedDays: 7 }); assert.deepEqual(result.selected.map((item) => item.id), ["fresh"]); });
await check("24. Insufficient availability shows shortage", () => assert.ok(buildSmartSet([q()], { topics: [], types: [], count: 3, seed: "x" }).shortages.length));
await check("25. Blueprint selection respects allocation", () => { const result = selectBlueprintAllocation([q()], { subject: "Toán", grade: "12", topic: "Hàm số", type: "multiple_choice", difficulty: "Nhận biết", count: 2 }); assert.equal(result.shortage, 1); });
await check("26. Exam receives compatible StructuredExam questions", () => { const item = q(); assert.equal(questionBankToExam([item]).exam.parts[0].questions[0].id, item.id); });
await check("27. Worksheet receives compatible activities", () => assert.equal(questionToWorksheetActivity(q()).type, "multiple_choice"));
await check("28. Lesson Plan links selected questions", () => assert.equal(lessonPlanQuestionLink(q({ id: "linked" })).questionId, "linked"));
await check("29. Answer Solutions updates verified status", () => assert.equal(markExplanationVerified(q(), "Lời giải").quality.reviewStatus, "verified"));
await check("30. Grading receives scoring rules", () => { const rules = gradingRules(q({ acceptedAnswers: ["1"], tolerance: 0.01 })); assert.equal(rules.tolerance, 0.01); });
await check("31. Student export contains no answers", () => assert.doesNotMatch(questionCollectionText([q()], "student"), /Đáp án:/));
await check("32. Teacher export contains explanations", () => assert.match(questionCollectionText([q({ explanation: "Giải thích đúng" })], "teacher"), /Giải thích đúng/));
await check("33. Teacher cannot access another teacher's question", () => assert.equal(canMutateQuestion(q({ ownerId: "other" }), "me"), false));
await check("34. Collection updates preserve references only", () => { const collection = addQuestionsToCollection(createQuestionCollection("A", ["1"]), ["2"]); assert.deepEqual(collection.questionIds, ["1", "2"]); });
await check("35. Maintenance mode blocks teacher", () => assert.equal(maintenanceAccessDecision({ pathname: "/question-bank", enabled: true, authenticated: true, role: "teacher" }), "redirect"));
await check("36. Admin bypass works", () => assert.equal(maintenanceAccessDecision({ pathname: "/question-bank", enabled: true, authenticated: true, role: "admin" }), "allow"));
await check("37. Exam mapping preserves stable IDs", () => assert.equal(questionBankToExam([q({ id: "stable" })]).exam.parts[0].questions[0].id, "stable"));
await check("38. Blueprint shortage never relaxes topic", () => assert.equal(selectBlueprintAllocation([q({ topic: "Khác" })], { subject: "Toán", grade: "12", topic: "Hàm số", type: "multiple_choice", difficulty: "Nhận biết", count: 1 }).selected.length, 0));
await check("39. Worksheet preserves answer", () => assert.equal(questionToWorksheetActivity(q()).answer, "A"));
await check("40. Lesson Plan preserves topic", () => assert.equal(lessonPlanQuestionLink(q()).topic, "Hàm số"));
await check("41. Usage tracking preserves document IDs", () => { const item = markQuestionUsed(q(), "doc-1", "ready"); assert.deepEqual(item.usage.documentIds, ["doc-1"]); });

assert.equal(passed, 41);
console.log(`Question Bank workflow: ${passed}/41 kiểm tra đạt.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

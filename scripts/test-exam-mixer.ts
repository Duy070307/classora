import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import JSZip from "jszip";
import { createExamVariants, regenerateExamVariant, validateSourceExamForMixing, variantComparisonRows } from "../lib/exam-mixer/engine";
import { variantSetToHistoryDocument, variantToDocument } from "../lib/exam-mixer/document";
import { buildVariantSetZip } from "../lib/exam-mixer/export";
import { defaultExamMixingOptions } from "../lib/exam-mixer/types";
import { buildOfficialExamDocxBlob } from "../lib/export-exam-docx";
import { maintenanceAccessDecision } from "../lib/maintenance-access";
import type { ExamPartType, ExamQuestion, StructuredExam } from "../lib/exam-types";

const labels = ["A", "B", "C", "D"] as const;
let passed = 0;
function check(value: unknown, message: string) { assert.ok(value, message); passed += 1; }

function question(part: ExamPartType, number: number): ExamQuestion {
  const answer = labels[(number - 1) % 4];
  const base = {
    id: `${part}-${number}`,
    part,
    number,
    stem: `${part} câu độc lập ${number}: dữ kiện duy nhất ${number * 17 + 3}.`,
    answer: part === "short_answer" ? String(number * 2) : answer,
    explanation: `Giải thích giữ nguyên cho câu ${number}.`,
    score: part === "multiple_choice" ? 0.25 : part === "true_false" ? 1 : 0.5,
    difficulty: (["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"] as const)[(number - 1) % 4],
    topic: "Hàm số",
  };
  if (part === "multiple_choice") return { ...base, options: { A: `Giá trị ${number}-A`, B: `Giá trị ${number}-B`, C: `Giá trị ${number}-C`, D: `Giá trị ${number}-D` } };
  if (part === "true_false") {
    const trueFalseItems = [true, true, false, false].map((itemAnswer, index) => ({ label: (["a", "b", "c", "d"] as const)[index], text: `Mệnh đề ${number}.${index + 1} riêng biệt.`, answer: index % 2 ? !itemAnswer : itemAnswer }));
    return { ...base, trueFalseItems, answer: trueFalseItems.map((item) => item.answer ? "Đúng" : "Sai").join(", ") };
  }
  return base;
}

function fixture(): StructuredExam {
  const mcq = Array.from({ length: 12 }, (_, index) => question("multiple_choice", index + 1));
  mcq[0].sourceMetadata = { groupId: "shared-figure-1" };
  mcq[1].sourceMetadata = { groupId: "shared-figure-1" };
  mcq[0].visuals = [{ type: "tikz", content: "\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}", alt: "Hình chung" }];
  mcq[1].visuals = JSON.parse(JSON.stringify(mcq[0].visuals));
  return {
    metadata: { title: "Đề Toán 12 chuẩn 12/4/6", examStyle: "THPTQG / tốt nghiệp", subject: "Toán", grade: "12", duration: "90 phút", examCode: "101", totalScore: 10, requestedSectionCounts: { partI: 12, partII: 4, partIII: 6 } },
    parts: [
      { type: "multiple_choice", title: "PHẦN I", instruction: "Chọn một phương án.", questions: mcq },
      { type: "true_false", title: "PHẦN II", instruction: "Chọn đúng hoặc sai.", questions: Array.from({ length: 4 }, (_, index) => question("true_false", index + 1)) },
      { type: "short_answer", title: "PHẦN III", instruction: "Trả lời ngắn.", questions: Array.from({ length: 6 }, (_, index) => question("short_answer", index + 1)) },
    ],
    teacherOnly: { scoringGuide: "Hướng dẫn chấm giữ nguyên.", matrix: "Ma trận giữ nguyên.", specification: "Đặc tả giữ nguyên.", notes: "Rà soát trước khi dùng." },
  };
}

async function run() {
const input = { exam: fixture(), sourceExamId: "source-1", sourceExamTitle: "Đề chuẩn", variantCount: 4, startingCode: 101, seed: "seed-on-dinh-2026", options: { ...defaultExamMixingOptions, shuffleTrueFalseStatements: true } };
const first = createExamVariants(input);
const repeated = createExamVariants(input);
const other = createExamVariants({ ...input, seed: "seed-khac-2026" });

check(JSON.stringify(first.variants) === JSON.stringify(repeated.variants), "1. Cùng seed phải tạo biến thể giống nhau");
check(JSON.stringify(first.variants.map((v) => v.questionMap)) !== JSON.stringify(other.variants.map((v) => v.questionMap)), "2. Seed khác phải đổi thứ tự");
check(first.variants.every((v) => v.auditResult.questionCount === 22), "3. Số câu phải giữ nguyên");
check(first.variants.every((v) => v.auditResult.totalScore === 10), "4. Tổng điểm phải giữ nguyên");
check(first.variants.every((v) => v.exam.parts.map((p) => p.questions.length).join("/") === "12/4/6"), "5. Số câu từng phần phải giữ nguyên");
const sourceIds = input.exam.parts.flatMap((part) => part.questions.map((q) => q.id)).sort().join("|");
check(first.variants.every((v) => v.exam.parts.flatMap((part) => part.questions.map((q) => q.id)).sort().join("|") === sourceIds), "6. Mỗi ID phải xuất hiện đúng một lần");
check(first.variants.every((v) => v.exam.parts[0].questions.every((q) => q.options?.[q.answer as keyof typeof q.options]?.endsWith(`-${input.exam.parts[0].questions.find((source) => source.id === q.id)?.answer}`))), "7. Đáp án phải được ánh xạ theo nội dung đúng");
check(first.variants.every((v) => v.exam.parts[0].questions.every((q) => JSON.stringify(Object.values(q.options || {}).sort()) === JSON.stringify(Object.values(input.exam.parts[0].questions.find((source) => source.id === q.id)?.options || {}).sort()))), "8. Nội dung phương án không đổi");
check(first.variants.every((v) => Math.max(...Object.values(v.auditResult.answerDistribution)) - Math.min(...Object.values(v.auditResult.answerDistribution)) <= 1), "9. Phân bố 12 câu phải cân bằng");
check(first.variants.every((v) => !/(A{3}|B{3}|C{3}|D{3})/.test(v.exam.parts[0].questions.map((q) => q.answer).join(""))), "10. Không có chuỗi đáp án quá dài");
check(first.variants.every((v) => v.exam.parts[1].questions.every((q) => q.trueFalseItems?.every((item) => input.exam.parts[1].questions.find((source) => source.id === q.id)?.trueFalseItems?.some((sourceItem) => sourceItem.text === item.text && sourceItem.answer === item.answer)))), "11. Trộn mệnh đề giữ đúng chân trị");
check(first.variants.every((v) => v.exam.parts[2].questions.every((q) => { const source = input.exam.parts[2].questions.find((item) => item.id === q.id); return q.stem === source?.stem && q.answer === source.answer; })), "12. Trả lời ngắn không đổi nội dung/đáp án");
check(first.variants.every((v) => v.exam.teacherOnly.scoringGuide === input.exam.teacherOnly.scoringGuide && v.exam.parts.flatMap((p) => p.questions).every((q) => q.score === input.exam.parts.flatMap((p) => p.questions).find((source) => source.id === q.id)?.score)), "13. Rubric và điểm không đổi");
check(first.variants.every((v) => { const positions = v.exam.parts[0].questions.map((q, i) => q.sourceMetadata?.groupId === "shared-figure-1" ? i : -10).filter((i) => i >= 0); return positions.length === 2 && positions[1] === positions[0] + 1; }), "14. Câu dùng chung dữ kiện phải liền nhau");
check(first.variants.every((v) => v.exam.parts[0].questions.filter((q) => q.id === "multiple_choice-1" || q.id === "multiple_choice-2").every((q) => q.visuals?.[0]?.type === "tikz")), "15. Visual/TikZ phải đi cùng câu");
const missingVisual = fixture(); missingVisual.parts[0].questions[2].stem = "Dựa vào đồ thị dưới đây, chọn đáp án.";
check(!validateSourceExamForMixing(missingVisual).valid, "16. Thiếu visual phải bị chặn");
check(first.variants.every((v) => v.exam.parts.every((p) => p.questions.every((q, i) => q.number === i + 1))), "17. Đánh số phải liên tục");
check(variantComparisonRows(first).every((row) => first.variants.every((variant) => row.variants[variant.code] > 0)), "18. Bảng đối chiếu phải có ánh xạ cho mọi mã");

const studentBlob = await buildOfficialExamDocxBlob(variantToDocument(first, first.variants[0]), { includeTeacher: false });
const studentZip = await JSZip.loadAsync(await studentBlob.arrayBuffer());
const studentXml = await studentZip.file("word/document.xml")?.async("string") || "";
const printViewSource = readFileSync("components/document/OfficialExamPrintView.tsx", "utf8");
check(!/PHẦN DÀNH CHO GIÁO VIÊN|ĐÁP ÁN VÀ THANG ĐIỂM|Hướng dẫn chấm giữ nguyên/i.test(studentXml) && /mode !== "exam-mixer"/.test(printViewSource), "19. Word/PDF học sinh không được chứa đáp án");

const packageBlob = await buildVariantSetZip(first);
const packageZip = await JSZip.loadAsync(await packageBlob.arrayBuffer());
const keyXml = await JSZip.loadAsync(await packageZip.file("Dap_an_Ma101.docx")!.async("arraybuffer")).then((zip) => zip.file("word/document.xml")!.async("string"));
check(/MÃ ĐỀ: 101/.test(keyXml) && first.variants[0].answerKey.every((item) => keyXml.includes(item.answer)), "20. File đáp án phải khớp mã");
check(["De_Ma101.docx", "Dap_an_Ma101.docx", "Dap_an_Tong_hop.docx", "Bang_doi_chieu_ma_de.docx", "Thong_tin_bo_ma.txt"].every((name) => packageZip.file(name)), "21. ZIP phải có đủ nhóm file");
const history = variantSetToHistoryDocument(first);
const reopened = JSON.parse(JSON.stringify(history)).examVariantSet;
check(JSON.stringify(reopened.variants) === JSON.stringify(first.variants), "22. Mở lại lịch sử phải giữ nguyên biến thể");
const storeSource = readFileSync("lib/data/documents-store.ts", "utf8");
check(/getCloudClientForUser\(\)/.test(storeSource) && /\.eq\("id", id\)/.test(storeSource), "23. Lịch sử dùng phiên người dùng và RLS hiện có");
check(maintenanceAccessDecision({ pathname: "/tools/exam-mixer", enabled: true, authenticated: true, role: "teacher" }) === "redirect", "24. Bảo trì phải chặn giáo viên");
check(maintenanceAccessDecision({ pathname: "/tools/exam-mixer", enabled: true, authenticated: true, role: "admin" }) === "allow", "25. Admin phải được bypass");
check(readFileSync("app/tools/exam-generator/page.tsx", "utf8").includes("createStructuredExam") || readFileSync("app/tools/exam-generator/page.tsx", "utf8").includes("generateToolContent"), "26. Luồng tạo đề thủ công vẫn còn");
check(readFileSync("components/exam-generator/FileExamGenerator.tsx", "utf8").includes("structuredExamToText"), "27. Tạo đề từ file vẫn dùng StructuredExam");
check(readFileSync("scripts/test-exam-auditor.ts", "utf8").includes("17/17"), "28. Bộ test Auditor vẫn được nối trong test tổng");
check(variantToDocument(first, first.variants[0]).structuredExam === first.variants[0].exam, "29. Preview/Word/PDF dùng cùng StructuredExam của biến thể");

const regenerated = regenerateExamVariant(first, 0);
assert.equal(regenerated.variants[0].auditResult.valid, true);
assert.equal(passed, 29);
console.log(`Exam mixer: ${passed}/29 nhóm kiểm tra đạt.`);
}

void run();

import assert from "node:assert/strict";
import JSZip from "jszip";
import { buildOfficialExamDocxBlob } from "../lib/export-exam-docx";
import { normalizeGeneratedDocument } from "../lib/content/generated-content";
import type { GeneratedDocument } from "../lib/types";

const document: GeneratedDocument = {
  id: "qa-ohm-exam",
  title: "Đề kiểm tra Vật lí lớp 11",
  type: "exam",
  createdAt: "2026-07-11T00:00:00.000Z",
  content: "PHẦN I. TRẮC NGHIỆM\n\nCâu 1. Với U = 12 V và R = 4 Ω, cường độ dòng điện I bằng bao nhiêu?\nA. 2 A\nB. 3 A\nC. 4 A\nD. 48 A\n\nPHẦN DÀNH CHO GIÁO VIÊN\n\nĐÁP ÁN: B",
  examMeta: { subject: "Vật lí", grade: "11", topic: "Định luật Ohm", duration: "45 phút", examCode: "0101" },
  generationMeta: {
    source: "question-bank",
    bankSource: "Ngân hàng Soạn Lab",
    subject: "Vật lí",
    grade: "11",
    topic: "Định luật Ohm",
    questionCount: 1,
    requestContext: {
      subject: "Vật lí", canonicalSubject: "vat li", grade: "11", topic: "Định luật Ohm", canonicalTopic: "dinh luat ohm",
      subtopics: [], excludedTopics: [], questionType: "Trắc nghiệm", questionCount: 1, bookSeries: "Kết nối tri thức",
      source: "system", allowAiSupplement: false, allowRelatedTopics: false, difficultyDistribution: {}, toolType: "exam", userPrompt: "", language: "vi",
    },
  },
  structuredExam: {
    metadata: { title: "Đề kiểm tra Vật lí lớp 11", examStyle: "Kiểm tra thường", subject: "Vật lí", grade: "11", duration: "45 phút", examCode: "0101" },
    parts: [{
      type: "multiple_choice", title: "PHẦN I", instruction: "Chọn một phương án đúng.",
      questions: [{ id: "ohm-1", part: "multiple_choice", number: 1, stem: "Với U = 12 V và R = 4 Ω, cường độ dòng điện I bằng bao nhiêu?", options: { A: "2 A", B: "3 A", C: "4 A", D: "48 A" }, answer: "B", explanation: "Theo I = U/R = 3 A.", score: 10, difficulty: "Nhận biết", topic: "Định luật Ohm" }],
    }],
    teacherOnly: { scoringGuide: "Câu 1: B", matrix: "Định luật Ohm", specification: "U, I, R", notes: "Giáo viên rà soát trước khi sử dụng." },
  },
};

async function run() {
const normalized = normalizeGeneratedDocument(document);
const reopened = JSON.parse(JSON.stringify(normalized)) as GeneratedDocument;
assert.deepEqual(reopened.structuredExam, document.structuredExam, "Lịch sử phải giữ nguyên câu hỏi có cấu trúc");
assert.deepEqual(reopened.generationMeta?.requestContext, document.generationMeta?.requestContext, "Lịch sử phải giữ request context");
assert.equal(reopened.generationMeta?.source, "question-bank");

const blob = await buildOfficialExamDocxBlob(reopened);
assert.ok(blob.size > 1000, "DOCX phải có dữ liệu");
const zip = await JSZip.loadAsync(await blob.arrayBuffer());
const xml = await zip.file("word/document.xml")?.async("string");
assert.ok(xml, "DOCX phải có document.xml");
const plainText = xml.replace(/<[^>]+>/g, "");
assert.match(plainText, /VẬT LÍ 11/i);
assert.match(plainText, /cường độ dòng điện/i);
assert.match(plainText, /A\.\s*2 A/i);
assert.match(plainText, /B\.\s*3 A/i);
assert.match(plainText, /I = U\/R = 3 A/i);
assert.doesNotMatch(plainText, /```|structuredExam|\{\s*&quot;/i);
assert.doesNotMatch(plainText, /từ trường|cảm ứng điện từ|xác suất/i);

const fullExam: GeneratedDocument = JSON.parse(JSON.stringify(document));
fullExam.id = "qa-math-22";
fullExam.title = "Đề kiểm tra Toán lớp 12";
fullExam.examMeta = { subject: "Toán", grade: "12", topic: "hàm số", duration: "45 phút", examCode: "0101", examStyle: "THPTQG / tốt nghiệp" };
fullExam.structuredExam = {
  metadata: { title: fullExam.title, examStyle: "THPTQG / tốt nghiệp", subject: "Toán", grade: "12", duration: "45 phút", examCode: "0101" },
  parts: [
    { type: "multiple_choice", title: "PHẦN I", instruction: "Chọn một phương án.", questions: Array.from({ length: 12 }, (_, index) => ({ id: `mc-${index}`, part: "multiple_choice" as const, number: index + 1, stem: `MC-${index + 1}-MARK: Xét hàm số bậc ba số ${index + 1}.`, options: { A: "Phương án A", B: "Phương án B", C: "Phương án C", D: "Phương án D" }, answer: ["A", "B", "C", "D"][index % 4], explanation: `Lời giải MC ${index + 1}.`, score: 0.25, difficulty: "Nhận biết" as const, topic: "hàm số" })) },
    { type: "true_false", title: "PHẦN II", instruction: "Chọn đúng hoặc sai.", questions: Array.from({ length: 4 }, (_, index) => ({ id: `tf-${index}`, part: "true_false" as const, number: index + 1, stem: `TF-${index + 1}-MARK: Xét bảng biến thiên số ${index + 1}.`, trueFalseItems: ["a", "b", "c", "d"].map((label, item) => ({ label: label as "a", text: `Mệnh đề ${label}`, answer: item % 2 === 0 })), answer: "a Đúng; b Sai; c Đúng; d Sai", explanation: `Lời giải TF ${index + 1}.`, score: 1, difficulty: "Thông hiểu" as const, topic: "hàm số" })) },
    { type: "short_answer", title: "PHẦN III", instruction: "Trả lời ngắn.", questions: Array.from({ length: 6 }, (_, index) => ({ id: `sa-${index}`, part: "short_answer" as const, number: index + 1, stem: `SA-${index + 1}-MARK: Tìm cực trị trường hợp ${index + 1}.`, answer: `${index + 1}`, explanation: `Lời giải SA ${index + 1}.`, score: 0.5, difficulty: "Vận dụng" as const, topic: "hàm số" })) },
  ],
  teacherOnly: { scoringGuide: "Đáp án đủ 22 câu", matrix: "Ma trận 12/4/6", specification: "Đặc tả 12/4/6", notes: "Rà soát." },
};
fullExam.content = "Nội dung được dựng từ structuredExam";
fullExam.generationMeta = { source: "ai", requestedCount: 22, finalCount: 22, questionCount: 22, requestedSectionCounts: { partI: 12, partII: 4, partIII: 6 }, generatedSectionCounts: { partI: 12, partII: 4, partIII: 6 } };
const reopenedFull = JSON.parse(JSON.stringify(fullExam)) as GeneratedDocument;
assert.equal(reopenedFull.structuredExam?.parts.reduce((sum, part) => sum + part.questions.length, 0), 22);
const fullBlob = await buildOfficialExamDocxBlob(reopenedFull);
const fullZip = await JSZip.loadAsync(await fullBlob.arrayBuffer());
const fullXml = await fullZip.file("word/document.xml")?.async("string");
const fullText = (fullXml || "").replace(/<[^>]+>/g, "");
assert.match(fullText, /MC-12-MARK/);
assert.match(fullText, /TF-4-MARK/);
assert.match(fullText, /SA-6-MARK/);
assert.match(fullText, /Đáp án đủ 22 câu/);

console.log("Export/history reliability: DOCX và history giữ đủ cấu trúc 12/4/6 = 22 câu, đáp án/lời giải và nội dung chủ đề đều đạt.");
}

void run();

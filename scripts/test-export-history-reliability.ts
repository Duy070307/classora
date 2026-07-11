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

console.log("Export/history reliability: DOCX, tiếng Việt, A/B/C/D, đáp án, lời giải, request context và nội dung chủ đề đều đạt.");
}

void run();

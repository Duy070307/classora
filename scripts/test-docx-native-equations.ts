import assert from "node:assert/strict";
import JSZip from "jszip";
import { buildGenericDocxBlob } from "../lib/export-docx";
import { buildOfficialExamDocxBlob } from "../lib/export-exam-docx";
import type { GeneratedDocument } from "../lib/types";

async function documentXml(blob: Blob) {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return zip.file("word/document.xml")?.async("string") || "";
}

const generic: GeneratedDocument = {
  id: "native-math-generic",
  title: "Phiếu học tập hình học giải tích",
  type: "worksheet",
  createdAt: "2026-07-20T00:00:00.000Z",
  content: [
    "# PHIẾU HỌC TẬP",
    "Mặt cầu có tâm $I(2;-3;1)$ và phương trình (x-2)^2+(y+3)^2+(z-1)^2=25.",
    "| Nội dung | Công thức |",
    "| --- | --- |",
    "| Bán kính | $R=\\sqrt{25}=5$ |",
    "| Phân số | \\(\\frac{a^2}{b_1}\\) |",
    "Biểu thức lỗi vẫn phải xuất an toàn: $\\frac{1{$.",
  ].join("\n"),
};

const exam: GeneratedDocument = {
  id: "native-math-exam",
  title: "Đề kiểm tra Toán 12",
  type: "exam",
  createdAt: "2026-07-20T00:00:00.000Z",
  examMeta: { subject: "Toán", grade: "12", duration: "45 phút", examCode: "101" },
  content: "Nội dung dựng từ đề có cấu trúc.",
  structuredExam: {
    metadata: { title: "Đề kiểm tra Toán 12", examStyle: "Kiểm tra thường", subject: "Toán", grade: "12", duration: "45 phút", examCode: "101" },
    parts: [{
      type: "multiple_choice",
      title: "PHẦN I",
      instruction: "Chọn một phương án đúng.",
      questions: [{
        id: "sphere-1", part: "multiple_choice", number: 1,
        stem: "Cho mặt cầu $(x-2)^2+(y+3)^2+(z-1)^2=25$. Tâm của mặt cầu là",
        options: { A: "$I(2;-3;1)$", B: "$I(-2;3;-1)$", C: "$I(2;3;1)$", D: "$I(-2;-3;-1)$" },
        answer: "A", explanation: "Từ dạng chuẩn suy ra tâm $I(2;-3;1)$ và bán kính $R=5$.",
        score: 1, difficulty: "Nhận biết", topic: "Mặt cầu",
      }],
    }],
    teacherOnly: { scoringGuide: "Câu 1: A. Bán kính $R=5$.", matrix: "Mặt cầu", specification: "Nhận biết phương trình mặt cầu.", notes: "Giáo viên rà soát." },
  },
};

async function run() {
  const genericXml = await documentXml(await buildGenericDocxBlob(generic));
  assert.match(genericXml, /<m:oMath>/, "DOCX chung phải chứa phương trình OMML");
  assert.match(genericXml, /<m:sSup>/, "Số mũ phải là cấu trúc superscript OMML");
  assert.match(genericXml, /<m:f>/, "Phân số phải là cấu trúc fraction OMML");
  assert.doesNotMatch(genericXml, /\$/, "DOCX không được giữ ký hiệu phân cách LaTeX thô");
  const tableStart = genericXml.indexOf("<w:tbl>"); const tableEnd = genericXml.indexOf("</w:tbl>", tableStart);
  assert.ok(tableStart >= 0 && tableEnd > tableStart && genericXml.slice(tableStart, tableEnd).includes("<m:oMath>"), "Công thức trong bảng phải dùng OMML");
  assert.match(genericXml, /PHIẾU HỌC TẬP/, "Văn bản tiếng Việt xung quanh công thức phải được giữ");

  const studentXml = await documentXml(await buildOfficialExamDocxBlob(exam, { includeTeacher: false }));
  assert.match(studentXml, /<m:oMath>/, "Đề học sinh phải chứa OMML");
  assert.match(studentXml, /<m:sSup>/, "Đề học sinh phải giữ số mũ dạng OMML");
  assert.doesNotMatch(studentXml, /Bán kính/, "Đề học sinh không được lộ lời giải/đáp án giáo viên");
  assert.doesNotMatch(studentXml, /\$/, "Đề học sinh không được giữ ký hiệu phân cách LaTeX thô");

  const teacherXml = await documentXml(await buildOfficialExamDocxBlob(exam, { includeTeacher: true }));
  assert.match(teacherXml, /<m:oMath>/, "Phần giáo viên phải dùng cùng pipeline OMML");
  assert.match(teacherXml, /Bán kính/, "Phần giáo viên phải giữ lời giải");
  assert.doesNotMatch(teacherXml, /\$/, "Phần giáo viên không được giữ ký hiệu phân cách LaTeX thô");
  console.log("DOCX native equations: generic/table/student/teacher OMML đều đạt.");
}

void run();

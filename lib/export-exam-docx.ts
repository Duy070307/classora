"use client";

import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  convertMillimetersToTwip
} from "docx";
import { getDocumentSettings } from "@/lib/document-settings";
import type { GeneratedDocument } from "@/lib/types";

const FONT = "Times New Roman";
const BODY_SIZE = 26;
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
};
const thinBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
};

function run(text: string, options: { bold?: boolean; italics?: boolean; size?: number } = {}) {
  return new TextRun({ text, font: FONT, size: options.size ?? BODY_SIZE, bold: options.bold, italics: options.italics });
}

function paragraph(text = "", options: { bold?: boolean; italics?: boolean; center?: boolean; right?: boolean; before?: number; after?: number; size?: number } = {}) {
  return new Paragraph({
    alignment: options.center ? AlignmentType.CENTER : options.right ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
    spacing: { before: options.before ?? 0, after: options.after ?? 70, line: 276 },
    children: [run(text, options)]
  });
}

function extract(content: string, label: string) {
  return content.match(new RegExp(`^${label}:\\s*(.+)$`, "im"))?.[1]?.trim() ?? "";
}

function section(content: string, start: RegExp, end?: RegExp) {
  const lines = content.split(/\r?\n/);
  const first = lines.findIndex((line) => start.test(line.trim()));
  if (first < 0) return "";
  const remaining = lines.slice(first + 1);
  const last = end ? remaining.findIndex((line) => end.test(line.trim())) : -1;
  return remaining.slice(0, last < 0 ? undefined : last).join("\n").trim();
}

function cleanStudentBody(text: string) {
  return text
    .replace(/^Khoanh tròn.+$/im, "")
    .replace(/^Học sinh trình bày.+$/im, "")
    .replace(/^Không có phần.+$/im, "")
    .replace(/^PHẦN DÀNH CHO GIÁO VIÊN$/im, "")
    .trim();
}

function bodyParagraphs(text: string) {
  return text.split(/\r?\n/).flatMap((raw) => {
    const line = raw.trim();
    if (!line) return [];
    const question = line.match(/^Câu\s+(\d+)\.\s*(.*)$/i);
    if (question) {
      return [new Paragraph({
        spacing: { before: 120, after: 45, line: 276 },
        keepNext: true,
        children: [run(`Câu ${question[1]}. `, { bold: true }), run(question[2])]
      })];
    }
    const option = line.match(/^([A-D])\.\s*(.*)$/);
    if (option) return [new Paragraph({ spacing: { after: 25, line: 260 }, indent: { left: 360 }, children: [run(`${option[1]}. `, { bold: true }), run(option[2])] })];
    return [paragraph(line)];
  });
}

function markdownTable(text: string) {
  const rows = text.split(/\r?\n/)
    .filter((line) => line.trim().startsWith("|") && !/^\|?\s*:?-{3,}/.test(line.trim()))
    .map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
  if (!rows.length) return null;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: thinBorders,
    rows: rows.map((cells, rowIndex) => new TableRow({
      children: cells.map((cell) => new TableCell({
        width: { size: Math.floor(100 / cells.length), type: WidthType.PERCENTAGE },
        shading: rowIndex === 0 ? { fill: "EAF2F8" } : undefined,
        margins: { top: 70, bottom: 70, left: 90, right: 90 },
        children: [new Paragraph({ alignment: rowIndex === 0 ? AlignmentType.CENTER : AlignmentType.LEFT, children: [run(cell, { bold: rowIndex === 0, size: 22 })] })]
      }))
    }))
  });
}

function teacherContent(content: string) {
  const answer = section(content, /^III\.\s*ĐÁP ÁN/i, /^IV\./i);
  const scoring = section(content, /^IV\.\s*THANG ĐIỂM/i, /^V\./i);
  const matrix = section(content, /^V\.\s*MA TRẬN/i, /^VI\./i);
  const specification = section(content, /^VI\.\s*BẢN ĐẶC TẢ/i, /^YÊU CẦU THÊM/i);
  const children: (Paragraph | Table)[] = [
    new Paragraph({ children: [new PageBreak()] }),
    paragraph("PHẦN DÀNH CHO GIÁO VIÊN", { bold: true, center: true, size: 30, after: 80 }),
    paragraph("ĐÁP ÁN VÀ THANG ĐIỂM", { bold: true, center: true, size: 30, after: 220 })
  ];
  if (answer) {
    children.push(paragraph("I. ĐÁP ÁN", { bold: true, before: 80, after: 90 }));
    const compact = answer.match(/Trắc nghiệm:\s*(.+)/i)?.[1];
    if (compact) {
      const pairs = [...compact.matchAll(/(\d+)\.\s*([A-D])/g)];
      if (pairs.length) children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: thinBorders,
        rows: [
          new TableRow({ children: [new TableCell({ children: [paragraph("Câu", { bold: true, center: true })] }), ...pairs.map((pair) => new TableCell({ children: [paragraph(pair[1], { center: true })] }))] }),
          new TableRow({ children: [new TableCell({ children: [paragraph("Đáp án", { bold: true, center: true })] }), ...pairs.map((pair) => new TableCell({ children: [paragraph(pair[2], { bold: true, center: true })] }))] })
        ]
      }));
    }
    children.push(...bodyParagraphs(answer.replace(/^Trắc nghiệm:.*$/im, "").trim()));
  }
  if (scoring) {
    children.push(paragraph("II. HƯỚNG DẪN CHẤM", { bold: true, before: 180, after: 90 }), ...bodyParagraphs(scoring));
  }
  if (matrix) {
    children.push(paragraph("III. MA TRẬN ĐỀ", { bold: true, before: 180, after: 90 }));
    const table = markdownTable(matrix);
    if (table) children.push(table);
    else children.push(...bodyParagraphs(matrix));
  }
  if (specification) children.push(paragraph("IV. BẢN ĐẶC TẢ", { bold: true, before: 180, after: 90 }), ...bodyParagraphs(specification));
  return children;
}

export async function buildOfficialExamDocxBlob(document: GeneratedDocument) {
  const settings = getDocumentSettings();
  const meta = document.examMeta ?? {};
  const subject = meta.subject || document.title.match(/Đề kiểm tra\s+(.+?)\s+lớp/i)?.[1] || extract(document.content, "Môn học") || "................................";
  const grade = meta.grade || extract(document.content, "Lớp") || "........";
  const duration = meta.duration || extract(document.content, "Thời gian làm bài") || "........ phút";
  const schoolName = meta.schoolName || settings.schoolName || "TRƯỜNG THPT ...";
  const department = settings.department || "SỞ GIÁO DỤC VÀ ĐÀO TẠO";
  const schoolYear = settings.schoolYear ? `NĂM HỌC ${settings.schoolYear}` : "";
  const examCode = meta.examCode || document.content.match(/Mã đề:\s*(\d+)/i)?.[1] || "101";
  const mc = cleanStudentBody(section(document.content, /^I\.\s*TRẮC NGHIỆM/i, /^II\./i));
  const essay = cleanStudentBody(section(document.content, /^II\.\s*TỰ LUẬN/i, /^III\./i));
  const mcCount = [...mc.matchAll(/^Câu\s+\d+\./gim)].length;

  const header = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [4700, 5300],
    borders: noBorders,
    rows: [new TableRow({
      children: [
        new TableCell({ width: { size: 47, type: WidthType.PERCENTAGE }, borders: noBorders, children: [
          paragraph(department.toUpperCase(), { bold: true, center: true, size: 24, after: 40 }),
          paragraph(schoolName.toUpperCase(), { bold: true, center: true, size: 24, after: 40 }),
          paragraph("(Đề thi có .... trang)", { italics: true, center: true, size: 22 })
        ] }),
        new TableCell({ width: { size: 53, type: WidthType.PERCENTAGE }, borders: noBorders, children: [
          paragraph("KỲ KIỂM TRA", { bold: true, center: true, size: 26, after: 35 }),
          ...(schoolYear ? [paragraph(schoolYear, { bold: true, center: true, size: 24, after: 35 })] : []),
          paragraph(`MÔN THI: ${subject.toUpperCase()} - LỚP ${grade}`, { bold: true, center: true, size: 24, after: 35 }),
          paragraph(`Thời gian làm bài: ${duration}, không kể thời gian phát đề`, { italics: true, center: true, size: 22 })
        ] })
      ]
    })]
  });

  const codeBox = new Table({
    alignment: AlignmentType.RIGHT,
    width: { size: 28, type: WidthType.PERCENTAGE },
    borders: thinBorders,
    rows: [new TableRow({ children: [new TableCell({ margins: { top: 90, bottom: 90, left: 130, right: 130 }, children: [paragraph(`Mã đề: ${examCode}`, { bold: true, center: true, size: 26, after: 0 })] })] })]
  });

  const children: (Paragraph | Table)[] = [
    header,
    paragraph("", { after: 80 }),
    paragraph(document.title.toUpperCase(), { bold: true, center: true, size: 32, after: 50 }),
    ...(meta.topic ? [paragraph(`Chủ đề: ${meta.topic}`, { bold: true, center: true, size: 24, after: 140 })] : []),
    paragraph("Họ và tên thí sinh: ........................................................................", { after: 55 }),
    paragraph("Số báo danh: ................................................................................", { after: 60 }),
    codeBox,
    paragraph("Thí sinh làm bài theo hướng dẫn của cán bộ coi thi; không sử dụng tài liệu nếu không được phép.", { italics: true, before: 100, after: 140 }),
    ...(mc ? [
      paragraph("PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.", { bold: true, before: 80, after: 60 }),
      paragraph(`Thí sinh trả lời từ câu 1 đến câu ${mcCount || "..."}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.`, { italics: true, after: 80 }),
      ...bodyParagraphs(mc)
    ] : []),
    ...(essay ? [
      paragraph("PHẦN II. TỰ LUẬN", { bold: true, before: 180, after: 70 }),
      paragraph("Thí sinh trình bày rõ ràng, đầy đủ các bước và nêu kết luận.", { italics: true, after: 80 }),
      ...bodyParagraphs(essay)
    ] : []),
    ...teacherContent(document.content)
  ];

  const docx = new Document({
    styles: { default: { document: { run: { font: FONT, size: BODY_SIZE }, paragraph: { spacing: { line: 276, after: 70 } } } } },
    sections: [{
      properties: {
        page: {
          size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
          margin: {
            top: convertMillimetersToTwip(15),
            bottom: convertMillimetersToTwip(15),
            left: convertMillimetersToTwip(18),
            right: convertMillimetersToTwip(18)
          }
        }
      },
      children
    }]
  });
  return Packer.toBlob(docx);
}

function safeFileName(value: string) {
  return value.replace(/đ/g, "d").replace(/Đ/g, "D").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function exportOfficialExamDocx(document: GeneratedDocument) {
  const blob = await buildOfficialExamDocxBlob(document);
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  const subject = document.examMeta?.subject || document.title;
  const grade = document.examMeta?.grade ? `-lop-${document.examMeta.grade}` : "";
  const code = document.examMeta?.examCode || "101";
  link.download = `${safeFileName(`De-kiem-tra-${subject}${grade}-ma-de-${code}`)}.docx`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

"use client";

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Packer,
  PageNumber,
  Paragraph,
  SectionType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  convertMillimetersToTwip
} from "docx";
import { getDocumentSettings } from "@/lib/document-settings";
import type { GeneratedDocument } from "@/lib/types";
import { splitMarkdownTables, type ParsedMarkdownTable } from "@/lib/markdown-table";
import { normalizeGeneratedDocument } from "@/lib/content/generated-content";
import { containsMathLikeText } from "@/lib/content/math-symbol-normalize";

const FONT = "Times New Roman";
const BODY_SIZE = 24;
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
const footerCellBorders = {
  ...noBorders,
  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
};

function run(text: string, options: { bold?: boolean; italics?: boolean; size?: number } = {}) {
  return new TextRun({ text, font: containsMathLikeText(text) ? "Cambria Math" : FONT, size: options.size ?? BODY_SIZE, bold: options.bold, italics: options.italics });
}

function paragraph(text = "", options: { bold?: boolean; italics?: boolean; center?: boolean; right?: boolean; before?: number; after?: number; size?: number; borderBottom?: boolean } = {}) {
  return new Paragraph({
    alignment: options.center ? AlignmentType.CENTER : options.right ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
    spacing: { before: options.before ?? 0, after: options.after ?? 45, line: 252 },
    border: options.borderBottom ? { bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000", space: 3 } } : undefined,
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
        spacing: { before: 80, after: 25, line: 252 },
        keepNext: true,
        children: [run(`Câu ${question[1]}. `, { bold: true }), run(question[2])]
      })];
    }
    const option = line.match(/^([A-D])\.\s*(.*)$/);
    if (option) return [new Paragraph({ spacing: { after: 10, line: 240 }, indent: { left: 240 }, children: [run(`${option[1]}. `, { bold: true }), run(option[2])] })];
    const subItem = line.match(/^([a-d])\)\s*(.*)$/i);
    if (subItem) return [new Paragraph({ spacing: { after: 18, line: 252 }, indent: { left: 280 }, children: [run(`${subItem[1].toLowerCase()}) `, { bold: true }), run(subItem[2])] })];
    if (/\[(Hình vẽ|Hình minh họa|Hình ảnh)\]/i.test(line)) {
      return [new Table({
        alignment: AlignmentType.RIGHT,
        width: { size: 35, type: WidthType.PERCENTAGE },
        borders: thinBorders,
        rows: [new TableRow({ children: [new TableCell({ margins: { top: 180, bottom: 180, left: 100, right: 100 }, children: [paragraph("[Hình vẽ minh họa]", { italics: true, center: true, after: 0 })] })] })]
      })];
    }
    return [paragraph(line)];
  });
}

function questionBlocks(text: string) {
  const blocks = text.split(/(?=^Câu\s+\d+\.)/gim).map((block) => block.trim()).filter(Boolean);
  return blocks.flatMap((block) => {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const question = lines.shift() || "";
    const options = lines.map((line) => line.match(/^([A-D])\.\s*(.*)$/)).filter(Boolean) as RegExpMatchArray[];
    const children: (Paragraph | Table)[] = bodyParagraphs(question);
    if (options.length === 4 && options.every((item) => item[2].length <= 55)) {
      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorders,
        rows: [
          new TableRow({ children: options.slice(0, 2).map((item) => new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: noBorders, margins: { top: 20, bottom: 20, left: 100, right: 100 }, children: [new Paragraph({ spacing: { after: 0, line: 240 }, children: [run(`${item[1]}. `, { bold: true }), run(item[2])] })] })) }),
          new TableRow({ children: options.slice(2, 4).map((item) => new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: noBorders, margins: { top: 20, bottom: 20, left: 100, right: 100 }, children: [new Paragraph({ spacing: { after: 0, line: 240 }, children: [run(`${item[1]}. `, { bold: true }), run(item[2])] })] })) })
        ]
      }));
    } else {
      children.push(...bodyParagraphs(lines.join("\n")));
    }
    return children;
  });
}

function docxTable(table: ParsedMarkdownTable) {
  const rows = [table.headers, ...table.rows];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: thinBorders,
    rows: rows.map((cells, rowIndex) => new TableRow({
      children: cells.map((cell) => new TableCell({
        width: { size: Math.floor(100 / cells.length), type: WidthType.PERCENTAGE },
        shading: rowIndex === 0 ? { fill: "F1F5F9" } : undefined,
        margins: { top: 70, bottom: 70, left: 90, right: 90 },
        children: [new Paragraph({ alignment: rowIndex === 0 ? AlignmentType.CENTER : AlignmentType.LEFT, children: [run(cell, { bold: rowIndex === 0, size: 22 })] })]
      }))
    }))
  });
}

function structuredSectionText(document: GeneratedDocument, type: "multiple_choice" | "true_false" | "short_answer") {
  const questions = document.structuredExam?.parts.find((part) => part.type === type)?.questions ?? [];
  return questions.map((question) => {
    const lines = [`Câu ${question.number}. ${question.stem}`];
    if (question.options) for (const key of ["A", "B", "C", "D"] as const) lines.push(`${key}. ${question.options[key]}`);
    if (question.trueFalseItems) for (const item of question.trueFalseItems) lines.push(`${item.label}) ${item.text}`);
    return lines.join("\n");
  }).join("\n\n");
}

function teacherBlocks(text: string) {
  return splitMarkdownTables(text).flatMap((block) => block.type === "table"
    ? [docxTable(block.table), paragraph("", { after: 70 })]
    : bodyParagraphs(block.text));
}

function teacherContent(document: GeneratedDocument) {
  const content = document.content;
  const answer = section(content, /^III\.\s*ĐÁP ÁN/i, /^IV\./i);
  const scoring = section(content, /^IV\.\s*THANG ĐIỂM/i, /^V\./i);
  const matrix = section(content, /^V\.\s*MA TRẬN/i, /^VI\./i);
  const specification = section(content, /^VI\.\s*BẢN ĐẶC TẢ/i, /^(YÊU CẦU THÊM|GHI CHÚ GIÁO VIÊN)/i);
  const structuredTrueFalse = document.structuredExam?.parts.find((part) => part.type === "true_false")?.questions ?? [];
  const children: (Paragraph | Table)[] = [
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
    const remainingAnswer = answer
      .replace(/^Trắc nghiệm:.*$/im, "")
      .replace(/^PHẦN II:[\s\S]*?(?=^PHẦN III:)/im, "")
      .trim();
    if (structuredTrueFalse.length) {
      children.push(paragraph("PHẦN II", { bold: true, before: 100, after: 60 }));
      children.push(docxTable({
        headers: ["Câu", "a", "b", "c", "d"],
        rows: structuredTrueFalse.map((question) => [
          String(question.number),
          ...(question.trueFalseItems ?? []).map((item) => item.answer ? "Đúng" : "Sai")
        ])
      }));
    }
    children.push(...teacherBlocks(remainingAnswer.replace(/^PHẦN III:\s*/im, "").trim()));
  }
  if (scoring) {
    children.push(paragraph("II. HƯỚNG DẪN CHẤM", { bold: true, before: 180, after: 90 }), ...teacherBlocks(scoring));
  }
  if (matrix) {
    children.push(paragraph("III. MA TRẬN ĐỀ", { bold: true, before: 180, after: 90 }));
    children.push(...teacherBlocks(matrix));
  }
  if (specification) children.push(paragraph("IV. BẢN ĐẶC TẢ", { bold: true, before: 180, after: 90 }), ...teacherBlocks(specification));
  if (document.structuredExam?.teacherOnly.notes) children.push(paragraph("GHI CHÚ GIÁO VIÊN", { bold: true, before: 180, after: 90 }), paragraph(document.structuredExam.teacherOnly.notes));
  return children;
}

export async function buildOfficialExamDocxBlob(document: GeneratedDocument) {
  document = normalizeGeneratedDocument(document);
  const settings = getDocumentSettings();
  const meta = document.examMeta ?? {};
  const subject = meta.subject || document.title.match(/Đề kiểm tra\s+(.+?)\s+lớp/i)?.[1] || extract(document.content, "Môn học") || "................................";
  const grade = meta.grade || extract(document.content, "Lớp") || "........";
  const duration = meta.duration || extract(document.content, "Thời gian làm bài") || "........ phút";
  const schoolName = meta.schoolName || settings.schoolName || "TRƯỜNG THPT ...";
  const department = settings.department || "SỞ GIÁO DỤC VÀ ĐÀO TẠO";
  const schoolYear = settings.schoolYear ? `NĂM HỌC ${settings.schoolYear}` : "";
  const examCode = (meta.examCode || document.content.match(/Mã đề:\s*(\d+)/i)?.[1] || "0101").padStart(4, "0");
  const explicitPart1 = cleanStudentBody(section(document.content, /^PHẦN I\./i, /^PHẦN II\./i));
  const explicitPart2 = cleanStudentBody(section(document.content, /^PHẦN II\./i, /^PHẦN III\./i));
  const explicitPart3 = cleanStudentBody(section(document.content, /^PHẦN III\./i, /^(PHẦN DÀNH CHO GIÁO VIÊN|III\.\s*ĐÁP ÁN)/i));
  const mc = explicitPart1 || cleanStudentBody(section(document.content, /^I\.\s*TRẮC NGHIỆM/i, /^II\./i)) || structuredSectionText(document, "multiple_choice");
  const trueFalse = explicitPart2 && /(^|\n)[a-d]\)/im.test(explicitPart2) ? explicitPart2 : structuredSectionText(document, "true_false");
  const essay = explicitPart3 || (!trueFalse ? cleanStudentBody(section(document.content, /^II\.\s*TỰ LUẬN/i, /^III\./i)) : "") || structuredSectionText(document, "short_answer");
  const mcCount = [...mc.matchAll(/^Câu\s+\d+\./gim)].length;
  const trueFalseCount = [...trueFalse.matchAll(/^Câu\s+\d+\./gim)].length;
  const essayCount = [...essay.matchAll(/^Câu\s+\d+\./gim)].length;

  const header = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [4700, 5300],
    borders: noBorders,
    rows: [new TableRow({
      children: [
        new TableCell({ width: { size: 47, type: WidthType.PERCENTAGE }, borders: noBorders, children: [
          paragraph(department.toUpperCase(), { bold: true, center: true, size: 24, after: 40 }),
          paragraph(schoolName.toUpperCase(), { bold: true, center: true, size: 24, after: 40 }),
          paragraph("(Đề có .... trang)", { italics: true, center: true, size: 22 })
        ] }),
        new TableCell({ width: { size: 53, type: WidthType.PERCENTAGE }, borders: noBorders, children: [
          paragraph("ĐỀ THI THỬ", { bold: true, center: true, size: 24, after: 20 }),
          paragraph(`KỲ THI TỐT NGHIỆP THPT NĂM ${schoolYear.match(/\d{4}/)?.[0] || new Date().getFullYear()}`, { bold: true, center: true, size: 24, after: 20 }),
          paragraph(`MÔN: ${subject.toUpperCase()} ${grade}`, { bold: true, center: true, size: 24, after: 20 }),
          paragraph(`Thời gian làm bài: ${duration}, không kể thời gian phát đề.`, { italics: true, center: true, size: 22 })
        ] })
      ]
    })]
  });

  const candidateRow = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [7900, 2100],
    borders: noBorders,
    rows: [new TableRow({ children: [
      new TableCell({ width: { size: 79, type: WidthType.PERCENTAGE }, borders: noBorders, margins: { top: 80, bottom: 40, left: 0, right: 100 }, children: [paragraph("Họ và tên thí sinh: ...................................................   Số báo danh: ...................", { after: 0 })] }),
      new TableCell({ width: { size: 21, type: WidthType.PERCENTAGE }, borders: thinBorders, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [paragraph(`Mã đề: ${examCode}`, { bold: true, center: true, size: 24, after: 0 })] })
    ] })]
  });

  const studentChildren: (Paragraph | Table)[] = [
    header,
    candidateRow,
    paragraph("", { after: 80, borderBottom: true }),
    ...(mc ? [
      paragraph(`PHẦN I. Thí sinh trả lời từ câu 1 đến câu ${mcCount || 12}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.`, { bold: true, before: 60, after: 35 }),
      ...questionBlocks(mc)
    ] : []),
    ...(trueFalse ? [
      paragraph(`PHẦN II. Thí sinh trả lời từ câu 1 đến câu ${trueFalseCount || 4}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.`, { bold: true, before: 100, after: 35 }),
      ...bodyParagraphs(trueFalse)
    ] : []),
    ...(essay ? [
      paragraph(`PHẦN III. Thí sinh trả lời từ câu 1 đến câu ${essayCount || 6}.`, { bold: true, before: 100, after: 35 }),
      ...bodyParagraphs(essay)
    ] : []),
    paragraph("------ HẾT ------", { bold: true, italics: true, center: true, before: 160, after: 30 })
  ];

  const footer = new Footer({ children: [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { ...noBorders, top: { style: BorderStyle.SINGLE, size: 4, color: "000000" } },
    rows: [new TableRow({ children: [
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: footerCellBorders, children: [paragraph(`Mã đề ${examCode}`, { after: 0 })] }),
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: footerCellBorders, children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [run("Trang "), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: BODY_SIZE }), run("/"), new TextRun({ children: [PageNumber.TOTAL_PAGES_IN_SECTION], font: FONT, size: BODY_SIZE })] })] })
    ] })]
  })] });

  const docx = new Document({
    styles: { default: { document: { run: { font: FONT, size: BODY_SIZE }, paragraph: { spacing: { line: 252, after: 45 } } } } },
    sections: [
      {
        footers: { default: footer },
        properties: {
        page: {
          size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
          margin: {
            top: convertMillimetersToTwip(13),
            bottom: convertMillimetersToTwip(14),
            left: convertMillimetersToTwip(16),
            right: convertMillimetersToTwip(16),
            footer: convertMillimetersToTwip(7)
          }
        }
      },
        children: studentChildren
      },
      {
        footers: { default: new Footer({ children: [paragraph("", { after: 0 })] }) },
        properties: {
          type: SectionType.NEXT_PAGE,
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
        children: teacherContent(document)
      }
    ]
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
  const code = (document.examMeta?.examCode || "0101").padStart(4, "0");
  link.download = `${safeFileName(`De-kiem-tra-${subject}${grade}-ma-de-${code}`)}.docx`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

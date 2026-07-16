import { createQrPayload } from "@/lib/answer-sheet/checksum";
import type { AnswerSheetLayout, AnswerSheetPageLayout, AnswerSheetSection, AnswerSheetTemplate, BoundingBox, LayoutPrimitive, RecognitionRegion } from "@/lib/answer-sheet/types";

const PAGE_SIZES = {
  A4_PORTRAIT: { width: 595.28, height: 841.89 },
  A4_LANDSCAPE: { width: 841.89, height: 595.28 },
  A5: { width: 419.53, height: 595.28 },
  A4_TWO_UP: { width: 595.28, height: 841.89 },
} as const;

const MARGIN = 28;
const HEADER_HEIGHT = 122;
const ANCHOR_SIZE = 13;

type WorkingPage = { primitives: LayoutPrimitive[]; regions: RecognitionRegion[]; cursorY: number };

function text(primitives: LayoutPrimitive[], value: string, x: number, y: number, size = 9, width?: number, bold = false, align: "left" | "center" | "right" = "left") {
  primitives.push({ kind: "text", text: value, x, y, size, width, bold, align });
}

function rect(primitives: LayoutPrimitive[], box: BoundingBox, lineWidth = 0.8, fill?: string) {
  primitives.push({ kind: "rect", ...box, lineWidth, fill });
}

function circle(primitives: LayoutPrimitive[], x: number, y: number, radius: number) {
  primitives.push({ kind: "circle", x, y, radius, lineWidth: 0.9 });
}

function addAnchors(page: WorkingPage, width: number, height: number, copyIndex?: number, offsetY = 0) {
  const positions = [
    [MARGIN, MARGIN + offsetY], [width - MARGIN - ANCHOR_SIZE, MARGIN + offsetY],
    [MARGIN, height - MARGIN - ANCHOR_SIZE + offsetY], [width - MARGIN - ANCHOR_SIZE, height - MARGIN - ANCHOR_SIZE + offsetY],
  ];
  positions.forEach(([x, y], index) => {
    rect(page.primitives, { x, y, width: ANCHOR_SIZE, height: ANCHOR_SIZE }, 1.2, "#000000");
    rect(page.primitives, { x: x + 3, y: y + 3, width: ANCHOR_SIZE - 6, height: ANCHOR_SIZE - 6 }, 0, "#ffffff");
    page.regions.push({ id: `anchor-${copyIndex ?? 0}-${index}`, type: "anchor", expectedShape: "square", boundingBox: { x, y, width: ANCHOR_SIZE, height: ANCHOR_SIZE }, copyIndex });
  });
}

function studentFieldLabel(key: keyof AnswerSheetTemplate["studentFields"]) {
  return { fullName: "Họ và tên", className: "Lớp", candidateNumber: "Số báo danh", studentCode: "Mã học sinh", examDate: "Ngày kiểm tra" }[key];
}

function addHeader(page: WorkingPage, template: AnswerSheetTemplate, width: number, contentHeight: number, copyIndex?: number, offsetY = 0) {
  if (template.recognition.cornerAnchorsEnabled) addAnchors(page, width, contentHeight, copyIndex, offsetY);
  const innerWidth = width - MARGIN * 2;
  text(page.primitives, template.schoolName || "SOẠN LAB", MARGIN + 20, offsetY + 34, 8, innerWidth * 0.42, true);
  text(page.primitives, template.title.toUpperCase(), MARGIN, offsetY + 48, 15, innerWidth, true, "center");
  text(page.primitives, `${template.subject ? `Môn: ${template.subject}` : ""}${template.grade ? ` · Khối: ${template.grade}` : ""}${template.durationMinutes ? ` · Thời gian: ${template.durationMinutes} phút` : ""}`, MARGIN, offsetY + 68, 9, innerWidth, false, "center");
  if (template.recognition.printedVariantCode) {
    const codeBox = { x: width - MARGIN - 90, y: offsetY + 48, width: 72, height: 22 };
    rect(page.primitives, codeBox, 1);
    text(page.primitives, `MÃ ĐỀ: ${template.variantCode || "____"}`, codeBox.x, codeBox.y + 6, 9, codeBox.width, true, "center");
    page.regions.push({ id: `exam-code-${copyIndex ?? 0}`, type: "exam_code", expectedShape: "text", boundingBox: codeBox, copyIndex });
  }
  if (template.recognition.qrEnabled) {
    const qrBox = { x: MARGIN + 20, y: offsetY + 45, width: 38, height: 38 };
    rect(page.primitives, qrBox, 0.5);
    page.regions.push({ id: `qr-${copyIndex ?? 0}`, type: "qr", expectedShape: "square", boundingBox: qrBox, copyIndex });
  }
  let fieldX = MARGIN + 20;
  let fieldY = offsetY + 86;
  const enabled = (Object.keys(template.studentFields) as Array<keyof AnswerSheetTemplate["studentFields"]>).filter((key) => template.studentFields[key]);
  enabled.forEach((key, index) => {
    const fieldWidth = key === "fullName" ? Math.min(260, innerWidth * 0.54) : Math.min(140, innerWidth * 0.3);
    if (fieldX + fieldWidth > width - MARGIN - 10) { fieldX = MARGIN + 20; fieldY += 22; }
    text(page.primitives, `${studentFieldLabel(key)}:`, fieldX, fieldY, 8, undefined, true);
    const labelWidth = key === "candidateNumber" || key === "studentCode" ? 72 : key === "examDate" ? 68 : key === "fullName" ? 60 : 24;
    page.primitives.push({ kind: "line", x1: fieldX + labelWidth, y1: fieldY + 10, x2: fieldX + fieldWidth, y2: fieldY + 10, width: 0.7 });
    page.regions.push({ id: `student-${key}-${copyIndex ?? 0}`, type: "student_field", optionValue: key, expectedShape: "text", boundingBox: { x: fieldX + labelWidth, y: fieldY - 2, width: fieldWidth - labelWidth, height: 15 }, copyIndex });
    fieldX += fieldWidth + 14;
    if (index === enabled.length - 1) fieldY += 18;
  });
  page.cursorY = Math.max(offsetY + HEADER_HEIGHT, fieldY + 4);
}

function sectionHeading(page: WorkingPage, titleValue: string, width: number) {
  rect(page.primitives, { x: MARGIN + 18, y: page.cursorY, width: width - MARGIN * 2 - 36, height: 20 }, 0.5, "#eef4ff");
  text(page.primitives, titleValue, MARGIN + 24, page.cursorY + 5, 9, width - MARGIN * 2 - 48, true);
  page.cursorY += 25;
}

function bubbleRegion(page: WorkingPage, input: { id: string; x: number; y: number; questionId: string; questionNumber: number; option: string; statementId?: string; copyIndex?: number }) {
  const radius = 6;
  circle(page.primitives, input.x, input.y, radius);
  page.regions.push({ id: input.id, type: "bubble", questionId: input.questionId, questionNumber: input.questionNumber, statementId: input.statementId, optionValue: input.option, expectedShape: "circle", boundingBox: { x: input.x - radius, y: input.y - radius, width: radius * 2, height: radius * 2 }, copyIndex: input.copyIndex });
}

function addMcq(page: WorkingPage, section: Extract<AnswerSheetSection, { type: "multiple_choice" }>, width: number, usableBottom: number, newPage: () => WorkingPage, copyIndex?: number, density = 1) {
  let current = page;
  sectionHeading(current, section.title || "PHẦN TRẮC NGHIỆM", width);
  const rowHeight = 19 * density;
  const columnWidth = width < 500 ? width - MARGIN * 2 - 36 : 170;
  const columns = Math.max(1, Math.min(width > 760 ? 4 : width > 560 ? 3 : 2, Math.floor((width - MARGIN * 2 - 36) / columnWidth)));
  let index = 0;
  while (index < section.questions.length) {
    const rowsPerColumn = Math.max(1, Math.floor((usableBottom - current.cursorY) / rowHeight));
    const capacity = rowsPerColumn * columns;
    if (capacity < 1) { current = newPage(); sectionHeading(current, `${section.title} (tiếp)`, width); continue; }
    const chunk = section.questions.slice(index, index + capacity);
    chunk.forEach((question, localIndex) => {
      const col = Math.floor(localIndex / rowsPerColumn);
      const row = localIndex % rowsPerColumn;
      const x = MARGIN + 20 + col * columnWidth;
      const y = current.cursorY + row * rowHeight + 7;
      text(current.primitives, String(question.questionNumber).padStart(2, "0"), x, y - 4, 8, 20, true);
      section.options.forEach((option, optionIndex) => {
        const bx = x + 34 + optionIndex * 28;
        bubbleRegion(current, { id: `${question.questionId}:${option}:${copyIndex ?? 0}`, x: bx, y, questionId: question.questionId, questionNumber: question.questionNumber, option, copyIndex });
        text(current.primitives, option, bx + 8, y - 4, 7, 9, true);
      });
    });
    current.cursorY += Math.min(rowsPerColumn, chunk.length) * rowHeight + 8;
    index += chunk.length;
    if (index < section.questions.length) { current = newPage(); sectionHeading(current, `${section.title} (tiếp)`, width); }
  }
  return current;
}

function addTrueFalse(page: WorkingPage, section: Extract<AnswerSheetSection, { type: "true_false" }>, width: number, usableBottom: number, newPage: () => WorkingPage, copyIndex?: number, density = 1) {
  let current = page;
  sectionHeading(current, section.title || "PHẦN ĐÚNG/SAI", width);
  for (const question of section.questions) {
    const needed = 20 + question.statements.length * 19 * density;
    if (current.cursorY + needed > usableBottom) { current = newPage(); sectionHeading(current, `${section.title} (tiếp)`, width); }
    text(current.primitives, `Câu ${question.questionNumber}`, MARGIN + 22, current.cursorY + 3, 9, 70, true);
    text(current.primitives, "Đ", MARGIN + 124, current.cursorY + 3, 8, 18, true, "center");
    text(current.primitives, "S", MARGIN + 160, current.cursorY + 3, 8, 18, true, "center");
    current.cursorY += 18;
    question.statements.forEach((statement) => {
      const y = current.cursorY + 7;
      text(current.primitives, `Mệnh đề ${statement.label}`, MARGIN + 38, current.cursorY + 3, 8, 70);
      bubbleRegion(current, { id: `${statement.statementId}:true:${copyIndex ?? 0}`, x: MARGIN + 133, y, questionId: question.questionId, questionNumber: question.questionNumber, statementId: statement.statementId, option: "true", copyIndex });
      bubbleRegion(current, { id: `${statement.statementId}:false:${copyIndex ?? 0}`, x: MARGIN + 169, y, questionId: question.questionId, questionNumber: question.questionNumber, statementId: statement.statementId, option: "false", copyIndex });
      current.cursorY += 19 * density;
    });
    current.cursorY += 7;
  }
  return current;
}

function addShort(page: WorkingPage, section: Extract<AnswerSheetSection, { type: "short_answer" }>, width: number, usableBottom: number, newPage: () => WorkingPage, copyIndex?: number, density = 1) {
  let current = page;
  sectionHeading(current, section.title || "PHẦN TRẢ LỜI NGẮN", width);
  const boxHeight = (section.mode === "free" ? 39 : 31) * density;
  for (const question of section.questions) {
    if (current.cursorY + boxHeight + 10 > usableBottom) { current = newPage(); sectionHeading(current, `${section.title} (tiếp)`, width); }
    text(current.primitives, `Câu ${question.questionNumber}`, MARGIN + 22, current.cursorY + 10, 9, 45, true);
    const box = { x: MARGIN + 70, y: current.cursorY, width: width - MARGIN * 2 - 92, height: boxHeight };
    rect(current.primitives, box, 0.9);
    if (section.mode === "structured_numeric") {
      const cellWidth = 24;
      for (let x = box.x + cellWidth; x < box.x + box.width - 35; x += cellWidth) current.primitives.push({ kind: "line", x1: x, y1: box.y, x2: x, y2: box.y + box.height, width: 0.5 });
      text(current.primitives, "Dấu · phần nguyên · thập phân/phân số · đơn vị", box.x + 4, box.y + box.height - 10, 6, box.width - 8);
    }
    current.regions.push({ id: `${question.questionId}:short:${copyIndex ?? 0}`, type: "short_answer", questionId: question.questionId, questionNumber: question.questionNumber, expectedShape: "rectangle", boundingBox: box, copyIndex });
    current.cursorY += boxHeight + 10;
  }
  return current;
}

function addEssay(page: WorkingPage, section: Extract<AnswerSheetSection, { type: "essay" }>, width: number, usableBottom: number, newPage: () => WorkingPage, copyIndex?: number) {
  let current = page;
  sectionHeading(current, section.title || "PHẦN TỰ LUẬN", width);
  const heights = { none: 0, short_lines: 110, half_page: 250, full_page: 520, separate_page: 560 };
  for (const question of section.questions) {
    const requested = heights[section.space];
    if (!requested) continue;
    if (section.space === "separate_page" || current.cursorY + Math.min(requested, usableBottom - HEADER_HEIGHT) > usableBottom) { current = newPage(); sectionHeading(current, `Câu ${question.questionNumber} · Bài làm tự luận`, width); }
    const height = Math.min(requested, usableBottom - current.cursorY - 5);
    const box = { x: MARGIN + 20, y: current.cursorY, width: width - MARGIN * 2 - 40, height };
    rect(current.primitives, box, 0.7);
    for (let y = box.y + 23; y < box.y + box.height; y += 22) current.primitives.push({ kind: "line", x1: box.x + 5, y1: y, x2: box.x + box.width - 5, y2: y, width: 0.35 });
    current.regions.push({ id: `${question.questionId}:essay:${copyIndex ?? 0}`, type: "essay", questionId: question.questionId, questionNumber: question.questionNumber, expectedShape: "rectangle", boundingBox: box, copyIndex });
    current.cursorY += height + 10;
  }
  return current;
}

function buildLogicalPages(template: AnswerSheetTemplate, width: number, height: number, copyIndex?: number, offsetY = 0) {
  const pages: WorkingPage[] = [];
  const makePage = () => {
    const page: WorkingPage = { primitives: [], regions: [], cursorY: offsetY + HEADER_HEIGHT };
    addHeader(page, template, width, height, copyIndex, offsetY);
    pages.push(page);
    return page;
  };
  let page = makePage();
  const density = template.density === "comfortable" ? 1.14 : template.density === "compact" ? 0.88 : 1;
  const usableBottom = offsetY + height - MARGIN - 10;
  const newPage = () => { page = makePage(); return page; };
  for (const section of template.sections) {
    if (page.cursorY + 45 > usableBottom) page = newPage();
    if (section.type === "multiple_choice") page = addMcq(page, section, width, usableBottom, newPage, copyIndex, density);
    else if (section.type === "true_false") page = addTrueFalse(page, section, width, usableBottom, newPage, copyIndex, density);
    else if (section.type === "short_answer") page = addShort(page, section, width, usableBottom, newPage, copyIndex, density);
    else page = addEssay(page, section, width, usableBottom, newPage, copyIndex);
  }
  return pages;
}

function finalizePages(template: AnswerSheetTemplate, working: WorkingPage[], width: number, height: number): AnswerSheetPageLayout[] {
  return working.map((page, index) => {
    const pageNumber = index + 1;
    if (template.recognition.pageNumbersEnabled) text(page.primitives, `Trang ${pageNumber}/${working.length} · Mẫu ${template.recognition.templateVersion}`, MARGIN, height - 22, 7, width - MARGIN * 2, false, "center");
    return { pageNumber, width, height, primitives: page.primitives, recognitionRegions: page.regions, qrPayload: template.recognition.qrEnabled ? JSON.stringify(createQrPayload(template, pageNumber)) : undefined };
  });
}

export function buildAnswerSheetLayout(template: AnswerSheetTemplate): AnswerSheetLayout {
  const size = PAGE_SIZES[template.pageSize];
  const warnings: string[] = [];
  if (template.pageSize === "A4_TWO_UP") {
    const halfHeight = size.height / 2;
    const first = buildLogicalPages(template, size.width, halfHeight, 1, 0);
    const second = buildLogicalPages(template, size.width, halfHeight, 2, halfHeight);
    const pageCount = Math.max(first.length, second.length);
    const combined = Array.from({ length: pageCount }, (_, index): WorkingPage => ({ primitives: [...(first[index]?.primitives || []), ...(second[index]?.primitives || []), { kind: "line", x1: MARGIN, y1: halfHeight, x2: size.width - MARGIN, y2: halfHeight, width: 0.5, dash: true }], regions: [...(first[index]?.regions || []), ...(second[index]?.regions || [])], cursorY: size.height }));
    warnings.push("Mỗi trang A4 chứa hai bản phiếu giống nhau; cắt theo đường nét đứt trước khi phát cho học sinh.");
    return { templateId: template.recognition.templateId, pages: finalizePages(template, combined, size.width, size.height), warnings };
  }
  const pages = buildLogicalPages(template, size.width, size.height);
  if (pages.length > 1) warnings.push(`Nội dung được chia thành ${pages.length} trang để giữ ô trả lời đủ lớn.`);
  return { templateId: template.recognition.templateId, pages: finalizePages(template, pages, size.width, size.height), warnings };
}

export function pageSizePoints(pageSize: AnswerSheetTemplate["pageSize"]) {
  return PAGE_SIZES[pageSize];
}

import type { GeneratedDocument } from "@/lib/types";

function section(content: string, start: RegExp, end?: RegExp) {
  const lines = content.split(/\r?\n/);
  const first = lines.findIndex((line) => start.test(line.trim()));
  if (first < 0) return "";
  const remaining = lines.slice(first + 1);
  const last = end ? remaining.findIndex((line) => end.test(line.trim())) : -1;
  return remaining.slice(0, last < 0 ? undefined : last).join("\n").trim();
}

function clean(text: string) {
  return text
    .replace(/^Khoanh tròn.+$/im, "")
    .replace(/^Học sinh trình bày.+$/im, "")
    .replace(/^Không có phần.+$/im, "")
    .replace(/^PHẦN DÀNH CHO GIÁO VIÊN$/im, "")
    .trim();
}

export type ExamPrintQuestion = {
  number: string;
  stem: string;
  options: { label: string; text: string }[];
  subItems: { label: string; text: string }[];
  extra: string[];
};

export function parseExamQuestions(text: string): ExamPrintQuestion[] {
  return text.split(/(?=^Câu\s+\d+\.)/gim).map((block) => block.trim()).filter(Boolean).map((block) => {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const first = lines.shift() || "";
    const match = first.match(/^Câu\s+(\d+)\.\s*(.*)$/i);
    const options: ExamPrintQuestion["options"] = [];
    const subItems: ExamPrintQuestion["subItems"] = [];
    const extra: string[] = [];
    for (const line of lines) {
      const option = line.match(/^([A-D])\.\s*(.*)$/);
      const subItem = line.match(/^([a-d])\)\s*(.*)$/i);
      if (option) options.push({ label: option[1], text: option[2] });
      else if (subItem) subItems.push({ label: subItem[1].toLowerCase(), text: subItem[2] });
      else extra.push(line);
    }
    return { number: match?.[1] || "", stem: match?.[2] || first, options, subItems, extra };
  });
}

export function parseExamForPrint(document: GeneratedDocument) {
  const content = document.content;
  const explicitPart1 = clean(section(content, /^PHẦN I\./i, /^PHẦN II\./i));
  const explicitPart2 = clean(section(content, /^PHẦN II\./i, /^PHẦN III\./i));
  const explicitPart3 = clean(section(content, /^PHẦN III\./i, /^(PHẦN DÀNH CHO GIÁO VIÊN|III\.\s*ĐÁP ÁN)/i));
  const part1 = explicitPart1 || clean(section(content, /^I\.\s*TRẮC NGHIỆM/i, /^II\./i));
  const part2 = explicitPart2 && /(^|\n)[a-d]\)/im.test(explicitPart2) ? explicitPart2 : "";
  const part3 = explicitPart3 || (!part2 ? clean(section(content, /^II\.\s*TỰ LUẬN/i, /^III\./i)) : "");
  return {
    part1: parseExamQuestions(part1),
    part2: parseExamQuestions(part2),
    part3: parseExamQuestions(part3),
    answer: section(content, /^III\.\s*ĐÁP ÁN/i, /^IV\./i),
    scoring: section(content, /^IV\.\s*THANG ĐIỂM/i, /^V\./i),
    matrix: section(content, /^V\.\s*MA TRẬN/i, /^VI\./i),
    specification: section(content, /^VI\.\s*BẢN ĐẶC TẢ/i, /^(YÊU CẦU THÊM|GHI CHÚ GIÁO VIÊN)/i)
  };
}

import { auditAndUpdate } from "@/lib/question-bank-core/audit";
import { createCanonicalQuestion } from "@/lib/question-bank-core/normalize";
import type { CanonicalQuestionType, QuestionBankItem } from "@/lib/question-bank-core/types";

export type ImportReviewItem = {
  id: string;
  selected: boolean;
  status: "valid" | "warning" | "error" | "excluded";
  warnings: string[];
  item: QuestionBankItem;
};

function key(value: string) {
  return value.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]/g, "");
}

function questionType(value: string): CanonicalQuestionType {
  const normalized = key(value);
  if (/dungsai|truefalse/.test(normalized)) return "true_false";
  if (/traloi.*ngan|shortanswer|numeric/.test(normalized)) return "short_answer";
  if (/dienkhuyet|fillblank/.test(normalized)) return "fill_blank";
  if (/ghepdoi|matching/.test(normalized)) return "matching";
  if (/sapxep|ordering/.test(normalized)) return "ordering";
  if (/hoanthanhbang|table/.test(normalized)) return "table_completion";
  if (/tuluan|essay/.test(normalized)) return "essay";
  return "multiple_choice";
}

function booleanAnswer(value: string) {
  return /^(d|đ|dung|đúng|true|1|x)$/i.test(value.trim());
}

const aliases = {
  subject: ["mon", "monhoc", "subject"], grade: ["lop", "khoi", "grade"], topic: ["chude", "topic"], subtopic: ["chudecon", "subtopic"],
  type: ["dangcau", "loaicauhoi", "loaicau", "type"], prompt: ["cauhoi", "noidungcauhoi", "noidung", "question", "prompt"],
  answer: ["dapan", "dapandung", "answer", "correctanswer"], explanation: ["loigiai", "explanation", "huongdancham"],
  difficulty: ["dokho", "mucdo", "difficulty"], cognitive: ["mucdonhanthuc", "cognitivelevel"], score: ["diem", "score"], tags: ["tags", "tag"],
  bookSeries: ["bosach", "bookseries"], accepted: ["dapan chapnhan", "dapanchapnhan", "acceptedanswers"], unit: ["donvi", "unit"],
} as const;

function indexFor(headers: string[], names: readonly string[]) { return headers.findIndex((header) => names.map(key).includes(header)); }
function get(row: string[], headers: string[], names: readonly string[]) { const index = indexFor(headers, names); return index >= 0 ? String(row[index] || "").trim() : ""; }

function splitDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = []; let current = ""; let quoted = false;
  for (let index = 0; index < line.length; index += 1) { const char = line[index]; if (char === '"' && quoted && line[index + 1] === '"') { current += '"'; index += 1; } else if (char === '"') quoted = !quoted; else if (char === delimiter && !quoted) { cells.push(current.trim()); current = ""; } else current += char; }
  cells.push(current.trim()); return cells;
}

export function importRowsFromDelimited(text: string, sourceName = "CSV") {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const delimiter = [";", "\t", ","].map((value) => ({ value, count: splitDelimitedLine(lines[0], value).length })).sort((a, b) => b.count - a.count)[0].value;
  return importRowsFromTable(lines.map((line) => splitDelimitedLine(line, delimiter)), sourceName);
}

function difficulty(value: string): QuestionBankItem["difficulty"] {
  const normalized = key(value);
  if (normalized === "nhanbiet" || normalized === "nb") return "Nhận biết";
  if (normalized === "vandung" || normalized === "vd") return "Vận dụng";
  if (normalized === "vandungcao" || normalized === "vdc") return "Vận dụng cao";
  return "Thông hiểu";
}

export function importRowsFromTable(rows: string[][], sourceName = "file nhập") {
  const cleanRows = rows.filter((row) => row.some((cell) => String(cell || "").trim()));
  if (!cleanRows.length) return [];
  const headers = cleanRows[0].map((cell) => key(String(cell || "")));
  const hasHeader = indexFor(headers, aliases.prompt) >= 0;
  if (!hasHeader) return [];
  return cleanRows.slice(1).map((row, rowIndex) => {
    const type = questionType(get(row, headers, aliases.type));
    const option = (label: string) => get(row, headers, [label, `phuongan${label}`, `option${label}`]);
    const options = ["a", "b", "c", "d"].map((label) => ({ id: label.toUpperCase(), label: label.toUpperCase(), text: option(label) })).filter((item) => item.text);
    const statements = ["a", "b", "c", "d"].map((label) => {
      const text = get(row, headers, [`menhde${label}`, `statement${label}`]);
      const answer = get(row, headers, [`dapan${label}`, `answer${label}`]);
      return text ? { id: `s-${rowIndex + 1}-${label}`, label, text, answer: booleanAnswer(answer) } : null;
    }).filter((item): item is NonNullable<typeof item> => Boolean(item));
    const answer = get(row, headers, aliases.answer);
    const item = createCanonicalQuestion({
      type, prompt: get(row, headers, aliases.prompt), subject: get(row, headers, aliases.subject), grade: get(row, headers, aliases.grade),
      topic: get(row, headers, aliases.topic), subtopic: get(row, headers, aliases.subtopic), difficulty: difficulty(get(row, headers, aliases.difficulty)),
      cognitiveLevel: difficulty(get(row, headers, aliases.cognitive)), bookSeries: get(row, headers, aliases.bookSeries) || "Khác",
      score: Math.max(0, Number(get(row, headers, aliases.score)) || 0), tags: get(row, headers, aliases.tags).split(/[,;]/).map((value) => value.trim()).filter(Boolean),
      options, correctOptionIds: type === "multiple_choice" ? answer.toUpperCase().split(/[,;]/).map((value) => value.trim()).filter(Boolean) : [],
      trueFalseStatements: statements, answer: type === "multiple_choice" || type === "true_false" ? "" : answer,
      acceptedAnswers: get(row, headers, aliases.accepted).split(/[|;]/).map((value) => value.trim()).filter(Boolean), unit: get(row, headers, aliases.unit),
      explanation: get(row, headers, aliases.explanation), source: { type: "import", name: sourceName },
    });
    return toReviewItem(item, rowIndex);
  });
}

function splitQuestionChunks(text: string) {
  const normalized = text.replace(/\r/g, "").trim();
  const chunks = normalized.split(/\n(?=\s*(?:Câu|Bài|Question)\s*\d+\s*[.:)])/i).map((value) => value.trim()).filter(Boolean);
  return chunks.length > 1 ? chunks : normalized.split(/\n{2,}/).map((value) => value.trim()).filter((value) => value.length > 8);
}

export function importRowsFromText(text: string, sourceName = "nội dung đã dán") {
  return splitQuestionChunks(text).slice(0, 500).map((chunk, index) => {
    const option = (label: string) => chunk.match(new RegExp(`(?:^|\\n)\\s*${label}[.)]\\s*([^\\n]+)`, "i"))?.[1]?.trim() || "";
    const options = ["A", "B", "C", "D"].map((label) => ({ id: label, label, text: option(label) })).filter((item) => item.text);
    const answerMatch = chunk.match(/(?:Đáp án|Answer)\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() || "";
    const prompt = chunk.replace(/^(?:Câu|Bài|Question)\s*\d+\s*[.:)]\s*/i, "").replace(/\n\s*[A-D][.)]\s*[^\n]+/gi, "").replace(/\n\s*(?:Đáp án|Answer)\s*[:：][^\n]+/i, "").trim();
    const type: CanonicalQuestionType = options.length >= 2 ? "multiple_choice" : "essay";
    return toReviewItem(createCanonicalQuestion({ type, prompt, options, correctOptionIds: type === "multiple_choice" && /^[A-D]$/i.test(answerMatch) ? [answerMatch.toUpperCase()] : [], answer: type === "essay" ? answerMatch : "", source: { type: "text_import", name: sourceName } }), index);
  });
}

export function toReviewItem(input: QuestionBankItem, index = 0): ImportReviewItem {
  const item = auditAndUpdate(input);
  const status = item.quality.status === "invalid" ? "error" : item.quality.status === "needs_review" ? "warning" : "valid";
  return { id: `review-${index}-${item.id}`, selected: status !== "error", status, warnings: item.quality.issues, item };
}

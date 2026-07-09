import { NextRequest, NextResponse } from "next/server";
import { inflateRawSync } from "node:zlib";
import { buildQuestionBankImportPrompt } from "@/lib/ai/prompts/question-bank-import";
import { extractJson } from "@/lib/ai/extract-json";
import { getConfiguredProvider } from "@/lib/ai/provider";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getCurrentUser } from "@/lib/auth/user";

const maxFileSize = 5 * 1024 * 1024;
const supportedExtensions = [".txt", ".md", ".csv", ".tsv", ".xlsx", ".docx"];
const templateHeaders = [
  "monhoc",
  "lop",
  "chude",
  "loaicauhoi",
  "mucdo",
  "noidungcauhoi",
  "phuongana",
  "phuonganb",
  "phuonganc",
  "phuongand",
  "dapandung",
  "loigiai",
  "ghichu",
];

type ImportCandidate = {
  subject: string;
  grade: string;
  topic: string;
  questionType: string;
  difficulty: string;
  content: string;
  options?: Partial<Record<"A" | "B" | "C" | "D", string>>;
  answer: string;
  explanation: string;
  note: string;
  warnings: string[];
  metadata?: Record<string, unknown>;
};

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function extensionOf(name: string) {
  const match = name.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] || "";
}

function stripVietnamese(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "");
}

function splitDelimitedLine(line: string, delimiter: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (quoted && line[index + 1] === "\"") {
        value += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value.trim());
  return values;
}

function detectDelimiter(line: string) {
  return [";", "\t", ","]
    .map((delimiter) => ({ delimiter, count: splitDelimitedLine(line, delimiter).length }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter || ",";
}

function rowsFromDelimited(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const delimiter = detectDelimiter(lines[0]);
  return lines.map((line) => splitDelimitedLine(line, delimiter));
}

function deterministicRows(rawRows: string[][]): ImportCandidate[] {
  const [headerRow, ...dataRows] = rawRows.filter((row) => row.some((cell) => String(cell || "").trim()));
  if (!headerRow) return [];
  const headers = headerRow.map((cell) => stripVietnamese(String(cell || "")));
  const hasTemplateHeaders = templateHeaders.slice(0, 6).every((header) => headers.includes(header));
  if (!hasTemplateHeaders) return [];
  const indexOf = (aliases: string[]) => headers.findIndex((header) => aliases.includes(header));
  const get = (row: string[], aliases: string[]) => {
    const index = indexOf(aliases);
    return index >= 0 ? String(row[index] || "").trim() : "";
  };
  return dataRows.map((row) => ({
    subject: get(row, ["monhoc", "subject"]),
    grade: get(row, ["lop", "grade"]),
    topic: get(row, ["chude", "topic"]),
    questionType: get(row, ["loaicauhoi", "type"]) || "Trắc nghiệm",
    difficulty: get(row, ["mucdo", "difficulty"]) || "Nhận biết",
    content: get(row, ["noidungcauhoi", "cauhoi", "question"]),
    options: {
      A: get(row, ["phuongana", "a", "optiona"]),
      B: get(row, ["phuonganb", "b", "optionb"]),
      C: get(row, ["phuonganc", "c", "optionc"]),
      D: get(row, ["phuongand", "d", "optiond"]),
    },
    answer: get(row, ["dapandung", "dapan", "answer", "correctanswer"]).toUpperCase(),
    explanation: get(row, ["loigiai", "goiycham", "explanation"]),
    note: get(row, ["ghichu", "note"]),
    warnings: [],
  })).filter((row) => row.content.trim());
}

function readUint32(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

function readUint16(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}

function unzipEntries(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocd = -1;
  for (let index = bytes.length - 22; index >= 0; index -= 1) {
    if (readUint32(view, index) === 0x06054b50) {
      eocd = index;
      break;
    }
  }
  if (eocd < 0) throw new Error("invalid_zip");
  const centralDirOffset = readUint32(view, eocd + 16);
  const entries = new Map<string, string>();
  let offset = centralDirOffset;
  const decoder = new TextDecoder("utf-8");

  while (offset < bytes.length && readUint32(view, offset) === 0x02014b50) {
    const method = readUint16(view, offset + 10);
    const compressedSize = readUint32(view, offset + 20);
    const nameLength = readUint16(view, offset + 28);
    const extraLength = readUint16(view, offset + 30);
    const commentLength = readUint16(view, offset + 32);
    const localHeaderOffset = readUint32(view, offset + 42);
    const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    const localNameLength = readUint16(view, localHeaderOffset + 26);
    const localExtraLength = readUint16(view, localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    const uncompressed = method === 0
      ? compressed
      : method === 8
        ? inflateRawSync(compressed)
        : null;
    if (uncompressed) entries.set(name, decoder.decode(uncompressed));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function stripXml(value: string) {
  return value
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractXmlText(entry: string | undefined) {
  return stripXml(entry || "");
}

function xlsxRowsFromEntries(entries: Map<string, string>) {
  const sharedXml = entries.get("xl/sharedStrings.xml") || "";
  const sharedStrings = Array.from(sharedXml.matchAll(/<si[\s\S]*?<\/si>/g)).map((match) =>
    Array.from(match[0].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)).map((text) => stripXml(text[1] || "")).join(""),
  );
  const sheetXml = entries.get("xl/worksheets/sheet1.xml") || Array.from(entries.entries()).find(([name]) => name.startsWith("xl/worksheets/sheet"))?.[1] || "";
  const rows = Array.from(sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)).map((rowMatch) => {
    const row: string[] = [];
    Array.from(rowMatch[1].matchAll(/<c[^>]*r="([A-Z]+)\d+"[^>]*?(?:t="([^"]+)")?[^>]*>([\s\S]*?)<\/c>/g)).forEach((cellMatch) => {
      const letters = cellMatch[1];
      const type = cellMatch[2] || "";
      const body = cellMatch[3] || "";
      const index = letters.split("").reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
      const rawValue = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] || body.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] || "";
      row[index] = type === "s" ? sharedStrings[Number(rawValue)] || "" : stripXml(rawValue);
    });
    return row.map((value) => value || "");
  });
  return rows;
}

function rowsToText(rows: string[][]) {
  return rows.map((row) => row.map((cell) => String(cell || "").trim()).join("\t")).join("\n");
}

function heuristicQuestions(text: string): ImportCandidate[] {
  const chunks = text
    .split(/\n(?=(?:Câu\s*\d+|Question\s*\d+|Bài\s*\d+)[\.:])/i)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 20)
    .slice(0, 80);
  return chunks.map((chunk) => {
    const option = (letter: "A" | "B" | "C" | "D") => chunk.match(new RegExp(`${letter}[\\.)]\\s*([^\\n]+)`, "i"))?.[1]?.trim() || "";
    const answer = chunk.match(/(?:đáp án|answer)\s*[:：]\s*([A-DĐS]|đúng|sai|true|false)/i)?.[1]?.trim().toUpperCase() || "";
    return {
      subject: "",
      grade: "",
      topic: "",
      questionType: option("A") ? "Trắc nghiệm" : "Tự luận",
      difficulty: "",
      content: chunk.replace(/\n(?:Đáp án|Answer)\s*[:：][^\n]+/i, "").trim(),
      options: { A: option("A"), B: option("B"), C: option("C"), D: option("D") },
      answer,
      explanation: "",
      note: "",
      warnings: ["Cần kiểm tra lại vì dữ liệu được tách tự động từ file không theo mẫu."],
    };
  });
}

function normalizeRows(value: unknown): { rows: ImportCandidate[]; warnings: string[] } {
  if (!value || typeof value !== "object") return { rows: [], warnings: ["Chưa nhận diện được dữ liệu có cấu trúc."] };
  const source = value as { rows?: unknown; warnings?: unknown };
  const rows = Array.isArray(source.rows) ? source.rows : [];
  return {
    rows: rows.map((item): ImportCandidate | null => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const options = row.options && typeof row.options === "object" ? row.options as Record<string, unknown> : {};
      const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {};
      return {
        subject: String(row.subject || ""),
        grade: String(row.grade || ""),
        topic: String(row.topic || ""),
        questionType: String(row.questionType || row.type || ""),
        difficulty: String(row.difficulty || ""),
        content: String(row.content || row.question || ""),
        options: {
          A: String(options.A || options.a || row.optionA || ""),
          B: String(options.B || options.b || row.optionB || ""),
          C: String(options.C || options.c || row.optionC || ""),
          D: String(options.D || options.d || row.optionD || ""),
        },
        answer: String(row.answer || ""),
        explanation: String(row.explanation || row.solution || ""),
        metadata,
        note: String(row.note || ""),
        warnings: Array.isArray(row.warnings) ? row.warnings.map(String) : [],
      };
    }).filter((row): row is ImportCandidate => Boolean(row?.content?.trim())),
    warnings: Array.isArray(source.warnings) ? source.warnings.map(String) : [],
  };
}

async function extractFile(file: File, extension: string) {
  const buffer = await file.arrayBuffer();
  if (extension === ".txt" || extension === ".md") {
    return { text: await file.text(), deterministic: [] as ImportCandidate[] };
  }
  if (extension === ".csv" || extension === ".tsv") {
    const text = await file.text();
    const rows = rowsFromDelimited(text);
    return { text: rowsToText(rows), deterministic: deterministicRows(rows) };
  }
  if (extension === ".xlsx") {
    const entries = unzipEntries(buffer);
    const rows = xlsxRowsFromEntries(entries);
    return { text: rowsToText(rows), deterministic: deterministicRows(rows) };
  }
  if (extension === ".docx") {
    const entries = unzipEntries(buffer);
    return { text: extractXmlText(entries.get("word/document.xml")), deterministic: [] as ImportCandidate[] };
  }
  return { text: "", deterministic: [] as ImportCandidate[] };
}

export async function POST(request: NextRequest) {
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (!user) return jsonResponse({ ok: false, error: "Vui lòng đăng nhập để sử dụng chức năng nhận diện file." }, 401);
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const bookSeries = typeof formData.get("bookSeries") === "string" ? String(formData.get("bookSeries")) : "Kết nối tri thức";
  if (!(file instanceof File)) return jsonResponse({ ok: false, error: "Vui lòng chọn file cần nhận diện." }, 400);
  if (file.size > maxFileSize) return jsonResponse({ ok: false, error: "File quá lớn. Vui lòng dùng file tối đa 5MB." }, 400);

  const extension = extensionOf(file.name);
  if (!supportedExtensions.includes(extension)) {
    return jsonResponse({
      ok: false,
      error: "Định dạng này chưa được hỗ trợ trong chế độ nhận diện. Vui lòng dùng .txt, .md, .csv, .xlsx hoặc mẫu Excel.",
    }, 400);
  }

  try {
    const extracted = await extractFile(file, extension);
    if (extracted.deterministic.length) {
      return jsonResponse({
        ok: true,
        rows: extracted.deterministic,
        warnings: ["File có vẻ dùng đúng mẫu nên Soạn Lab đã đọc bằng bộ nhập chính xác. Vui lòng xem trước trước khi nhập."],
      });
    }

    if (!extracted.text.trim()) {
      return jsonResponse({ ok: false, error: "Chưa đọc được nội dung trong file. Vui lòng kiểm tra file hoặc dùng mẫu Excel." }, 400);
    }

    const provider = getConfiguredProvider();
    if (provider.name === "local") {
      const rows = heuristicQuestions(extracted.text);
      return jsonResponse({
        ok: true,
        rows,
        warnings: rows.length
          ? ["Soạn Lab đã tách câu hỏi ở mức cơ bản. Thầy/cô cần kiểm tra kỹ trước khi nhập."]
          : ["Chưa nhận diện được câu hỏi rõ ràng. Vui lòng dùng mẫu Excel để nhập chính xác hơn."],
      });
    }

    const prompt = buildQuestionBankImportPrompt({ fileName: file.name, extractedText: extracted.text, bookSeries });
    const response = await provider.generate({
      tool: "question-bank-import",
      input: { fileName: file.name },
      prompt,
    });
    const parsed = extractJson(response.content);
    if (!parsed.ok) {
      const rows = heuristicQuestions(extracted.text);
      return jsonResponse({
        ok: true,
        rows,
        warnings: ["Kết quả nhận diện cần được kiểm tra kỹ. Nếu thiếu dữ liệu, thầy/cô có thể dùng mẫu Excel để nhập chính xác hơn."],
      });
    }
    const normalized = normalizeRows(parsed.value);
    return jsonResponse({
      ok: true,
      rows: normalized.rows,
      warnings: normalized.warnings.length
        ? normalized.warnings
        : ["Kết quả nhận diện là bản nháp. Vui lòng kiểm tra trước khi nhập vào ngân hàng câu hỏi."],
    });
  } catch {
    return jsonResponse({ ok: false, error: "Chưa đọc được file. Vui lòng kiểm tra định dạng hoặc dùng mẫu Excel." }, 400);
  }
}

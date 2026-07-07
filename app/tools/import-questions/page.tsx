"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, FileUp, Save, Sparkles, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ToolPageHeader as PageHeader } from "@/components/tools/ToolPageHeader";
import { SoanLabEmptyState } from "@/components/ui/SoanLabEmptyState";
import { addQuestions, createQuestion } from "@/lib/question-bank";
import type { QuestionDifficulty, QuestionType } from "@/lib/types";

const templateXlsx = "/templates/mau-ngan-hang-cau-hoi-soan-lab.xlsx";
const templateCsv = "/templates/mau-ngan-hang-cau-hoi-soan-lab.csv";

const columns = [
  "Môn học",
  "Lớp",
  "Chủ đề",
  "Loại câu hỏi",
  "Mức độ",
  "Nội dung câu hỏi",
  "Phương án A",
  "Phương án B",
  "Phương án C",
  "Phương án D",
  "Đáp án đúng",
  "Lời giải",
  "Ghi chú",
] as const;

type ImportRow = {
  subject: string;
  grade: string;
  topic: string;
  type: QuestionType | "";
  difficulty: QuestionDifficulty | "";
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: string;
  explanation: string;
  note: string;
  errors: string[];
};

type ImportMode = "excel" | "ai";

function stripVietnamese(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeHeader(value: string) {
  return stripVietnamese(value);
}

const headerAliases: Record<keyof Omit<ImportRow, "errors">, string[]> = {
  subject: ["monhoc", "subject"],
  grade: ["lop", "grade"],
  topic: ["chude", "topic"],
  type: ["loaicauhoi", "type"],
  difficulty: ["mucdo", "difficulty"],
  question: ["noidungcauhoi", "cauhoi", "question"],
  optionA: ["phuongana", "a", "optiona"],
  optionB: ["phuonganb", "b", "optionb"],
  optionC: ["phuonganc", "c", "optionc"],
  optionD: ["phuongand", "d", "optiond"],
  answer: ["dapandung", "dapan", "answer", "correctanswer"],
  explanation: ["loigiai", "goiycham", "explanation"],
  note: ["ghichu", "note"],
};

function normalizeType(value: string): QuestionType | "" {
  const key = stripVietnamese(value);
  if (!key) return "";
  if (["tn", "tracnghiem", "multiplechoice"].includes(key)) return "Trắc nghiệm";
  if (["tuluan", "tuluanvan", "essay"].includes(key)) return "Tự luận";
  if (["dungsai", "dungsai", "truefalse"].includes(key)) return "Đúng/Sai";
  if (["traloin ngan", "traloingan", "ngan", "shortanswer", "dienkhuyet"].includes(key)) return "Trả lời ngắn";
  return "";
}

function normalizeDifficulty(value: string): QuestionDifficulty | "" {
  const key = stripVietnamese(value);
  if (!key) return "";
  if (["nb", "nhanbiet"].includes(key)) return "Nhận biết";
  if (["th", "thonghieu"].includes(key)) return "Thông hiểu";
  if (["vd", "vandung"].includes(key)) return "Vận dụng";
  if (["vdc", "vandungcao"].includes(key)) return "Vận dụng cao";
  return "";
}

function validate(row: Omit<ImportRow, "errors">) {
  const errors: string[] = [];
  if (!row.subject.trim()) errors.push("Thiếu môn học");
  if (!row.grade.trim()) errors.push("Thiếu lớp");
  if (!row.topic.trim()) errors.push("Thiếu chủ đề");
  if (!row.type) errors.push("Loại câu hỏi chưa hợp lệ");
  if (!row.difficulty) errors.push("Mức độ chưa hợp lệ");
  if (!row.question.trim()) errors.push("Thiếu nội dung câu hỏi");
  if (row.type === "Trắc nghiệm") {
    if (!row.optionA.trim() || !row.optionB.trim() || !row.optionC.trim() || !row.optionD.trim()) {
      errors.push("Thiếu phương án cho câu trắc nghiệm");
    }
    if (!["A", "B", "C", "D"].includes(row.answer.trim().toUpperCase())) {
      errors.push("Đáp án đúng phải là A, B, C hoặc D");
    }
  }
  return errors;
}

function toImportRow(source: Record<string, string>): ImportRow {
  const row = {
    subject: source.subject || "",
    grade: source.grade || "",
    topic: source.topic || "",
    type: normalizeType(source.type || "Trắc nghiệm"),
    difficulty: normalizeDifficulty(source.difficulty || "Nhận biết"),
    question: source.question || "",
    optionA: source.optionA || "",
    optionB: source.optionB || "",
    optionC: source.optionC || "",
    optionD: source.optionD || "",
    answer: (source.answer || "").trim().toUpperCase(),
    explanation: source.explanation || "",
    note: source.note || "",
  };
  return { ...row, errors: validate(row) };
}

function detectDelimiter(line: string) {
  const candidates = [";", "\t", ","];
  return candidates
    .map((delimiter) => ({ delimiter, count: splitDelimitedLine(line, delimiter).length }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter || ",";
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

function mapRows(rawRows: string[][]) {
  const [headerRow, ...dataRows] = rawRows.filter((row) => row.some((cell) => String(cell || "").trim()));
  if (!headerRow) return [];
  const headers = headerRow.map((cell) => normalizeHeader(String(cell || "")));
  const indexOf = (key: keyof Omit<ImportRow, "errors">) => headers.findIndex((header) => headerAliases[key].includes(header));
  return dataRows.map((row) => {
    const source = Object.fromEntries(
      (Object.keys(headerAliases) as Array<keyof Omit<ImportRow, "errors">>).map((key) => {
        const index = indexOf(key);
        return [key, index >= 0 ? String(row[index] || "").trim() : ""];
      }),
    ) as Record<string, string>;
    return toImportRow(source);
  });
}

function parseDelimited(text: string) {
  const cleaned = text.replace(/^\uFEFF/, "");
  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const delimiter = detectDelimiter(lines[0]);
  const rows = lines.map((line) => {
    const cells = splitDelimitedLine(line, delimiter);
    if (cells.length === 1) {
      const fallbackDelimiter = detectDelimiter(cells[0]);
      return splitDelimitedLine(cells[0], fallbackDelimiter);
    }
    return cells;
  });
  return mapRows(rows);
}

function readUint32(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

function readUint16(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}

async function inflateRaw(data: Uint8Array) {
  if (!("DecompressionStream" in window)) {
    throw new Error("Trình duyệt chưa hỗ trợ đọc file Excel trực tiếp. Vui lòng dùng CSV mẫu.");
  }
  const source = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const stream = new Blob([source]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzipXlsx(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocd = -1;
  for (let index = bytes.length - 22; index >= 0; index -= 1) {
    if (readUint32(view, index) === 0x06054b50) {
      eocd = index;
      break;
    }
  }
  if (eocd < 0) throw new Error("File Excel chưa hợp lệ.");
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
    const uncompressed = method === 0 ? compressed : method === 8 ? await inflateRaw(compressed) : null;
    if (uncompressed) entries.set(name, decoder.decode(uncompressed));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function xmlText(node: Element | null) {
  return node?.textContent || "";
}

function columnIndex(cellRef: string) {
  const letters = (cellRef.match(/[A-Z]+/i)?.[0] || "A").toUpperCase();
  return letters.split("").reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

async function parseXlsx(file: File) {
  const entries = await unzipXlsx(await file.arrayBuffer());
  const parser = new DOMParser();
  const sharedXml = entries.get("xl/sharedStrings.xml");
  const sharedStrings = sharedXml
    ? Array.from(parser.parseFromString(sharedXml, "application/xml").querySelectorAll("si")).map((si) =>
        Array.from(si.querySelectorAll("t")).map((text) => text.textContent || "").join(""),
      )
    : [];
  const sheetXml = entries.get("xl/worksheets/sheet1.xml") || Array.from(entries.entries()).find(([name]) => name.startsWith("xl/worksheets/sheet"))?.[1];
  if (!sheetXml) return [];
  const sheet = parser.parseFromString(sheetXml, "application/xml");
  const rows = Array.from(sheet.querySelectorAll("sheetData row")).map((rowNode) => {
    const row: string[] = [];
    Array.from(rowNode.querySelectorAll("c")).forEach((cell) => {
      const index = columnIndex(cell.getAttribute("r") || "");
      const type = cell.getAttribute("t");
      const value = type === "s"
        ? sharedStrings[Number(xmlText(cell.querySelector("v")))] || ""
        : type === "inlineStr"
          ? xmlText(cell.querySelector("is t"))
          : xmlText(cell.querySelector("v"));
      row[index] = value;
    });
    return row.map((value) => value || "");
  });
  return mapRows(rows);
}

function buildQuestion(row: ImportRow) {
  if (row.type !== "Trắc nghiệm") return row.question.trim();
  return [
    row.question.trim(),
    `A. ${row.optionA.trim()}`,
    `B. ${row.optionB.trim()}`,
    `C. ${row.optionC.trim()}`,
    `D. ${row.optionD.trim()}`,
  ].join("\n");
}

export default function ImportQuestionsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ImportMode>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "ai" ? "ai" : "excel",
  );
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const validRows = useMemo(() => rows.filter((row) => row.errors.length === 0), [rows]);
  const invalidRows = rows.length - validRows.length;

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const name = file.name.toLowerCase();
      const parsed = name.endsWith(".xlsx")
        ? await parseXlsx(file)
        : name.endsWith(".csv") || name.endsWith(".tsv")
          ? parseDelimited(await file.text())
          : [];
      if (!parsed.length) {
        setRows([]);
        setMessage("Chưa nhận diện được dữ liệu. Vui lòng dùng file mẫu Excel hoặc CSV của Soạn Lab.");
        return;
      }
      setRows(parsed);
      setMessage(`Đã đọc ${parsed.length} dòng. Vui lòng kiểm tra bảng xem trước trước khi nhập.`);
    } catch {
      setRows([]);
      setMessage("Chưa đọc được file. Vui lòng kiểm tra định dạng hoặc tải lại file mẫu.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAIUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    if (![".txt", ".md", ".csv", ".tsv", ".xlsx", ".docx"].some((extension) => lowerName.endsWith(extension))) {
      setRows([]);
      setMessage("Định dạng này chưa được hỗ trợ trong chế độ nhận diện. Vui lòng dùng .txt, .md, .csv, .xlsx hoặc mẫu Excel.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const payload = new FormData();
      payload.append("file", file);
      const response = await fetch("/api/question-bank/ai-import", {
        method: "POST",
        body: payload,
      });
      const data = await response.json() as {
        ok?: boolean;
        error?: string;
        rows?: Array<{
          subject?: string;
          grade?: string;
          topic?: string;
          questionType?: string;
          type?: string;
          difficulty?: string;
          content?: string;
          question?: string;
          options?: Partial<Record<"A" | "B" | "C" | "D", string>>;
          answer?: string;
          explanation?: string;
          note?: string;
          warnings?: string[];
        }>;
        warnings?: string[];
      };
      if (!response.ok || !data.ok) {
        setRows([]);
        setMessage(data.error || "Chưa nhận diện được file. Vui lòng thử lại hoặc dùng mẫu Excel.");
        return;
      }
      const parsed = (data.rows || []).map((row) => toImportRow({
        subject: row.subject || "",
        grade: row.grade || "",
        topic: row.topic || "",
        type: row.questionType || row.type || "",
        difficulty: row.difficulty || "",
        question: row.content || row.question || "",
        optionA: row.options?.A || "",
        optionB: row.options?.B || "",
        optionC: row.options?.C || "",
        optionD: row.options?.D || "",
        answer: row.answer || "",
        explanation: row.explanation || "",
        note: [row.note, ...(row.warnings || [])].filter(Boolean).join(" | "),
      }));
      setRows(parsed);
      setMessage(parsed.length
        ? `Đã nhận diện ${parsed.length} dòng. Vui lòng kiểm tra bảng xem trước trước khi nhập.${data.warnings?.length ? ` ${data.warnings.join(" ")}` : ""}`
        : "Chưa nhận diện được câu hỏi rõ ràng. Vui lòng thử file khác hoặc dùng mẫu Excel.");
    } catch {
      setRows([]);
      setMessage("Chưa nhận diện được file. Vui lòng thử lại hoặc dùng mẫu Excel.");
    } finally {
      setBusy(false);
    }
  }

  function saveValidRows() {
    if (!validRows.length) return;
    addQuestions(validRows.map((row) => createQuestion({
      subject: row.subject.trim(),
      grade: row.grade.trim(),
      topic: row.topic.trim(),
      type: row.type as QuestionType,
      difficulty: row.difficulty as QuestionDifficulty,
      question: buildQuestion(row),
      answer: row.answer.trim(),
      explanation: row.explanation.trim(),
    })));
    setMessage(`Đã nhập ${validRows.length} câu hỏi hợp lệ vào ngân hàng câu hỏi.`);
    setRows([]);
  }

  return (
    <AppShell title="Nhập câu hỏi">
      <PageHeader
        title="Nhập câu hỏi"
        description="Chọn nhập theo mẫu Excel chính thức hoặc để Soạn Lab hỗ trợ nhận diện file cũ. Luôn kiểm tra bảng xem trước trước khi nhập."
        category="Ngân hàng câu hỏi"
        iconName="question-bank"
        exportable={false}
      />

      <div className="mb-5 grid gap-2 rounded-[24px] border border-blue-100 bg-white p-2 shadow-sm sm:inline-grid sm:grid-cols-2">
        {([
          ["excel", "Theo mẫu Excel"],
          ["ai", "AI tự nhận diện"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setMessage("");
            }}
            className={`min-h-11 rounded-2xl px-4 text-sm font-black transition ${mode === value ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "excel" ? <section className="premium-section">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <span className="premium-pill">Theo mẫu Excel</span>
            <h2 className="mt-4 text-2xl font-black text-slate-950">Nhập câu hỏi bằng mẫu chính thức</h2>
            <p className="mt-2 leading-7 text-slate-600">
              Phù hợp khi thầy cô muốn nhập dữ liệu chính xác, đúng cột và ít cần chỉnh sửa. Hỗ trợ .xlsx, .csv, .tsv.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={templateXlsx} className="btn-primary" download>
              <FileSpreadsheet size={16} /> Tải mẫu Excel
            </Link>
            <Link href={templateCsv} className="btn-secondary" download>
              <Download size={16} /> Tải mẫu CSV
            </Link>
            <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={busy}>
              <FileUp size={16} /> {busy ? "Đang đọc file..." : "Upload file"}
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.csv,.tsv,text/csv,text/tab-separated-values" className="hidden" onChange={handleUpload} />
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
          Khuyến nghị dùng mẫu Excel để tránh lỗi định dạng. Không đổi tên cột. Mỗi dòng là một câu hỏi; với câu trắc nghiệm, đáp án đúng cần là A, B, C hoặc D.
        </div>
      </section> : (
        <section className="premium-section">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <span className="premium-pill">AI tự nhận diện</span>
              <h2 className="mt-4 text-2xl font-black text-slate-950">Nhận diện câu hỏi từ file cũ</h2>
              <p className="mt-2 leading-7 text-slate-600">
                Upload đề cũ, file Word/TXT/Markdown/CSV/Excel hoặc nội dung đã có. Soạn Lab sẽ thử tách câu hỏi, đáp án và lời giải thành dữ liệu có cấu trúc.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={() => aiFileInputRef.current?.click()} disabled={busy}>
                <Sparkles size={16} /> {busy ? "Đang nhận diện..." : "Upload file để nhận diện"}
              </button>
              <Link href={templateXlsx} className="btn-secondary" download>
                <FileSpreadsheet size={16} /> Tải mẫu Excel
              </Link>
              <input ref={aiFileInputRef} type="file" accept=".txt,.md,.csv,.tsv,.xlsx,.docx,text/plain,text/markdown,text/csv,text/tab-separated-values" className="hidden" onChange={handleAIUpload} />
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
            Kết quả nhận diện là bản nháp. Thầy cô cần kiểm tra lại nội dung, đáp án và phân loại trước khi nhập vào ngân hàng câu hỏi.
          </div>
          <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            Hỗ trợ trong phiên bản này: .txt, .md, .csv, .tsv, .xlsx, .docx. Chưa nhận diện PDF hoặc ảnh trong luồng này.
          </div>
        </section>
      )}

      {message ? <p className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm font-bold text-blue-800">{message}</p> : null}

      {rows.length ? (
        <section className="mt-6 space-y-4">
          <div className="premium-section">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Xem trước trước khi nhập</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Tổng số dòng: <strong>{rows.length}</strong> · Hợp lệ: <strong className="text-emerald-700">{validRows.length}</strong> · Cần sửa: <strong className="text-red-700">{invalidRows}</strong>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-primary" disabled={!validRows.length} onClick={saveValidRows}>
                  <Save size={16} /> Nhập câu hỏi hợp lệ
                </button>
                <button type="button" className="btn-secondary" onClick={() => setRows([])}>
                  <X size={16} /> Hủy
                </button>
                <Link href={templateXlsx} className="btn-secondary" download>
                  <Download size={16} /> Tải file mẫu
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[28px] border border-blue-100 bg-white shadow-sm">
            <table className="min-w-[1180px] w-full text-left text-sm">
              <thead className="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
                <tr>
                  <th className="p-3">Môn học</th>
                  <th className="p-3">Lớp</th>
                  <th className="p-3">Chủ đề</th>
                  <th className="p-3">Loại câu hỏi</th>
                  <th className="p-3">Mức độ</th>
                  <th className="p-3">Nội dung câu hỏi</th>
                  <th className="p-3">Đáp án đúng</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="border-t border-slate-100 align-top">
                    <td className="p-3 font-semibold text-slate-900">{row.subject || "—"}</td>
                    <td className="p-3">{row.grade || "—"}</td>
                    <td className="p-3">{row.topic || "—"}</td>
                    <td className="p-3">{row.type || "—"}</td>
                    <td className="p-3">{row.difficulty || "—"}</td>
                    <td className="max-w-md p-3">
                      <p className="line-clamp-3 leading-6">{row.question || "—"}</p>
                      {row.type === "Trắc nghiệm" ? (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          A. {row.optionA || "—"} · B. {row.optionB || "—"} · C. {row.optionC || "—"} · D. {row.optionD || "—"}
                        </p>
                      ) : null}
                    </td>
                    <td className="p-3 font-bold">{row.answer || "—"}</td>
                    <td className="p-3">
                      {row.errors.length ? (
                        <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700">
                          <div className="mb-1 flex items-center gap-1 font-black"><AlertCircle size={14} /> Cần sửa</div>
                          <ul className="list-disc pl-4">
                            {row.errors.map((error) => <li key={error}>{error}</li>)}
                          </ul>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                          <CheckCircle2 size={14} /> Hợp lệ
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="mt-6">
          <SoanLabEmptyState
            title="Chưa có file nào được upload"
            description="Tải mẫu Excel, điền câu hỏi rồi upload lại. Soạn Lab sẽ hiển thị bảng xem trước để thầy/cô kiểm tra trước khi nhập."
            action={<button type="button" className="btn-primary" onClick={() => fileInputRef.current?.click()}>Upload file</button>}
          />
        </div>
      )}

      <section className="mt-6 rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">Các cột trong file mẫu</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {columns.map((column) => (
            <span key={column} className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-100">
              {column}
            </span>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

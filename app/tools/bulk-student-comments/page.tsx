"use client";

import { Copy, Download, FileDown, Trash2 } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import { OutputPreview } from "@/components/OutputPreview";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { createDocument, saveDocument } from "@/lib/history";
import type { GeneratedDocument } from "@/lib/types";
import { sampleBulkCommentsCsv } from "@/lib/sample-data";
import { FormDraftControls } from "@/components/tools/FormDraftControls";
import { useFormDraft } from "@/hooks/useFormDraft";

type StudentRow = {
  name: string;
  className: string;
  performance: string;
  attitude: string;
  strengths: string;
  limitations: string;
  purpose: string;
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === "\"") quoted = !quoted;
    else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else current += char;
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string): StudentRow[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  const key = (names: string[]) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
  const indexes = {
    name: key(["ho_ten", "ho_ten", "name"]),
    className: key(["lop", "class"]),
    performance: key(["muc_hoc_tap", "hoc_tap", "performance"]),
    attitude: key(["thai_do", "attitude"]),
    strengths: key(["uu_diem", "diem_manh", "strengths"]),
    limitations: key(["han_che", "limitations"]),
    purpose: key(["muc_dich", "purpose"])
  };
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return {
      name: cells[indexes.name] || "Chưa có tên",
      className: cells[indexes.className] || "",
      performance: cells[indexes.performance] || "Khá",
      attitude: cells[indexes.attitude] || "có thái độ học tập tích cực",
      strengths: cells[indexes.strengths] || "có cố gắng trong học tập",
      limitations: cells[indexes.limitations] || "cần chủ động hơn",
      purpose: cells[indexes.purpose] || "Nhận xét cuối kỳ"
    };
  });
}

function makeComments(row: StudentRow) {
  return {
    short: `${row.name} có mức học tập ${row.performance.toLowerCase()}, ${row.attitude}. Em phát huy tốt ${row.strengths} và cần chú ý ${row.limitations}.`,
    formal: `Trong quá trình học tập, ${row.name} thể hiện mức độ ${row.performance.toLowerCase()}. Em có ưu điểm là ${row.strengths}; bên cạnh đó cần tiếp tục rèn luyện ở điểm ${row.limitations} để tiến bộ ổn định hơn.`,
    parent: `Kính gửi quý phụ huynh, ${row.name} ${row.attitude}. Em có điểm mạnh là ${row.strengths}. Gia đình có thể hỗ trợ thêm bằng cách nhắc em ${row.limitations}.`
  };
}

export default function BulkStudentCommentsPage() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [message, setMessage] = useState("");
  const draft = useFormDraft("/tools/bulk-student-comments", rows, setRows);

  const output = useMemo(() => rows.map((row, index) => {
    const comments = makeComments(row);
    return `${index + 1}. ${row.name} - Lớp ${row.className}
Nhận xét ngắn gọn: ${comments.short}
Nhận xét trang trọng: ${comments.formal}
Tin nhắn thân thiện gửi phụ huynh: ${comments.parent}`;
  }).join("\n\n"), [rows]);

  function downloadSample() {
    downloadText("classora-mau-nhan-xet-hang-loat.csv", sampleBulkCommentsCsv, "text/csv;charset=utf-8");
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) return setMessage("Vui lòng chọn đúng file CSV.");
    const text = await file.text();
    const parsed = parseCsv(text);
    setRows(parsed);
    setDocument(null);
    const invalid = parsed.filter((row) => row.name === "Chưa có tên").length;
    setMessage(parsed.length ? `Đã đọc ${parsed.length} dòng; ${invalid} dòng thiếu Họ tên.` : "File CSV thiếu dữ liệu hoặc cột Họ tên.");
  }

  function generate() {
    if (!rows.length) {
      setMessage("Vui lòng tải CSV trước khi tạo nhận xét.");
      return;
    }
    const content = `NHẬN XÉT HỌC SINH HÀNG LOẠT\nSố học sinh: ${rows.length}\n\n${output}\n\nNội dung hiện được tạo bằng AI mô phỏng trong bản demo. Giáo viên cần kiểm tra lại trước khi sử dụng.`;
    const next = createDocument(`Nhận xét hàng loạt - ${rows.length} học sinh`, "bulk-student-comments", content);
    setDocument(next);
    setMessage("Đã tạo nhận xét hàng loạt.");
  }

  function save() {
    if (!document) return;
    saveDocument(document);
    setMessage("Đã lưu vào lịch sử.");
  }

  function exportCsv() {
    const header = "Họ tên,Lớp,Nhận xét ngắn gọn,Nhận xét trang trọng,Tin nhắn phụ huynh";
    const body = rows.map((row) => {
      const comments = makeComments(row);
      return [row.name, row.className, comments.short, comments.formal, comments.parent].map((cell) => `"${cell.replace(/"/g, "\"\"")}"`).join(",");
    }).join("\n");
    downloadText("classora-nhan-xet-hang-loat.csv", `${header}\n${body}`, "text/csv;charset=utf-8");
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title="Nhận xét học sinh hàng loạt" description="Tải CSV, xem trước dữ liệu và tạo nhận xét hàng loạt bằng AI mô phỏng." />
        <div className="grid gap-6 xl:grid-cols-[520px_1fr]">
          <section className="card space-y-5 p-5">
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
              CSV cần có cột: Họ tên, Lớp, Mức học tập, Thái độ, Ưu điểm, Hạn chế, Mục đích. Cũng hỗ trợ: ho_ten, lop, muc_hoc_tap, thai_do, uu_diem, han_che, muc_dich.
            </div>
            <button type="button" onClick={downloadSample} className="btn-secondary"><FileDown size={16} />Tải file mẫu CSV</button>
            <button type="button" onClick={() => navigator.clipboard.writeText(sampleBulkCommentsCsv)} className="btn-secondary"><Copy size={16} />Copy mẫu CSV</button>
            <button type="button" onClick={() => { const parsed = parseCsv(sampleBulkCommentsCsv); setRows(parsed); setDocument(null); setMessage(`Đã điền ${parsed.length} học sinh mẫu.`); }} className="btn-secondary">Dùng dữ liệu mẫu</button>
            <FormDraftControls updatedAt={draft.updatedAt} onRestore={draft.restoreDraft} onClear={draft.clearDraft} />
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="form-field" />
            {rows.length ? (
              <div className="overflow-auto rounded-md border border-line">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-muted"><tr><th className="p-2">Họ tên</th><th className="p-2">Lớp</th><th className="p-2">Mức học tập</th><th className="p-2">Xóa</th></tr></thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={`${row.name}-${index}`} className="border-t border-line">
                        <td className="p-2">{row.name}</td><td className="p-2">{row.className}</td><td className="p-2">{row.performance}</td>
                        <td className="p-2"><button type="button" onClick={() => setRows(rows.filter((_, i) => i !== index))} className="rounded-md border border-line p-2 text-red-600" aria-label={`Xóa ${row.name}`}><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="empty-state">Chưa có dữ liệu CSV.</div>}
            <button type="button" onClick={generate} className="btn-primary w-full">Tạo nhận xét hàng loạt</button>
            {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
          </section>
          <section className="space-y-4">
            {document ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <DocumentExportMenu document={document} onSave={save} />
                  <button type="button" onClick={exportCsv} className="btn-secondary"><Download size={16} />Xuất CSV</button>
                </div>
                <OutputPreview document={document} />
              </>
            ) : <div className="empty-state">Kết quả nhận xét sẽ hiển thị tại đây.</div>}
          </section>
        </div>
      </main>
    </div>
  );
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

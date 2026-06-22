"use client";

import { Copy, Download, FileDown, Trash2 } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import { TemplateSelect } from "@/components/TemplateSelect";
import { OutputPreview } from "@/components/OutputPreview";
import { ToolPageHeader as PageHeader } from "@/components/tools/ToolPageHeader";
import { Sidebar } from "@/components/Sidebar";
import { createDocument, saveDocument } from "@/lib/history";
import type { GeneratedDocument } from "@/lib/types";
import { sampleBulkCommentsCsv } from "@/lib/sample-data";
import { FormDraftControls } from "@/components/tools/FormDraftControls";
import { useFormDraft } from "@/hooks/useFormDraft";
import { applyTemplate, resolveTemplate } from "@/lib/templates";
import { ToolOutputPanel } from "@/components/tools/ToolOutputPanel";
import { ToolWorkspaceLayout } from "@/components/tools/ToolWorkspaceLayout";
import { SoanLabEmptyState } from "@/components/ui/SoanLabEmptyState";

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
  const nextAction = `dành 10-15 phút mỗi ngày để ${row.limitations} và tự đánh dấu phần đã hoàn thành`;
  return {
    short: `${row.name} có kết quả học tập ở mức ${row.performance.toLowerCase()} và ${row.attitude}. Em nổi bật ở điểm ${row.strengths}; thời gian tới nên ${nextAction}.`,
    formal: `Trong quá trình học tập, ${row.name} thể hiện mức độ ${row.performance.toLowerCase()}. Em phát huy tốt ${row.strengths}. Để tiến bộ ổn định hơn, em cần ${row.limitations}; giáo viên đề nghị em ${nextAction}.`,
    parent: `Kính gửi quý phụ huynh, ${row.name} ${row.attitude} và có điểm mạnh là ${row.strengths}. Gia đình có thể đồng hành bằng cách tạo lịch học ngắn, nhắc em ${row.limitations} và ghi nhận khi em hoàn thành mục tiêu.`
  };
}

export default function BulkStudentCommentsPage() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [message, setMessage] = useState("");
  const [templateId, setTemplateId] = useState("");
  const draft = useFormDraft("/tools/bulk-student-comments", rows, setRows);

  const output = useMemo(() => rows.map((row, index) => {
    const comments = makeComments(row);
    return `HỌC SINH ${index + 1}: ${row.name}
- Lớp: ${row.className}
- Hồ sơ ngắn: Mức học tập ${row.performance.toLowerCase()}; ${row.attitude}.
- Điểm mạnh: ${row.strengths}
- Điểm cần cải thiện: ${row.limitations}

NHẬN XÉT HOÀN CHỈNH
${comments.formal}

GỢI Ý TRAO ĐỔI PHỤ HUYNH
${comments.parent}`;
  }).join("\n\n"), [rows]);

  function downloadSample() {
    downloadText("soan-lab-mau-nhan-xet-hang-loat.csv", sampleBulkCommentsCsv, "text/csv;charset=utf-8");
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
    const generated = `NHẬN XÉT HỌC SINH HÀNG LOẠT\nSố học sinh: ${rows.length}\n\n${output}\n\nNội dung được tạo tự động và cần giáo viên kiểm tra, chỉnh sửa trước khi sử dụng chính thức.`;
    const content = applyTemplate(resolveTemplate(templateId), generated, { className: `${rows.length} học sinh`, ghi_chu: "Giáo viên kiểm tra lại từng nhận xét trước khi gửi." });
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
    downloadText("soan-lab-nhan-xet-hang-loat.csv", `${header}\n${body}`, "text/csv;charset=utf-8");
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title="Nhận xét học sinh hàng loạt" description="Tải CSV, xem trước dữ liệu và tạo bản nháp nhận xét hàng loạt." />
        <ToolWorkspaceLayout
          wideForm
          form={
          <section className="tool-form-card">
            <div className="tool-tip-card">
              CSV cần có cột: Họ tên, Lớp, Mức học tập, Thái độ, Ưu điểm, Hạn chế, Mục đích. Cũng hỗ trợ: ho_ten, lop, muc_hoc_tap, thai_do, uu_diem, han_che, muc_dich.
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={downloadSample} className="btn-secondary"><FileDown size={16} />Tải file mẫu CSV</button>
              <button type="button" onClick={() => navigator.clipboard.writeText(sampleBulkCommentsCsv)} className="btn-secondary"><Copy size={16} />Copy mẫu CSV</button>
              <button type="button" onClick={() => { const parsed = parseCsv(sampleBulkCommentsCsv); setRows(parsed); setDocument(null); setMessage(`Đã điền ${parsed.length} học sinh mẫu.`); }} className="btn-secondary">Dùng dữ liệu mẫu</button>
            </div>
            <FormDraftControls updatedAt={draft.updatedAt} onRestore={draft.restoreDraft} onClear={draft.clearDraft} />
            <TemplateSelect type="Nhận xét học sinh" value={templateId} onChange={setTemplateId} />
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.35rem] border-2 border-dashed border-blue-200 bg-blue-50/60 p-6 text-center text-sm text-muted transition hover:border-blue-300 hover:bg-blue-50">
              <FileDown className="mb-3 text-blue-600" size={28} />
              <span className="font-bold text-ink">Thả/chọn file CSV học sinh</span>
              <span className="mt-1">Dữ liệu chỉ xử lý trên trình duyệt.</span>
              <input type="file" accept=".csv,text/csv" onChange={handleFile} className="sr-only" />
            </label>
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
            ) : <SoanLabEmptyState title="Chưa có dữ liệu CSV" description="Tải file mẫu hoặc chọn file CSV học sinh để xem trước các dòng nhận xét." />}
            <button type="button" onClick={generate} className="btn-primary w-full">Tạo nhận xét hàng loạt</button>
            {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
          </section>
          }
          output={
            <ToolOutputPanel hasOutput={Boolean(document)} showWarning={false} emptyDescription="Sau khi tải CSV và tạo nhận xét, danh sách nhận xét sẽ hiển thị ở đây để xuất Word hoặc CSV.">
              {document ? (
              <>
                <div className="document-actions sticky top-20 z-10 flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-lg shadow-slate-200/60 backdrop-blur-xl">
                  <DocumentExportMenu document={document} onSave={save} />
                  <button type="button" onClick={exportCsv} className="btn-secondary"><Download size={16} />Xuất CSV</button>
                </div>
                <OutputPreview document={document} />
              </>
              ) : null}
            </ToolOutputPanel>
          }
        />
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

"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Eye, FileText, Trash2 } from "lucide-react";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import type { DocumentFolder, GeneratedDocument } from "@/lib/types";
import { deleteDocument, getHistory, updateDocumentFolder } from "@/lib/history";
import Link from "next/link";
import { removeStored, STORAGE_KEYS } from "@/lib/storage";

const folders: DocumentFolder[] = ["Đề kiểm tra", "Giáo án", "Phiếu học tập", "Nhận xét học sinh", "Khác"];

const labels: Record<GeneratedDocument["type"], string> = {
  exam: "Đề kiểm tra",
  worksheet: "Phiếu học tập",
  "student-comment": "Nhận xét học sinh",
  "lesson-plan": "Giáo án",
  matrix: "Ma trận đề",
  "answer-key": "Đáp án và thang điểm",
  rubric: "Rubric",
  "parent-message": "Tin nhắn phụ huynh",
  "question-bank": "Ngân hàng câu hỏi",
  "question-variant": "Biến thể câu hỏi",
  "exam-checker": "Kiểm tra lỗi đề",
  activity: "Hoạt động lớp học",
  "differentiated-exercises": "Bài tập phân hóa",
  "exam-shuffler": "Trộn mã đề",
  "slide-outline": "Dàn ý slide",
  "lesson-summary": "Tóm tắt bài học",
  "mindmap-outline": "Sơ đồ tư duy",
  "homeroom-plan": "Kế hoạch chủ nhiệm",
  "parent-meeting-minutes": "Biên bản họp phụ huynh",
  "latex-converter": "Công thức LaTeX",
  "bulk-student-comments": "Nhận xét hàng loạt"
};

export function HistoryList() {
  const [items, setItems] = useState<GeneratedDocument[]>([]);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tất cả");
  const [folderFilter, setFolderFilter] = useState("Tất cả thư mục");
  const [selected, setSelected] = useState<string[]>([]);

  function refresh() {
    setItems(getHistory());
  }

  useEffect(() => {
    queueMicrotask(refresh);
  }, []);

  function remove(id: string) {
    deleteDocument(id);
    refresh();
    setMessage("Đã xóa tài liệu khỏi lịch sử.");
    setTimeout(() => setMessage(""), 2200);
  }

  function downloadBundle(extension: "md" | "txt") {
    const chosen = items.filter((item) => selected.includes(item.id));
    if (!chosen.length) return;
    const content = chosen.map((item) => `${extension === "md" ? "# " : ""}${item.title}\n\n${item.content}\n\n${extension === "md" ? "---" : "========================================"}`).join("\n\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `classora-history-bundle.${extension}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function deleteSelected() {
    if (!selected.length || !window.confirm(`Xóa ${selected.length} tài liệu đã chọn?`)) return;
    selected.forEach(deleteDocument);
    setSelected([]);
    refresh();
    setMessage("Đã xóa các tài liệu đã chọn.");
  }

  function moveSelected(folder: DocumentFolder) {
    selected.forEach((id) => updateDocumentFolder(id, folder));
    refresh();
    setMessage(`Đã chuyển ${selected.length} tài liệu vào thư mục ${folder}.`);
  }

  function clearAll() {
    if (!window.confirm("Bạn có chắc muốn xóa toàn bộ lịch sử không?")) return;
    removeStored(STORAGE_KEYS.history);
    setItems([]);
    setMessage("Đã xóa toàn bộ lịch sử.");
  }

  const filteredItems = items.filter((item) => {
    const normalized = query.trim().toLowerCase();
    const matchQuery = !normalized || item.title.toLowerCase().includes(normalized) || item.content.toLowerCase().includes(normalized);
    const matchType = typeFilter === "Tất cả" || labels[item.type] === typeFilter;
    const matchFolder = folderFilter === "Tất cả thư mục" || (item.folder || "Khác") === folderFilter;
    return matchQuery && matchType && matchFolder;
  });

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <FileText className="mx-auto mb-3 text-slate-400" size={34} />
        <p className="font-semibold text-ink">Chưa có tài liệu nào được lưu</p>
        <p className="mt-1">Hãy thử tạo một đề kiểm tra hoặc phiếu học tập đầu tiên rồi lưu lại tại đây.</p>
        <Link href="/tools" className="btn-primary mt-4">Khám phá công cụ</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div> : null}
      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px_auto]">
          <input className="form-field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tiêu đề hoặc nội dung..." />
          <select className="form-field" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option>Tất cả</option>
            {Object.values(labels).map((label) => <option key={label}>{label}</option>)}
          </select>
          <select className="form-field" value={folderFilter} onChange={(event) => setFolderFilter(event.target.value)}>
            <option>Tất cả thư mục</option>
            {folders.map((folder) => <option key={folder}>{folder}</option>)}
          </select>
          <button type="button" onClick={clearAll} className="btn-secondary text-red-600">Xóa tất cả</button>
        </div>
      </div>
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={filteredItems.length > 0 && filteredItems.every((item) => selected.includes(item.id))} onChange={(event) => setSelected(event.target.checked ? Array.from(new Set([...selected, ...filteredItems.map((item) => item.id)])) : selected.filter((id) => !filteredItems.some((item) => item.id === id)))} />Chọn tất cả đang hiển thị</label>
        <span className="text-sm text-muted">Đã chọn {selected.length}</span>
        <button type="button" className="btn-secondary" disabled={!selected.length} onClick={() => downloadBundle("md")}>Xuất Markdown</button>
        <button type="button" className="btn-secondary" disabled={!selected.length} onClick={() => downloadBundle("txt")}>Xuất TXT</button>
        <select className="form-field max-w-56" disabled={!selected.length} defaultValue="" onChange={(event) => { if (event.target.value) moveSelected(event.target.value as DocumentFolder); event.target.value = ""; }}><option value="">Chuyển thư mục...</option>{folders.map((folder) => <option key={folder}>{folder}</option>)}</select>
        <button type="button" className="btn-secondary text-red-600" disabled={!selected.length} onClick={deleteSelected}>Xóa đã chọn</button>
        <button type="button" className="btn-secondary" disabled={!selected.length} onClick={() => setSelected([])}>Bỏ chọn</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.length ? filteredItems.map((item) => (
            <article key={item.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <input type="checkbox" checked={selected.includes(item.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, item.id] : selected.filter((id) => id !== item.id))} aria-label={`Chọn ${item.title}`} />
                <div>
                  <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-bold uppercase tracking-wide text-brand">{labels[item.type]}</span>
                  <span className="ml-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{item.folder || "Khác"}</span>
                  <h3 className="mt-2 font-bold text-ink">{item.title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <CalendarDays size={13} />
                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <button type="button" onClick={() => remove(item.id)} className="rounded-md border border-line p-2 text-muted hover:border-red-200 hover:bg-red-50 hover:text-red-600" aria-label="Xóa">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{item.content}</p>
              <select className="form-field mt-3" value={item.folder || "Khác"} onChange={(event) => { updateDocumentFolder(item.id, event.target.value as DocumentFolder); refresh(); }}>
                {folders.map((folder) => <option key={folder}>{folder}</option>)}
              </select>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/history/${item.id}`} className="btn-secondary min-h-9 px-3 py-1.5 text-xs"><Eye size={16} />Xem</Link>
                <DocumentExportMenu document={item} compact />
              </div>
            </article>
          )) : <div className="empty-state">Không tìm thấy tài liệu phù hợp.</div>}
      </div>
    </div>
  );
}

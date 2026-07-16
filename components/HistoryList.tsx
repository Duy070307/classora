"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardCheck, Download, Eye, FileCheck2, FolderOpen, RefreshCw, Search, Trash2 } from "lucide-react";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import { SoanLabEmptyState } from "@/components/ui/SoanLabEmptyState";
import { deleteCloudDocument, listCloudDocuments, updateCloudDocumentFolder } from "@/lib/data/documents-store";
import { deleteDocument, getHistory, updateDocumentFolder } from "@/lib/history";
import { removeStored, STORAGE_KEYS } from "@/lib/storage";
import type { DocumentFolder, GeneratedDocument } from "@/lib/types";
import { auditStatusLabel } from "@/lib/exam-audit/document";
import { EXAM_BLUEPRINT_SESSION_KEY } from "@/lib/exam-blueprints";

const creationLabels = { matrix: "Tạo từ ma trận", specification: "Tạo từ bảng đặc tả", previous_exam: "Tạo từ đề cũ", lesson_material: "Tạo từ tài liệu" } as const;

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
  "exam-audit": "Kiểm tra đề",
  activity: "Hoạt động lớp học",
  "differentiated-exercises": "Bài tập phân hóa",
  "exam-shuffler": "Bộ mã đề",
  "slide-outline": "Dàn ý slide",
  "lesson-slides": "Slide bài giảng",
  "lesson-summary": "Tóm tắt bài học",
  "mindmap-outline": "Sơ đồ tư duy",
  "homeroom-plan": "Kế hoạch chủ nhiệm",
  "parent-meeting-minutes": "Biên bản họp phụ huynh",
  "latex-converter": "Công thức LaTeX",
  "image-to-latex": "Ảnh công thức → LaTeX",
  "image-to-tikz": "Ảnh hình học → TikZ",
  "3d-animation": "Mô phỏng 3D",
  "document-recognition": "Đề nhận dạng từ ảnh/PDF",
  "bulk-student-comments": "Nhận xét hàng loạt",
};

export function HistoryList() {
  const [items, setItems] = useState<GeneratedDocument[]>([]);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tất cả");
  const [folderFilter, setFolderFilter] = useState("Tất cả thư mục");
  const [selected, setSelected] = useState<string[]>([]);

  async function refresh() {
    const accountItems = await listCloudDocuments();
    setItems(accountItems ?? getHistory());
  }

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, []);

  async function remove(id: string) {
    deleteDocument(id);
    await deleteCloudDocument(id);
    await refresh();
    setMessage("Đã xóa tài liệu khỏi lịch sử.");
    setTimeout(() => setMessage(""), 2200);
  }

  function downloadBundle(extension: "md" | "txt") {
    const chosen = items.filter((item) => selected.includes(item.id));
    if (!chosen.length) return;
    const divider = extension === "md" ? "---" : "========================================";
    const content = chosen
      .map((item) => `${extension === "md" ? "# " : ""}${item.title}\n\n${item.content}\n\n${divider}`)
      .join("\n\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `soan-lab-history-bundle.${extension}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function deleteSelected() {
    if (!selected.length || !window.confirm(`Xóa ${selected.length} tài liệu đã chọn?`)) return;
    selected.forEach(deleteDocument);
    selected.forEach((id) => void deleteCloudDocument(id));
    setSelected([]);
    void refresh();
    setMessage("Đã xóa các tài liệu đã chọn.");
  }

  function moveSelected(folder: DocumentFolder) {
    selected.forEach((id) => updateDocumentFolder(id, folder));
    selected.forEach((id) => void updateCloudDocumentFolder(id, folder));
    void refresh();
    setMessage(`Đã chuyển ${selected.length} tài liệu vào thư mục ${folder}.`);
  }

  function clearAll() {
    if (!window.confirm("Bạn có chắc muốn xóa toàn bộ lịch sử không?")) return;
    removeStored(STORAGE_KEYS.history);
    setItems([]);
    setSelected([]);
    setMessage("Đã xóa toàn bộ lịch sử trên trình duyệt này.");
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const normalized = query.trim().toLowerCase();
      const matchQuery = !normalized || item.title.toLowerCase().includes(normalized) || item.content.toLowerCase().includes(normalized);
      const matchType = typeFilter === "Tất cả" || labels[item.type] === typeFilter;
      const matchFolder = folderFilter === "Tất cả thư mục" || (item.folder || "Khác") === folderFilter;
      return matchQuery && matchType && matchFolder;
    });
  }, [folderFilter, items, query, typeFilter]);

  if (items.length === 0) {
    return (
      <SoanLabEmptyState
        title="Chưa có tài liệu nào được lưu"
        description="Hãy tạo một đề kiểm tra, phiếu học tập hoặc giáo án đầu tiên rồi lưu lại để mở lại nhanh tại đây."
        action={<Link href="/tools" className="btn-primary">Khám phá công cụ</Link>}
      />
    );
  }

  const allVisibleSelected = filteredItems.length > 0 && filteredItems.every((item) => selected.includes(item.id));

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {message}
        </div>
      ) : null}

      <section className="rounded-[28px] border border-blue-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
          <label className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="form-field pl-11"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tiêu đề hoặc nội dung..."
            />
          </label>
          <select className="form-field" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option>Tất cả</option>
            {Array.from(new Set(Object.values(labels))).map((label) => <option key={label}>{label}</option>)}
          </select>
          <select className="form-field" value={folderFilter} onChange={(event) => setFolderFilter(event.target.value)}>
            <option>Tất cả thư mục</option>
            {folders.map((folder) => <option key={folder}>{folder}</option>)}
          </select>
          <button type="button" onClick={clearAll} className="btn-secondary text-red-600">Xóa tất cả</button>
        </div>
      </section>

      <section className="sticky top-4 z-10 rounded-[24px] border border-blue-100 bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2 text-sm font-bold text-slate-800">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(event) => {
                setSelected(event.target.checked
                  ? Array.from(new Set([...selected, ...filteredItems.map((item) => item.id)]))
                  : selected.filter((id) => !filteredItems.some((item) => item.id === id)));
              }}
            />
            Chọn tất cả đang hiển thị
          </label>
          <span className="text-sm font-semibold text-slate-500">Đã chọn {selected.length}</span>
          <button type="button" className="btn-secondary" disabled={!selected.length} onClick={() => downloadBundle("md")}>
            <Download size={16} /> Xuất Markdown
          </button>
          <button type="button" className="btn-secondary" disabled={!selected.length} onClick={() => downloadBundle("txt")}>
            <Download size={16} /> Xuất TXT
          </button>
          <select
            className="form-field max-w-56"
            disabled={!selected.length}
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) moveSelected(event.target.value as DocumentFolder);
              event.target.value = "";
            }}
          >
            <option value="">Chuyển thư mục...</option>
            {folders.map((folder) => <option key={folder}>{folder}</option>)}
          </select>
          <button type="button" className="btn-secondary text-red-600" disabled={!selected.length} onClick={deleteSelected}>Xóa đã chọn</button>
          <button type="button" className="btn-secondary" disabled={!selected.length} onClick={() => setSelected([])}>Bỏ chọn</button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.length ? filteredItems.map((item) => (
          <article
            key={item.id}
            className={`rounded-[28px] border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl ${selected.includes(item.id) ? "border-blue-400 bg-blue-50/50 ring-2 ring-blue-100" : "border-blue-100"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={(event) => setSelected(event.target.checked ? [...selected, item.id] : selected.filter((id) => id !== item.id))}
                aria-label={`Chọn ${item.title}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{labels[item.type]}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    <FolderOpen size={13} /> {item.folder || "Khác"}
                  </span>
                  {item.type === "exam" ? <span className={`rounded-full px-3 py-1 text-xs font-black ${item.auditMeta?.auditStatus === "ready" ? "bg-emerald-100 text-emerald-700" : item.auditMeta?.auditStatus === "needs_fix" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{auditStatusLabel(item)}</span> : null}
                  {item.structuredExam ? <span className={`rounded-full px-3 py-1 text-xs font-black ${item.examSolutionSet?.verificationStatus === "verified" ? "bg-emerald-100 text-emerald-700" : item.examSolutionSet?.verificationStatus === "has_errors" || item.examSolutionSet?.verificationStatus === "needs_review" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{item.examSolutionSet?.verificationStatus === "verified" ? "Đã xác minh" : item.examSolutionSet?.verificationStatus === "has_errors" || item.examSolutionSet?.verificationStatus === "needs_review" ? "Cần rà soát đáp án" : item.examSolutionSet ? "Đã tạo đáp án" : "Chưa có lời giải"}</span> : null}
                  {item.generationMeta?.creationMode && item.generationMeta.creationMode !== "manual" ? <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">{creationLabels[item.generationMeta.creationMode]}</span> : null}
                </div>
                <h3 className="mt-3 line-clamp-2 font-black text-slate-900">{item.title}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                  <CalendarDays size={13} />
                  {new Date(item.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="rounded-2xl border border-slate-200 p-2 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                aria-label="Xóa"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.content}</p>
            <select
              className="form-field mt-3"
              value={item.folder || "Khác"}
              onChange={(event) => {
                updateDocumentFolder(item.id, event.target.value as DocumentFolder);
                void updateCloudDocumentFolder(item.id, event.target.value as DocumentFolder);
                void refresh();
              }}
            >
              {folders.map((folder) => <option key={folder}>{folder}</option>)}
            </select>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/history/${item.id}`} className="btn-secondary min-h-9 px-3 py-1.5 text-xs">
                <Eye size={16} /> Xem
              </Link>
              {item.type === "document-recognition" ? <Link href={`/tools/document-recognition?history=${encodeURIComponent(item.id)}`} className="btn-secondary min-h-9 px-3 py-1.5 text-xs"><FileCheck2 size={16} />Tiếp tục rà soát</Link> : null}
              {item.type === "exam" ? <Link href={`/tools/exam-audit?history=${encodeURIComponent(item.id)}`} className="btn-secondary min-h-9 px-3 py-1.5 text-xs"><ClipboardCheck size={16} />Kiểm tra lại</Link> : null}
              {item.structuredExam ? <Link href={`/tools/answer-solutions?history=${encodeURIComponent(item.id)}`} className="btn-secondary min-h-9 px-3 py-1.5 text-xs"><FileCheck2 size={16} />Lời giải &amp; đáp án</Link> : null}
              {item.type === "exam" && item.generationMeta?.normalizedBlueprint ? <button type="button" className="btn-secondary min-h-9 px-3 py-1.5 text-xs" onClick={() => { sessionStorage.setItem(EXAM_BLUEPRINT_SESSION_KEY, JSON.stringify(item.generationMeta?.normalizedBlueprint)); window.location.assign("/tools/exam-generator?mode=file"); }}><RefreshCw size={16} />Tạo đề mới theo cấu trúc này</button> : null}
              <DocumentExportMenu document={item} compact />
            </div>
          </article>
        )) : (
          <SoanLabEmptyState
            title="Không tìm thấy tài liệu phù hợp"
            description="Thử đổi từ khóa, loại tài liệu hoặc thư mục để xem lại lịch sử."
          />
        )}
      </div>
    </div>
  );
}

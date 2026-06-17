"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Eye, FileText, Trash2 } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { ExportDocxButton } from "@/components/ExportDocxButton";
import { OutputPreview } from "@/components/OutputPreview";
import type { GeneratedDocument } from "@/lib/types";
import { deleteDocument, getHistory } from "@/lib/history";

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
  const [selected, setSelected] = useState<GeneratedDocument | null>(null);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tất cả");

  function refresh() {
    setItems(getHistory());
  }

  useEffect(() => {
    queueMicrotask(refresh);
  }, []);

  function remove(id: string) {
    deleteDocument(id);
    if (selected?.id === id) setSelected(null);
    refresh();
    setMessage("Đã xóa tài liệu khỏi lịch sử.");
    setTimeout(() => setMessage(""), 2200);
  }

  function clearAll() {
    if (!window.confirm("Bạn có chắc muốn xóa toàn bộ lịch sử không?")) return;
    localStorage.removeItem("classora_history");
    setItems([]);
    setSelected(null);
    setMessage("Đã xóa toàn bộ lịch sử.");
  }

  const filteredItems = items.filter((item) => {
    const normalized = query.trim().toLowerCase();
    const matchQuery = !normalized || item.title.toLowerCase().includes(normalized) || item.content.toLowerCase().includes(normalized);
    const matchType = typeFilter === "Tất cả" || labels[item.type] === typeFilter;
    return matchQuery && matchType;
  });

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <FileText className="mx-auto mb-3 text-slate-400" size={34} />
        <p className="font-semibold text-ink">Chưa có tài liệu nào được lưu</p>
        <p className="mt-1">Sau khi tạo đề, phiếu học tập hoặc nhận xét, hãy bấm “Save to history”.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div> : null}
      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
          <input className="form-field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tiêu đề hoặc nội dung..." />
          <select className="form-field" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option>Tất cả</option>
            {Object.values(labels).map((label) => <option key={label}>{label}</option>)}
          </select>
          <button type="button" onClick={clearAll} className="btn-secondary text-red-600">Xóa tất cả</button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.2fr]">
        <div className="space-y-3">
          {filteredItems.length ? filteredItems.map((item) => (
            <article key={item.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-bold uppercase tracking-wide text-brand">{labels[item.type]}</span>
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
              <button type="button" onClick={() => setSelected(item)} className="mt-3 btn-secondary">
                <Eye size={16} />
                Xem
              </button>
            </article>
          )) : <div className="empty-state">Không tìm thấy tài liệu phù hợp.</div>}
        </div>
        <div className="min-h-80">
          {selected ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <CopyButton text={selected.content} />
                <ExportDocxButton document={selected} />
              </div>
              <OutputPreview document={selected} />
            </div>
          ) : (
            <div className="empty-state h-full">
              <Eye className="mx-auto mb-3 text-slate-400" size={34} />
              <p className="font-semibold text-ink">Chọn một tài liệu để xem nội dung</p>
              <p className="mt-1">Bản xem trước sẽ hiển thị theo định dạng gần giống trang Word.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

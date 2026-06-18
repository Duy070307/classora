"use client";

import { Copy, Download, Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ExportDocxButton } from "@/components/ExportDocxButton";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { createDocument } from "@/lib/history";
import { createQuestion, getQuestions, questionsToDocument, saveQuestions } from "@/lib/question-bank";
import type { QuestionDifficulty, QuestionItem, QuestionType } from "@/lib/types";
import Link from "next/link";

const emptyForm = {
  subject: "Toán",
  grade: "8",
  topic: "",
  question: "",
  type: "Trắc nghiệm" as QuestionType,
  difficulty: "Nhận biết" as QuestionDifficulty,
  answer: "",
  explanation: ""
};

export default function QuestionBankPage() {
  const [items, setItems] = useState<QuestionItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ subject: "", grade: "", topic: "", type: "", difficulty: "" });
  const [message, setMessage] = useState("");

  useEffect(() => queueMicrotask(() => setItems(getQuestions())), []);

  function persist(next: QuestionItem[]) {
    setItems(next);
    saveQuestions(next);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.question.trim()) return setMessage("Vui lòng nhập nội dung câu hỏi.");
    const nextItem = editingId
      ? { ...items.find((item) => item.id === editingId)!, ...form }
      : createQuestion(form);
    persist(editingId ? items.map((item) => item.id === editingId ? nextItem : item) : [nextItem, ...items]);
    setForm(emptyForm);
    setEditingId(null);
    setMessage(editingId ? "Đã cập nhật câu hỏi." : "Đã thêm câu hỏi.");
  }

  function edit(item: QuestionItem) {
    setEditingId(item.id);
    setForm({
      subject: item.subject, grade: item.grade, topic: item.topic, question: item.question,
      type: item.type, difficulty: item.difficulty, answer: item.answer, explanation: item.explanation
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function remove(id: string) {
    if (!window.confirm("Xóa câu hỏi này?")) return;
    persist(items.filter((item) => item.id !== id));
    setSelected((current) => current.filter((item) => item !== id));
  }

  const filtered = useMemo(() => items.filter((item) => {
    const text = query.trim().toLowerCase();
    return (!text || `${item.question} ${item.answer} ${item.explanation}`.toLowerCase().includes(text))
      && (!filters.subject || item.subject === filters.subject)
      && (!filters.grade || item.grade === filters.grade)
      && (!filters.topic || item.topic === filters.topic)
      && (!filters.type || item.type === filters.type)
      && (!filters.difficulty || item.difficulty === filters.difficulty);
  }), [filters, items, query]);

  const exportItems = selected.length ? items.filter((item) => selected.includes(item.id)) : filtered;
  const exportDocument = createDocument(`Ngân hàng câu hỏi - ${exportItems.length} câu`, "question-bank", questionsToDocument(exportItems));
  const unique = (key: "subject" | "grade" | "topic") => [...new Set(items.map((item) => item[key]).filter(Boolean))];

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title="Ngân hàng câu hỏi" description="Lưu, tìm kiếm và tái sử dụng câu hỏi ngay trên trình duyệt của bạn." />
        <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
          <form onSubmit={submit} className="card space-y-4 p-5">
            <div className="flex items-center gap-2"><Plus size={18} className="text-brand" /><h2 className="font-bold text-ink">{editingId ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi"}</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">Môn học</label><input className="form-field mt-1" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
              <div><label className="label">Lớp</label><input className="form-field mt-1" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} /></div>
            </div>
            <div><label className="label">Chủ đề</label><input className="form-field mt-1" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>
            <div><label className="label">Nội dung câu hỏi</label><textarea className="form-field mt-1 min-h-28" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">Loại câu hỏi</label><select className="form-field mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as QuestionType })}>{["Trắc nghiệm", "Tự luận", "Điền khuyết", "Đúng/Sai"].map((value) => <option key={value}>{value}</option>)}</select></div>
              <div><label className="label">Mức độ</label><select className="form-field mt-1" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as QuestionDifficulty })}>{["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"].map((value) => <option key={value}>{value}</option>)}</select></div>
            </div>
            <div><label className="label">Đáp án</label><textarea className="form-field mt-1 min-h-20" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></div>
            <div><label className="label">Lời giải hoặc ghi chú</label><textarea className="form-field mt-1 min-h-20" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} /></div>
            <div className="flex gap-2"><button className="btn-primary flex-1">{editingId ? "Lưu chỉnh sửa" : "Thêm câu hỏi"}</button>{editingId ? <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Hủy</button> : null}</div>
            {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
          </form>

          <section className="space-y-4">
            <div className="card space-y-3 p-4">
              <input className="form-field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm nội dung, đáp án hoặc lời giải..." />
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {(["subject", "grade", "topic"] as const).map((key) => <select key={key} className="form-field" value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}><option value="">{key === "subject" ? "Mọi môn" : key === "grade" ? "Mọi lớp" : "Mọi chủ đề"}</option>{unique(key).map((value) => <option key={value}>{value}</option>)}</select>)}
                <select className="form-field" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}><option value="">Mọi loại</option>{["Trắc nghiệm", "Tự luận", "Điền khuyết", "Đúng/Sai"].map((value) => <option key={value}>{value}</option>)}</select>
                <select className="form-field" value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}><option value="">Mọi mức độ</option>{["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"].map((value) => <option key={value}>{value}</option>)}</select>
              </div>
              <div className="flex flex-wrap gap-2">
                <ExportDocxButton document={exportDocument} />
                <button type="button" className="btn-secondary" onClick={() => navigator.clipboard.writeText(questionsToDocument(exportItems))}><Copy size={16} />Copy {selected.length ? "đã chọn" : "kết quả lọc"}</button>
                <button type="button" className="btn-secondary text-red-600" onClick={() => { if (window.confirm("Xóa toàn bộ ngân hàng câu hỏi?")) { persist([]); setSelected([]); } }}><Trash2 size={16} />Xóa tất cả</button>
              </div>
            </div>
            {filtered.length ? filtered.map((item) => (
              <article key={item.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" checked={selected.includes(item.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, item.id] : selected.filter((id) => id !== item.id))} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2 text-xs"><span className="rounded bg-blue-50 px-2 py-1 font-semibold text-brand">{item.subject} · Lớp {item.grade}</span><span className="rounded bg-slate-100 px-2 py-1">{item.topic || "Chưa có chủ đề"}</span><span className="rounded bg-amber-50 px-2 py-1 text-amber-700">{item.type} · {item.difficulty}</span></div>
                    <p className="mt-3 whitespace-pre-wrap font-medium leading-6 text-ink">{item.question}</p>
                    <p className="mt-2 text-sm text-muted"><strong>Đáp án:</strong> {item.answer || "Chưa có"}</p>
                    {item.explanation ? <p className="mt-1 text-sm text-muted"><strong>Lời giải:</strong> {item.explanation}</p> : null}
                    <p className="mt-2 text-xs text-muted">{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="rounded-md border border-line p-2" title="Sao chép" onClick={() => navigator.clipboard.writeText(item.question)}><Copy size={15} /></button>
                    <button className="rounded-md border border-line p-2" title="Chỉnh sửa" onClick={() => edit(item)}><Pencil size={15} /></button>
                    <button className="rounded-md border border-line p-2 text-red-600" title="Xóa" onClick={() => remove(item.id)}><Trash2 size={15} /></button>
                  </div>
                </div>
              </article>
            )) : <div className="empty-state"><Download className="mx-auto mb-3 text-slate-400" /><p className="font-semibold text-ink">Chưa có câu hỏi phù hợp</p><p className="mt-1">Thêm thủ công hoặc nhập nhanh từ văn bản/CSV.</p><Link href="/tools/import-questions" className="btn-primary mt-4">Nhập câu hỏi</Link></div>}
          </section>
        </div>
      </main>
    </div>
  );
}

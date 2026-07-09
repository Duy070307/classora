"use client";

import { Copy, Download, FileUp, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import { PageHeader } from "@/components/PageHeader";
import { AppShell } from "@/components/AppShell";
import { createDocument } from "@/lib/history";
import { createQuestion, getQuestions, questionsToDocument, saveQuestions } from "@/lib/question-bank";
import type { QuestionDifficulty, QuestionItem, QuestionType } from "@/lib/types";
import Link from "next/link";
import { BugReportLink } from "@/components/BugReportLink";
import { SoanLabEmptyState } from "@/components/ui/SoanLabEmptyState";
import { BOOK_SERIES_OPTIONS, DEFAULT_BOOK_SERIES } from "@/lib/curriculum";

type ScopeFilter = "all" | "system" | "user";

const emptyForm = {
  subject: "Toán",
  grade: "8",
  topic: "",
  question: "",
  type: "Trắc nghiệm" as QuestionType,
  difficulty: "Nhận biết" as QuestionDifficulty,
  answer: "",
  explanation: "",
  bookSeries: DEFAULT_BOOK_SERIES,
  contentType: "Lý thuyết"
};

function mergeQuestions(localItems: QuestionItem[], cloudItems: QuestionItem[]) {
  const map = new Map<string, QuestionItem>();
  localItems.forEach((item) => map.set(item.id, { ...item, bankScope: item.bankScope || "user" }));
  cloudItems.forEach((item) => map.set(item.id, item));
  return [...map.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function scopeOf(item: QuestionItem): "system" | "user" {
  return item.bankScope === "system" || item.metadata?.generatedBy === "Soạn Lab seed" ? "system" : "user";
}

export default function QuestionBankPage() {
  const [items, setItems] = useState<QuestionItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [importMode, setImportMode] = useState<"excel" | "ai">("excel");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [filters, setFilters] = useState({ subject: "", grade: "", topic: "", type: "", difficulty: "", bookSeries: "", contentType: "" });
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const local = getQuestions();
      setItems(local);
      import("@/lib/data/question-bank-store")
        .then(({ listCloudQuestions }) => listCloudQuestions())
        .then((cloud) => {
          if (cloud?.length) setItems((current) => mergeQuestions(current.length ? current : local, cloud));
        })
        .catch(() => undefined);
      fetch("/api/auth/me")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => setIsAdmin(data?.user?.role === "admin"))
        .catch(() => undefined);
    });
  }, []);

  function persist(next: QuestionItem[]) {
    setItems(next);
    saveQuestions(next.filter((item) => scopeOf(item) === "user"));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.question.trim()) return setMessage("Vui lòng nhập nội dung câu hỏi.");
    const nextItem = editingId
      ? {
          ...items.find((item) => item.id === editingId)!,
          subject: form.subject,
          grade: form.grade,
          topic: form.topic,
          question: form.question,
          type: form.type,
          difficulty: form.difficulty,
          answer: form.answer,
          explanation: form.explanation,
          bankScope: "user" as const,
          metadata: {
            ...(items.find((item) => item.id === editingId)?.metadata || {}),
            bookSeries: form.bookSeries,
            contentType: form.contentType,
            sourceType: "teacher_created",
            needsReview: true,
          },
        }
      : createQuestion({
          subject: form.subject,
          grade: form.grade,
          topic: form.topic,
          question: form.question,
          type: form.type,
          difficulty: form.difficulty,
          answer: form.answer,
          explanation: form.explanation,
          bankScope: "user",
          metadata: {
            bookSeries: form.bookSeries,
            contentType: form.contentType,
            sourceType: "teacher_created",
            needsReview: true,
          },
        });
    persist(editingId ? items.map((item) => item.id === editingId ? nextItem : item) : [nextItem, ...items]);
    setForm(emptyForm);
    setEditingId(null);
    setMessage(editingId ? "Đã cập nhật câu hỏi." : "Đã thêm câu hỏi.");
  }

  function edit(item: QuestionItem) {
    if (scopeOf(item) === "system") return setMessage("Câu hỏi Soạn Lab là dữ liệu tham khảo dùng chung. Hãy sao chép vào ngân hàng của tôi để chỉnh sửa.");
    setEditingId(item.id);
    setForm({
      subject: item.subject, grade: item.grade, topic: item.topic, question: item.question,
      type: item.type, difficulty: item.difficulty, answer: item.answer, explanation: item.explanation,
      bookSeries: item.metadata?.bookSeries || DEFAULT_BOOK_SERIES,
      contentType: item.metadata?.contentType || "Lý thuyết"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function remove(id: string) {
    const target = items.find((item) => item.id === id);
    if (target && scopeOf(target) === "system") return setMessage("Không thể xóa câu hỏi Soạn Lab. Thầy/cô có thể sao chép câu hỏi này vào ngân hàng của tôi để chỉnh sửa riêng.");
    if (!window.confirm("Xóa câu hỏi này?")) return;
    persist(items.filter((item) => item.id !== id));
    setSelected((current) => current.filter((item) => item !== id));
  }

  const filtered = useMemo(() => items.filter((item) => {
    const text = query.trim().toLowerCase();
    return (!text || `${item.question} ${item.answer} ${item.explanation}`.toLowerCase().includes(text))
      && (scopeFilter === "all" || scopeOf(item) === scopeFilter)
      && (!filters.subject || item.subject === filters.subject)
      && (!filters.grade || item.grade === filters.grade)
      && (!filters.topic || item.topic === filters.topic)
      && (!filters.type || item.type === filters.type)
      && (!filters.difficulty || item.difficulty === filters.difficulty)
      && (!filters.bookSeries || (item.metadata?.bookSeries || "Khác") === filters.bookSeries)
      && (!filters.contentType || (item.metadata?.contentType || "Bài tập") === filters.contentType);
  }), [filters, items, query, scopeFilter]);

  const exportItems = selected.length ? items.filter((item) => selected.includes(item.id)) : filtered;
  const exportDocument = createDocument(`Ngân hàng câu hỏi - ${exportItems.length} câu`, "question-bank", questionsToDocument(exportItems));
  const unique = (key: "subject" | "grade" | "topic") => [...new Set(items.map((item) => item[key]).filter(Boolean))];
  const hasSeedQuestions = items.some((item) => item.metadata?.generatedBy === "Soạn Lab seed");
  const counts = {
    all: items.length,
    system: items.filter((item) => scopeOf(item) === "system").length,
    user: items.filter((item) => scopeOf(item) === "user").length,
  };

  async function seedKnttQuestions() {
    setSeeding(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/seed-question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "kntt-theory" }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Chưa thêm được câu hỏi mẫu.");
      const { listCloudQuestions } = await import("@/lib/data/question-bank-store");
      const cloud = await listCloudQuestions();
      if (cloud?.length) setItems((current) => mergeQuestions(current, cloud));
      setMessage(`Đã thêm ${data.inserted || 0} câu hỏi mẫu. Bỏ qua ${data.skipped || 0} câu hỏi đã tồn tại.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chưa thêm được câu hỏi mẫu. Vui lòng thử lại.");
    }
    setSeeding(false);
  }

  async function copyToMyBank(item: QuestionItem) {
    setMessage("");
    try {
      const response = await fetch("/api/question-bank/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Chưa sao chép được câu hỏi.");
      const { listCloudQuestions } = await import("@/lib/data/question-bank-store");
      const cloud = await listCloudQuestions();
      if (cloud?.length) setItems((current) => mergeQuestions(current, cloud));
      setMessage(data.message || "Đã sao chép câu hỏi vào ngân hàng của tôi.");
    } catch (error) {
      const copied = createQuestion({
        subject: item.subject,
        grade: item.grade,
        topic: item.topic,
        question: item.question,
        type: item.type,
        difficulty: item.difficulty,
        answer: item.answer,
        explanation: item.explanation,
        options: item.options || null,
        bankScope: "user",
        metadata: {
          ...(item.metadata || {}),
          generatedBy: undefined,
          sourceType: "copied_from_soanlab",
          needsReview: true,
          referenceSourceId: item.id,
        },
      });
      delete copied.metadata?.generatedBy;
      delete copied.metadata?.seedKey;
      persist([copied, ...items]);
      setMessage(error instanceof Error ? `${error.message} Đã lưu bản sao cục bộ vào ngân hàng của tôi.` : "Đã lưu bản sao cục bộ vào ngân hàng của tôi.");
    }
  }

  return (
    <AppShell title="Ngân hàng câu hỏi">
        <PageHeader title="Ngân hàng câu hỏi" description="Lưu, tìm kiếm và tái sử dụng câu hỏi ngay trên trình duyệt của bạn." />
        <BugReportLink source="question-bank" className="mb-4" />
        <section className="mb-6 rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Nhập câu hỏi</h2>
              <div className="mt-3 inline-grid gap-2 rounded-2xl border border-blue-100 bg-white p-1.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setImportMode("excel")}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition ${importMode === "excel" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50"}`}
                >
                  Theo mẫu Excel
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode("ai")}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition ${importMode === "ai" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50"}`}
                >
                  AI tự nhận diện
                </button>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {importMode === "excel"
                  ? "Phù hợp khi thầy cô muốn nhập dữ liệu chính xác, đúng cột và ít cần chỉnh sửa."
                  : "Upload đề cũ, file Word/TXT/Markdown/CSV/Excel hoặc nội dung đã có để Soạn Lab thử tách thành dữ liệu có cấu trúc."}
              </p>
              {importMode === "excel" ? (
                <p className="mt-2 text-sm font-semibold text-amber-700">
                  Khuyến nghị dùng mẫu Excel để tránh lỗi định dạng. Không đổi tên các cột trong file mẫu.
                </p>
              ) : (
                <p className="mt-2 text-sm font-semibold text-amber-700">
                  Kết quả nhận diện là bản nháp. Thầy cô cần kiểm tra lại nội dung, đáp án và phân loại trước khi nhập.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {importMode === "excel" ? (
                <>
                  <Link href="/templates/mau-ngan-hang-cau-hoi-soan-lab.xlsx" className="btn-primary" download>
                    <Download size={16} /> Tải mẫu Excel
                  </Link>
                  <Link href="/templates/mau-ngan-hang-cau-hoi-soan-lab.csv" className="btn-secondary" download>
                    <Download size={16} /> Tải mẫu CSV
                  </Link>
                  <Link href="/tools/import-questions" className="btn-secondary">
                    <FileUp size={16} /> Upload file
                  </Link>
                </>
              ) : (
                <Link href="/tools/import-questions?mode=ai" className="btn-primary">
                  <Sparkles size={16} /> Upload file để nhận diện
                </Link>
              )}
              {isAdmin ? (
                <button type="button" className="btn-secondary" onClick={seedKnttQuestions} disabled={seeding}>
                  {seeding ? "Đang thêm…" : "Thêm câu hỏi mẫu Kết nối tri thức"}
                </button>
              ) : null}
            </div>
          </div>
        </section>
        <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
          <form onSubmit={submit} className="tool-form-card">
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">Bộ sách</label><select className="form-field mt-1" value={form.bookSeries} onChange={(e) => setForm({ ...form, bookSeries: e.target.value })}>{BOOK_SERIES_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select></div>
              <div><label className="label">Loại nội dung</label><select className="form-field mt-1" value={form.contentType} onChange={(e) => setForm({ ...form, contentType: e.target.value })}>{["Lý thuyết", "Bài tập", "Thí nghiệm", "Vận dụng thực tế"].map((value) => <option key={value}>{value}</option>)}</select></div>
            </div>
            <div><label className="label">Đáp án</label><textarea className="form-field mt-1 min-h-20" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></div>
            <div><label className="label">Lời giải hoặc ghi chú</label><textarea className="form-field mt-1 min-h-20" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} /></div>
            <div className="flex gap-2"><button className="btn-primary flex-1">{editingId ? "Lưu chỉnh sửa" : "Thêm câu hỏi"}</button>{editingId ? <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Hủy</button> : null}</div>
            {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
          </form>

          <section className="space-y-4">
            <div className="card space-y-3 p-4">
              <div className="grid gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 p-1.5 sm:grid-cols-3">
                {([
                  ["all", `Tất cả (${counts.all})`],
                  ["system", `Ngân hàng Soạn Lab (${counts.system})`],
                  ["user", `Ngân hàng của tôi (${counts.user})`],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setScopeFilter(value);
                      setSelected([]);
                    }}
                    className={`rounded-xl px-3 py-2 text-xs font-black transition ${scopeFilter === value ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:text-blue-700"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input className="form-field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm nội dung, đáp án hoặc lời giải..." />
              {hasSeedQuestions ? (
                <p className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
                  Câu hỏi mẫu chỉ dùng để tham khảo và làm dữ liệu khởi đầu. Thầy cô cần kiểm tra, chỉnh sửa hoặc thay thế theo nội dung dạy học thực tế.
                </p>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <select className="form-field" value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value as ScopeFilter)}><option value="all">Mọi nguồn</option><option value="system">Soạn Lab</option><option value="user">Của tôi</option></select>
                {(["subject", "grade", "topic"] as const).map((key) => <select key={key} className="form-field" value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}><option value="">{key === "subject" ? "Mọi môn" : key === "grade" ? "Mọi lớp" : "Mọi chủ đề"}</option>{unique(key).map((value) => <option key={value}>{value}</option>)}</select>)}
                <select className="form-field" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}><option value="">Mọi loại</option>{["Trắc nghiệm", "Tự luận", "Điền khuyết", "Đúng/Sai"].map((value) => <option key={value}>{value}</option>)}</select>
                <select className="form-field" value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}><option value="">Mọi mức độ</option>{["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"].map((value) => <option key={value}>{value}</option>)}</select>
                <select className="form-field" value={filters.bookSeries} onChange={(e) => setFilters({ ...filters, bookSeries: e.target.value })}><option value="">Mọi bộ sách</option>{["Kết nối tri thức", "Chân trời sáng tạo", "Cánh diều", "Khác"].map((value) => <option key={value}>{value}</option>)}</select>
                <select className="form-field" value={filters.contentType} onChange={(e) => setFilters({ ...filters, contentType: e.target.value })}><option value="">Mọi loại nội dung</option>{["Lý thuyết", "Bài tập", "Thí nghiệm", "Vận dụng thực tế"].map((value) => <option key={value}>{value}</option>)}</select>
              </div>
              <div className="flex flex-wrap gap-2">
                <DocumentExportMenu document={exportDocument} />
                <button type="button" className="btn-secondary" onClick={() => navigator.clipboard.writeText(questionsToDocument(exportItems))}><Copy size={16} />Copy {selected.length ? "đã chọn" : "kết quả lọc"}</button>
                <button type="button" className="btn-secondary text-red-600" onClick={() => { if (window.confirm("Xóa toàn bộ câu hỏi trong ngân hàng của tôi?")) { persist(items.filter((item) => scopeOf(item) === "system")); setSelected([]); } }}><Trash2 size={16} />Xóa câu hỏi của tôi</button>
              </div>
            </div>
            {filtered.length ? filtered.map((item) => (
              <article key={item.id} className={`card p-4 transition hover:border-blue-200 hover:shadow-lg ${selected.includes(item.id) ? "border-blue-400 bg-blue-50/40 ring-2 ring-blue-100" : ""}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" checked={selected.includes(item.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, item.id] : selected.filter((id) => id !== item.id))} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2 text-xs"><span className={scopeOf(item) === "system" ? "rounded bg-blue-600 px-2 py-1 font-semibold text-white" : "rounded bg-slate-900 px-2 py-1 font-semibold text-white"}>{scopeOf(item) === "system" ? "Soạn Lab" : "Của tôi"}</span><span className="rounded bg-blue-50 px-2 py-1 font-semibold text-brand">{item.subject} · Lớp {item.grade}</span><span className="rounded bg-slate-100 px-2 py-1">{item.topic || "Chưa có chủ đề"}</span><span className="rounded bg-amber-50 px-2 py-1 text-amber-700">{item.type} · {item.difficulty}</span>{item.metadata?.bookSeries ? <span className="rounded bg-indigo-50 px-2 py-1 text-indigo-700">{item.metadata.bookSeries}</span> : null}{item.metadata?.contentType ? <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">{item.metadata.contentType}</span> : null}</div>
                    <p className="mt-3 whitespace-pre-wrap font-medium leading-6 text-ink">{item.question}</p>
                    <p className="mt-2 text-sm text-muted"><strong>Đáp án:</strong> {item.answer || "Chưa có"}</p>
                    {item.explanation ? <p className="mt-1 text-sm text-muted"><strong>Lời giải:</strong> {item.explanation}</p> : null}
                    <p className="mt-2 text-xs text-muted">{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="rounded-md border border-line p-2" title="Sao chép" aria-label="Sao chép câu hỏi" onClick={() => navigator.clipboard.writeText(item.question)}><Copy size={15} /></button>
                    {scopeOf(item) === "system" ? <button className="rounded-md border border-line px-2 py-1 text-xs font-bold text-blue-700" title="Sao chép vào ngân hàng của tôi" onClick={() => copyToMyBank(item)}>Sao chép vào của tôi</button> : null}
                    {scopeOf(item) === "user" ? <button className="rounded-md border border-line p-2" title="Chỉnh sửa" aria-label="Chỉnh sửa câu hỏi" onClick={() => edit(item)}><Pencil size={15} /></button> : null}
                    {scopeOf(item) === "user" ? <button className="rounded-md border border-line p-2 text-red-600" title="Xóa" aria-label="Xóa câu hỏi" onClick={() => remove(item.id)}><Trash2 size={15} /></button> : null}
                  </div>
                </div>
              </article>
            )) : <SoanLabEmptyState title="Chưa có câu hỏi phù hợp" description={scopeFilter === "system" ? "Chưa có câu hỏi mẫu phù hợp. Vui lòng thử môn, lớp hoặc chủ đề khác." : scopeFilter === "user" ? "Thầy cô chưa thêm câu hỏi riêng. Có thể thêm thủ công, nhập từ Excel hoặc dùng AI tự nhận diện file." : "Thử đổi bộ lọc hoặc thêm câu hỏi vào ngân hàng của tôi."} action={<Link href="/tools/import-questions" className="btn-primary">Nhập câu hỏi</Link>} />}
          </section>
        </div>
    </AppShell>
  );
}

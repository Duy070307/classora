"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Code2, Copy, Download, Edit3, Plus, Save, Search, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { buildStandaloneLatex, tikzCategories, tikzFilename, type TikzSnippet } from "@/lib/tikz-bank";

type SourceTab = "all" | "system" | "user";
type FormState = {
  title: string;
  description: string;
  category: string;
  subject: string;
  grade: string;
  tags: string;
  tikz_code: string;
  full_latex: string;
  preview_note: string;
};

const emptyForm: FormState = { title: "", description: "", category: "Hình học phẳng", subject: "Toán", grade: "", tags: "", tikz_code: "", full_latex: "", preview_note: "" };

export default function TikzBankPage() {
  const [snippets, setSnippets] = useState<TikzSnippet[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [tab, setTab] = useState<SourceTab>("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [tag, setTag] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TikzSnippet | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tikz-bank", { cache: "no-store" });
      const result = await response.json().catch(() => null) as { ok?: boolean; snippets?: TikzSnippet[]; isAdmin?: boolean; userId?: string; error?: string } | null;
      if (!response.ok || !result?.ok) {
        setMessage({ tone: "error", text: result?.error || "Chưa tải được Ngân hàng TikZ. Vui lòng thử lại." });
        return;
      }
      setSnippets(Array.isArray(result.snippets) ? result.snippets : []);
      setIsAdmin(Boolean(result.isAdmin));
      setUserId(result.userId || "");
    } catch {
      setMessage({ tone: "error", text: "Chưa tải được Ngân hàng TikZ. Vui lòng thử lại." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  const options = useMemo(() => ({
    subjects: unique(snippets.map((item) => item.subject)),
    grades: unique(snippets.map((item) => item.grade)),
    tags: unique(snippets.flatMap((item) => item.tags || [])),
  }), [snippets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return snippets.filter((item) => {
      if (tab !== "all" && item.bank_scope !== tab) return false;
      if (category && item.category !== category) return false;
      if (subject && item.subject !== subject) return false;
      if (grade && item.grade !== grade) return false;
      if (tag && !(item.tags || []).includes(tag)) return false;
      const searchable = `${item.title} ${item.description || ""} ${item.category || ""} ${item.subject || ""} ${item.grade || ""} ${(item.tags || []).join(" ")} ${item.tikz_code}`.toLowerCase();
      return !q || searchable.includes(q);
    });
  }, [category, grade, query, snippets, subject, tab, tag]);

  const counts = useMemo(() => ({ system: snippets.filter((item) => item.bank_scope === "system").length, user: snippets.filter((item) => item.bank_scope === "user").length }), [snippets]);

  function toast(text: string, tone: "success" | "error" = "success") {
    setMessage({ text, tone });
    window.setTimeout(() => setMessage(null), 2600);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(item: TikzSnippet) {
    setEditing(item);
    setForm({ title: item.title, description: item.description || "", category: item.category || "Khác", subject: item.subject || "", grade: item.grade || "", tags: (item.tags || []).join(", "), tikz_code: item.tikz_code, full_latex: item.full_latex || "", preview_note: item.preview_note || "" });
    setShowForm(true);
  }

  async function saveSnippet() {
    if (!form.title.trim() || !form.tikz_code.trim()) {
      toast("Vui lòng nhập tiêu đề và mã TikZ.", "error");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(editing ? `/api/tikz-bank/${editing.id}` : "/api/tikz-bank", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean), source_type: editing?.source_type || "teacher_created" }),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string; warnings?: string[] } | null;
      if (!response.ok || !result?.ok) {
        toast(result?.error || "Chưa lưu được mã TikZ. Vui lòng thử lại.", "error");
        return;
      }
      setShowForm(false);
      setEditing(null);
      toast(result.warnings?.[0] || (editing ? "Đã cập nhật mã TikZ." : "Đã thêm mã TikZ vào ngân hàng của tôi."));
      await load();
    } catch {
      toast("Chưa lưu được mã TikZ. Vui lòng thử lại.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function removeSnippet(item: TikzSnippet) {
    if (!window.confirm(`Xóa “${item.title}”?`)) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/tikz-bank/${item.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) return toast(result?.error || "Chưa xóa được mã TikZ.", "error");
      setSnippets((current) => current.filter((snippet) => snippet.id !== item.id));
      toast("Đã xóa mã TikZ.");
    } catch {
      toast("Chưa xóa được mã TikZ.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function copyPersonal(item: TikzSnippet) {
    setBusy(true);
    try {
      const response = await fetch("/api/tikz-bank/copy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id }) });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string; message?: string } | null;
      if (!response.ok || !result?.ok) return toast(result?.error || "Chưa lưu được mã TikZ.", "error");
      toast(result.message || "Đã lưu mã TikZ vào ngân hàng của tôi.");
      await load();
    } catch {
      toast("Chưa lưu được mã TikZ.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function seedSystem() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/seed-tikz-bank", { method: "POST" });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string; inserted?: number; skipped?: number } | null;
      if (!response.ok || !result?.ok) return toast(result?.error || "Chưa thêm được mã TikZ mẫu.", "error");
      toast(`Đã thêm ${result.inserted || 0} mã mẫu, bỏ qua ${result.skipped || 0} mã đã có.`);
      await load();
    } catch {
      toast("Chưa thêm được mã TikZ mẫu.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function copyText(value: string, text: string) {
    try { await navigator.clipboard.writeText(value); toast(text); } catch { toast("Chưa sao chép được. Vui lòng thử lại.", "error"); }
  }

  function downloadTex(item: TikzSnippet) {
    const content = item.full_latex || buildStandaloneLatex(item.tikz_code);
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = tikzFilename(item.title); anchor.click(); URL.revokeObjectURL(url);
    toast("Đã tải file .tex.");
  }

  const hasFilters = Boolean(query || category || subject || grade || tag);
  const emptyText = hasFilters
    ? "Không tìm thấy mã TikZ phù hợp."
    : tab === "system"
      ? "Chưa có mã TikZ mẫu. Admin có thể thêm mã mẫu trong trang quản trị."
      : tab === "user"
        ? "Thầy cô chưa lưu mã TikZ nào. Có thể thêm thủ công hoặc lưu từ công cụ Hình học → TikZ."
        : "Ngân hàng TikZ chưa có nội dung.";

  return (
    <AppShell title="Ngân hàng TikZ">
      <PageHeader title="Ngân hàng TikZ" description="Lưu, tìm kiếm và sao chép nhanh các đoạn mã TikZ thường dùng cho hình học, đồ thị và bài giảng." />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary" onClick={openCreate}><Plus size={17} />Thêm mã TikZ</button>
        {isAdmin ? <button type="button" className="btn-secondary" disabled={busy} onClick={() => { void seedSystem(); }}><Code2 size={17} />Thêm mã TikZ mẫu</button> : null}
        {isAdmin ? <span className="ml-auto text-sm font-bold text-slate-500">Tổng {snippets.length} · SOẠN LAB {counts.system} · Cá nhân {counts.user}</span> : null}
      </div>

      {message ? <div className={`mb-5 rounded-2xl border p-4 text-sm font-bold ${message.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`} role="status">{message.text}</div> : null}

      <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {([['all', 'Tất cả'], ['system', 'Ngân hàng SOẠN LAB'], ['user', 'Của tôi']] as Array<[SourceTab, string]>).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setTab(value)} className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-black ${tab === value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}>{label}</button>
          ))}
        </div>
        <label className="relative mt-3 block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="form-field pl-11" placeholder="Tìm theo tên, chủ đề, tag hoặc nội dung mã TikZ…" />
        </label>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Filter value={category} onChange={setCategory} label="Danh mục" options={[...tikzCategories]} />
          <Filter value={subject} onChange={setSubject} label="Môn học" options={options.subjects} />
          <Filter value={grade} onChange={setGrade} label="Lớp" options={options.grades} />
          <Filter value={tag} onChange={setTag} label="Tag" options={options.tags} />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
        Mã TikZ là bản tham khảo để thầy cô sao chép và chỉnh sửa. Với hình phức tạp, thầy cô nên kiểm tra lại khi biên dịch LaTeX.
      </section>

      {loading ? <div className="empty-state mt-6"><p className="font-bold text-slate-700">Đang tải Ngân hàng TikZ…</p></div> : filtered.length ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {filtered.map((item) => {
            const canManage = isAdmin || (item.bank_scope === "user" && item.user_id === userId);
            const fullLatex = item.full_latex || buildStandaloneLatex(item.tikz_code);
            return <article key={item.id} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${item.bank_scope === "system" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>{item.bank_scope === "system" ? "SOẠN LAB" : "Của tôi"}</span>
                  <h2 className="mt-3 text-lg font-black text-slate-950">{item.title}</h2>
                  {item.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p> : null}
                </div>
                <div className="flex flex-wrap gap-1 text-xs font-bold text-slate-500">{[item.category, item.subject, item.grade ? `Lớp ${item.grade}` : ""].filter(Boolean).map((value) => <span key={value} className="rounded-full bg-slate-100 px-2.5 py-1">{value}</span>)}</div>
              </div>
              {(item.tags || []).length ? <div className="mt-3 flex flex-wrap gap-1">{item.tags?.map((value) => <span key={value} className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">#{value}</span>)}</div> : null}
              <pre className="mt-4 max-h-52 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-100">{item.tikz_code}</pre>
              {item.preview_note ? <p className="mt-3 text-xs font-semibold leading-5 text-amber-700">{item.preview_note}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn-secondary min-h-9 px-3 py-2 text-xs" onClick={() => { void copyText(item.tikz_code, "Đã sao chép mã TikZ."); }}><Copy size={14} />Sao chép TikZ</button>
                <button type="button" className="btn-secondary min-h-9 px-3 py-2 text-xs" onClick={() => { void copyText(fullLatex, "Đã sao chép LaTeX đầy đủ."); }}><Copy size={14} />Sao chép LaTeX đầy đủ</button>
                <button type="button" className="btn-secondary min-h-9 px-3 py-2 text-xs" onClick={() => downloadTex(item)}><Download size={14} />Tải .tex</button>
                {item.bank_scope === "system" && !isAdmin ? <button type="button" disabled={busy} className="btn-secondary min-h-9 px-3 py-2 text-xs" onClick={() => { void copyPersonal(item); }}><Save size={14} />Lưu vào của tôi</button> : null}
                {canManage ? <button type="button" className="btn-secondary min-h-9 px-3 py-2 text-xs" onClick={() => openEdit(item)}><Edit3 size={14} />Sửa</button> : null}
                {canManage ? <button type="button" disabled={busy} className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50" onClick={() => { void removeSnippet(item); }}><Trash2 size={14} />Xóa</button> : null}
              </div>
            </article>;
          })}
        </div>
      ) : <div className="empty-state mt-6"><Code2 className="mx-auto text-blue-600" size={34} /><p className="mt-3 font-bold text-slate-900">{emptyText}</p></div>}

      {showForm ? <SnippetModal form={form} setForm={setForm} editing={Boolean(editing)} busy={busy} onClose={() => setShowForm(false)} onSave={() => { void saveSnippet(); }} /> : null}
    </AppShell>
  );
}

function Filter({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: string[] }) {
  return <label className="text-xs font-bold text-slate-500">{label}<select className="form-field mt-1" value={value} onChange={(event) => onChange(event.target.value)}><option value="">Tất cả</option>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>;
}

function SnippetModal({ form, setForm, editing, busy, onClose, onSave }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>; editing: boolean; busy: boolean; onClose: () => void; onSave: () => void }) {
  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const missingPicture = Boolean(form.tikz_code.trim()) && !/\\begin\s*\{tikzpicture\}/i.test(form.tikz_code);
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div className="mx-auto my-6 max-w-3xl rounded-[28px] bg-white p-5 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-black text-slate-950">{editing ? "Sửa mã TikZ" : "Thêm mã TikZ"}</h2><p className="mt-1 text-sm text-slate-600">Lưu mã vào ngân hàng cá nhân để sử dụng lại.</p></div><button type="button" onClick={onClose} aria-label="Đóng" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Tiêu đề *"><input className="form-field mt-1" value={form.title} maxLength={160} onChange={(e) => update("title", e.target.value)} /></Field>
        <Field label="Danh mục"><select className="form-field mt-1" value={form.category} onChange={(e) => update("category", e.target.value)}>{tikzCategories.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Môn học"><input className="form-field mt-1" value={form.subject} onChange={(e) => update("subject", e.target.value)} /></Field>
        <Field label="Lớp"><input className="form-field mt-1" value={form.grade} onChange={(e) => update("grade", e.target.value)} /></Field>
        <Field label="Mô tả"><textarea className="form-field mt-1 min-h-20" value={form.description} onChange={(e) => update("description", e.target.value)} /></Field>
        <Field label="Tags, cách nhau bằng dấu phẩy"><textarea className="form-field mt-1 min-h-20" value={form.tags} onChange={(e) => update("tags", e.target.value)} /></Field>
      </div>
      <Field label="Mã TikZ *"><textarea className="form-field mt-1 min-h-56 font-mono text-xs" value={form.tikz_code} onChange={(e) => update("tikz_code", e.target.value)} /></Field>
      {missingPicture ? <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800">Mã chưa có môi trường tikzpicture. Hãy kiểm tra lại trước khi lưu và biên dịch.</p> : null}
      <Field label="LaTeX đầy đủ, không bắt buộc"><textarea className="form-field mt-1 min-h-36 font-mono text-xs" value={form.full_latex} onChange={(e) => update("full_latex", e.target.value)} /></Field>
      <Field label="Ghi chú xem trước, không bắt buộc"><textarea className="form-field mt-1 min-h-20" value={form.preview_note} onChange={(e) => update("preview_note", e.target.value)} /></Field>
      <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" className="btn-secondary" onClick={onClose}>Hủy</button><button type="button" className="btn-primary" disabled={busy} onClick={onSave}><Check size={16} />{busy ? "Đang lưu…" : "Lưu mã TikZ"}</button></div>
    </div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="mt-4 block text-sm font-bold text-slate-900">{label}{children}</label>; }
function unique(values: Array<string | null>) { return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "vi")); }

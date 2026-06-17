"use client";

import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";

type TemplateItem = {
  id: string;
  name: string;
  type: string;
  content: string;
  notes: string;
  updatedAt: string;
};

const TEMPLATE_KEY = "classora_templates";
const templateTypes = ["Đề kiểm tra", "Giáo án", "Phiếu học tập", "Nhận xét học sinh", "Tin nhắn phụ huynh"];

function readTemplates(): TemplateItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is TemplateItem => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<TemplateItem>;
      return typeof candidate.id === "string" && typeof candidate.name === "string" && typeof candidate.content === "string";
    });
  } catch {
    return [];
  }
}

export default function TemplatesPage() {
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState(templateTypes[0]);
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    queueMicrotask(() => setItems(readTemplates()));
  }, []);

  function persist(next: TemplateItem[]) {
    setItems(next);
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(next));
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setType(templateTypes[0]);
    setContent("");
    setNotes("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const item: TemplateItem = {
      id: editingId ?? crypto.randomUUID(),
      name: name || "Mẫu chưa đặt tên",
      type,
      content: content || "Chưa có nội dung.",
      notes,
      updatedAt: new Date().toISOString()
    };
    const next = editingId ? items.map((current) => current.id === editingId ? item : current) : [item, ...items];
    persist(next);
    resetForm();
    setMessage(editingId ? "Đã cập nhật mẫu." : "Đã thêm mẫu cá nhân.");
  }

  function edit(item: TemplateItem) {
    setEditingId(item.id);
    setName(item.name);
    setType(item.type);
    setContent(item.content);
    setNotes(item.notes);
  }

  function remove(id: string) {
    persist(items.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setMessage("Đã xóa mẫu.");
  }

  async function copy(item: TemplateItem) {
    await navigator.clipboard.writeText(`MẪU: ${item.name}\nLoại: ${item.type}\n\n${item.content}\n\nGhi chú: ${item.notes || "Không có"}`);
    setMessage("Đã copy mẫu vào clipboard.");
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title="Mẫu cá nhân" description="Tạo, sửa, xóa và copy các mẫu tài liệu cá nhân. Dữ liệu chỉ lưu trong localStorage của trình duyệt này." />
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={handleSubmit} className="card space-y-4 p-5">
            <div className="flex items-center gap-2">
              <Plus size={18} className="text-brand" />
              <h2 className="text-lg font-bold text-ink">{editingId ? "Sửa mẫu" : "Thêm mẫu mới"}</h2>
            </div>
            <div>
              <label className="label">Template name</label>
              <input className="form-field mt-1" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Mẫu đề 15 phút" />
            </div>
            <div>
              <label className="label">Template type</label>
              <select className="form-field mt-1" value={type} onChange={(event) => setType(event.target.value)}>
                {templateTypes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Template content</label>
              <textarea className="form-field mt-1 min-h-40" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Nhập nội dung mẫu..." />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="form-field mt-1 min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ghi chú cách dùng mẫu..." />
            </div>
            <div className="flex gap-2">
              <button className="btn-primary flex-1" type="submit">{editingId ? "Lưu chỉnh sửa" : "Add template"}</button>
              {editingId ? <button className="btn-secondary" type="button" onClick={resetForm}>Hủy</button> : null}
            </div>
            {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
          </form>

          <section className="space-y-3">
            {items.length ? items.map((item) => (
              <article key={item.id} className="card p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-bold uppercase tracking-wide text-brand">{item.type}</span>
                    <h3 className="mt-2 text-lg font-bold text-ink">{item.name}</h3>
                    <p className="mt-1 text-xs text-muted">Cập nhật: {new Date(item.updatedAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => copy(item)} className="btn-secondary"><Copy size={16} />Copy</button>
                    <button type="button" onClick={() => edit(item)} className="btn-secondary"><Pencil size={16} />Edit</button>
                    <button type="button" onClick={() => remove(item.id)} className="btn-secondary text-red-600"><Trash2 size={16} />Delete</button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.content}</p>
                {item.notes ? <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-muted">{item.notes}</p> : null}
              </article>
            )) : (
              <div className="empty-state">Chưa có mẫu cá nhân. Hãy thêm mẫu đầu tiên để dùng lại nhanh hơn.</div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

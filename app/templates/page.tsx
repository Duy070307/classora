"use client";

import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { getTemplates, saveTemplates, templateTypes, type TemplateItem } from "@/lib/templates";

const placeholderGuide = `{{ten_truong}} - Tên trường/trung tâm
{{ten_giao_vien}} - Tên giáo viên
{{to_bo_mon}} - Tổ/bộ môn
{{nam_hoc}} - Năm học
{{mon_hoc}} - Môn học
{{lop}} - Lớp
{{chu_de}} - Chủ đề
{{thoi_gian}} - Thời gian
{{noi_dung}} - Nội dung chính
{{dap_an}} - Đáp án
{{thang_diem}} - Thang điểm
{{ma_tran}} - Ma trận
{{ghi_chu}} - Ghi chú`;

export default function TemplatesPage() {
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState(templateTypes[0]);
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    queueMicrotask(() => setItems(getTemplates()));
  }, []);

  function persist(next: TemplateItem[]) {
    setItems(next);
    saveTemplates(next);
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
      content: content || "{{noi_dung}}",
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

  async function copyPlaceholderGuide() {
    await navigator.clipboard.writeText(placeholderGuide);
    setMessage("Đã sao chép danh sách placeholder.");
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title="Mẫu cá nhân" description="Tạo, sửa, xóa và copy các mẫu tài liệu cá nhân. Mẫu có sẵn luôn tự xuất hiện trong các công cụ phù hợp." />

        <section className="card mb-6 p-5">
          <h2 className="text-lg font-bold text-ink">Cách dùng mẫu tài liệu</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Soạn Lab có sẵn các mẫu tiếng Việt cho đề kiểm tra, đáp án, ma trận, giáo án, phiếu học tập và nhận xét học sinh. Bạn cũng có thể tạo mẫu cá nhân bằng placeholder; khi chọn mẫu trong tool, Soạn Lab thay placeholder bằng dữ liệu từ cài đặt, form và nội dung đã tạo.</p>
          <div className="mt-4 rounded-md bg-slate-50 p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h3 className="font-semibold text-ink">Placeholder guide</h3>
              <button type="button" className="btn-secondary" onClick={copyPlaceholderGuide}><Copy size={16} />Sao chép danh sách placeholder</button>
            </div>
            <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{placeholderGuide}</pre>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={handleSubmit} className="tool-form-card">
            <div className="flex items-center gap-2">
              <Plus size={18} className="text-brand" />
              <h2 className="text-lg font-bold text-ink">{editingId ? "Sửa mẫu" : "Thêm mẫu mới"}</h2>
            </div>
            <div>
              <label className="label">Tên mẫu</label>
              <input className="form-field mt-1" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Mẫu đề 45 phút của trường" />
            </div>
            <div>
              <label className="label">Loại mẫu</label>
              <select className="form-field mt-1" value={type} onChange={(event) => setType(event.target.value)}>
                {templateTypes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nội dung mẫu</label>
              <textarea className="form-field mt-1 min-h-44" value={content} onChange={(event) => setContent(event.target.value)} placeholder={"{{ten_truong}}\nMôn: {{mon_hoc}} - Lớp: {{lop}}\n{{noi_dung}}"} />
              <p className="mt-2 text-xs leading-5 text-muted">Nên có {"{{noi_dung}}"} để nội dung tạo ra được đặt đúng vị trí trong mẫu.</p>
            </div>
            <div>
              <label className="label">Ghi chú</label>
              <textarea className="form-field mt-1 min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ghi chú cách dùng mẫu..." />
            </div>
            <div className="flex gap-2">
              <button className="btn-primary flex-1" type="submit">{editingId ? "Lưu chỉnh sửa" : "Thêm mẫu"}</button>
              {editingId ? <button className="btn-secondary" type="button" onClick={resetForm}>Hủy</button> : null}
            </div>
            {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
          </form>

          <section className="space-y-3">
            {items.length ? items.map((item) => (
              <article key={item.id} className="card p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-bold uppercase tracking-wide text-brand">{item.type}</span>
                    <h3 className="mt-2 text-lg font-bold text-ink">{item.name}</h3>
                    <p className="mt-1 text-xs text-muted">Cập nhật: {new Date(item.updatedAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => copy(item)} className="btn-secondary"><Copy size={16} />Copy</button>
                    <button type="button" onClick={() => edit(item)} className="btn-secondary"><Pencil size={16} />Sửa</button>
                    <button type="button" onClick={() => remove(item.id)} className="btn-secondary text-red-600"><Trash2 size={16} />Xóa</button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.content}</p>
                {item.notes ? <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-muted">{item.notes}</p> : null}
              </article>
            )) : (
              <div className="empty-state"><p className="font-semibold text-ink">Chưa có mẫu cá nhân</p><p className="mt-1">Mẫu có sẵn vẫn dùng được trong các công cụ. Tạo mẫu cá nhân nếu trường/tổ chuyên môn có format riêng.</p><Link href="/getting-started" className="btn-secondary mt-4">Xem cách bắt đầu</Link></div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

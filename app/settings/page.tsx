"use client";

import { RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { defaultDocumentSettings, getDocumentSettings, resetDocumentSettings, saveDocumentSettings, type DocumentSettings } from "@/lib/document-settings";
import { PlanSelector } from "@/components/PlanSelector";
import Link from "next/link";

export default function SettingsPage() {
  const [settings, setSettings] = useState<DocumentSettings>(defaultDocumentSettings);
  const [message, setMessage] = useState("");

  useEffect(() => {
    queueMicrotask(() => setSettings(getDocumentSettings()));
  }, []);

  function update<K extends keyof DocumentSettings>(key: K, value: DocumentSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function save() {
    saveDocumentSettings(settings);
    setMessage("Đã lưu cài đặt tài liệu.");
  }

  function reset() {
    resetDocumentSettings();
    setSettings(defaultDocumentSettings);
    setMessage("Đã reset cài đặt.");
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title="Cài đặt tài liệu" description="Cài đặt header mặc định khi xuất Word. Dữ liệu chỉ lưu trong localStorage." />
        <section className="tool-form-card max-w-3xl">
          <PlanSelector />
          <hr className="border-line" />
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="label">Tên trường/trung tâm</label><input className="form-field mt-1" value={settings.schoolName} onChange={(e) => update("schoolName", e.target.value)} /></div>
            <div><label className="label">Tên giáo viên</label><input className="form-field mt-1" value={settings.teacherName} onChange={(e) => update("teacherName", e.target.value)} /></div>
            <div><label className="label">Tổ/bộ môn</label><input className="form-field mt-1" value={settings.department} onChange={(e) => update("department", e.target.value)} /></div>
            <div><label className="label">Năm học</label><input className="form-field mt-1" value={settings.schoolYear} onChange={(e) => update("schoolYear", e.target.value)} placeholder="2026-2027" /></div>
            <div><label className="label">Font mặc định</label><select className="form-field mt-1" value={settings.fontFamily} onChange={(e) => update("fontFamily", e.target.value as DocumentSettings["fontFamily"])}><option>Times New Roman</option><option>Arial</option></select></div>
            <div><label className="label">Cỡ chữ</label><select className="form-field mt-1" value={settings.fontSize} onChange={(e) => update("fontSize", e.target.value as DocumentSettings["fontSize"])}><option>12</option><option>13</option><option>14</option></select></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={save} className="btn-primary"><Save size={16} />Lưu cài đặt</button>
            <button type="button" onClick={reset} className="btn-secondary"><RotateCcw size={16} />Đặt lại</button>
          </div>
          {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
          <p className="text-sm text-muted">Dữ liệu chỉ lưu trên trình duyệt. <Link href="/privacy" className="font-semibold text-brand">Xem ghi chú quyền riêng tư</Link>.</p>
        </section>
        <section className="card mt-6 max-w-3xl p-5">
          <h2 className="text-lg font-bold text-ink">Dữ liệu cá nhân trên trình duyệt</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Bạn có thể sao lưu hoặc xóa dữ liệu Soạn Lab đang lưu trên trình duyệt này.</p>
          <Link href="/data" className="btn-secondary mt-4">Quản lý dữ liệu</Link>
        </section>
        <section className="card mt-6 max-w-3xl p-5">
          <h2 className="text-lg font-bold text-ink">AI demo</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 p-3"><dt className="text-muted">Nhà cung cấp hiện tại</dt><dd className="mt-1 font-semibold text-ink">Mock AI</dd></div>
            <div className="rounded-md bg-slate-50 p-3"><dt className="text-muted">AI thật</dt><dd className="mt-1 font-semibold text-ink">Chưa được bật</dd></div>
          </dl>
          <p className="mt-4 text-sm text-muted">Soạn Lab không cho nhập API key ở frontend. Tích hợp AI thật trong tương lai phải chạy phía máy chủ và có bảo vệ phù hợp.</p>
          <Link href="/ai-lab" className="btn-secondary mt-4">Mở AI Lab</Link>
        </section>
      </main>
    </div>
  );
}

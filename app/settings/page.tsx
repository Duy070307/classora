"use client";

import { RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { defaultDocumentSettings, getDocumentSettings, resetDocumentSettings, saveDocumentSettings, type DocumentSettings } from "@/lib/document-settings";

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
        <section className="card max-w-3xl space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="label">Tên trường/trung tâm</label><input className="form-field mt-1" value={settings.schoolName} onChange={(e) => update("schoolName", e.target.value)} /></div>
            <div><label className="label">Tên giáo viên</label><input className="form-field mt-1" value={settings.teacherName} onChange={(e) => update("teacherName", e.target.value)} /></div>
            <div><label className="label">Tổ/bộ môn</label><input className="form-field mt-1" value={settings.department} onChange={(e) => update("department", e.target.value)} /></div>
            <div><label className="label">Năm học</label><input className="form-field mt-1" value={settings.schoolYear} onChange={(e) => update("schoolYear", e.target.value)} placeholder="2026-2027" /></div>
            <div><label className="label">Font mặc định</label><select className="form-field mt-1" value={settings.fontFamily} onChange={(e) => update("fontFamily", e.target.value as DocumentSettings["fontFamily"])}><option>Times New Roman</option><option>Arial</option></select></div>
            <div><label className="label">Cỡ chữ</label><select className="form-field mt-1" value={settings.fontSize} onChange={(e) => update("fontSize", e.target.value as DocumentSettings["fontSize"])}><option>12</option><option>13</option><option>14</option></select></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={save} className="btn-primary"><Save size={16} />Save settings</button>
            <button type="button" onClick={reset} className="btn-secondary"><RotateCcw size={16} />Reset settings</button>
          </div>
          {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
        </section>
      </main>
    </div>
  );
}

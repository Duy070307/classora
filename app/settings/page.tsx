"use client";

import Link from "next/link";
import { Compass, FileText, RotateCcw, Save, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import {
  defaultDocumentSettings,
  getDocumentSettings,
  resetDocumentSettings,
  saveDocumentSettings,
  type DocumentSettings,
} from "@/lib/document-settings";

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
    setMessage("Đã đặt lại cài đặt.");
  }

  return (
    <AppShell title="Cài đặt">
      <PageHeader
        title="Cài đặt"
        description="Thiết lập thông tin mặc định để các tài liệu xuất ra nhất quán và dễ rà soát hơn."
        eyebrow="Không gian làm việc"
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[32px] border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <FileText size={21} />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900">Thông tin tài liệu mặc định</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Những thông tin này sẽ được dùng khi Soạn Lab tạo phần đầu trang hoặc file xuất.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tên trường/trung tâm">
              <input className="form-field" value={settings.schoolName} onChange={(event) => update("schoolName", event.target.value)} />
            </Field>
            <Field label="Tên giáo viên">
              <input className="form-field" value={settings.teacherName} onChange={(event) => update("teacherName", event.target.value)} />
            </Field>
            <Field label="Tổ/bộ môn">
              <input className="form-field" value={settings.department} onChange={(event) => update("department", event.target.value)} />
            </Field>
            <Field label="Năm học">
              <input className="form-field" value={settings.schoolYear} onChange={(event) => update("schoolYear", event.target.value)} placeholder="2026-2027" />
            </Field>
            <Field label="Font mặc định">
              <select className="form-field" value={settings.fontFamily} onChange={(event) => update("fontFamily", event.target.value as DocumentSettings["fontFamily"])}>
                <option>Times New Roman</option>
                <option>Arial</option>
              </select>
            </Field>
            <Field label="Cỡ chữ">
              <select className="form-field" value={settings.fontSize} onChange={(event) => update("fontSize", event.target.value as DocumentSettings["fontSize"])}>
                <option>12</option>
                <option>13</option>
                <option>14</option>
              </select>
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" onClick={save} className="btn-primary">
              <Save size={16} /> Lưu cài đặt
            </button>
            <button type="button" onClick={reset} className="btn-secondary">
              <RotateCcw size={16} /> Đặt lại
            </button>
          </div>

          {message ? <p className="mt-4 text-sm font-bold text-emerald-600">{message}</p> : null}
        </section>

        <aside className="space-y-5">
          <section className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-blue-600" size={22} />
              <h2 className="text-lg font-black text-slate-900">Dữ liệu cá nhân</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sao lưu, khôi phục hoặc xóa dữ liệu Soạn Lab khi cần.
            </p>
            <Link href="/data" className="btn-secondary mt-4">Quản lý dữ liệu</Link>
          </section>

          <section className="rounded-[28px] border border-indigo-100 bg-indigo-50/60 p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Muốn xem lại hướng dẫn?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Mở lại thẻ hướng dẫn nhanh trên dashboard để bắt đầu theo từng bước.
            </p>
            <button
              type="button"
              className="btn-secondary mt-4"
              onClick={() => {
                localStorage.removeItem("soan_lab_onboarding_dismissed");
                window.location.assign("/dashboard");
              }}
            >
              <Compass size={16} /> Mở lại hướng dẫn
            </button>
          </section>
        </aside>
      </div>

      <p className="mt-6 text-sm leading-6 text-slate-500">
        Dữ liệu được dùng để phục vụ trải nghiệm soạn tài liệu. Xem thêm tại{" "}
        <Link href="/privacy" className="font-bold text-blue-700">ghi chú quyền riêng tư</Link>.
      </p>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  teachingLevel: "",
  school: "",
  purpose: "",
  note: "",
};

export function BetaRequestForm() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/beta-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string; message?: string } | null;
      if (!response.ok || !result?.ok) {
        setError(result?.error || "Chưa thể gửi đăng ký lúc này. Thầy/cô vui lòng thử lại sau.");
        return;
      }
      setSuccess(result.message || "Em đã nhận được đăng ký của thầy/cô. SOẠN LAB sẽ liên hệ và cấp tài khoản thử nghiệm trong thời gian sớm nhất.");
      setForm(initialForm);
    } catch {
      setError("Không thể kết nối để gửi đăng ký. Thầy/cô vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 text-center sm:p-8" role="status">
        <CheckCircle2 className="mx-auto text-emerald-600" size={42} />
        <h2 className="mt-4 text-xl font-black text-emerald-950">Đăng ký đã được ghi nhận</h2>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-emerald-900">{success}</p>
        <button type="button" className="btn-secondary mt-6" onClick={() => setSuccess("")}>Gửi đăng ký khác</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Họ và tên" required>
          <input className="form-field mt-2" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} maxLength={120} autoComplete="name" required />
        </Field>
        <Field label="Email" required>
          <input className="form-field mt-2" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} maxLength={254} autoComplete="email" required />
        </Field>
        <Field label="Số điện thoại/Zalo" hint="Không bắt buộc">
          <input className="form-field mt-2" type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} maxLength={40} autoComplete="tel" />
        </Field>
        <Field label="Môn dạy" required>
          <input className="form-field mt-2" value={form.subject} onChange={(event) => update("subject", event.target.value)} maxLength={120} placeholder="Ví dụ: Toán, Ngữ văn, Vật lí" required />
        </Field>
        <Field label="Cấp/lớp đang dạy" required>
          <input className="form-field mt-2" value={form.teachingLevel} onChange={(event) => update("teachingLevel", event.target.value)} maxLength={120} placeholder="Ví dụ: THPT, lớp 10–12" required />
        </Field>
        <Field label="Trường/đơn vị" hint="Không bắt buộc">
          <input className="form-field mt-2" value={form.school} onChange={(event) => update("school", event.target.value)} maxLength={180} autoComplete="organization" />
        </Field>
      </div>
      <Field label="Thầy/cô muốn dùng SOẠN LAB cho việc gì?" required>
        <textarea className="form-field mt-2 min-h-28 resize-y" value={form.purpose} onChange={(event) => update("purpose", event.target.value)} maxLength={1200} placeholder="Ví dụ: soạn đề kiểm tra, tạo phiếu học tập, chuẩn bị giáo án..." required />
      </Field>
      <Field label="Ghi chú thêm" hint="Không bắt buộc">
        <textarea className="form-field mt-2 min-h-24 resize-y" value={form.note} onChange={(event) => update("note", event.target.value)} maxLength={1200} />
      </Field>
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700" role="alert">{error}</div> : null}
      <button className="btn-primary min-h-12 w-full sm:w-auto sm:justify-self-start" disabled={loading}>
        <Send size={17} />
        {loading ? "Đang gửi đăng ký..." : "Gửi đăng ký dùng thử"}
      </button>
    </form>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-bold text-slate-900">
      <span>{label}{required ? <span className="ml-1 text-blue-600" aria-hidden="true">*</span> : null}</span>
      {hint ? <span className="ml-2 text-xs font-medium text-slate-400">{hint}</span> : null}
      {children}
    </label>
  );
}

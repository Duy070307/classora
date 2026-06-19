"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "soan_lab_onboarding_dismissed";
const steps = ["Chọn một công cụ", "Nhập thông tin bài học", "Tạo bản nháp", "Xuất Word hoặc lưu lịch sử"];

export function DashboardOnboarding() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const refresh = () => setVisible(localStorage.getItem(STORAGE_KEY) !== "true");
    queueMicrotask(refresh);
    window.addEventListener("soan-lab-show-onboarding", refresh);
    return () => window.removeEventListener("soan-lab-show-onboarding", refresh);
  }, []);
  function dismiss() { localStorage.setItem(STORAGE_KEY, "true"); setVisible(false); }
  if (!visible) return null;
  return <section className="app-surface motion-enter relative mb-8 overflow-hidden border-indigo-200 bg-gradient-to-br from-white to-indigo-50/80 p-5 sm:p-7"><button type="button" onClick={dismiss} className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700" aria-label="Ẩn hướng dẫn"><X size={18} /></button><div className="pr-10"><span className="app-badge">Hướng dẫn nhanh · 3 phút</span><h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">Bắt đầu với Soạn Lab</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Một quy trình ngắn để tạo tài liệu đầu tiên mà không cần viết prompt dài.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{steps.map((step, index) => <div key={step} className="flex items-center gap-3 rounded-2xl border border-white bg-white/80 p-3 shadow-sm"><CheckCircle2 size={18} className="shrink-0 text-indigo-600" /><p className="text-sm font-semibold text-slate-700"><span className="mr-1 text-indigo-600">{index + 1}.</span>{step}</p></div>)}</div><div className="mt-5 flex flex-wrap gap-2"><Link href="/tools/exam-generator" className="btn-primary">Thử tạo đề<ArrowRight size={16} /></Link><Link href="/tools" className="btn-secondary">Xem tất cả công cụ</Link><button type="button" onClick={dismiss} className="btn-ghost">Ẩn hướng dẫn</button></div></section>;
}

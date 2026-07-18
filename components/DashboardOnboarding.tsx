"use client";

import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";
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
  return <section className="ui-panel motion-enter relative mb-5 border-blue-200 bg-blue-50/50 p-4"><button type="button" onClick={dismiss} className="ui-icon-button absolute right-2 top-2" aria-label="Ẩn hướng dẫn"><X size={18} /></button><div className="pr-11 sm:flex sm:items-start sm:justify-between sm:gap-5"><div><p className="text-sm font-bold text-slate-900">Bắt đầu với Soạn Lab trong 3 phút</p><p className="mt-1 text-sm leading-6 text-slate-600">{steps.map((step, index) => <span key={step} className="mr-2 inline-flex items-center gap-1"><CheckCircle2 size={14} className="text-blue-700" /><span className="font-semibold text-blue-800">{index + 1}.</span>{step}</span>)}</p></div><Link href="/teacher-testing-guide" className="mt-2 inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline sm:mt-0">Xem hướng dẫn</Link></div></section>;
}

"use client";

import Link from "next/link";
import { CheckCircle2, HardDrive, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

const STORAGE_KEY = "classora_release_candidate_checklist";
const sections = [
  ["Kiểm tra phát hành", ["Build pass", "Smoke test pass", "Dữ liệu lưu ổn định", "Không cần thanh toán"]],
  ["Công cụ chính", ["Tạo đề kiểm tra", "Tạo ma trận đề", "Tạo đáp án/thang điểm", "Tạo phiếu học tập", "Tạo giáo án", "Tạo nhận xét học sinh", "Ngân hàng câu hỏi"]],
  ["Xuất tài liệu", ["Word", "Print/PDF", "Markdown", "TXT", "Lưu lịch sử", "Mở lại từ lịch sử"]],
  ["Chất lượng nội dung", ["Toán 12 THPTQG", "Lịch sử 12 THPTQG", "PHẦN I/II/III", "Bảng đáp án giáo viên", "Ma trận và bản đặc tả"]],
  ["Trải nghiệm sản phẩm", ["Share page", "Tools page", "Privacy", "Terms", "Hướng dẫn sử dụng"]],
] as const;

export default function ReleaseCandidatePage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) queueMicrotask(() => setChecked(JSON.parse(saved)));
    } catch { /* Checklist vẫn dùng được nếu storage bị chặn. */ }
  }, []);
  const total = useMemo(() => sections.reduce((sum, [, items]) => sum + items.length, 0), []);
  const completed = Object.values(checked).filter(Boolean).length;
  function toggle(item: string) {
    const next = { ...checked, [item]: !checked[item] };
    setChecked(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Không làm crash trang QA. */ }
  }
  function reset() {
    setChecked({});
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Không làm crash trang QA. */ }
  }

  return <main className="warm-page min-h-screen"><Navbar /><section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
    <div className="hero-gradient relative overflow-hidden rounded-[30px] p-6 text-white shadow-[0_20px_50px_rgba(37,99,235,.2)] sm:p-9">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[36px] border-white/10" />
      <div className="relative"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-cyan-200">Kiểm tra chất lượng</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">Trạng thái sản phẩm</h1><p className="mt-4 max-w-3xl leading-7 text-blue-100">Bảng kiểm tra các quy trình chính của Soạn Lab trước khi giáo viên sử dụng.</p><div className="mt-6 flex flex-wrap gap-2">{[[CheckCircle2, "Sẵn sàng"], [HardDrive, "Lưu trên trình duyệt"], [Sparkles, "Tạo bản nháp"]].map(([Icon, label]) => { const I = Icon as typeof CheckCircle2; return <span key={label as string} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold ring-1 ring-white/20"><I size={14} />{label as string}</span>; })}</div></div>
    </div>
    <div className="play-card mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-extrabold text-ink">Checklist nhanh · {completed}/{total} mục</p><div className="mt-3 h-2.5 w-full min-w-48 overflow-hidden rounded-full bg-blue-50 sm:w-80"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all" style={{ width: `${(completed / total) * 100}%` }} /></div></div><button type="button" className="btn-secondary" onClick={reset}><RotateCcw size={16} />Đặt lại checklist</button></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2">{sections.map(([title, items]) => <section key={title} className="play-card p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-extrabold text-ink">{title}</h2><span className="soft-badge">{items.filter((item) => checked[item]).length}/{items.length}</span></div><div className="mt-4 space-y-1">{items.map((item) => <label key={item} className="flex cursor-pointer items-start gap-3 rounded-xl p-2.5 transition hover:bg-blue-50/60"><input type="checkbox" className="mt-1 h-4 w-4 accent-blue-600" checked={Boolean(checked[item])} onChange={() => toggle(item)} /><span className={checked[item] ? "text-sm text-slate-400 line-through" : "text-sm leading-6 text-slate-600"}>{item}</span></label>)}</div></section>)}</div>
    <div className="mt-7 flex flex-wrap gap-3"><Link href="/dashboard" className="btn-primary">Mở dashboard</Link><Link href="/tools" className="btn-secondary">Mở tất cả công cụ</Link></div>
  </section><SiteFooter /></main>;
}

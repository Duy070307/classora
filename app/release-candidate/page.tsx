"use client";

import Link from "next/link";
import { CheckCircle2, FlaskConical, HardDrive, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

const STORAGE_KEY = "classora_release_candidate_checklist";
const sections = [
  ["Trạng thái hệ thống", ["Build pass", "Smoke test pass", "localStorage hoạt động", "Không cần API key", "Không cần database", "Không cần đăng nhập", "Không cần thanh toán"]],
  ["Công cụ chính", ["Tạo đề kiểm tra", "Tạo ma trận đề", "Tạo đáp án/thang điểm", "Trộn mã đề", "Tạo phiếu học tập", "Tạo giáo án", "Tạo nhận xét học sinh", "Nhận xét hàng loạt CSV", "Ngân hàng câu hỏi", "Nhập câu hỏi từ văn bản/CSV"]],
  ["Xuất tài liệu", ["Word", "Print/PDF", "Markdown", "TXT", "Lưu lịch sử", "Mở lại từ lịch sử"]],
  ["Dữ liệu local", ["Backup JSON", "Restore JSON", "Xóa dữ liệu", "Demo data", "Diagnostics"]],
  ["Private beta", ["Feedback page", "Share page", "Privacy", "Terms", "Tester guide"]]
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
    <div className="hero-gradient relative overflow-hidden rounded-[30px] p-6 text-white shadow-[0_20px_50px_rgba(37,99,235,.2)] sm:p-9"><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[36px] border-white/10" /><div className="relative"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-cyan-200">v0.5 Release Candidate</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">Trạng thái bản demo</h1><p className="mt-4 max-w-3xl leading-7 text-blue-100">Bảng kiểm thử minh bạch trước khi gửi Soạn Lab cho giáo viên trải nghiệm.</p><div className="mt-6 flex flex-wrap gap-2">{[[CheckCircle2,"Ổn"],[FlaskConical,"Demo"],[HardDrive,"LocalStorage"],[Sparkles,"AI mô phỏng"]].map(([Icon,label])=>{const I=Icon as typeof CheckCircle2;return <span key={label as string} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold ring-1 ring-white/20"><I size={14}/>{label as string}</span>;})}</div></div></div>
    <div className="play-card mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-extrabold text-ink">Checklist nhanh · {completed}/{total} mục</p><div className="mt-3 h-2.5 w-full min-w-48 overflow-hidden rounded-full bg-blue-50 sm:w-80"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all" style={{ width: `${(completed / total) * 100}%` }} /></div></div><button type="button" className="btn-secondary" onClick={reset}><RotateCcw size={16} />Đặt lại checklist</button></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2">{sections.map(([title, items]) => <section key={title} className="play-card p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-extrabold text-ink">{title}</h2><span className="soft-badge">{items.filter((item)=>checked[item]).length}/{items.length}</span></div><div className="mt-4 space-y-1">{items.map((item) => <label key={item} className="flex cursor-pointer items-start gap-3 rounded-xl p-2.5 transition hover:bg-blue-50/60"><input type="checkbox" className="mt-1 h-4 w-4 accent-blue-600" checked={Boolean(checked[item])} onChange={() => toggle(item)} /><span className={checked[item] ? "text-sm text-slate-400 line-through" : "text-sm leading-6 text-slate-600"}>{item}</span></label>)}</div></section>)}</div>
    <div className="mt-7 flex flex-wrap gap-3"><Link href="/dashboard" className="btn-primary">Mở dashboard</Link><Link href="/tools" className="btn-secondary">Mở tất cả công cụ</Link><Link href="/demo-checklist" className="btn-secondary">Mở checklist demo</Link><Link href="/known-issues" className="btn-secondary">Giới hạn hiện tại</Link><Link href="/feedback" className="btn-secondary">Gửi góp ý</Link></div>
  </section><SiteFooter /></main>;
}

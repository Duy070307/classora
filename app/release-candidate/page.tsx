"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
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

  return <main className="min-h-screen"><Navbar /><section className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
    <p className="text-sm font-bold uppercase tracking-wide text-brand">v0.5 RC</p>
    <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">Soạn Lab Release Candidate</h1>
    <p className="mt-4 max-w-3xl leading-7 text-muted">Checklist thủ công để xác nhận bản demo đã sẵn sàng trước khi gửi cho nhóm private beta.</p>
    <div className="card mt-7 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-ink">Đã hoàn thành {completed}/{total} mục</p><div className="mt-2 h-2 w-full min-w-48 overflow-hidden rounded-full bg-slate-100 sm:w-72"><div className="h-full bg-brand transition-all" style={{ width: `${(completed / total) * 100}%` }} /></div></div><button type="button" className="btn-secondary" onClick={reset}><RotateCcw size={16} />Đặt lại checklist</button></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2">{sections.map(([title, items]) => <section key={title} className="card p-5"><h2 className="text-lg font-bold text-ink">{title}</h2><div className="mt-4 space-y-2">{items.map((item) => <label key={item} className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-slate-50"><input type="checkbox" className="mt-1 h-4 w-4 accent-blue-600" checked={Boolean(checked[item])} onChange={() => toggle(item)} /><span className={checked[item] ? "text-sm text-slate-400 line-through" : "text-sm text-muted"}>{item}</span></label>)}</div></section>)}</div>
    <div className="mt-7 flex flex-wrap gap-3"><Link href="/dashboard" className="btn-primary">Mở dashboard</Link><Link href="/tools" className="btn-secondary">Mở tất cả công cụ</Link><Link href="/demo-checklist" className="btn-secondary">Mở checklist demo</Link><Link href="/known-issues" className="btn-secondary">Giới hạn hiện tại</Link><Link href="/feedback" className="btn-secondary">Gửi góp ý</Link></div>
  </section><SiteFooter /></main>;
}

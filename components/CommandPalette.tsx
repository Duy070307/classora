"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { categoryLabels, getToolSearchText, toolRegistry } from "@/lib/tool-registry";

type Item = { title: string; description: string; href: string; category: string; group: "Công cụ" | "Trang" | "Dữ liệu cá nhân"; searchText?: string };

const pages: Item[] = [
  ["Dashboard", "Tổng quan workspace Soạn Lab.", "/dashboard", "Trang chính", "Trang"],
  ["Tạo mới", "Chọn công việc cần tạo và mở đúng công cụ.", "/create", "Tạo tài liệu", "Trang"],
  ["Công cụ", "Tìm và mở mọi công cụ.", "/tools", "Điều hướng", "Trang"],
  ["Hướng dẫn", "Quy trình bắt đầu với Soạn Lab.", "/getting-started", "Hướng dẫn", "Trang"],
  ["Tạo đề kiểm tra", "Mở nhanh công cụ tạo đề.", "/tools/exam-generator", "Công cụ nổi bật", "Công cụ"],
  ["Kiểm tra đề", "Rà soát đề trước khi xuất Word/PDF.", "/tools/exam-audit", "Công cụ nổi bật", "Công cụ"],
  ["Phiếu học tập", "Mở nhanh công cụ tạo phiếu học tập.", "/tools/worksheet-generator", "Công cụ nổi bật", "Công cụ"],
  ["Giáo án", "Mở nhanh công cụ tạo giáo án.", "/tools/lesson-plan", "Công cụ nổi bật", "Công cụ"],
  ["Ảnh công thức & hình học → LaTeX/TikZ", "Chuyển ảnh công thức thành LaTeX hoặc ảnh hình học thành TikZ.", "/tools/image-to-latex", "Công thức & LaTeX", "Công cụ"],
  ["Lịch sử", "Tài liệu đã lưu trên trình duyệt.", "/history", "Dữ liệu cá nhân", "Dữ liệu cá nhân"],
  ["Cài đặt", "Header, font và dữ liệu làm việc.", "/settings", "Cấu hình", "Trang"],
].map(([title, description, href, category, group]) => ({ title, description, href, category, group: group as Item["group"] }));

export function CommandPaletteButton({ compact = false }: { compact?: boolean }) {
  return <button type="button" className={compact ? "btn-secondary min-h-9 px-3 py-1.5 text-xs" : "btn-secondary"} onClick={() => window.dispatchEvent(new Event("classora-open-command-palette"))}><Search size={16} />Tìm nhanh{compact ? null : <span className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-xs text-muted sm:inline">Ctrl K</span>}</button>;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const commands = useMemo<Item[]>(() => [...toolRegistry.map((tool) => ({ title: tool.title, description: tool.description, href: tool.href, category: categoryLabels[tool.category], group: "Công cụ" as const, searchText: getToolSearchText(tool) })), ...pages], []);
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return commands.filter((item) => !normalized || `${item.title} ${item.description} ${item.category} ${item.searchText || ""}`.toLowerCase().includes(normalized)).slice(0, 12);
  }, [commands, query]);

  useEffect(() => {
    const openPalette = () => { setQuery(""); setActive(0); setOpen(true); };
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setQuery(""); setActive(0); setOpen(true); }
      if (!open) return;
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowDown") { event.preventDefault(); setActive((value) => Math.min(value + 1, Math.max(results.length - 1, 0))); }
      if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
      if (event.key === "Enter" && results[active]) { event.preventDefault(); window.location.assign(results[active].href); }
    };
    window.addEventListener("classora-open-command-palette", openPalette);
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("classora-open-command-palette", openPalette); window.removeEventListener("keydown", onKeyDown); };
  }, [active, open, results]);

  if (!open) return null;

  return <div className="fixed inset-0 z-50 bg-slate-950/40 p-3 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(15,23,42,0.22)] ring-1 ring-slate-200 sm:mt-16">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3"><Search className="text-emerald-700" size={18} /><input autoFocus className="min-h-11 min-w-0 flex-1 border-0 bg-transparent text-base outline-none sm:text-sm" placeholder="Tìm công cụ, trang, dữ liệu..." value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} /><button type="button" className="ui-icon-button" onClick={() => setOpen(false)} aria-label="Đóng"><X size={18} /></button></div>
      <div className="max-h-[65vh] overflow-auto p-2">{results.length ? (["Công cụ", "Trang", "Dữ liệu cá nhân"] as const).map((group) => {
        const grouped = results.filter((item) => item.group === group);
        return grouped.length ? <section key={group} className="py-2"><p className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">{group}</p>{grouped.map((item) => { const index = results.indexOf(item); return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} onMouseEnter={() => setActive(index)} className={`block rounded-lg px-3 py-2 ${index === active ? "bg-blue-50" : "hover:bg-slate-50"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-ink">{item.title}</p><p className="mt-0.5 text-sm leading-5 text-muted">{item.description}</p></div><span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{item.category}</span></div></Link>; })}</section> : null;
      }) : <div className="px-4 py-8 text-center"><p className="font-bold text-ink">Chưa tìm thấy công cụ phù hợp.</p><Link href="/tools" onClick={() => setOpen(false)} className="btn-secondary mt-4">Xem tất cả công cụ</Link></div>}</div>
    </div>
  </div>;
}

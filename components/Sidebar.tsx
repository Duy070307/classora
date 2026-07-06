"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  BookOpenCheck,
  ClipboardList,
  Database,
  FileClock,
  FileText,
  History,
  Home,
  MessageCircle,
  Settings,
  Sigma,
  Wrench,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { AccountPanel } from "@/components/AccountPanel";

const groups = [
  { title: "Tổng quan", links: [["Dashboard", "/dashboard", Home]] },
  {
    title: "Công cụ",
    links: [
      ["Tất cả công cụ", "/tools", Wrench],
      ["Mẫu sử dụng", "/samples", BookOpenCheck],
      ["Soạn đề", "/tools?category=exam-assessment", ClipboardList],
      ["Phiếu học tập", "/tools/worksheet-generator", FileText],
      ["Nhận xét", "/tools/student-comments", MessageCircle],
      ["Ảnh → LaTeX", "/tools/image-to-latex", Sigma],
    ],
  },
  {
    title: "Tài liệu",
    links: [
      ["Lịch sử", "/history", History],
      ["Ngân hàng câu hỏi", "/question-bank", BookOpenCheck],
      ["Mẫu cá nhân", "/templates", FileClock],
    ],
  },
  {
    title: "Hệ thống",
    links: [
      ["Dữ liệu", "/data", Database],
      ["Cài đặt", "/settings", Settings],
    ],
  },
];

export function Sidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  return (
    <Suspense fallback={null}>
      <Content mobileOpen={mobileOpen} onClose={onClose} />
    </Suspense>
  );
}

function Content({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const currentCategory = useSearchParams().get("category");
  const active = (href: string) => {
    const [path, query] = href.split("?");
    if (pathname !== path) return false;
    const category = query ? new URLSearchParams(query).get("category") : null;
    return category ? category === currentCategory : !currentCategory;
  };
  return (
    <>
      <button type="button" aria-label="Đóng lớp phủ menu" onClick={onClose} className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden ${mobileOpen ? "block" : "hidden"}`} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/70 bg-white shadow-2xl transition-transform duration-300 md:sticky md:top-0 md:z-auto md:h-screen md:w-64 md:shrink-0 md:translate-x-0 md:shadow-[8px_0_30px_rgba(30,64,175,0.035)] ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center border-b border-slate-100 px-5 py-5">
          <Link href="/" className="min-w-0">
            <BrandLogo compact />
          </Link>
          <button type="button" className="ml-2 rounded-xl p-2 text-muted md:hidden" onClick={onClose} aria-label="Đóng menu">
            <X size={18} />
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
          {groups.map((group) => (
            <section key={group.title} className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{group.title}</p>
              <div className="space-y-1">
                {group.links.map(([label, href, Icon]) => {
                  const I = Icon as typeof Home;
                  const selected = active(href as string);
                  return (
                    <Link key={href as string} href={href as string} onClick={onClose} aria-current={selected ? "page" : undefined} className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${selected ? "bg-gradient-to-r from-blue-50 to-cyan-50/60 text-blue-700 shadow-sm ring-1 ring-blue-100" : "text-slate-600 hover:bg-blue-50/60 hover:text-blue-800"}`}>
                      {selected ? <span className="absolute -left-1 h-6 w-1 rounded-full bg-blue-600" /> : null}
                      <I size={17} className={selected ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"} />
                      {label as string}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
        <div className="border-t border-slate-100 bg-slate-50/70 p-4">
          <AccountPanel />
        </div>
      </aside>
    </>
  );
}

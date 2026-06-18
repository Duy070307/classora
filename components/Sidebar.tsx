"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BookOpenCheck, CircleHelp, ClipboardList, Database, FileClock, History, Home, Keyboard, MessageCircle, Settings, Tags, Wrench, X } from "lucide-react";
import { UsageBadge } from "@/components/UsageBadge";
import { BrandLogo } from "@/components/BrandLogo";

const groups = [
  { title: "Tổng quan", links: [["Dashboard", "/dashboard", Home], ["Tất cả công cụ", "/tools", Wrench], ["Bắt đầu", "/getting-started", CircleHelp]] },
  { title: "Công cụ", links: [["Soạn đề & kiểm tra", "/tools?category=exam-assessment", ClipboardList], ["Soạn bài & tài liệu", "/tools?category=lesson-materials", BookOpenCheck], ["Chủ nhiệm & phụ huynh", "/tools?category=homeroom-parent", MessageCircle], ["Công thức & LaTeX", "/tools?category=formula-latex", Tags]] },
  { title: "Dữ liệu cá nhân", links: [["Lịch sử", "/history", History], ["Bản nháp biểu mẫu", "/drafts", FileClock], ["Ngân hàng câu hỏi", "/question-bank", BookOpenCheck], ["Mẫu cá nhân", "/templates", FileClock], ["Cài đặt tài liệu", "/settings", Settings], ["Quản lý dữ liệu", "/data", Database]] },
  { title: "Kiểm thử demo", links: [["Private Beta", "/private-beta", CircleHelp], ["Hướng dẫn tester", "/tester-guide", ClipboardList], ["Release Candidate", "/release-candidate", ClipboardList], ["Diagnostics", "/diagnostics", Wrench]] },
  { title: "Khác", links: [["Phím tắt", "/shortcuts", Keyboard], ["Bảng giá", "/pricing", Tags], ["Góp ý", "/feedback", MessageCircle], ["Nhật ký phát triển", "/changelog", FileClock]] }
];

export function Sidebar({ mobileOpen = false, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  return <Suspense fallback={null}><SidebarContent mobileOpen={mobileOpen} onClose={onClose} /></Suspense>;
}

function SidebarContent({ mobileOpen, onClose }: { mobileOpen: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  function isActive(href: string) {
    const [linkPath, query] = href.split("?");
    if (pathname !== linkPath) return false;
    const linkCategory = query ? new URLSearchParams(query).get("category") : null;
    return linkCategory ? currentCategory === linkCategory : !currentCategory;
  }

  return <><button type="button" aria-label="Đóng lớp phủ menu" onClick={onClose} className={`fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm md:hidden ${mobileOpen ? "block" : "hidden"}`} /><aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white shadow-2xl transition-transform md:sticky md:top-0 md:z-auto md:h-screen md:shrink-0 md:translate-x-0 md:shadow-none ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
    <div className="flex items-start justify-between gap-3 p-5">
      <div><Link href="/"><BrandLogo compact /></Link><p className="mt-2 hidden text-xs font-medium text-muted sm:block">Bộ công cụ cho giáo viên Việt Nam</p></div>
      <button type="button" className="rounded-lg p-2 text-muted hover:bg-slate-100 md:hidden" onClick={onClose} aria-label="Đóng menu"><X size={19} /></button>
    </div>
    <nav className="max-h-[calc(100vh-150px)] overflow-y-auto px-4 pb-5">
      <div className="space-y-5">{groups.map((group) => <section key={group.title}><p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{group.title}</p><div className="mt-2 space-y-1">{group.links.map(([label, href, Icon]) => { const NavIcon = Icon as typeof Home; const active = isActive(href as string); return <Link key={href as string} href={href as string} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-brand" : "text-muted hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-brand"}`}><NavIcon size={17} />{label as string}</Link>; })}</div></section>)}</div>
    </nav>
    <div className="absolute inset-x-0 bottom-0 border-t border-slate-100 bg-white p-4"><div className="mb-3 flex items-center justify-between"><UsageBadge compact /><span className="text-xs font-bold text-slate-400">v0.5 RC</span></div><div className="flex gap-3 text-xs font-semibold"><Link href="/feedback" className="text-brand">Góp ý</Link><Link href="/settings" className="text-muted hover:text-brand">Cài đặt</Link></div></div>
  </aside></>;
}

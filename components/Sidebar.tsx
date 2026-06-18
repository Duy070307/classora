"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BookOpenCheck, CircleHelp, ClipboardList, Database, FileClock, History, Home, Keyboard, MessageCircle, Settings, Tags, Wrench } from "lucide-react";
import { CommandPaletteButton } from "@/components/CommandPalette";
import { DemoNotice } from "@/components/DemoNotice";
import { UsageBadge } from "@/components/UsageBadge";
import { BrandLogo } from "@/components/BrandLogo";

const groups = [
  { title: "Tổng quan", links: [["Dashboard", "/dashboard", Home], ["Tất cả công cụ", "/tools", Wrench], ["Bắt đầu", "/getting-started", CircleHelp]] },
  { title: "Công cụ", links: [["Soạn đề & kiểm tra", "/tools?category=exam-assessment", ClipboardList], ["Soạn bài & tài liệu", "/tools?category=lesson-materials", BookOpenCheck], ["Chủ nhiệm & phụ huynh", "/tools?category=homeroom-parent", MessageCircle], ["Công thức & LaTeX", "/tools?category=formula-latex", Tags]] },
  { title: "Dữ liệu cá nhân", links: [["Lịch sử", "/history", History], ["Bản nháp biểu mẫu", "/drafts", FileClock], ["Ngân hàng câu hỏi", "/question-bank", BookOpenCheck], ["Mẫu cá nhân", "/templates", FileClock], ["Cài đặt tài liệu", "/settings", Settings], ["Quản lý dữ liệu", "/data", Database]] },
  { title: "Kiểm thử demo", links: [["Private Beta", "/private-beta", CircleHelp], ["Hướng dẫn tester", "/tester-guide", ClipboardList], ["Release Candidate", "/release-candidate", ClipboardList], ["Diagnostics", "/diagnostics", Wrench]] },
  { title: "Khác", links: [["Phím tắt", "/shortcuts", Keyboard], ["Bảng giá", "/pricing", Tags], ["Góp ý", "/feedback", MessageCircle], ["Nhật ký phát triển", "/changelog", FileClock]] }
];

export function Sidebar() {
  return <Suspense fallback={null}><SidebarContent /></Suspense>;
}

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  function isActive(href: string) {
    const [linkPath, query] = href.split("?");
    if (pathname !== linkPath) return false;
    const linkCategory = query ? new URLSearchParams(query).get("category") : null;
    return linkCategory ? currentCategory === linkCategory : !currentCategory;
  }

  return <aside className="border-b border-slate-200 bg-white/95 md:sticky md:top-0 md:h-screen md:w-72 md:shrink-0 md:border-b-0 md:border-r">
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:block md:p-5">
      <div><Link href="/"><BrandLogo compact /></Link><p className="mt-2 hidden text-xs font-medium text-muted sm:block">Bộ công cụ cho giáo viên Việt Nam</p></div>
      <div className="flex items-center gap-2 md:mt-3 md:block"><UsageBadge compact /><div className="md:mt-3"><CommandPaletteButton compact /></div></div>
    </div>
    <nav className="flex gap-2 overflow-x-auto border-t border-line px-4 py-3 md:hidden"><CommandPaletteButton compact /><Link href="/dashboard" className="btn-secondary shrink-0">Dashboard</Link><Link href="/tools" className="btn-secondary shrink-0">Công cụ</Link><Link href="/history" className="btn-secondary shrink-0">Lịch sử</Link></nav>
    <nav className="hidden max-h-[calc(100vh-170px)] overflow-y-auto px-4 pb-5 md:block">
      <div className="mb-4"><DemoNotice compact /></div>
      <div className="space-y-5">{groups.map((group) => <section key={group.title}><p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{group.title}</p><div className="mt-2 space-y-1">{group.links.map(([label, href, Icon]) => { const NavIcon = Icon as typeof Home; const active = isActive(href as string); return <Link key={href as string} href={href as string} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-brand" : "text-muted hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-brand"}`}><NavIcon size={17} />{label as string}</Link>; })}</div></section>)}</div>
    </nav>
  </aside>;
}

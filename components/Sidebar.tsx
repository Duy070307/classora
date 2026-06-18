"use client";

import Link from "next/link";
import { BookOpenCheck, CircleHelp, ClipboardList, Database, FileClock, History, Home, Keyboard, MessageCircle, Settings, Tags, Wrench } from "lucide-react";
import { CommandPaletteButton } from "@/components/CommandPalette";
import { DemoNotice } from "@/components/DemoNotice";
import { UsageBadge } from "@/components/UsageBadge";

const groups = [
  { title: "Tổng quan", links: [["Dashboard", "/dashboard", Home], ["Tất cả công cụ", "/tools", Wrench], ["Bắt đầu", "/getting-started", CircleHelp]] },
  { title: "Công cụ", links: [["Soạn đề & kiểm tra", "/tools?category=exam-assessment", ClipboardList], ["Soạn bài & tài liệu", "/tools?category=lesson-materials", BookOpenCheck], ["Chủ nhiệm & phụ huynh", "/tools?category=homeroom-parent", MessageCircle], ["Công thức & LaTeX", "/tools?category=formula-latex", Tags]] },
  { title: "Dữ liệu cá nhân", links: [["Lịch sử", "/history", History], ["Bản nháp biểu mẫu", "/drafts", FileClock], ["Ngân hàng câu hỏi", "/question-bank", BookOpenCheck], ["Mẫu cá nhân", "/templates", FileClock], ["Cài đặt tài liệu", "/settings", Settings], ["Quản lý dữ liệu", "/data", Database]] },
  { title: "Khác", links: [["Phím tắt", "/shortcuts", Keyboard], ["Private Beta", "/private-beta", CircleHelp], ["Hướng dẫn tester", "/tester-guide", ClipboardList], ["Bảng giá", "/pricing", Tags], ["Góp ý", "/feedback", MessageCircle], ["Nhật ký phát triển", "/changelog", FileClock]] }
];

export function Sidebar() {
  return <aside className="border-b border-line bg-white md:sticky md:top-0 md:h-screen md:w-72 md:shrink-0 md:border-b-0 md:border-r">
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:block md:p-5">
      <div><Link href="/" className="text-2xl font-bold text-ink">Classora</Link><p className="mt-1 hidden text-sm text-muted sm:block">Bộ công cụ cho giáo viên Việt Nam</p></div>
      <div className="flex items-center gap-2 md:mt-3 md:block"><UsageBadge compact /><div className="md:mt-3"><CommandPaletteButton compact /></div></div>
    </div>
    <nav className="flex gap-2 overflow-x-auto border-t border-line px-4 py-3 md:hidden"><CommandPaletteButton compact /><Link href="/dashboard" className="btn-secondary shrink-0">Dashboard</Link><Link href="/tools" className="btn-secondary shrink-0">Công cụ</Link><Link href="/history" className="btn-secondary shrink-0">Lịch sử</Link></nav>
    <nav className="hidden max-h-[calc(100vh-170px)] overflow-y-auto px-4 pb-5 md:block">
      <div className="mb-4"><DemoNotice compact /></div>
      <div className="space-y-5">{groups.map((group) => <section key={group.title}><p className="px-3 text-xs font-bold uppercase tracking-wide text-slate-400">{group.title}</p><div className="mt-2 space-y-1">{group.links.map(([label, href, Icon]) => { const NavIcon = Icon as typeof Home; return <Link key={href as string} href={href as string} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-blue-50 hover:text-brand"><NavIcon size={17} />{label as string}</Link>; })}</div></section>)}</div>
    </nav>
  </aside>;
}

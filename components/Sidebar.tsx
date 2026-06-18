"use client";

import Link from "next/link";
import { BookOpenCheck, CircleHelp, ClipboardList, FileClock, History, Home, MessageCircle, Settings, Tags, Wrench } from "lucide-react";
import { DemoNotice } from "@/components/DemoNotice";
import { UsageBadge } from "@/components/UsageBadge";

const groups = [
  { title: "Tổng quan", links: [["Dashboard", "/dashboard", Home], ["Tất cả công cụ", "/tools", Wrench], ["Bắt đầu", "/getting-started", CircleHelp]] },
  { title: "Công cụ", links: [["Soạn đề & kiểm tra", "/tools?category=exam-assessment", ClipboardList], ["Soạn bài & tài liệu", "/tools?category=lesson-materials", BookOpenCheck], ["Chủ nhiệm & phụ huynh", "/tools?category=homeroom-parent", MessageCircle], ["Công thức & LaTeX", "/tools?category=formula-latex", Tags]] },
  { title: "Dữ liệu cá nhân", links: [["Lịch sử", "/history", History], ["Ngân hàng câu hỏi", "/question-bank", BookOpenCheck], ["Mẫu cá nhân", "/templates", FileClock], ["Cài đặt tài liệu", "/settings", Settings]] },
  { title: "Khác", links: [["Bảng giá", "/pricing", Tags], ["Góp ý", "/feedback", MessageCircle], ["Nhật ký phát triển", "/changelog", FileClock]] }
];

export function Sidebar() {
  return <aside className="border-b border-line bg-white md:sticky md:top-0 md:h-screen md:w-72 md:border-b-0 md:border-r">
    <div className="p-5"><Link href="/" className="text-2xl font-bold text-ink">Classora</Link><p className="mt-1 text-sm text-muted">Bộ công cụ cho giáo viên Việt Nam</p><div className="mt-3"><UsageBadge compact /></div></div>
    <nav className="max-h-[calc(100vh-150px)] overflow-y-auto px-4 pb-5">
      <div className="mb-4"><DemoNotice compact /></div>
      <div className="space-y-5">{groups.map((group) => <section key={group.title}><p className="px-3 text-xs font-bold uppercase tracking-wide text-slate-400">{group.title}</p><div className="mt-2 space-y-1">{group.links.map(([label, href, Icon]) => { const NavIcon = Icon as typeof Home; return <Link key={href as string} href={href as string} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-blue-50 hover:text-brand"><NavIcon size={17} />{label as string}</Link>; })}</div></section>)}</div>
    </nav>
  </aside>;
}

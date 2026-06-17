"use client";

import Link from "next/link";
import { FileText, Home, MessageCircle, MessageSquareText, NotebookPen, ScrollText } from "lucide-react";
import { DemoNotice } from "@/components/DemoNotice";

const links = [
  { href: "/dashboard", label: "Tổng quan", icon: Home },
  { href: "/tools/exam-generator", label: "Tạo đề kiểm tra", icon: FileText },
  { href: "/tools/worksheet-generator", label: "Phiếu học tập", icon: NotebookPen },
  { href: "/tools/student-comments", label: "Nhận xét học sinh", icon: MessageSquareText },
  { href: "/history", label: "Lịch sử", icon: ScrollText },
  { href: "/feedback", label: "Góp ý", icon: MessageCircle }
];

export function Sidebar() {
  return (
    <aside className="border-b border-line bg-white md:min-h-screen md:w-72 md:border-b-0 md:border-r">
      <div className="p-5">
        <Link href="/" className="text-2xl font-bold text-ink">Classora</Link>
        <p className="mt-1 text-sm text-muted">Trợ lý tài liệu cho giáo viên Việt Nam</p>
      </div>
      <div className="px-4 pb-4">
        <DemoNotice compact />
      </div>
      <nav className="flex gap-2 overflow-x-auto px-4 pb-4 md:block md:space-y-1 md:overflow-visible">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-blue-50 hover:text-brand">
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

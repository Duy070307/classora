"use client";

import Link from "next/link";
import { Home, MessageCircle, ScrollText } from "lucide-react";
import { DemoNotice } from "@/components/DemoNotice";
import { allToolLinks, toolCategories } from "@/lib/tool-configs";

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
      <nav className="max-h-[calc(100vh-180px)] overflow-y-auto px-4 pb-4">
        <div className="space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-blue-50 hover:text-brand">
            <Home size={18} />
            Tổng quan
          </Link>
          <Link href="/history" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-blue-50 hover:text-brand">
            <ScrollText size={18} />
            Lịch sử
          </Link>
          <Link href="/feedback" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-blue-50 hover:text-brand">
            <MessageCircle size={18} />
            Góp ý
          </Link>
        </div>
        <div className="mt-5 space-y-5">
          {toolCategories.map((category) => (
            <div key={category}>
              <p className="px-3 text-xs font-bold uppercase tracking-wide text-slate-400">{category}</p>
              <div className="mt-2 space-y-1">
                {allToolLinks.filter((tool) => tool.category === category).map((tool) => (
                  <Link key={tool.href} href={tool.href} className="block rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-blue-50 hover:text-brand">
                    {tool.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}

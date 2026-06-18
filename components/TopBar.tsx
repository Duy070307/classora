"use client";

import Link from "next/link";
import { Menu, Plus } from "lucide-react";
import { CommandPaletteButton } from "@/components/CommandPalette";

export function TopBar({ title, onOpenMenu }: { title?: string; onOpenMenu: () => void }) {
  return <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
    <div className="flex min-w-0 items-center gap-3">
      <button type="button" className="btn-secondary min-h-10 px-3 md:hidden" onClick={onOpenMenu} aria-label="Mở menu"><Menu size={19} /></button>
      <div className="min-w-0"><p className="truncate text-sm font-bold text-ink">{title || "Không gian làm việc"}</p><p className="hidden text-xs text-muted sm:block">Soạn Lab · MVP/demo</p></div>
    </div>
    <div className="flex items-center gap-2"><CommandPaletteButton compact /><span className="hidden rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 sm:inline">AI mô phỏng</span><Link href="/tools/exam-generator" className="btn-primary min-h-10 px-3"><Plus size={16} /><span className="hidden sm:inline">Tạo đề</span></Link></div>
  </header>;
}

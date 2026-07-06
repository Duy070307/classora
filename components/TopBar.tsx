"use client";

import Link from "next/link";
import { FileDown, Menu, Plus, Search } from "lucide-react";

export function TopBar({
  title,
  onOpenMenu,
}: {
  title?: string;
  onOpenMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-blue-100/70 bg-white/88 px-3 py-3 shadow-[0_8px_28px_rgba(37,99,235,.06)] backdrop-blur-xl sm:px-5">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-3">
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm md:hidden"
          onClick={onOpenMenu}
          aria-label="Mở menu"
        >
          <Menu size={19} />
        </button>
        <div className="hidden min-w-0 md:block lg:w-52">
          <p className="truncate text-sm font-black text-slate-900">{title || "Không gian làm việc"}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">Hỗ trợ giáo viên Việt Nam</p>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("classora-open-command-palette"))}
          className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-left text-sm text-slate-500 transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
          aria-label="Tìm công cụ, tài liệu"
        >
          <Search size={18} className="shrink-0 text-blue-500" />
          <span className="truncate">Tìm công cụ, tài liệu...</span>
          <kbd className="ml-auto hidden rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-400 sm:block">
            Ctrl K
          </kbd>
        </button>
        <Link href="/history" className="hidden min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 lg:inline-flex">
          <FileDown size={16} />
          Xuất lại
        </Link>
        <Link href="/tools" className="btn-primary min-h-11 shrink-0 px-3 sm:px-4">
          <Plus size={17} />
          <span className="hidden sm:inline">Tạo tài liệu</span>
        </Link>
      </div>
    </header>
  );
}

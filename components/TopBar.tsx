"use client";

import Link from "next/link";
import { FileClock, Menu, Plus, Search } from "lucide-react";

export function TopBar({
  title,
  onOpenMenu,
}: {
  title?: string;
  onOpenMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur-xl sm:px-5">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-3">
        <button
          type="button"
          className="ui-icon-button shrink-0 border border-slate-200 bg-white md:hidden"
          onClick={onOpenMenu}
          aria-label="Mở menu"
        >
          <Menu size={19} />
        </button>
        <div className="hidden min-w-0 md:block lg:w-56">
          <p className="truncate text-sm font-black text-slate-900">{title || "Không gian làm việc"}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">Tạo bản nháp, rà soát và xuất file</p>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("classora-open-command-palette"))}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-500 transition hover:border-emerald-300 hover:bg-white sm:px-4"
          aria-label="Tìm công cụ, tài liệu"
        >
          <Search size={18} className="shrink-0 text-emerald-700" />
          <span className="truncate">Tìm công cụ, tài liệu...</span>
          <kbd className="ml-auto hidden rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-400 sm:block">
            Ctrl K
          </kbd>
        </button>
        <Link href="/history" className="hidden min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800 lg:inline-flex">
          <FileClock size={16} />
          Lịch sử
        </Link>
        <Link href="/create" className="btn-primary shrink-0 px-3 sm:px-4">
          <Plus size={17} />
          <span className="hidden sm:inline">Tạo mới</span>
        </Link>
      </div>
    </header>
  );
}

"use client";
import Link from "next/link";
import { Menu, Plus, Search } from "lucide-react";
export function TopBar({
  title,
  onOpenMenu,
}: {
  title?: string;
  onOpenMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-[72px] items-center gap-3 border-b border-blue-100/70 bg-white/90 px-4 shadow-[0_6px_24px_rgba(37,99,235,.045)] backdrop-blur-xl sm:px-6">
      <button
        type="button"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm md:hidden"
        onClick={onOpenMenu}
        aria-label="Mở menu"
      >
        <Menu size={19} />
      </button>
      <div className="hidden min-w-0 md:block lg:w-48">
        <p className="truncate text-sm font-bold text-ink">
          {title || "Không gian làm việc"}
        </p>
        <p className="mt-0.5 text-xs text-muted">Soạn Lab · MVP/demo</p>
      </div>
      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(new Event("classora-open-command-palette"))
        }
        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left text-sm text-slate-500 transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
        aria-label="Tìm công cụ, tài liệu"
      >
        <Search size={18} className="shrink-0 text-slate-400" />
        <span className="truncate">Tìm công cụ, tài liệu...</span>
        <kbd className="ml-auto hidden rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-400 sm:block">
          Ctrl K
        </kbd>
      </button>
      <span className="hidden rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 lg:inline">
        Demo
      </span>
      <Link
        href="/tools/exam-generator"
        className="btn-primary min-h-11 shrink-0 px-3 sm:px-4"
      >
        <Plus size={17} />
        <span className="hidden sm:inline">Tạo đề</span>
      </Link>
    </header>
  );
}

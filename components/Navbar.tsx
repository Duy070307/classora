import Link from "next/link";
import { FileDown } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
      <div className="mx-auto flex max-w-7xl items-center gap-3 rounded-2xl border border-blue-100/80 bg-white/90 px-4 py-3 shadow-[0_10px_35px_rgba(37,99,235,.09)] backdrop-blur-xl">
        <Link href="/" aria-label="Soạn Lab" className="shrink-0">
          <BrandLogo variant="full" compact />
        </Link>
        <nav className="mx-auto hidden items-center gap-1 rounded-full bg-slate-50 p-1 text-sm font-bold text-slate-600 lg:flex">
          <Link
            href="/#how-it-works"
            className="rounded-full px-4 py-2 hover:bg-white hover:text-blue-700"
          >
            Cách hoạt động
          </Link>
          <Link
            href="/#tools"
            className="rounded-full px-4 py-2 hover:bg-white hover:text-blue-700"
          >
            Công cụ
          </Link>
          <Link
            href="/feedback"
            className="rounded-full px-4 py-2 hover:bg-white hover:text-blue-700"
          >
            Góp ý
          </Link>
          <Link
            href="/getting-started"
            className="rounded-full px-4 py-2 hover:bg-white hover:text-blue-700"
          >
            Hướng dẫn
          </Link>
        </nav>
        <span className="hidden items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-2 text-xs font-extrabold text-cyan-700 md:inline-flex">
          <FileDown size={14} />
          Xuất Word/PDF
        </span>
        <Link href="/dashboard" className="btn-primary min-h-10 shrink-0 px-4">
          Bắt đầu sử dụng
        </Link>
      </div>
    </header>
  );
}

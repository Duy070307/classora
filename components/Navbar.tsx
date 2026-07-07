import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" aria-label="Soạn Lab" className="shrink-0">
          <BrandLogo variant="full" compact />
        </Link>
        <nav className="ml-auto hidden items-center gap-6 text-sm font-bold text-slate-600 lg:flex">
          <Link href="/" className="hover:text-blue-700">
            Trang chủ
          </Link>
          <Link href="/tools" className="hover:text-blue-700">
            Công cụ
          </Link>
          <Link href="/getting-started" className="hover:text-blue-700">
            Hướng dẫn
          </Link>
          <Link href="/pricing" className="hover:text-blue-700">
            Bảng giá
          </Link>
        </nav>
        <Link href="/login" className="ml-auto hidden text-sm font-bold text-slate-600 hover:text-blue-700 sm:inline-flex lg:ml-0">
          Đăng nhập
        </Link>
        <Link href="/dashboard" className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700">
          Bắt đầu
        </Link>
      </div>
    </header>
  );
}

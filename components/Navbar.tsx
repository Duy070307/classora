import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export function Navbar() {
  return <header className="sticky top-0 z-30 border-b border-white/70 bg-white/90 shadow-sm backdrop-blur-xl">
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
      <Link href="/" aria-label="Soạn Lab"><BrandLogo variant="full" compact /></Link>
      <nav className="flex items-center justify-end gap-3 text-sm font-semibold text-muted">
        <Link href="/tools" className="hidden hover:text-brand sm:inline">Công cụ</Link><Link href="/pricing" className="hidden hover:text-brand md:inline">Bảng giá</Link><Link href="/feedback" className="hidden hover:text-brand lg:inline">Góp ý</Link><Link href="/dashboard" className="btn-primary min-h-10 px-3 sm:px-4">Dùng thử demo</Link>
      </nav>
    </div>
  </header>;
}

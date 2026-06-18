import Link from "next/link";
import { DemoNotice } from "@/components/DemoNotice";

export function Navbar() {
  return <header className="border-b border-line bg-white/95 backdrop-blur">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
      <Link href="/" className="text-xl font-bold text-ink">Classora</Link>
      <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-medium text-muted">
        <Link href="/tools" className="hover:text-brand">Công cụ</Link><Link href="/getting-started" className="hover:text-brand">Bắt đầu</Link><Link href="/pricing" className="hover:text-brand">Bảng giá</Link><Link href="/changelog" className="hover:text-brand">Cập nhật</Link><Link href="/dashboard" className="btn-primary">Dùng thử demo</Link>
      </nav>
    </div>
    <div className="mx-auto max-w-6xl px-4 pb-3"><DemoNotice compact /></div>
  </header>;
}

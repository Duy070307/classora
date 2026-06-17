import Link from "next/link";
import { DemoNotice } from "@/components/DemoNotice";

export function Navbar() {
  return (
    <header className="border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-ink">
          Classora
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-muted">
          <Link href="/dashboard" className="hover:text-brand">Dashboard</Link>
          <Link href="/history" className="hover:text-brand">Lịch sử</Link>
          <Link href="/feedback" className="hover:text-brand">Góp ý</Link>
          <Link href="/dashboard" className="btn-primary">Bắt đầu</Link>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-3">
        <DemoNotice compact />
      </div>
    </header>
  );
}

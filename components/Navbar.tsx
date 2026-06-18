import Link from "next/link";
import { CommandPaletteButton } from "@/components/CommandPalette";
import { DemoNotice } from "@/components/DemoNotice";
import { BrandLogo } from "@/components/BrandLogo";

export function Navbar() {
  return <header className="sticky top-0 z-30 border-b border-white/70 bg-white/90 shadow-sm backdrop-blur-xl">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
      <Link href="/" aria-label="Soạn Lab"><BrandLogo compact /></Link>
      <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-medium text-muted">
        <CommandPaletteButton compact /><Link href="/tools" className="hover:text-brand">Công cụ</Link><Link href="/private-beta" className="hover:text-brand">Private Beta</Link><Link href="/tester-guide" className="hover:text-brand">Hướng dẫn test</Link><Link href="/feedback" className="hover:text-brand">Góp ý</Link><Link href="/dashboard" className="btn-primary">Dùng thử demo</Link>
      </nav>
    </div>
    <div className="mx-auto max-w-6xl px-4 pb-3"><DemoNotice compact /></div>
  </header>;
}

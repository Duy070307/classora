"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export function AppShell({ children, title, contentClassName = "mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8" }: { children: React.ReactNode; title?: string; contentClassName?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    let active = true;
    fetch("/api/maintenance", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { maintenance?: boolean }) => { if (active && data.maintenance && pathname !== "/maintenance") router.replace("/maintenance"); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [pathname, router]);
  return <div className="app-bg min-h-screen md:flex">
    <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    <div className="min-w-0 flex-1"><TopBar title={title} onOpenMenu={() => setMenuOpen(true)} /><main className={contentClassName}>{children}</main></div>
  </div>;
}

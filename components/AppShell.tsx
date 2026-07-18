"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export function AppShell({ children, title, contentClassName = "mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-5 sm:py-6 lg:px-7 lg:py-7" }: { children: React.ReactNode; title?: string; contentClassName?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLElement | null>(null);
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
  const openMenu = useCallback(() => {
    menuTriggerRef.current = document.activeElement as HTMLElement | null;
    setMenuOpen(true);
  }, []);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    queueMicrotask(() => menuTriggerRef.current?.focus());
  }, []);
  return <div className="app-bg min-h-dvh md:flex">
    <Sidebar mobileOpen={menuOpen} onClose={closeMenu} />
    <div className="min-w-0 flex-1"><TopBar title={title} onOpenMenu={openMenu} /><main id="main-content" className={contentClassName}>{children}</main></div>
  </div>;
}

"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export function AppShell({ children, title, contentClassName = "p-4 sm:p-6 lg:p-8" }: { children: React.ReactNode; title?: string; contentClassName?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="min-h-screen bg-slate-50 md:flex">
    <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    <div className="min-w-0 flex-1"><TopBar title={title} onOpenMenu={() => setMenuOpen(true)} /><main className={contentClassName}>{children}</main></div>
  </div>;
}

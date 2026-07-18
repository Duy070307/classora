"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";

const links = [
  ["Tính năng", "#tinh-nang"],
  ["Cách hoạt động", "#cach-hoat-dong"],
  ["TikZ", "#tikz"],
  ["Dùng thử", "#dung-thu"],
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      queueMicrotask(() => trigger?.focus());
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <Link href="#noi-dung-chinh" className="absolute left-4 top-2 z-[60] -translate-y-16 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-300">
        Bỏ qua điều hướng
      </Link>
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="SOẠN LAB — Trang chủ">
          <BrandLogo size="sm" className="pointer-events-none" />
          <span className="hidden border-l border-slate-200 pl-3 text-xs font-medium leading-5 text-slate-500 xl:block">
            Bộ công cụ hỗ trợ giáo viên
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Điều hướng trang chủ">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-slate-600 transition hover:text-blue-700">
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-slate-700 hover:text-blue-700">
            Đăng nhập
          </Link>
          <Link href="/dang-ky-dung-thu" className="btn-primary">
            Đăng ký dùng thử
          </Link>
        </div>

        <button
          ref={triggerRef}
          type="button"
          className="ui-icon-button ml-auto lg:hidden"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          aria-controls="public-mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {open ? (
        <>
          <button type="button" aria-label="Đóng menu" className="fixed inset-0 top-16 z-40 bg-slate-950/30 lg:hidden" onClick={() => setOpen(false)} />
          <div ref={menuRef} id="public-mobile-menu" className="absolute inset-x-0 top-full z-50 border-b border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden">
            <nav className="mx-auto grid max-w-7xl" aria-label="Điều hướng di động">
              {links.map(([label, href]) => (
                <Link key={href} href={href} onClick={() => setOpen(false)} className="flex min-h-11 items-center border-b border-slate-100 text-sm font-medium text-slate-700 last:border-b-0 hover:text-blue-700">
                  {label}
                </Link>
              ))}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Link href="/login" onClick={() => setOpen(false)} className="btn-secondary">Đăng nhập</Link>
                <Link href="/dang-ky-dung-thu" onClick={() => setOpen(false)} className="btn-primary">Đăng ký dùng thử</Link>
              </div>
            </nav>
          </div>
        </>
      ) : null}
    </header>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronUp, LoaderCircle, LogOut, MessageCircle, Settings, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/auth/roles";

type Account = {
  email: string;
  role: UserRole;
  fullName: string;
};

type AccountPanelProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

const menuItemClass =
  "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-700 outline-none transition hover:bg-blue-50 hover:text-blue-800 focus-visible:bg-blue-50 focus-visible:text-blue-800 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600";

function roleLabel(role: UserRole) {
  return role === "admin" ? "Quản trị" : "Giáo viên";
}

function accountInitial(account: Account) {
  return (account.fullName.trim() || account.email.trim() || "S").charAt(0).toLocaleUpperCase("vi");
}

export function AccountPanel({ collapsed = false, onNavigate }: AccountPanelProps) {
  const [configured] = useState(() => Boolean(createSupabaseBrowserClient()));
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(configured);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    void (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted || !data.user) return;
        const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", data.user.id).maybeSingle();
        if (!mounted) return;
        setAccount({
          email: data.user.email ?? "Tài khoản SOẠN LAB",
          fullName: typeof profile?.full_name === "string" ? profile.full_name : "",
          role: profile?.role === "admin" ? "admin" : "teacher",
        });
      } catch {
        // Giữ hàng tài khoản ở trạng thái an toàn nếu phiên đăng nhập tạm thời không đọc được.
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    queueMicrotask(() => firstItem?.focus());

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setMenuOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [menuOpen]);

  const fallbackAccount: Account = {
    email: configured ? "Tài khoản giáo viên" : "Không gian làm việc",
    fullName: "",
    role: "teacher",
  };
  const displayedAccount = account ?? fallbackAccount;
  const displayedRole = roleLabel(displayedAccount.role);
  const identity = `${displayedAccount.email} · ${displayedRole}`;

  const finishNavigation = () => {
    setMenuOpen(false);
    onNavigate?.();
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []);
    if (!items.length) return;
    event.preventDefault();
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Home") items[0].focus();
    else if (event.key === "End") items[items.length - 1].focus();
    else if (event.key === "ArrowDown") items[(currentIndex + 1 + items.length) % items.length].focus();
    else items[(currentIndex - 1 + items.length) % items.length].focus();
  };

  if (loading) {
    return (
      <div className={`flex min-h-14 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 ${collapsed ? "justify-center" : ""}`} aria-label="Đang tải tài khoản">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
        </span>
        {!collapsed ? (
          <span className="min-w-0 flex-1" aria-hidden="true">
            <span className="block h-3 w-28 rounded bg-slate-200" />
            <span className="mt-1.5 block h-2.5 w-16 rounded bg-slate-100" />
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      {menuOpen ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Tùy chọn tài khoản"
          aria-orientation="vertical"
          onKeyDown={handleMenuKeyDown}
          className={`absolute bottom-[calc(100%+0.5rem)] z-[60] max-h-[min(18rem,calc(100dvh-6rem))] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 ${collapsed ? "left-0 w-60" : "inset-x-0"}`}
        >
          {account?.role === "admin" ? (
            <Link href="/admin" role="menuitem" className={menuItemClass} onClick={finishNavigation}>
              <ShieldCheck size={16} className="shrink-0 text-slate-500" aria-hidden="true" />
              Quản trị
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={() => {
              window.dispatchEvent(new CustomEvent("soanlab:open-feedback"));
              finishNavigation();
            }}
          >
            <MessageCircle size={16} className="shrink-0 text-slate-500" aria-hidden="true" />
            Góp ý
          </button>
          <Link href="/settings" role="menuitem" className={menuItemClass} onClick={finishNavigation}>
            <Settings size={16} className="shrink-0 text-slate-500" aria-hidden="true" />
            Cài đặt
          </Link>
          {account ? (
            <>
              <div role="separator" className="my-1 border-t border-slate-200" />
              <form
                action="/api/auth/logout"
                method="post"
                onSubmit={(event) => {
                  if (loggingOut) {
                    event.preventDefault();
                    return;
                  }
                  setLoggingOut(true);
                }}
              >
                <button
                  type="submit"
                  role="menuitem"
                  disabled={loggingOut}
                  className={`${menuItemClass} text-slate-600 hover:bg-red-50 hover:text-red-700 focus-visible:bg-red-50 focus-visible:text-red-700 disabled:cursor-wait disabled:opacity-60`}
                >
                  {loggingOut ? <LoaderCircle size={16} className="shrink-0 animate-spin" aria-hidden="true" /> : <LogOut size={16} className="shrink-0" aria-hidden="true" />}
                  {loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
                </button>
              </form>
            </>
          ) : null}
        </div>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        title={identity}
        aria-label={collapsed ? `Mở menu tài khoản: ${identity}` : "Mở menu tài khoản"}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        onClick={() => setMenuOpen((current) => !current)}
        className={`group grid min-h-14 w-full items-center rounded-lg border border-slate-200 bg-white px-2 text-left outline-none transition hover:border-blue-200 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${collapsed ? "grid-cols-1 justify-items-center" : "grid-cols-[2rem_minmax(0,1fr)_1.25rem] gap-2"}`}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800" aria-hidden="true">
          {accountInitial(displayedAccount)}
        </span>
        {!collapsed ? (
          <span className="min-w-0">
            <span className="block truncate whitespace-nowrap text-[13px] font-semibold leading-4 text-slate-800" title={displayedAccount.email}>
              {displayedAccount.email}
            </span>
            <span className="mt-0.5 block text-[11px] font-medium leading-4 text-slate-500">{displayedRole}</span>
          </span>
        ) : null}
        {!collapsed ? (
          <ChevronUp size={16} className={`text-slate-400 transition-transform group-hover:text-blue-700 ${menuOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        ) : null}
      </button>
    </div>
  );
}

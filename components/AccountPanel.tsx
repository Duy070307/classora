"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/auth/roles";

type Account = {
  email: string;
  role: UserRole;
  fullName: string;
};

export function AccountPanel() {
  const [account, setAccount] = useState<Account | null>(null);
  const [configured] = useState(() => Boolean(createSupabaseBrowserClient()));

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", data.user.id).maybeSingle();
      setAccount({
        email: data.user.email ?? "",
        fullName: typeof profile?.full_name === "string" ? profile.full_name : "",
        role: profile?.role === "admin" ? "admin" : "teacher",
      });
    });
  }, []);

  if (!configured) {
    return (
      <div className="rounded-2xl bg-white/80 p-3 ring-1 ring-blue-100">
        <p className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <UserRound size={14} className="text-indigo-600" />
          Không gian làm việc
        </p>
        <div className="mt-3 flex gap-4 text-xs font-semibold">
          <Link href="/settings" className="text-slate-500 hover:text-blue-700">Cài đặt</Link>
          <Link href="/data" className="text-slate-500 hover:text-blue-700">Dữ liệu</Link>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="rounded-2xl bg-white/80 p-3 ring-1 ring-blue-100">
        <p className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <UserRound size={14} className="text-indigo-600" />
          Tài khoản giáo viên
        </p>
        <div className="mt-3 flex gap-4 text-xs font-semibold">
          <Link href="/login" className="text-blue-700">Đăng nhập</Link>
          <Link href="/data" className="text-slate-500 hover:text-blue-700">Dữ liệu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/80 p-3 ring-1 ring-blue-100">
      <p className="truncate text-xs font-bold text-slate-700">{account.fullName || account.email}</p>
      <div className="mt-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
        <ShieldCheck size={13} className="text-blue-600" />
        {account.role === "admin" ? "Quản trị" : "Giáo viên"}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
        {account.role === "admin" ? <Link href="/admin" className="text-blue-700">Quản trị</Link> : null}
        <Link href="/settings" className="text-slate-500 hover:text-blue-700">Cài đặt</Link>
        <form action="/api/auth/logout" method="post">
          <button className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-700" type="submit">
            <LogOut size={13} /> Thoát
          </button>
        </form>
      </div>
    </div>
  );
}

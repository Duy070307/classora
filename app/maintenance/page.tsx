import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, LogOut, Settings } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { getCurrentUser } from "@/lib/auth/user";
import { getMaintenanceSettings, isMaintenanceBypassed } from "@/lib/maintenance";

export default async function MaintenancePage() {
  const [user, maintenance] = await Promise.all([getCurrentUser(), getMaintenanceSettings()]);
  const adminBypass = isMaintenanceBypassed(user);
  if (!maintenance.enabled) redirect(user ? adminBypass ? "/admin" : "/dashboard" : "/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6">
      <section className="w-full max-w-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,.08)] sm:p-10">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <BrandLogo href="/" size="sm" />
          <span className="inline-flex size-10 items-center justify-center border border-blue-200 bg-blue-50 text-blue-700" aria-hidden="true"><Clock3 size={20} /></span>
        </div>
        <div className="py-7 text-center sm:py-9">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Thông báo hệ thống</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">SOẠN LAB đang bảo trì</h1>
          <p className="mx-auto mt-5 max-w-xl whitespace-pre-line text-base leading-7 text-slate-700">{maintenance.message}</p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">Dữ liệu và tài khoản đã cấp vẫn được giữ nguyên. Khi hệ thống mở lại, thầy cô có thể đăng nhập và sử dụng bình thường.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 border-t border-slate-200 pt-6">
          {user ? <form action="/api/auth/logout" method="post"><button type="submit" className="btn-primary"><LogOut size={17} />Đăng xuất</button></form> : null}
          <Link href="/login" className="btn-secondary">Về trang đăng nhập</Link>
          {adminBypass ? <Link href="/admin" className="btn-secondary"><Settings size={17} />Vào trang quản trị</Link> : null}
        </div>
      </section>
    </main>
  );
}

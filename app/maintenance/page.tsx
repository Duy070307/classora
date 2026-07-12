import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/user";
import { getMaintenanceSettings } from "@/lib/maintenance";

export default async function MaintenancePage() {
  const [user, maintenance] = await Promise.all([getCurrentUser(), getMaintenanceSettings()]);
  if (!maintenance.enabled) redirect(user ? user.role === "admin" ? "/admin" : "/dashboard" : "/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 via-white to-slate-50 p-4 sm:p-6">
      <section className="w-full max-w-2xl rounded-[32px] border border-blue-100 bg-white p-6 text-center shadow-[0_24px_70px_rgba(30,64,175,.12)] sm:p-10">
        <Image src="/brand/soan-lab-mark.png" alt="SOẠN LAB" width={64} height={64} className="mx-auto h-16 w-16 object-contain" priority />
        <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-blue-700">Thông báo hệ thống</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">SOẠN LAB đang bảo trì</h1>
        <p className="mx-auto mt-5 max-w-xl whitespace-pre-line text-base leading-7 text-slate-700">{maintenance.message}</p>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">Dữ liệu và tài khoản đã cấp vẫn được giữ nguyên. Khi hệ thống mở lại, thầy cô có thể đăng nhập và sử dụng bình thường.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {user ? <form action="/api/auth/logout" method="post"><button type="submit" className="btn-primary"><LogOut size={17} />Đăng xuất</button></form> : null}
          <Link href="/login" className="btn-secondary">Về trang đăng nhập</Link>
          {user?.role === "admin" ? <Link href="/admin" className="btn-secondary"><Settings size={17} />Vào trang quản trị</Link> : null}
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";

export default function RegisterPage() {
  return (
    <main className="warm-page flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl rounded-[32px] border border-blue-100 bg-white p-6 text-center shadow-2xl shadow-blue-100/70 sm:p-9">
        <BrandLockup href="/" className="justify-center" priority />
        <span className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
          <LockKeyhole size={26} />
        </span>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950">Đăng ký tài khoản hiện chưa mở</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-600">
          Hiện tại SOẠN LAB chưa mở đăng ký tự do. Thầy/cô vui lòng gửi đăng ký dùng thử để được xem xét cấp tài khoản.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dang-ky-dung-thu" className="btn-primary">Đăng ký dùng thử</Link>
          <Link href="/login" className="btn-secondary">Quay lại đăng nhập</Link>
        </div>
      </section>
    </main>
  );
}

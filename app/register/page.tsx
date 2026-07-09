import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export default function RegisterPage() {
  return (
    <main className="warm-page flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl rounded-[32px] border border-blue-100 bg-white p-6 text-center shadow-2xl shadow-blue-100/70 sm:p-9">
        <Link href="/" className="inline-flex justify-center">
          <BrandLogo />
        </Link>
        <span className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
          <LockKeyhole size={26} />
        </span>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950">Đăng ký tài khoản hiện chưa mở</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-600">
          Tài khoản thử nghiệm được cấp bởi nhóm phát triển Soạn Lab. Nếu đã có tài khoản, thầy/cô quay lại trang đăng nhập để tiếp tục.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login" className="btn-primary">Quay lại đăng nhập</Link>
          <Link href="/" className="btn-secondary">Về trang chủ</Link>
        </div>
      </section>
    </main>
  );
}

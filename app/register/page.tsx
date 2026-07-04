import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function RegisterPage() {
  return (
    <main className="warm-page flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-blue-100 bg-white p-6 text-center shadow-xl sm:p-8">
        <Link href="/" className="inline-flex justify-center">
          <BrandLogo />
        </Link>
        <h1 className="mt-8 text-3xl font-extrabold text-ink">Đăng ký tài khoản hiện chưa mở.</h1>
        <p className="mt-4 leading-7 text-muted">
          Tài khoản sử dụng được cấp bởi quản trị viên trong giai đoạn triển khai ban đầu.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login" className="btn-primary">Quay lại đăng nhập</Link>
          <Link href="/" className="btn-secondary">Về trang chủ</Link>
        </div>
      </section>
    </main>
  );
}

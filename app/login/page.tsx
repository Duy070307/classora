"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, FileText } from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { AuthProductPreview } from "@/components/landing/PublicProductVisuals";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(next);
    });
  }, [next, router, supabase]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      router.push("/dashboard");
      return;
    }
    setLoading(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Không thể đăng nhập. Vui lòng kiểm tra email và mật khẩu.");
      return;
    }
    router.refresh();
    router.push(next);
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto grid min-h-screen max-w-7xl border-x border-slate-200 bg-white lg:grid-cols-[1.04fr_.96fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="pointer-events-none absolute inset-0 soft-grid-bg opacity-[.08]" aria-hidden="true" />
          <div className="relative">
            <BrandLockup variant="inverse" href="/" priority />
            <p className="mt-14 text-sm font-semibold text-blue-300">Không gian làm việc dành cho giáo viên</p>
            <h1 className="mt-4 max-w-xl text-4xl font-bold leading-tight tracking-[-0.03em] xl:text-5xl">
              Tạo, rà soát và hoàn thiện tài liệu trong một quy trình rõ ràng.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-slate-300">
              Tiếp tục công việc với đề kiểm tra, giáo án, phiếu học tập, ngân hàng câu hỏi và tài liệu đã lưu.
            </p>
          </div>
          <div className="relative mt-10 max-w-lg [&_figcaption]:text-slate-300">
            <AuthProductPreview />
          </div>
        </section>

        <section className="flex min-w-0 items-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-md">
            <BrandLockup href="/" className="lg:hidden" priority />
            <div className="mt-9 flex size-11 items-center justify-center border border-blue-200 bg-blue-50 text-blue-700 lg:mt-0" aria-hidden="true">
              <FileText size={21} />
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950">Đăng nhập SOẠN LAB</h1>
            <p className="mt-3 leading-7 text-slate-600">Truy cập không gian tạo và quản lý tài liệu của thầy cô.</p>

            {!supabase ? (
              <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Tài khoản đang được thiết lập cho môi trường sử dụng hiện tại. Thầy/cô vẫn có thể tiếp tục vào SOẠN LAB trên thiết bị này.
              </div>
            ) : null}

            {error ? <div className="mt-5 border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert" aria-live="assertive">{error}</div> : null}

            <form className="mt-7 space-y-5" onSubmit={login}>
              <label className="block text-sm font-semibold text-slate-900">
                Email
                <input className="form-field mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
              </label>
              <label className="block text-sm font-semibold text-slate-900">
                Mật khẩu
                <span className="relative mt-2 block">
                  <input className="form-field pr-12" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 inline-flex min-w-11 items-center justify-center text-slate-500 transition hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </span>
              </label>
              <button className="btn-primary min-h-12 w-full" disabled={loading}>{loading ? "Đang đăng nhập..." : supabase ? "Đăng nhập" : "Tiếp tục sử dụng"}</button>
            </form>

            <div className="mt-6 border-l-2 border-blue-600 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              SOẠN LAB đang mở thử nghiệm giới hạn. Yêu cầu truy cập được xem xét thủ công trước khi cấp tài khoản.
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
              <Link href="/dang-ky-dung-thu" className="inline-flex min-h-11 items-center text-blue-700 hover:underline">Đăng ký dùng thử</Link>
              <Link href="/" className="inline-flex min-h-11 items-center text-slate-600 hover:text-slate-950 hover:underline">Về trang chủ</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-100" />}>
      <LoginContent />
    </Suspense>
  );
}

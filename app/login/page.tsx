"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
      <section className="w-full max-w-[440px]" data-testid="login-form-container">
        <BrandLockup href="/" priority />
        <div className="mt-10 border-t border-slate-200 pt-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Đăng nhập SOẠN LAB</h1>
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

          <div className="mt-6 border-l-2 border-blue-600 bg-blue-50/60 px-4 py-3 text-sm leading-6 text-slate-600">
            Sau khi gửi yêu cầu, thầy/cô vui lòng chờ quản trị viên duyệt tài khoản.
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
            <Link href="/dang-ky-dung-thu" className="inline-flex min-h-11 items-center text-blue-700 hover:underline">Đăng ký dùng thử</Link>
            <Link href="/" className="inline-flex min-h-11 items-center text-slate-600 hover:text-slate-950 hover:underline">Về trang chủ</Link>
          </div>
        </div>
      </section>
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

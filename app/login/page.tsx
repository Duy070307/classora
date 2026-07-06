"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <main className="warm-page flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-6 shadow-xl sm:p-8">
        <Link href="/" className="inline-flex">
          <BrandLogo />
        </Link>
        <h1 className="mt-8 text-3xl font-extrabold text-ink">Đăng nhập Soạn Lab</h1>
        <p className="mt-3 leading-7 text-muted">Truy cập không gian tạo tài liệu dành cho giáo viên.</p>

        {!supabase ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            T?i kho?n ?ang ???c thi?t l?p cho m?i tr??ng s? d?ng hi?n t?i. B?n v?n c? th? ti?p t?c v?o So?n Lab tr?n thi?t b? n?y.
          </div>
        ) : null}

        {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}

        <form className="mt-6 space-y-4" onSubmit={login}>
          <label className="block text-sm font-bold text-ink">
            Email
            <input className="form-field mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label className="block text-sm font-bold text-ink">
            Mật khẩu
            <input className="form-field mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
          </label>
          <button className="btn-primary w-full" disabled={loading}>{loading ? "?ang ??ng nh?p..." : supabase ? "??ng nh?p" : "Ti?p t?c s? d?ng"}</button>
        </form>

        <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
          <Link href="/register" className="text-blue-700">Thông tin đăng ký</Link>
          <Link href="/" className="text-slate-500">Về trang chủ</Link>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="warm-page min-h-screen" />}>
      <LoginContent />
    </Suspense>
  );
}

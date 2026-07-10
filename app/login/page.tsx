"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpenCheck, FileText, LockKeyhole, Sparkles } from "lucide-react";
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex">
            <BrandLogo />
          </Link>
          <h1 className="mt-10 max-w-xl text-5xl font-black tracking-tight text-slate-950">
            Soạn Lab giúp giáo viên tạo tài liệu nhanh hơn, gọn hơn.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
            Tạo đề kiểm tra, phiếu học tập, giáo án, nhận xét học sinh và xuất Word/PDF trong một không gian làm việc rõ ràng.
          </p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {[
              [FileText, "Tạo tài liệu"],
              [BookOpenCheck, "Soạn đề"],
              [Sparkles, "Lưu lịch sử"],
            ].map(([Icon, label]) => {
              const I = Icon as typeof FileText;
              return (
                <div key={label as string} className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
                  <I className="text-blue-600" size={22} />
                  <p className="mt-3 text-sm font-black text-slate-900">{label as string}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-[32px] border border-blue-100 bg-white p-6 shadow-2xl shadow-blue-100/70 sm:p-8">
          <Link href="/" className="inline-flex lg:hidden">
            <BrandLogo />
          </Link>
          <div className="mt-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <LockKeyhole size={24} />
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-950">Đăng nhập Soạn Lab</h1>
          <p className="mt-3 leading-7 text-slate-600">Không gian tạo tài liệu dành cho giáo viên.</p>

          {!supabase ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              Tài khoản đang được thiết lập cho môi trường sử dụng hiện tại. Thầy/cô vẫn có thể tiếp tục vào Soạn Lab trên thiết bị này.
            </div>
          ) : null}

          {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}

          <form className="mt-6 space-y-4" onSubmit={login}>
            <label className="block text-sm font-bold text-slate-900">
              Email
              <input className="form-field mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            </label>
            <label className="block text-sm font-bold text-slate-900">
              Mật khẩu
              <input className="form-field mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
            </label>
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Đang đăng nhập..." : supabase ? "Đăng nhập" : "Tiếp tục sử dụng"}</button>
          </form>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            SOẠN LAB đang thử nghiệm giới hạn. Nếu thầy/cô chưa có tài khoản, vui lòng đăng ký dùng thử để được xem xét cấp quyền truy cập.
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href="/dang-ky-dung-thu" className="text-blue-700">Đăng ký dùng thử</Link>
            <Link href="/" className="text-slate-500">Về trang chủ</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-blue-50" />}>
      <LoginContent />
    </Suspense>
  );
}

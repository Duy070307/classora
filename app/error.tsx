"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Soạn Lab route error", error);
  }, [error]);

  return <main className="flex min-h-screen items-center justify-center px-4 py-12">
    <section className="card w-full max-w-lg p-6 text-center sm:p-8">
      <AlertTriangle className="mx-auto text-coral" size={42} />
      <h1 className="mt-5 text-3xl font-bold text-ink">Đã có lỗi xảy ra</h1>
      <p className="mt-3 leading-7 text-muted">Soạn Lab chưa thể hiển thị nội dung này. Bạn có thể thử lại hoặc quay về dashboard.</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
        <button type="button" className="btn-primary" onClick={reset}>Thử lại</button>
        <Link href="/dashboard" className="btn-secondary">Về dashboard</Link>
        <Link href="/tools" className="btn-secondary">Xem công cụ</Link>
      </div>
    </section>
  </main>;
}

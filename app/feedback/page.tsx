import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

export default function FeedbackPage() {
  return <main className="warm-page min-h-screen">
    <Navbar />
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="play-card p-6 sm:p-9">
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-blue-600">Soạn Lab</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Trang này hiện không còn được sử dụng.</h1>
        <p className="mt-4 leading-7 text-slate-600">Thầy/cô có thể tiếp tục dùng các công cụ chính hoặc quay lại dashboard.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/dashboard" className="btn-primary">Về dashboard</Link>
          <Link href="/tools" className="btn-secondary">Xem công cụ</Link>
        </div>
      </div>
    </section>
    <SiteFooter />
  </main>;
}

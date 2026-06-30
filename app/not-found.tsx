import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center px-4 py-12">
    <section className="card w-full max-w-lg p-6 text-center sm:p-8">
      <SearchX className="mx-auto text-brand" size={40} />
      <h1 className="mt-5 text-3xl font-bold text-ink">Không tìm thấy trang</h1>
      <p className="mt-3 leading-7 text-muted">Đường dẫn này không tồn tại hoặc đã được thay đổi.</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
        <Link href="/dashboard" className="btn-primary">Về dashboard</Link>
        <Link href="/tools" className="btn-secondary">Xem tất cả công cụ</Link>
        <Link href="/samples" className="btn-secondary">Mẫu sử dụng</Link>
      </div>
    </section>
  </main>;
}

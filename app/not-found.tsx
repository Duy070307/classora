import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center px-4 py-12"><section className="card max-w-lg p-8 text-center"><SearchX className="mx-auto text-brand" size={40} /><h1 className="mt-5 text-3xl font-bold text-ink">Không tìm thấy trang</h1><p className="mt-3 leading-7 text-muted">Đường dẫn này không tồn tại hoặc đã được thay đổi. Bạn có thể quay về workspace hoặc mở danh sách công cụ.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/dashboard" className="btn-primary">Về dashboard</Link><Link href="/tools" className="btn-secondary">Mở công cụ</Link></div></section></main>;
}

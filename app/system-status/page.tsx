import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

const activeItems = [
  "Tạo đề kiểm tra",
  "Xuất Word",
  "Print/PDF",
  "Mẫu sử dụng",
  "Lưu lịch sử",
];

const upcomingItems = [
  "Tài khoản",
  "Đồng bộ dữ liệu",
  "OCR ảnh/PDF",
];

export default function SystemStatusPage() {
  return <main className="min-h-screen"><Navbar /><section className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
    <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 sm:p-9">
      <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Trạng thái hệ thống</p>
      <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">Các chức năng chính của Soạn Lab</h1>
      <p className="mt-4 max-w-3xl leading-7 text-muted">Thông tin tổng quan để giáo viên biết phạm vi hỗ trợ hiện tại. Nội dung tạo ra là bản nháp và cần giáo viên rà soát trước khi sử dụng.</p>
    </div>
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      <section className="card p-5 shadow-lg sm:p-7">
        <h2 className="text-xl font-extrabold text-ink">Đang hoạt động</h2>
        <ul className="mt-5 space-y-3">
          {activeItems.map((item) => <li key={item} className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><span className="flex items-center gap-3"><CheckCircle2 size={18} />{item}</span><span>Hoạt động</span></li>)}
        </ul>
      </section>
      <section className="card p-5 shadow-lg sm:p-7">
        <h2 className="text-xl font-extrabold text-ink">Chưa mở</h2>
        <ul className="mt-5 space-y-3">
          {upcomingItems.map((item) => <li key={item} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700"><span className="flex items-center gap-3"><Clock3 size={18} />{item}</span><span>Chưa mở</span></li>)}
        </ul>
      </section>
    </div>
    <div className="mt-7 flex flex-wrap gap-3">
      <Link href="/dashboard" className="btn-primary">Mở dashboard</Link>
      <Link href="/samples" className="btn-secondary">Mẫu sử dụng</Link>
      <Link href="/tools" className="btn-secondary">Xem công cụ</Link>
    </div>
  </section><SiteFooter /></main>;
}

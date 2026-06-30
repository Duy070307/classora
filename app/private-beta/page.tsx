import Link from "next/link";
import { CheckCircle2, FileDown, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

const sections = [
  ["Soạn Lab là gì?", "Bộ công cụ hỗ trợ giáo viên tạo đề, tài liệu, nhận xét và xuất Word/PDF bằng các form rõ ràng.", CheckCircle2],
  ["Ai nên dùng?", "Giáo viên THCS/THPT, giáo viên chủ nhiệm và gia sư thường xuyên chuẩn bị tài liệu.", Users],
  ["Nên thử điều gì?", "Mở mẫu sử dụng, tạo bản nháp, xuất Word/PDF và rà soát trước khi dùng.", FileDown],
];

export default function PrivateBetaPage() {
  return <main><Navbar /><section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-7 text-white shadow-2xl shadow-blue-200 sm:p-10">
      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold">Soạn Lab</span>
      <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">Khám phá Soạn Lab</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">Trải nghiệm quy trình tạo tài liệu, lưu lịch sử và xuất Word/PDF dành cho giáo viên.</p>
      <div className="mt-7 flex flex-wrap gap-3"><Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-2 text-sm font-bold text-blue-700">Mở dashboard</Link><Link href="/samples" className="inline-flex min-h-11 items-center rounded-xl border border-white/30 px-5 py-2 text-sm font-bold">Mẫu sử dụng</Link></div>
    </div>
    <div className="mt-8 grid gap-5 md:grid-cols-3">{sections.map(([title, text, Icon]) => { const SectionIcon = Icon as typeof CheckCircle2; return <section key={title as string} className="card p-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-brand"><SectionIcon size={21} /></span><h2 className="mt-4 text-xl font-bold text-ink">{title as string}</h2><p className="mt-2 text-sm leading-7 text-muted">{text as string}</p></section>; })}</div>
    <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold text-amber-900">Giới hạn hiện tại</h2><p className="mt-2 text-sm leading-6 text-amber-800">Dữ liệu lưu trên trình duyệt và mọi nội dung cần được giáo viên kiểm tra lại trước khi sử dụng.</p><Link href="/known-issues" className="mt-3 inline-flex text-sm font-bold text-amber-900 underline">Xem đầy đủ giới hạn</Link></section>
    <div className="mt-8 flex flex-wrap gap-3"><Link href="/tools" className="btn-secondary">Xem tất cả công cụ</Link><Link href="/share" className="btn-secondary">Chia sẻ Soạn Lab</Link><Link href="/tester-guide" className="btn-secondary">Hướng dẫn sử dụng</Link></div>
  </section><SiteFooter /></main>;
}

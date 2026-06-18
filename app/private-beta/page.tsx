import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

const focus = ["Công cụ có dễ dùng không?", "Output có đúng nhu cầu giáo viên không?", "File Word có đủ dùng không?", "Giao diện có rối không?", "Có lỗi nào khi thao tác không?"];

export default function PrivateBetaPage() {
  return <main><Navbar /><section className="mx-auto max-w-5xl px-4 py-12 md:py-16">
    <p className="text-sm font-bold uppercase text-brand">Thử nghiệm riêng · v0.5 RC</p><h1 className="mt-2 text-4xl font-bold text-ink">Classora Private Beta</h1>
    <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">Classora đang ở giai đoạn thử nghiệm riêng với một nhóm nhỏ giáo viên. Mục tiêu hiện tại là kiểm tra giao diện, quy trình tạo tài liệu, lưu lịch sử và xuất Word.</p>
    <div className="mt-8 grid gap-6 md:grid-cols-2"><section className="card p-5"><h2 className="text-xl font-bold text-ink">Bản hiện tại có gì?</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-muted"><li>• Chưa sử dụng AI thật; nội dung được tạo bằng AI mô phỏng.</li><li>• Không có đăng nhập, database hoặc thanh toán.</li><li>• Dữ liệu chỉ lưu trên trình duyệt hiện tại.</li><li>• Tester nên tập trung đánh giá workflow và file Word.</li></ul></section><section className="card p-5"><h2 className="text-xl font-bold text-ink">Mong thầy cô góp ý</h2><ul className="mt-4 space-y-3">{focus.map((item) => <li key={item} className="flex gap-2 text-sm text-muted"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand" />{item}</li>)}</ul></section></div>
    <div className="mt-8 flex flex-wrap gap-3"><Link href="/dashboard" className="btn-primary">Mở dashboard</Link><Link href="/tools" className="btn-secondary">Xem tất cả công cụ</Link><Link href="/feedback" className="btn-secondary">Gửi góp ý</Link><Link href="/release-candidate" className="btn-secondary">Checklist release</Link><Link href="/known-issues" className="btn-secondary">Giới hạn hiện tại</Link><Link href="/share" className="btn-secondary">Chia sẻ bản demo</Link><Link href="/tester-guide" className="btn-secondary">Hướng dẫn tester</Link></div>
  </section><SiteFooter /></main>;
}

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

const issues = [
  "Nội dung được tạo tự động và cần giáo viên rà soát chuyên môn trước khi sử dụng.",
  "Dữ liệu lưu trên trình duyệt bằng localStorage và chưa đồng bộ giữa thiết bị.",
  "Chưa có tài khoản đăng nhập; dữ liệu cá nhân hiện lưu trên từng trình duyệt.",
  "Chưa có OCR, đọc PDF hoặc nhận dạng hình ảnh.",
  "Export Word ưu tiên khả năng đọc và chỉnh sửa, chưa đảm bảo giống 100% mẫu Word phức tạp.",
  "Trộn mã đề cần giáo viên kiểm tra lại thứ tự câu và đáp án.",
  "Nội dung đầu ra chỉ để tham khảo; giáo viên cần duyệt trước khi sử dụng.",
];

export default function KnownIssuesPage() {
  return <main className="min-h-screen"><Navbar /><section className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
    <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 sm:p-9">
      <div className="flex items-center gap-3"><AlertCircle className="text-coral" /><p className="text-sm font-bold uppercase tracking-wide text-coral">Trạng thái hệ thống</p></div>
      <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">Giới hạn hiện tại</h1>
      <p className="mt-4 max-w-3xl leading-7 text-muted">Thông tin minh bạch về phạm vi hỗ trợ hiện tại của Soạn Lab để giáo viên sử dụng phù hợp và an toàn.</p>
    </div>
    <section className="card mt-8 p-5 shadow-lg sm:p-7"><ul className="space-y-4">{issues.map((issue) => <li key={issue} className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-muted"><CheckMark />{issue}</li>)}</ul></section>
    <div className="mt-7 flex flex-wrap gap-3"><Link href="/changelog" className="btn-secondary">Nhật ký phát triển</Link><Link href="/dashboard" className="btn-primary">Mở dashboard</Link></div>
  </section><SiteFooter /></main>;
}

function CheckMark() {
  return <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-coral" />;
}

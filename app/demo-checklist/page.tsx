import Link from "next/link";
import { CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";

const sections = [
  { title: "Kiểm tra tổng quan", items: [["Mở trang chủ", "/"], ["Mở dashboard", "/dashboard"], ["Mở tất cả công cụ", "/tools"], ["Kiểm tra trên điện thoại", "/tester-guide"]] },
  { title: "Kiểm tra công cụ chính", items: [["Tạo đề kiểm tra", "/tools/exam-generator"], ["Tạo ma trận đề", "/tools/matrix-generator"], ["Trộn mã đề", "/tools/exam-shuffler"], ["Tạo phiếu học tập", "/tools/worksheet-generator"], ["Tạo nhận xét học sinh", "/tools/student-comments"], ["Nhận xét hàng loạt CSV", "/tools/bulk-student-comments"], ["Ngân hàng câu hỏi", "/question-bank"], ["Nhập câu hỏi từ văn bản/CSV", "/tools/import-questions"]] },
  { title: "Kiểm tra tài liệu", items: [["Lưu và mở lại tài liệu", "/history"], ["Xóa tài liệu", "/history"], ["Xuất Word", "/tools/exam-generator"], ["Kiểm tra header từ cài đặt", "/settings"]] },
  { title: "Kiểm tra dữ liệu demo", items: [["Nạp dữ liệu demo", "/demo-data"], ["Xóa dữ liệu demo", "/demo-data"], ["Kiểm tra diagnostics", "/diagnostics"]] }
];

export default function DemoChecklistPage() {
  return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-4 sm:p-5 md:p-8"><PageHeader title="Checklist demo Soạn Lab" description="Danh sách kiểm tra trước khi gửi bản private beta cho giáo viên." /><div className="max-w-4xl space-y-6">{sections.map((section) => <section key={section.title}><h2 className="mb-3 text-xl font-bold text-ink">{section.title}</h2><div className="card divide-y divide-line">{section.items.map(([label, href]) => <div key={label} className="flex items-center gap-3 p-4"><CheckSquare size={19} className="shrink-0 text-slate-400" /><Link href={href} className="font-semibold text-ink hover:text-brand">{label}</Link></div>)}</div></section>)}</div><div className="mt-6 flex flex-wrap gap-3"><Link href="/tester-guide" className="btn-secondary">Xem hướng dẫn tester</Link><Link href="/feedback" className="btn-primary">Gửi góp ý</Link></div><p className="mt-5 max-w-3xl text-sm leading-6 text-muted">Nội dung hiện được tạo bằng AI mô phỏng trong bản demo. Giáo viên cần kiểm tra lại trước khi sử dụng.</p></main></div>;
}

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";

const steps = [
  ["01", "Chọn công cụ", "Mở thư mục công cụ và chọn workflow phù hợp với công việc đang làm."],
  ["02", "Nhập thông tin", "Điền môn học, lớp, chủ đề và yêu cầu tài liệu hoặc đề kiểm tra."],
  ["03", "Xem kết quả", "Kiểm tra bản nháp do AI mô phỏng tạo và chỉnh lại nội dung cần thiết."],
  ["04", "Dùng tài liệu", "Sao chép, lưu vào lịch sử hoặc xuất file Word để hoàn thiện."],
  ["05", "Góp ý", "Chia sẻ trải nghiệm để Classora cải thiện theo nhu cầu thực tế."]
];
const tools = [
  ["Tạo đề kiểm tra", "/tools/exam-generator"], ["Tạo phiếu học tập", "/tools/worksheet-generator"],
  ["Tạo nhận xét học sinh", "/tools/student-comments"], ["Nhận xét hàng loạt", "/tools/bulk-student-comments"],
  ["Ngân hàng câu hỏi", "/question-bank"]
];

export default function GettingStartedPage() {
  return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-5 md:p-8">
    <PageHeader title="Bắt đầu với Classora" description="Năm bước ngắn để tạo tài liệu đầu tiên trong bản demo." />
    <div className="grid gap-4 lg:grid-cols-5">{steps.map(([number, title, text]) => <article key={number} className="card p-5"><span className="text-sm font-bold text-brand">{number}</span><h2 className="mt-3 font-bold text-ink">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{text}</p></article>)}</div>
    <section className="mt-8"><h2 className="text-xl font-bold text-ink">Công cụ nên thử đầu tiên</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{tools.map(([title, href]) => <Link key={href} href={href} className="card flex items-center justify-between p-4 font-semibold text-ink hover:border-brand hover:text-brand"><span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-mint" />{title}</span><ArrowRight size={16} /></Link>)}</div></section>
    <Link href="/tools" className="btn-primary mt-8">Mở tất cả công cụ<ArrowRight size={16} /></Link>
  </main></div>;
}

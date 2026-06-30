import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { AppShell } from "@/components/AppShell";

const flow = [
  "Mở mẫu sử dụng và chọn một mẫu phù hợp.",
  "Tạo thử một đề kiểm tra hoặc phiếu học tập.",
  "Xuất Word và mở file để kiểm tra.",
  "Thử in hoặc lưu PDF.",
  "Lưu tài liệu vào lịch sử.",
  "Mở lại tài liệu trong Lịch sử.",
  "Rà soát nội dung trước khi sử dụng.",
];

export default function TesterGuidePage() {
  return <AppShell title="Hướng dẫn sử dụng"><PageHeader title="Hướng dẫn sử dụng Soạn Lab" description="Một quy trình ngắn để thầy cô làm quen với công cụ và kiểm tra chất lượng tài liệu đầu ra." /><section className="play-card max-w-4xl p-5 sm:p-7"><div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 text-sm leading-6 text-blue-900"><strong>Lưu ý chất lượng:</strong> nội dung là bản nháp hỗ trợ soạn tài liệu và cần giáo viên rà soát trước khi sử dụng.</div><h2 className="mt-7 text-xl font-extrabold text-ink">Quy trình gợi ý</h2><ol className="mt-4 space-y-2">{flow.map((item, index) => <li key={item} className="flex gap-3 rounded-2xl bg-slate-50/70 p-3 text-sm leading-6 text-slate-600"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm">{index + 1}</span>{item}</li>)}</ol><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Link href="/dashboard" className="btn-primary">Bắt đầu sử dụng</Link><Link href="/samples" className="btn-secondary">Mẫu sử dụng</Link><Link href="/known-issues" className="btn-secondary">Trạng thái hệ thống</Link></div></section></AppShell>;
}

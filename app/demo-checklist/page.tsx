import Link from "next/link";
import { CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";

const checks = [
  ["Mở dashboard", "/dashboard"],
  ["Tạo thử một đề kiểm tra", "/tools/exam-generator"],
  ["Xuất Word", "/tools/exam-generator"],
  ["Tạo phiếu học tập", "/tools/worksheet-generator"],
  ["Tạo nhận xét học sinh", "/tools/student-comments"],
  ["Thử nhận xét hàng loạt CSV", "/tools/bulk-student-comments"],
  ["Tạo ma trận đề", "/tools/matrix-generator"],
  ["Kiểm tra lịch sử", "/history"],
  ["Gửi góp ý", "/feedback"]
];

export default function DemoChecklistPage() {
  return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-4 sm:p-5 md:p-8"><PageHeader title="Checklist demo Classora" description="Các bước nên kiểm tra trước khi gửi bản demo cho giáo viên." /><section className="card max-w-3xl divide-y divide-line">{checks.map(([label, href], index) => <div key={label} className="flex items-center gap-3 p-4 sm:p-5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-sm font-bold text-brand">{index + 1}</span><CheckSquare size={19} className="text-slate-400" /><Link href={href} className="font-semibold text-ink hover:text-brand">{label}</Link></div>)}</section><p className="mt-5 max-w-3xl text-sm leading-6 text-muted">Mọi nội dung trong bản demo hiện do AI mô phỏng tạo ra. Hãy kiểm tra file Word và nội dung trước khi chia sẻ.</p></main></div>;
}

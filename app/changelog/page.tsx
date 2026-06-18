import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";

const entries = [
  ["v0.4", ["Pricing mock", "Onboarding", "Dashboard mới", "Free/Pro demo"]],
  ["v0.3", ["Ngân hàng câu hỏi", "Nhập câu hỏi từ văn bản/CSV", "Cài đặt tài liệu", "Cải thiện xuất Word"]],
  ["v0.2", ["Thêm nhiều công cụ giáo viên", "Trộn mã đề", "LaTeX preview", "Mẫu cá nhân"]],
  ["v0.1", ["MVP ban đầu", "Tạo đề kiểm tra", "Phiếu học tập", "Nhận xét học sinh", "Export Word"]]
];
export default function ChangelogPage() {
  return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-5 md:p-8"><PageHeader title="Nhật ký phát triển Classora" description="Các cột mốc chính của bản MVP được phát triển theo từng batch." /><div className="max-w-3xl space-y-4">{entries.map(([version, items]) => <section key={version as string} className="card p-5"><h2 className="text-xl font-bold text-brand">{version}</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2">{(items as string[]).map((item) => <li key={item} className="flex gap-2 text-sm text-muted"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-mint" />{item}</li>)}</ul></section>)}</div></main></div>;
}

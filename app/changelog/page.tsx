import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";

const entries = [
  ["Hiện tại", ["Trung tâm tạo tài liệu", "Xuất Word/PDF cho đề THPTQG", "Bảng đáp án giáo viên", "Tài liệu ngoài đề thi", "Điều hướng sản phẩm chính thức"]],
  ["Cải thiện tài liệu", ["Cấu trúc PHẦN I/II/III", "Ma trận và bản đặc tả", "Lưu lịch sử và xuất lại", "Mẫu cá nhân"]],
  ["Nền tảng dữ liệu cục bộ", ["Bản nháp biểu mẫu", "Sao l?u/kh?i ph?c d? li?u", "Ngân hàng câu hỏi", "Cài đặt header tài liệu"]],
  ["Công cụ cốt lõi", ["Tạo đề kiểm tra", "Phiếu học tập", "Giáo án", "Ngân hàng câu hỏi", "Xuất Word"]],
];

export default function ChangelogPage() {
  return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-5 md:p-8"><PageHeader title="Nhật ký phát triển Soạn Lab" description="Các cột mốc chính của sản phẩm và những phần giáo viên có thể sử dụng." /><div className="max-w-3xl space-y-4">{entries.map(([version, items]) => <section key={version as string} className="card p-5"><h2 className="text-xl font-bold text-brand">{version}</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2">{(items as string[]).map((item) => <li key={item} className="flex gap-2 text-sm text-muted"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-mint" />{item}</li>)}</ul></section>)}</div></main></div>;
}

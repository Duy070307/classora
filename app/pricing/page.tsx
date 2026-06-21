import { AppShell } from "@/components/AppShell";
import { PlanSelector } from "@/components/PlanSelector";
import { PricingCard } from "@/components/PricingCard";

export default function PricingPage() {
  return <AppShell title="Gói sử dụng">
    <section className="mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200 sm:p-9"><span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">Gói sử dụng</span><h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">Lựa chọn phù hợp với nhu cầu</h1><p className="mt-3 max-w-2xl leading-7 text-blue-100">Soạn Lab hiện cung cấp các công cụ cốt lõi để giáo viên tạo tài liệu và xuất Word/PDF.</p></section>
    <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
      <PricingCard name="Miễn phí hiện tại" price="0đ" features={["10 lượt tạo/tháng", "Các công cụ soạn tài liệu", "Lưu lịch sử trên trình duyệt", "Xuất Word/PDF", "Mẫu tài liệu cá nhân"]} />
      <PricingCard recommended name="Pro cá nhân" price="Dự kiến 49.000đ - 79.000đ/tháng" features={["Nhiều lượt tạo hơn", "Xuất Word tốt hơn", "Mẫu cá nhân", "Nhận xét hàng loạt", "Ngân hàng câu hỏi", "Ưu tiên tính năng mới"]} />
      <PricingCard name="Gói học kỳ" price="Dự kiến 199.000đ - 299.000đ/học kỳ" features={["Phù hợp mùa kiểm tra/cuối kỳ", "Tạo đề và ma trận", "Nhận xét học sinh", "Tài liệu ôn tập", "Lưu lịch sử nhiều hơn"]} />
      <PricingCard name="Tổ chuyên môn / Trường học" price="Liên hệ sau" features={["Nhiều tài khoản", "Mẫu chung", "Ngân hàng câu hỏi chung", "Quản lý theo tổ/trường", "Hỗ trợ triển khai"]} />
    </div>
    <section className="section-card mt-7 max-w-2xl"><PlanSelector /></section>
    <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium leading-6 text-amber-800">Các gói trả phí sẽ được mở sau khi hoàn thiện hệ thống tài khoản và thanh toán. Hiện tại không có giao dịch hoặc yêu cầu thanh toán.</p>
  </AppShell>;
}

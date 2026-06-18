import { PageHeader } from "@/components/PageHeader";
import { PlanSelector } from "@/components/PlanSelector";
import { PricingCard } from "@/components/PricingCard";
import { Sidebar } from "@/components/Sidebar";

export default function PricingPage() {
  return (
    <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-5 md:p-8">
      <PageHeader title="Bảng giá dự kiến" description="Các mức giá dưới đây chỉ dùng để kiểm thử mô hình sản phẩm. Classora hiện chưa thu phí." />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <PricingCard name="Free" price="0đ" features={["10 lượt tạo/tháng", "Dùng các công cụ demo", "Lưu lịch sử trên trình duyệt", "Xuất Word cơ bản", "Thông báo trạng thái demo"]} />
        <PricingCard name="Pro cá nhân" price="Dự kiến 49.000đ - 79.000đ/tháng" features={["Nhiều lượt tạo hơn", "Xuất Word tốt hơn", "Mẫu cá nhân", "Nhận xét hàng loạt", "Ngân hàng câu hỏi", "Ưu tiên tính năng mới"]} />
        <PricingCard name="Gói học kỳ" price="Dự kiến 199.000đ - 299.000đ/học kỳ" features={["Phù hợp mùa kiểm tra/cuối kỳ", "Tạo đề và ma trận", "Nhận xét học sinh", "Tài liệu ôn tập", "Lưu lịch sử nhiều hơn"]} />
        <PricingCard name="Tổ chuyên môn / Trường học" price="Liên hệ sau" features={["Nhiều tài khoản", "Mẫu chung", "Ngân hàng câu hỏi chung", "Quản lý theo tổ/trường", "Hỗ trợ triển khai"]} />
      </div>
      <section className="card mt-6 max-w-2xl p-5"><PlanSelector /></section>
      <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Bảng giá chỉ là dự kiến để kiểm thử mô hình sản phẩm. Classora hiện chưa thu phí.</p>
    </main></div>
  );
}

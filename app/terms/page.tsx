import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

export default function TermsPage() {
  return <main><Navbar /><section className="mx-auto max-w-3xl px-4 py-12 md:py-16"><h1 className="text-4xl font-bold text-ink">Điều khoản sử dụng</h1><div className="mt-6 space-y-4 leading-7 text-slate-700"><p>Soạn Lab là bộ công cụ hỗ trợ giáo viên tạo bản nháp tài liệu và tổ chức quy trình soạn thảo.</p><p>Nội dung tạo ra chỉ mang tính hỗ trợ. Giáo viên cần kiểm tra lại trước khi dùng trong giảng dạy, đánh giá hoặc kiểm tra học sinh.</p><p>Soạn Lab không đảm bảo độ chính xác tuyệt đối của nội dung được tạo tự động.</p><p>Không sử dụng Soạn Lab để xử lý dữ liệu nhạy cảm hoặc thông tin không cần thiết của học sinh, phụ huynh và giáo viên.</p><p>Các gói trả phí và giao dịch thanh toán hiện chưa được kích hoạt.</p></div></section><SiteFooter /></main>;
}

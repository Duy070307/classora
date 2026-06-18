import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

export default function TermsPage() {
  return <main><Navbar /><section className="mx-auto max-w-3xl px-4 py-12 md:py-16"><h1 className="text-4xl font-bold text-ink">Điều khoản sử dụng bản demo</h1><div className="mt-6 space-y-4 leading-7 text-slate-700"><p>Soạn Lab hiện là bản MVP/demo dùng để thử nghiệm giao diện và quy trình với giáo viên.</p><p>Nội dung tạo ra chỉ mang tính tham khảo. Giáo viên cần kiểm tra lại trước khi dùng trong giảng dạy, đánh giá hoặc kiểm tra học sinh.</p><p>Soạn Lab không đảm bảo độ chính xác tuyệt đối của nội dung trong bản demo và chưa sử dụng AI thật.</p><p>Không sử dụng bản demo để xử lý dữ liệu nhạy cảm hoặc thông tin không cần thiết của học sinh, phụ huynh và giáo viên.</p><p>Bản demo hiện chưa thu phí và không thực hiện giao dịch thanh toán.</p></div></section><SiteFooter /></main>;
}

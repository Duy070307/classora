import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";


export const metadata: Metadata = {
  title: { absolute: "Điều khoản sử dụng - Soạn Lab" },
  description: "Điều khoản sử dụng Soạn Lab dành cho giáo viên khi tạo bản nháp tài liệu, rà soát nội dung và xuất Word/PDF.",
};
export default function TermsPage() {
  return <main><Navbar /><section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
    <h1 className="text-4xl font-bold text-ink">Điều khoản sử dụng</h1>
    <div className="mt-6 space-y-4 leading-7 text-slate-700">
      <p>Soạn Lab là bộ công cụ hỗ trợ giáo viên tạo bản nháp tài liệu và tổ chức quy trình soạn thảo.</p>
      <p>Nội dung được tạo tự động có thể chứa sai sót, thiếu ngữ cảnh hoặc chưa phù hợp với yêu cầu cụ thể của từng lớp học.</p>
      <p>Giáo viên chịu trách nhiệm rà soát chuyên môn, đáp án, thang điểm, dữ kiện học sinh và định dạng tài liệu trước khi sử dụng chính thức.</p>
      <p>Các tài liệu xuất Word/PDF cần được kiểm tra lại trước khi dùng trong giảng dạy, đánh giá hoặc gửi cho học sinh/phụ huynh.</p>
      <p>Soạn Lab không bảo đảm độ chính xác tuyệt đối của nội dung được tạo ra và không thay thế vai trò chuyên môn của giáo viên.</p>
      <p>Không sử dụng Soạn Lab để tạo nội dung vi phạm pháp luật, xâm phạm quyền riêng tư hoặc xử lý dữ liệu nhạy cảm không cần thiết.</p>
      <p>Sản phẩm có thể thay đổi theo thời gian, bao gồm giao diện, tính năng, giới hạn sử dụng và chính sách dữ liệu.</p>
      <p>Các gói trả phí và giao dịch thanh toán hiện chưa được kích hoạt.</p>
    </div>
  </section><SiteFooter /></main>;
}

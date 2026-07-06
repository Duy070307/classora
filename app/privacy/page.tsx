import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: { absolute: "Bảo mật - Soạn Lab" },
  description: "Ghi chú bảo mật và quyền riêng tư của Soạn Lab khi giáo viên tạo, lưu và xuất tài liệu.",
};

export default function PrivacyPage() {
  return (
    <main className="warm-page">
      <Navbar />
      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <span className="soft-badge">Quyền riêng tư</span>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Bảo mật và dữ liệu cá nhân</h1>
        <div className="mt-6 space-y-4 rounded-[28px] border border-blue-100 bg-white p-6 leading-7 text-slate-700 shadow-sm">
          <p>Soạn Lab lưu những dữ liệu cần thiết để phục vụ quá trình tạo tài liệu, lưu lịch sử, mẫu cá nhân, ngân hàng câu hỏi và cài đặt xuất file.</p>
          <p>Các file Word/PDF hoặc file sao lưu do thầy/cô xuất ra sẽ nằm trên thiết bị của người dùng. Soạn Lab không tự gửi các file đó cho bên thứ ba.</p>
          <p>Thầy/cô có thể xuất bản sao lưu hoặc xóa từng nhóm dữ liệu tại <Link href="/data" className="font-bold text-blue-700">Quản lý dữ liệu</Link>.</p>
          <p>Nếu đổi thiết bị hoặc xóa dữ liệu trình duyệt khi chưa có bản sao lưu, một số dữ liệu cá nhân có thể không còn truy cập được.</p>
          <p>Không nên nhập dữ liệu học sinh quá nhạy cảm, thông tin sức khỏe, tài chính, mật khẩu hoặc thông tin riêng tư không cần thiết.</p>
          <p>Nội dung do Soạn Lab tạo là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra, chỉnh sửa trước khi sử dụng chính thức.</p>
          <p>Soạn Lab không bán dữ liệu cá nhân của người dùng.</p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

export default function PrivacyPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <h1 className="text-4xl font-bold text-ink">Bảo mật và quyền riêng tư</h1>
        <div className="mt-6 space-y-4 leading-7 text-slate-700">
          <p>Soạn Lab hiện chưa có hệ thống tài khoản và chưa đồng bộ dữ liệu lên database máy chủ.</p>
          <p>Lịch sử tài liệu, mẫu cá nhân, ngân hàng câu hỏi, cài đặt, số lượt sử dụng và bản nháp biểu mẫu được lưu trong trình duyệt hiện tại bằng localStorage.</p>
          <p>Các file Word/PDF hoặc file backup do thầy/cô xuất ra sẽ nằm trên thiết bị của người dùng. Soạn Lab không tự gửi các file đó tới máy chủ.</p>
          <p>Thầy/cô có thể xuất dữ liệu cục bộ thành file JSON hoặc xóa từng nhóm dữ liệu tại <Link href="/data" className="font-semibold text-brand">Quản lý dữ liệu</Link>.</p>
          <p>Nếu xóa dữ liệu trình duyệt, đổi trình duyệt hoặc đổi thiết bị khi chưa có bản sao lưu, dữ liệu cục bộ có thể mất.</p>
          <p>Không nên nhập dữ liệu học sinh quá nhạy cảm, thông tin sức khỏe, tài chính, mật khẩu hoặc thông tin riêng tư không cần thiết nếu thầy/cô chưa hiểu rõ các giới hạn hiện tại.</p>
          <p>Soạn Lab không bán dữ liệu cá nhân của người dùng.</p>
          <p>Khi Soạn Lab bổ sung tài khoản, đồng bộ dữ liệu hoặc thanh toán trong tương lai, chính sách dữ liệu sẽ cần được cập nhật trước khi triển khai.</p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

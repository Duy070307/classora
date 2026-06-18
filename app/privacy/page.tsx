import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import Link from "next/link";

export default function PrivacyPage() {
  return <main><Navbar /><section className="mx-auto max-w-3xl px-4 py-12 md:py-16"><h1 className="text-4xl font-bold text-ink">Quyền riêng tư và dữ liệu</h1><div className="mt-6 space-y-4 leading-7 text-slate-700"><p>Classora hiện không có đăng nhập và chưa có database phía máy chủ để lưu tài liệu của người dùng.</p><p>Lịch sử tài liệu, mẫu cá nhân, ngân hàng câu hỏi, cài đặt và số lượt demo chỉ được lưu trong trình duyệt bằng localStorage.</p><p>Bạn có thể xuất dữ liệu cục bộ thành file JSON hoặc xóa từng nhóm dữ liệu tại <Link href="/data" className="font-semibold text-brand">Quản lý dữ liệu</Link>.</p><p>Nếu xóa dữ liệu trình duyệt, đổi trình duyệt hoặc đổi thiết bị mà chưa có bản sao lưu, dữ liệu này có thể mất.</p><p>Không nên nhập thông tin quá nhạy cảm, dữ liệu sức khỏe, tài chính, mật khẩu hoặc thông tin riêng tư không cần thiết trong bản demo.</p><p>Khi Classora bổ sung AI thật, tài khoản hoặc database trong tương lai, chính sách dữ liệu sẽ được cập nhật trước khi triển khai.</p></div></section><SiteFooter /></main>;
}

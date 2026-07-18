import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

const links = [
  ["Tính năng", "/#tinh-nang"],
  ["TikZ", "/#tikz"],
  ["Dùng thử", "/dang-ky-dung-thu"],
  ["Đăng nhập", "/login"],
  ["Điều khoản", "/terms"],
  ["Quyền riêng tư", "/privacy"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-9 text-sm text-slate-500 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,520px)] md:items-start">
        <div>
          <BrandLogo variant="full" />
          <p className="mt-3 max-w-md leading-6">Bộ công cụ hỗ trợ giáo viên Việt Nam tạo, rà soát, chỉnh sửa và xuất tài liệu.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 md:justify-end" aria-label="Liên kết cuối trang">
          {links.map(([label, href]) => <Link key={href} href={href} className="min-h-8 font-medium text-slate-600 hover:text-blue-700">{label}</Link>)}
        </nav>
      </div>
      <div className="mx-auto mt-7 flex max-w-7xl flex-col gap-2 border-t border-slate-100 pt-5 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} SOẠN LAB · Tạo ra bởi Trần Đức Duy</p>
        <p>Bản nháp cần giáo viên rà soát trước khi sử dụng.</p>
      </div>
    </footer>
  );
}

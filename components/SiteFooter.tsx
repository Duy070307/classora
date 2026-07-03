import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

const columns = [
  [
    "Sản phẩm",
    ["Dashboard", "/dashboard"],
    ["Công cụ", "/tools"],
    ["Mẫu sử dụng", "/samples"],
    ["Hướng dẫn", "/getting-started"],
  ],
  [
    "Tài liệu",
    ["Bảng giá", "/pricing"],
    ["Bảo mật", "/privacy"],
    ["Điều khoản", "/terms"],
    ["Trạng thái hệ thống", "/system-status"],
  ],
  [
    "Công cụ nổi bật",
    ["Tạo đề kiểm tra", "/tools/exam-generator"],
    ["Phiếu học tập", "/tools/worksheet-generator"],
    ["Giáo án", "/tools/lesson-plan-generator"],
    ["Nhận xét học sinh", "/tools/student-comments"],
  ],
];

export function SiteFooter() {
  return (
    <footer className="border-t border-blue-100 bg-white px-4 py-12 text-sm text-slate-500">
      <div className="mx-auto grid max-w-7xl gap-9 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <BrandLogo variant="full" />
          <p className="mt-4 max-w-xs leading-6">
            Hỗ trợ giáo viên tạo bản nháp tài liệu, rà soát và xuất Word/PDF trong một quy trình gọn gàng.
          </p>
          <span className="mt-4 inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            Dành cho giáo viên Việt Nam
          </span>
        </div>
        {columns.map(([title, ...links]) => (
          <div key={title as string}>
            <h3 className="font-extrabold text-slate-900">{title as string}</h3>
            <div className="mt-4 space-y-3">
              {(links as string[][]).map(([label, href]) => (
                <Link key={href} href={href} className="block hover:text-blue-700">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-2 border-t border-slate-100 pt-6 text-xs sm:flex-row sm:justify-between">
        <p>© 2026 Soạn Lab · Tạo bởi Trần Đức Duy</p>
        <p className="font-bold">Bản nháp cần giáo viên rà soát trước khi sử dụng</p>
      </div>
    </footer>
  );
}

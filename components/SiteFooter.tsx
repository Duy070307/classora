import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

const columns = [
  [
    "Liên kết",
    ["Công cụ", "/tools"],
    ["Hướng dẫn", "/getting-started"],
    ["Bảng giá", "/pricing"],
    ["Điều khoản", "/terms"],
    ["Quyền riêng tư", "/privacy"],
  ],
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-10 text-sm text-slate-500">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <BrandLogo variant="full" />
          <p className="mt-4 max-w-md leading-6">
            Hỗ trợ giáo viên tạo bản nháp tài liệu, rà soát và xuất Word/PDF trong một quy trình rõ ràng.
          </p>
        </div>
        {columns.map(([title, ...links]) => (
          <div key={title as string}>
            <h3 className="font-extrabold text-slate-900">{title as string}</h3>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 md:max-w-sm">
              {(links as string[][]).map(([label, href]) => (
                <Link key={href} href={href} className="hover:text-blue-700">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-2 border-t border-slate-100 pt-6 text-xs sm:flex-row sm:justify-between">
        <p>© 2026 Soạn Lab · Tạo bởi Trần Đức Duy</p>
        <p className="font-bold">Bản nháp cần giáo viên rà soát trước khi sử dụng</p>
      </div>
    </footer>
  );
}

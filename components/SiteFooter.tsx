import Link from "next/link";
import { BrandLockup } from "@/components/BrandLockup";

const productLinks = [
  ["Tính năng", "/#tinh-nang"],
  ["TikZ", "/#tikz"],
  ["Dùng thử", "/dang-ky-dung-thu"],
  ["Đăng nhập", "/login"],
] as const;

const policyLinks = [
  ["Điều khoản", "/terms"],
  ["Quyền riêng tư", "/privacy"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-4 py-9 text-sm text-slate-400 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div>
          <BrandLockup variant="inverse" href="/" />
          <p className="mt-3 max-w-md leading-6">Bộ công cụ hỗ trợ giáo viên Việt Nam tạo, rà soát, chỉnh sửa và xuất tài liệu.</p>
        </div>
        <nav className="grid grid-cols-2 gap-x-8 sm:gap-x-12" aria-label="Liên kết cuối trang">
          <FooterLinkGroup title="Sản phẩm" links={productLinks} />
          <FooterLinkGroup title="Thông tin" links={policyLinks} />
        </nav>
      </div>
      <div className="mx-auto mt-7 flex max-w-7xl flex-col gap-2 border-t border-slate-800 pt-5 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} SOẠN LAB · Tạo ra bởi Trần Đức Duy</p>
        <p>Bản nháp cần giáo viên rà soát trước khi sử dụng.</p>
      </div>
    </footer>
  );
}

function FooterLinkGroup({ title, links }: { title: string; links: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <div className="mt-2 grid">
        {links.map(([label, href]) => <Link key={href} href={href} className="-mx-2.5 inline-flex min-h-11 items-center px-2.5 font-medium text-slate-300 transition duration-200 hover:text-white hover:underline hover:underline-offset-4">{label}</Link>)}
      </div>
    </div>
  );
}

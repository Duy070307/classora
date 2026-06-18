import Link from "next/link";

const links = [
  ["Dashboard", "/dashboard"], ["Tất cả công cụ", "/tools"], ["Quản lý dữ liệu", "/data"], ["Góp ý", "/feedback"],
  ["Private Beta", "/private-beta"], ["Quyền riêng tư", "/privacy"], ["Điều khoản", "/terms"],
  ["Nhật ký phát triển", "/changelog"]
];

export function SiteFooter() {
  return <footer className="border-t border-line bg-white px-4 py-8 text-center text-sm text-muted">
    <nav className="flex flex-wrap justify-center gap-x-5 gap-y-3">{links.map(([label, href]) => <Link key={href} href={href} className="hover:text-brand">{label}</Link>)}</nav>
    <p className="mx-auto mt-5 max-w-3xl leading-6">Classora được tạo ra bởi Trần Đức Duy, sinh viên của TUM và HCMUT, nhằm hỗ trợ giáo viên Việt Nam tiết kiệm thời gian trong các công việc lặp lại.</p>
  </footer>;
}

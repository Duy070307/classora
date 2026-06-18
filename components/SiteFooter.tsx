import Link from "next/link";

const links = [["Dashboard", "/dashboard"], ["Công cụ", "/tools"], ["Bảng giá", "/pricing"], ["Private Beta", "/private-beta"], ["Góp ý", "/feedback"], ["Quyền riêng tư", "/privacy"], ["Điều khoản", "/terms"], ["Giới hạn", "/known-issues"]];

export function SiteFooter() {
  return <footer className="border-t border-slate-200 bg-gradient-to-b from-white to-slate-50 px-4 py-10 text-center text-sm text-muted">
    <p className="text-xl font-extrabold text-ink">Soạn Lab</p><p className="mt-2 font-medium">Soạn đề, tạo tài liệu, xuất Word trong vài phút.</p>
    <nav className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-3">{links.map(([label, href]) => <Link key={href} href={href} className="hover:text-brand">{label}</Link>)}</nav>
    <p className="mx-auto mt-6 max-w-3xl leading-7">Soạn Lab hiện là bản MVP/demo dùng AI mô phỏng.</p>
    <p className="mt-3 text-xs font-semibold text-slate-400">v0.5 RC</p>
  </footer>;
}

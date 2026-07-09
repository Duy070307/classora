"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  BookOpenCheck,
  Box,
  ClipboardList,
  Database,
  FileClock,
  FileText,
  History,
  Home,
  MessageCircle,
  PlusCircle,
  Settings,
  Shield,
  Sigma,
  Wrench,
  X,
} from "lucide-react";
import { AccountPanel } from "@/components/AccountPanel";
import { BrandLogo } from "@/components/BrandLogo";
import { FeedbackWidget } from "@/components/FeedbackWidget";

const groups = [
  {
    title: "Tổng quan",
    links: [
      ["Dashboard", "/dashboard", Home],
      ["Tạo mới", "/create", PlusCircle],
    ],
  },
  {
    title: "Công cụ",
    links: [
      ["Tất cả công cụ", "/tools", Wrench],
      ["Soạn đề", "/tools/exam-generator", ClipboardList],
      ["Phiếu học tập", "/tools/worksheet-generator", FileText],
      ["Nhận xét", "/tools/student-comments", MessageCircle],
      ["Ảnh → LaTeX", "/tools/image-to-latex", Sigma],
      ["Tạo mô phỏng 3D", "/tools/3d-animation", Box, "Beta"],
    ],
  },
  {
    title: "Tài liệu",
    links: [
      ["Lịch sử", "/history", History],
      ["Ngân hàng câu hỏi", "/question-bank", BookOpenCheck],
      ["Mẫu cá nhân", "/templates", FileClock],
    ],
  },
  {
    title: "Tài khoản",
    links: [
      ["Dữ liệu", "/data", Database],
      ["Cài đặt", "/settings", Settings],
      ["Quản trị", "/admin", Shield],
    ],
  },
];

export function Sidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  return (
    <Suspense fallback={null}>
      <Content mobileOpen={mobileOpen} onClose={onClose} />
    </Suspense>
  );
}

function Content({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const currentCategory = useSearchParams().get("category");
  const active = (href: string) => {
    const [path, query] = href.split("?");
    if (pathname !== path) return false;
    const category = query ? new URLSearchParams(query).get("category") : null;
    return category ? category === currentCategory : !currentCategory;
  };

  return (
    <>
      <button type="button" aria-label="Đóng menu" onClick={onClose} className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden ${mobileOpen ? "block" : "hidden"}`} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-blue-100/80 bg-white/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 md:sticky md:top-0 md:z-auto md:h-screen md:w-72 md:shrink-0 md:translate-x-0 md:shadow-[8px_0_30px_rgba(30,64,175,0.045)] ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center border-b border-blue-50 px-5 py-5">
          <Link href="/" className="min-w-0">
            <BrandLogo compact />
          </Link>
          <button type="button" className="ml-auto rounded-xl p-2 text-muted md:hidden" onClick={onClose} aria-label="Đóng menu">
            <X size={18} />
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
          {groups.map((group) => (
            <section key={group.title} className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{group.title}</p>
              <div className="space-y-1">
                {group.links.map(([label, href, Icon, badge]) => {
                  const I = Icon as typeof Home;
                  const selected = active(href as string);
                  return (
                    <Link key={href as string} href={href as string} onClick={onClose} aria-current={selected ? "page" : undefined} className={`group relative flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold transition ${selected ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-100" : "text-slate-600 hover:bg-blue-50/80 hover:text-blue-800"}`}>
                      <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${selected ? "bg-white/18 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-blue-600"}`}>
                        <I size={16} />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{label as string}</span>
                      {badge ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${selected ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"}`}>
                          {badge as string}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
        <div className="border-t border-blue-50 bg-gradient-to-br from-blue-50/70 to-white p-4">
          <AccountPanel />
        </div>
      </aside>
      <FeedbackWidget />
    </>
  );
}

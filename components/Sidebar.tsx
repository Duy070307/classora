"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  BookOpenCheck,
  Box,
  ClipboardCheck,
  ClipboardList,
  Code2,
  Database,
  FileClock,
  FileText,
  History,
  Home,
  MessageCircle,
  PenTool,
  Presentation,
  Settings,
  Shield,
  Sigma,
  UserPlus,
  Wrench,
  X,
} from "lucide-react";
import { AccountPanel } from "@/components/AccountPanel";
import { BrandLogo } from "@/components/BrandLogo";
import { FeedbackWidget } from "@/components/FeedbackWidget";

type NavItem = [label: string, href: string, icon: typeof Home, badge?: string, adminOnly?: boolean];

const groups: Array<{ title: string; links: NavItem[] }> = [
  {
    title: "Chính",
    links: [
      ["Trang tổng quan", "/dashboard", Home],
      ["Trung tâm công cụ", "/tools", Wrench],
      ["Lịch sử", "/history", History],
      ["Ngân hàng câu hỏi", "/question-bank", BookOpenCheck],
    ],
  },
  {
    title: "Soạn tài liệu",
    links: [
      ["Tạo đề kiểm tra", "/tools/exam-generator", ClipboardList],
      ["Ma trận & bảng đặc tả", "/tools/exam-blueprint", ClipboardList, "Mới"],
      ["Chấm bài", "/tools/grading-assistant", ClipboardCheck, "Mới"],
      ["Phiếu trả lời", "/tools/answer-sheet", ClipboardList, "Mới"],
      ["Kiểm tra đề", "/tools/exam-audit", ClipboardCheck, "Mới"],
      ["Phiếu học tập", "/tools/worksheet-generator", FileText],
      ["Đề cương ôn tập", "/tools/review-pack", BookOpenCheck, "Mới"],
      ["Giáo án", "/tools/lesson-plan", FileText],
      ["Tạo slide bài giảng", "/tools/lesson-slides", Presentation, "Mới"],
      ["Rubric", "/tools/rubric", PenTool],
    ],
  },
  {
    title: "Công thức & trực quan",
    links: [
      ["Ảnh công thức → LaTeX", "/tools/image-to-latex?mode=formula", Sigma, "Beta"],
      ["Hình học → TikZ", "/tools/image-to-latex?mode=geometry", Sigma, "Beta"],
      ["Ngân hàng TikZ", "/tikz-bank", Code2],
      ["Tạo mô phỏng 3D", "/tools/3d-animation", Box, "Beta"],
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      ["Hướng dẫn dùng thử", "/teacher-testing-guide", ClipboardCheck],
      ["Góp ý", "#feedback", MessageCircle],
      ["Mẫu cá nhân", "/templates", FileClock],
      ["Dữ liệu", "/data", Database],
      ["Cài đặt", "/settings", Settings],
    ],
  },
  {
    title: "Quản trị",
    links: [
      ["Quản trị", "/admin", Shield, undefined, true],
      ["Đăng ký dùng thử", "/admin/beta-requests", UserPlus, undefined, true],
      ["Góp ý giáo viên", "/admin/feedback", MessageCircle, undefined, true],
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
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const currentMode = searchParams.get("mode");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setIsAdmin(data?.user?.role === "admin");
      })
      .catch(() => {
        if (mounted) setIsAdmin(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const active = (href: string) => {
    if (href === "#feedback") return false;
    const [path, query] = href.split("?");
    if (pathname !== path) return false;
    const category = query ? new URLSearchParams(query).get("category") : null;
    const mode = query ? new URLSearchParams(query).get("mode") : null;
    if (category) return category === currentCategory;
    if (mode) return mode === currentMode;
    return true;
  };

  return (
    <>
      <button type="button" aria-label="Đóng menu" onClick={onClose} className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden ${mobileOpen ? "block" : "hidden"}`} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:w-64 md:shrink-0 md:translate-x-0 md:shadow-none xl:w-72 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} aria-label="Điều hướng chính">
        <div className="flex min-h-[70px] items-center border-b border-slate-200/70 px-4 py-3">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="group flex min-w-0 flex-1 rounded-xl px-1.5 py-1.5 transition hover:bg-emerald-50/60"
            aria-label="Về trang tổng quan Soạn Lab"
          >
            <BrandLogo size="md" showSubtitle className="pointer-events-none" />
          </Link>
          <button type="button" className="ui-icon-button ml-auto md:hidden" onClick={onClose} aria-label="Đóng menu">
            <X size={18} />
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pt-3">
          {groups.map((group) => {
            const links = group.links.filter(([, , , , adminOnly]) => !adminOnly || isAdmin);
            if (!links.length) return null;
            return (
              <section key={group.title} className="mb-3">
                <p className="mb-2 px-3 text-[11px] font-extrabold uppercase tracking-[0.11em] text-slate-400">{group.title}</p>
                <div className="space-y-1">
                  {links.map(([label, href, Icon, badge]) => {
                    const selected = active(href);
                    const baseClass = `group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition duration-200 ${selected ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"}`;
                    const content = (
                      <>
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${selected ? "bg-white/15 text-white" : "bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-emerald-700"}`}>
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                        {badge ? (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${selected ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-800"}`}>
                            {badge}
                          </span>
                        ) : null}
                      </>
                    );
                    if (href === "#feedback") {
                      return (
                        <button
                          key={href}
                          type="button"
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent("soanlab:open-feedback"));
                            onClose?.();
                          }}
                          className={`${baseClass} w-full text-left`}
                        >
                          {content}
                        </button>
                      );
                    }
                    return (
                      <Link key={href} href={href} onClick={onClose} aria-current={selected ? "page" : undefined} className={baseClass}>
                        {content}
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 bg-slate-50/80 p-4">
          <AccountPanel />
        </div>
      </aside>
      <FeedbackWidget />
    </>
  );
}

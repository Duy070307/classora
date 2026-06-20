"use client";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardList,
  FileText,
  Grid2X2,
  History,
  MessageSquareText,
  PenTool,
  Search,
  Settings,
  Sparkles,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getHistory } from "@/lib/history";
import { getQuestions } from "@/lib/question-bank";
import { getTemplates } from "@/lib/templates";
import { DashboardOnboarding } from "@/components/DashboardOnboarding";
import { SoanLabIcon, iconNameFromHref } from "@/components/ui/SoanLabIcon";
import { SoanLabIllustration } from "@/components/ui/SoanLabIllustration";
import { SoanLabBadge } from "@/components/ui/SoanLabBadge";

const tasks = [
  [
    "Tạo một đề kiểm tra",
    "Có đáp án và ma trận",
    "5 phút",
    "/tools/exam-generator",
    PenTool,
    "bg-blue-50 text-blue-700",
  ],
  [
    "Tạo phiếu học tập",
    "Bài tập theo chủ đề",
    "Demo",
    "/tools/worksheet-generator",
    BookOpenCheck,
    "bg-cyan-50 text-cyan-700",
  ],
  [
    "Viết nhận xét học sinh",
    "Ba phiên bản dễ chỉnh sửa",
    "5 phút",
    "/tools/student-comments",
    MessageSquareText,
    "bg-violet-50 text-violet-700",
  ],
  [
    "Xuất Word từ lịch sử",
    "Mở lại tài liệu đã lưu",
    "Word",
    "/history",
    History,
    "bg-emerald-50 text-emerald-700",
  ],
] as const;
const explore = [
  ["Tạo đề", "/tools/exam-generator", PenTool, "bg-blue-50 text-blue-700"],
  ["Ma trận", "/tools/matrix-generator", Grid2X2, "bg-cyan-50 text-cyan-700"],
  [
    "Phiếu học tập",
    "/tools/worksheet-generator",
    BookOpenCheck,
    "bg-indigo-50 text-indigo-700",
  ],
  [
    "Nhận xét",
    "/tools/student-comments",
    MessageSquareText,
    "bg-violet-50 text-violet-700",
  ],
  [
    "Giáo án",
    "/tools/lesson-plan-generator",
    FileText,
    "bg-emerald-50 text-emerald-700",
  ],
  ["Ngân hàng", "/question-bank", ClipboardList, "bg-sky-50 text-sky-700"],
  ["Mẫu cá nhân", "/templates", Star, "bg-amber-50 text-amber-700"],
  ["Lịch sử", "/history", History, "bg-rose-50 text-rose-700"],
  ["Cài đặt", "/settings", Settings, "bg-slate-100 text-slate-700"],
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState({
    history: 0,
    templates: 0,
    questions: 0,
  });
  useEffect(
    () =>
      queueMicrotask(() =>
        setStats({
          history: getHistory().length,
          templates: getTemplates().length,
          questions: getQuestions().length,
        }),
      ),
    [],
  );
  return (
    <AppShell title="Dashboard">
      <DashboardOnboarding />
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0">
          <section className="hero-gradient relative overflow-hidden rounded-[30px] p-7 text-white shadow-[0_22px_55px_rgba(37,99,235,.2)] sm:p-10">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[38px] border-white/10" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold ring-1 ring-white/20">
                <Sparkles size={14} />
                Không gian làm việc hôm nay
              </span>
              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                Chào mừng quay lại với Soạn Lab
              </h1>
              <p className="mt-3 text-lg font-semibold text-blue-100">
                Hôm nay bạn muốn tạo tài liệu nào?
              </p>
              <div className="mt-6 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <div className="flex justify-between text-xs font-bold">
                  <span>Tạo bản nháp đầu tiên</span>
                  <span>0/3 bước</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/15">
                  <div className="h-full w-[8%] rounded-full bg-cyan-300" />
                </div>
              </div>
              <Link
                href="/tools/exam-generator"
                className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-extrabold text-blue-700 shadow-lg"
              >
                Tạo đề ngay
                <ArrowRight size={17} className="ml-2" />
              </Link>
            </div>
            <SoanLabIllustration variant="workspace" className="hidden bg-white/95 lg:block" />
            </div>
          </section>
          <section className="mt-8">
            <Heading
              title="Tạo nhanh hôm nay"
              text="Những tác vụ quen thuộc, chỉ mất vài phút."
            />
            <div className="play-card overflow-hidden p-2 sm:p-3">
              {tasks.map(([title, desc, badge, href], index) => (
                <Link
                  key={href}
                  href={href}
                  className={`task-row group border-0 shadow-none ${["bg-blue-50/35", "bg-cyan-50/35", "bg-violet-50/35", "bg-emerald-50/35"][index]} hover:brightness-[.98]`}
                >
                  <SoanLabIcon name={iconNameFromHref(href)} />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-slate-900">{title}</p>
                    <p className="mt-1 text-sm text-slate-500">{desc}</p>
                  </div>
                  <span className="hidden sm:inline-flex"><SoanLabBadge tone={badge === "Word" ? "export" : badge === "Demo" ? "demo" : "useful"}>{badge}</SoanLabBadge></span>
                  <ArrowRight
                    size={17}
                    className="shrink-0 text-blue-600 transition group-hover:translate-x-1"
                  />
                </Link>
              ))}
            </div>
          </section>
          <section className="mt-9">
            <Heading
              title="Khám phá"
              text="Mọi công cụ trong một không gian làm việc."
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {explore.map(([title, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="play-card group flex min-h-32 flex-col items-center justify-center p-4 text-center transition hover:-translate-y-1"
                >
                  <SoanLabIcon name={iconNameFromHref(href)} />
                  <p className="mt-3 text-sm font-extrabold text-slate-800">
                    {title}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">
                    {
                      [
                        "Tạo nhanh",
                        "Theo chủ đề",
                        "Ba phiên bản",
                        "Mở lại",
                        "Soạn bài",
                        "Lưu local",
                        "Dùng lại",
                        "Đã lưu",
                        "Cấu hình",
                      ][explore.findIndex((item) => item[0] === title)]
                    }
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>
        <aside className="space-y-5">
          <section className="play-card p-5">
            <h2 className="font-extrabold text-slate-900">Tìm nhanh</h2>
            <button
              onClick={() =>
                window.dispatchEvent(new Event("classora-open-command-palette"))
              }
              className="mt-4 flex min-h-12 w-full items-center gap-3 rounded-2xl bg-slate-50 px-4 text-left text-sm text-slate-500"
            >
              <Search size={18} />
              Công cụ, tài liệu...
            </button>
          </section>
          <section className="play-card p-5">
            <h2 className="font-extrabold text-slate-900">Dữ liệu của bạn</h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                [stats.history, "Lịch sử"],
                [stats.templates, "Mẫu"],
                [stats.questions, "Câu hỏi"],
              ].map(([n, l]) => (
                <div key={l} className="rounded-2xl bg-blue-50 p-3 text-center">
                  <p className="text-xl font-black text-blue-700">{n}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">
                    {l}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="play-card overflow-hidden bg-gradient-to-br from-cyan-50 to-blue-50 p-5">
            <MessageSquareText className="text-cyan-600" />
            <h2 className="mt-4 text-xl font-black text-slate-900">
              Cùng cải thiện Soạn Lab
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Gửi góp ý về form, file Word và công cụ hữu ích nhất.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/feedback" className="btn-primary">
                Gửi góp ý
              </Link>
              <Link href="/share" className="btn-secondary">
                Chia sẻ demo
              </Link>
            </div>
            <Link
              href="/known-issues"
              className="mt-4 inline-flex text-sm font-bold text-blue-700"
            >
              Xem giới hạn hiện tại →
            </Link>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
function Heading({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-4">
      <h2 className="section-title">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}

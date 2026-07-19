"use client";

import Link from "next/link";
import {
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  History,
  ImageIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DashboardOnboarding } from "@/components/DashboardOnboarding";
import { SoanLabBadge } from "@/components/ui/SoanLabBadge";
import { getHistory } from "@/lib/history";
import type { GeneratedDocument } from "@/lib/types";
import { toolAccentClasses, type ToolAccentTone } from "@/lib/ui-accent";

const quickTools = [
  { title: "Tạo đề kiểm tra", desc: "Tạo đề, đáp án, thang điểm, ma trận và bản đặc tả.", href: "/tools/exam-generator", icon: ClipboardList, accent: "amber", keywords: "đề kiểm tra thi thptqg" },
  { title: "Ma trận & bảng đặc tả", desc: "Lập ma trận trước khi ra đề, xuất Excel/Word và đối chiếu đề hiện có.", href: "/tools/exam-blueprint", icon: ClipboardList, accent: "amber", keywords: "ma trận đặc tả blueprint đối chiếu đề" },
  { title: "Ngân hàng câu hỏi", desc: "Lưu, tìm kiếm và quản lý câu hỏi theo môn/lớp/chủ đề.", href: "/question-bank", icon: BookOpenCheck, accent: "blue", keywords: "ngân hàng câu hỏi import" },
  { title: "Giáo án", desc: "Tạo kế hoạch bài dạy dạng bản nháp tham khảo.", href: "/tools/lesson-plan", icon: FileText, accent: "violet", keywords: "giáo án kế hoạch bài dạy" },
  { title: "Phiếu học tập", desc: "Tạo bài tập theo chủ đề, có gợi ý đáp án để rà soát.", href: "/tools/worksheet-generator", icon: BookOpenCheck, accent: "violet", keywords: "phiếu học tập worksheet bài tập" },
  { title: "Hình học → TikZ", desc: "Nhận diện hình học đã cắt gọn và tạo mã TikZ để giáo viên rà soát.", href: "/tools/image-to-latex?mode=geometry", icon: ImageIcon, badge: "Beta", accent: "cyan", keywords: "latex hình học tikz công thức" },
] as const;

export default function DashboardPage() {
  const [history, setHistory] = useState<GeneratedDocument[]>([]);

  useEffect(() => {
    queueMicrotask(() => setHistory(getHistory().slice(0, 4)));
  }, []);

  return (
    <AppShell title="Trang tổng quan">
      <DashboardOnboarding />

      <section className="border-b border-slate-200 pb-6 pt-2">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Bắt đầu công việc hôm nay</h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
              Chọn một công cụ, nhập môn/lớp/chủ đề và tạo bản nháp để thầy cô rà soát, chỉnh sửa, xuất Word/PDF.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link href="/tools/exam-generator" className="btn-primary">Tạo đề kiểm tra</Link>
              <Link href="/tools" className="btn-secondary">Xem tất cả công cụ</Link>
            </div>
          </div>
          <div className="border-l-2 border-blue-500 pl-4">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-0.5 shrink-0 text-blue-700" size={20} />
              <div>
                <h2 className="font-semibold text-slate-950">Gợi ý dùng thử trong 5 phút</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Chọn một công cụ, tạo bản nháp, xuất thử Word/PDF rồi gửi góp ý bằng nút “Góp ý”.
                </p>
                <Link href="/teacher-testing-guide" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 hover:underline">
                  Xem hướng dẫn
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-7">
        <SectionTitle title="Công cụ nên thử trước" desc="Các công cụ chính trong vòng dùng thử với giáo viên." />
        <div className="grid overflow-hidden border-y border-slate-200 md:grid-cols-2 xl:grid-cols-3">
            {quickTools.slice(0, 6).map((tool) => {
              const Icon = tool.icon;
              const accent = toolAccentClasses[tool.accent as ToolAccentTone];
              return (
                <Link data-tool-accent={tool.accent} key={tool.href} href={tool.href} className={`group flex min-h-28 gap-3 border-b border-l-2 border-slate-200 p-4 transition ${accent.border} ${accent.hover} focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 md:border-r`}>
                  <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border ${accent.icon}`}><Icon size={18} /></span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950">{tool.title}</h2>
                      {"badge" in tool && tool.badge ? <SoanLabBadge tone="beta">{tool.badge}</SoanLabBadge> : null}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{tool.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
      </section>

      <section className="mt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title="Lịch sử gần đây" desc="Mở lại tài liệu đã lưu để chỉnh sửa hoặc xuất file." compact />
          <Link href="/history" className="btn-secondary">Xem tất cả</Link>
        </div>
        {history.length ? (
          <div className="mt-3 border-y border-slate-200">
            {history.map((item) => (
              <Link key={item.id} href={`/history/${item.id}`} className="flex min-h-16 items-center gap-3 border-b border-slate-200 px-2 py-3 transition last:border-b-0 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500">
                <History size={17} className="shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Bản nháp đã lưu trong lịch sử</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 border-y border-slate-200 py-8 text-center">
            <History className="text-blue-600" size={30} />
            <h3 className="mt-3 font-semibold text-slate-900">Chưa có tài liệu nào được lưu</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Chưa có tài liệu nào được lưu. Hãy tạo đề kiểm tra hoặc giáo án đầu tiên để xem lại tại đây.</p>
            <Link href="/create" className="btn-primary mt-5">Tạo tài liệu đầu tiên</Link>
          </div>
        )}
      </section>

      <section className="mt-7 flex gap-3 border-y border-amber-200 bg-amber-50/70 px-3 py-4 text-sm leading-6 text-amber-950">
        <CheckCircle2 className="mt-0.5 shrink-0 text-amber-700" size={20} />
        <p>
          <span className="font-semibold">Lưu ý khi sử dụng: </span>
          Soạn Lab đang ở bản thử nghiệm. Nội dung được tạo tự động chỉ là bản nháp tham khảo và cần thầy cô kiểm tra trước khi sử dụng.
        </p>
      </section>
    </AppShell>
  );
}

function SectionTitle({ title, desc, compact = false }: { title: string; desc: string; compact?: boolean }) {
  return (
    <div className={compact ? "" : "mb-4"}>
      <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{desc}</p>
    </div>
  );
}

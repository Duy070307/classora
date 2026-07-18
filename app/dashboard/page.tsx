"use client";

import Link from "next/link";
import {
  ArrowRight,
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
import { getHistory } from "@/lib/history";
import type { GeneratedDocument } from "@/lib/types";

const quickTools = [
  { title: "Tạo đề kiểm tra", desc: "Tạo đề, đáp án, thang điểm, ma trận và bản đặc tả.", href: "/tools/exam-generator", icon: ClipboardList, badge: "Thường dùng", keywords: "đề kiểm tra thi thptqg" },
  { title: "Ma trận & bảng đặc tả", desc: "Lập ma trận trước khi ra đề, xuất Excel/Word và đối chiếu đề hiện có.", href: "/tools/exam-blueprint", icon: ClipboardList, badge: "Mới", keywords: "ma trận đặc tả blueprint đối chiếu đề" },
  { title: "Ngân hàng câu hỏi", desc: "Lưu, tìm kiếm và quản lý câu hỏi theo môn/lớp/chủ đề.", href: "/question-bank", icon: BookOpenCheck, badge: "Quản lý", keywords: "ngân hàng câu hỏi import" },
  { title: "Giáo án", desc: "Tạo kế hoạch bài dạy dạng bản nháp tham khảo.", href: "/tools/lesson-plan", icon: FileText, badge: "Tài liệu", keywords: "giáo án kế hoạch bài dạy" },
  { title: "Phiếu học tập", desc: "Tạo bài tập theo chủ đề, có gợi ý đáp án để rà soát.", href: "/tools/worksheet-generator", icon: BookOpenCheck, badge: "Word/PDF", keywords: "phiếu học tập worksheet bài tập" },
  { title: "Hình học → TikZ", desc: "Nhận diện hình học đã cắt gọn và tạo mã TikZ để giáo viên rà soát.", href: "/tools/image-to-latex?mode=geometry", icon: ImageIcon, badge: "Beta", keywords: "latex hình học tikz công thức" },
] as const;

export default function DashboardPage() {
  const [history, setHistory] = useState<GeneratedDocument[]>([]);

  useEffect(() => {
    queueMicrotask(() => setHistory(getHistory().slice(0, 4)));
  }, []);

  return (
    <AppShell title="Trang tổng quan">
      <DashboardOnboarding />

      <section className="ui-panel p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-800">
              <CheckCircle2 size={14} />
              Không gian làm việc cho giáo viên
            </span>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Bắt đầu công việc hôm nay</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Chọn một công cụ, nhập môn/lớp/chủ đề và tạo bản nháp để thầy cô rà soát, chỉnh sửa, xuất Word/PDF.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link href="/tools/exam-generator" className="btn-primary">Tạo đề kiểm tra</Link>
              <Link href="/tools" className="btn-secondary">Xem tất cả công cụ</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-0.5 shrink-0 text-emerald-700" size={22} />
              <div>
                <h2 className="font-black text-slate-950">Gợi ý dùng thử trong 5 phút</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Chọn một công cụ, tạo bản nháp, xuất thử Word/PDF rồi gửi góp ý bằng nút “Góp ý”.
                </p>
                <Link href="/teacher-testing-guide" className="mt-4 inline-flex min-h-11 items-center text-sm font-black text-emerald-800 hover:underline">
                  Xem hướng dẫn
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-7">
        <SectionTitle title="Công cụ nên thử trước" desc="Các công cụ chính trong vòng dùng thử với giáo viên." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quickTools.slice(0, 6).map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.href} href={tool.href} className="group ui-panel p-4 transition hover:border-emerald-200 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Icon size={21} />
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600">{tool.badge}</span>
                  </div>
                  <h2 className="mt-4 text-lg font-black text-slate-900">{tool.title}</h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{tool.desc}</p>
                  <div className="mt-4 flex min-h-11 items-center justify-between border-t border-slate-100 pt-3 text-sm font-black text-emerald-800">
                    <span>Mở công cụ</span>
                    <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
      </section>

      <section className="ui-panel mt-7 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title="Lịch sử gần đây" desc="Mở lại tài liệu đã lưu để chỉnh sửa hoặc xuất file." compact />
          <Link href="/history" className="btn-secondary">Xem tất cả</Link>
        </div>
        {history.length ? (
          <div className="mt-5 grid gap-3">
            {history.map((item) => (
              <Link key={item.id} href={`/history/${item.id}`} className="flex min-h-16 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:border-emerald-200 hover:bg-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <History size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Bản nháp đã lưu trong lịch sử</p>
                </div>
                <ArrowRight size={16} className="text-emerald-700" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-8 text-center">
            <History className="mx-auto text-emerald-600" size={30} />
            <h3 className="mt-3 font-black text-slate-900">Chưa có tài liệu nào được lưu</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Chưa có tài liệu nào được lưu. Hãy tạo đề kiểm tra hoặc giáo án đầu tiên để xem lại tại đây.</p>
            <Link href="/create" className="btn-primary mt-5">Tạo tài liệu đầu tiên</Link>
          </div>
        )}
      </section>

      <section className="mt-7 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <CheckCircle2 className="mt-0.5 shrink-0 text-amber-700" size={20} />
        <p>
          <span className="font-black">Lưu ý khi sử dụng: </span>
          Soạn Lab đang ở bản thử nghiệm. Nội dung được tạo tự động chỉ là bản nháp tham khảo và cần thầy cô kiểm tra trước khi sử dụng.
        </p>
      </section>
    </AppShell>
  );
}

function SectionTitle({ title, desc, compact = false }: { title: string; desc: string; compact?: boolean }) {
  return (
    <div className={compact ? "" : "mb-4"}>
      <h2 className="text-xl font-black text-slate-900 sm:text-2xl">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{desc}</p>
    </div>
  );
}

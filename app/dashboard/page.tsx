"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Box,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  History,
  ImageIcon,
  Presentation,
  Search,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DashboardOnboarding } from "@/components/DashboardOnboarding";
import { getHistory } from "@/lib/history";
import type { GeneratedDocument } from "@/lib/types";
import { publicBetaPresets } from "@/lib/public-beta-presets";

const quickTools = [
  { title: "Tạo đề kiểm tra", desc: "Tạo đề, đáp án, thang điểm, ma trận và bản đặc tả.", href: "/tools/exam-generator", icon: ClipboardList, badge: "Thường dùng", keywords: "đề kiểm tra thi thptqg" },
  { title: "Ma trận & bảng đặc tả", desc: "Lập ma trận trước khi ra đề, xuất Excel/Word và đối chiếu đề hiện có.", href: "/tools/exam-blueprint", icon: ClipboardList, badge: "Mới", keywords: "ma trận đặc tả blueprint đối chiếu đề" },
  { title: "Chấm bài", desc: "Nhận dạng bài làm và chấm phần khách quan với bước giáo viên rà soát.", href: "/tools/grading-assistant", icon: ClipboardCheck, badge: "Mới", keywords: "chấm bài bảng điểm bài làm mã đề" },
  { title: "Phiếu trả lời", desc: "Tạo phiếu chuẩn có QR và điểm định vị để in, quét rồi chấm ổn định.", href: "/tools/answer-sheet", icon: ClipboardList, badge: "Mới", keywords: "phiếu trả lời phiếu tô qr mã đề" },
  { title: "Giáo án", desc: "Tạo kế hoạch bài dạy dạng bản nháp tham khảo.", href: "/tools/lesson-plan", icon: FileText, badge: "Tài liệu", keywords: "giáo án kế hoạch bài dạy" },
  { title: "Tạo slide bài giảng", desc: "Tạo dàn ý, chỉnh sửa slide và xuất PowerPoint.", href: "/tools/lesson-slides", icon: Presentation, badge: "PowerPoint", keywords: "slide powerpoint bài giảng trình chiếu" },
  { title: "Phiếu học tập", desc: "Tạo bài tập theo chủ đề, có gợi ý đáp án để rà soát.", href: "/tools/worksheet-generator", icon: BookOpenCheck, badge: "Word/PDF", keywords: "phiếu học tập worksheet bài tập" },
  { title: "Đề cương ôn tập", desc: "Tạo kiến thức trọng tâm, ví dụ, bài luyện tập, kiểm tra nhanh và đáp án.", href: "/tools/review-pack", icon: BookOpenCheck, badge: "Mới", keywords: "đề cương ôn tập củng cố luyện tập" },
  { title: "Ngân hàng câu hỏi", desc: "Lưu, tìm kiếm và quản lý câu hỏi theo môn/lớp/chủ đề.", href: "/question-bank", icon: BookOpenCheck, badge: "Quản lý", keywords: "ngân hàng câu hỏi import" },
  { title: "Ảnh công thức → LaTeX", desc: "Chuyển ảnh công thức hoặc hình học đã cắt gọn thành mã dùng lại.", href: "/tools/image-to-latex", icon: ImageIcon, badge: "Beta", keywords: "latex hình học tikz công thức" },
  { title: "Tạo mô phỏng 3D", desc: "Tạo mô phỏng minh họa đơn giản cho bài học.", href: "/tools/3d-animation", icon: Box, badge: "Beta", keywords: "3d mô phỏng trực quan vật lý hóa học" },
] as const;

export default function DashboardPage() {
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    queueMicrotask(() => setHistory(getHistory().slice(0, 4)));
  }, []);

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? quickTools.filter((tool) => `${tool.title} ${tool.desc} ${tool.keywords}`.toLowerCase().includes(q)) : quickTools;
  }, [query]);

  return (
    <AppShell title="Trang tổng quan">
      <DashboardOnboarding />

      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-700">
              <CheckCircle2 size={14} />
              Không gian làm việc cho giáo viên
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Bắt đầu tạo tài liệu dạy học với Soạn Lab</h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
              Chọn một công cụ, nhập môn/lớp/chủ đề và tạo bản nháp để thầy cô rà soát, chỉnh sửa, xuất Word/PDF.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link href="/tools/exam-generator" className="btn-primary">Tạo đề kiểm tra</Link>
              <a href="#dung-thu-nhanh" className="btn-secondary">Dùng thử nhanh</a>
              <Link href="/teacher-testing-guide" className="btn-secondary">Hướng dẫn dùng thử</Link>
            </div>
          </div>
          <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-0.5 shrink-0 text-blue-700" size={22} />
              <div>
                <h2 className="font-black text-slate-950">Gợi ý dùng thử trong 5 phút</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Chọn một mẫu nhanh, tạo bản nháp, xuất thử Word/PDF rồi gửi góp ý bằng nút “Góp ý”.
                </p>
                <Link href="/teacher-testing-guide" className="mt-4 inline-flex text-sm font-black text-blue-700 hover:underline">
                  Xem hướng dẫn
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["Tạo đề nhanh hơn", "Điền môn, lớp, chủ đề và để Soạn Lab tạo bản nháp đề kiểm tra."],
          ["Xuất Word/PDF để chỉnh sửa", "Tải file về máy, rà soát đáp án, định dạng và dùng theo nhu cầu."],
          ["Lưu lịch sử và ngân hàng câu hỏi", "Mở lại tài liệu đã tạo và quản lý câu hỏi riêng của thầy cô."],
        ].map(([title, desc]) => (
          <article key={title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <CheckCircle2 className="text-blue-600" size={22} />
            <h2 className="mt-3 font-black text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
          </article>
        ))}
      </section>

      <section id="dung-thu-nhanh" className="mt-8">
        <SectionTitle title="Dùng thử nhanh" desc="Chọn một mẫu có sẵn để tạo bản nháp đầu tiên nhanh hơn." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {publicBetaPresets.map((preset) => (
            <Link key={preset.title} href={preset.href} className="group rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Wand2 size={20} />
              </span>
              <h2 className="mt-4 text-base font-black text-slate-950">{preset.title}</h2>
              <p className="mt-2 min-h-16 text-sm leading-6 text-slate-600">{preset.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-black text-blue-700">
                <span>Tạo bản nháp</span>
                <ArrowRight size={17} className="transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm nhanh: đề kiểm tra, giáo án, LaTeX, mô phỏng..."
            className="form-field pl-11"
          />
        </label>
      </section>

      <section className="mt-8">
        <SectionTitle title="Công cụ nên thử trước" desc="Các công cụ chính trong vòng dùng thử với giáo viên." />
        {filteredTools.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.href} href={tool.href} className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <Icon size={21} />
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600">{tool.badge}</span>
                  </div>
                  <h2 className="mt-4 text-lg font-black text-slate-900">{tool.title}</h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{tool.desc}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-black text-blue-700">
                    <span>Mở công cụ</span>
                    <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-blue-200 bg-blue-50 p-8 text-center">
            <Search className="mx-auto text-blue-500" size={30} />
            <h3 className="mt-3 font-black text-slate-900">Chưa tìm thấy công cụ phù hợp.</h3>
            <Link href="/tools" className="btn-secondary mt-5">Xem tất cả công cụ</Link>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title="Lịch sử gần đây" desc="Mở lại tài liệu đã lưu để chỉnh sửa hoặc xuất file." compact />
          <Link href="/history" className="btn-secondary">Xem tất cả</Link>
        </div>
        {history.length ? (
          <div className="mt-5 grid gap-3">
            {history.map((item) => (
              <Link key={item.id} href={`/history/${item.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <History size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Bản nháp đã lưu trong lịch sử</p>
                </div>
                <ArrowRight size={16} className="text-blue-600" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-blue-200 bg-blue-50 p-8 text-center">
            <History className="mx-auto text-blue-500" size={30} />
            <h3 className="mt-3 font-black text-slate-900">Chưa có tài liệu nào được lưu</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Chưa có tài liệu nào được lưu. Hãy tạo đề kiểm tra hoặc giáo án đầu tiên để xem lại tại đây.</p>
            <Link href="/create" className="btn-primary mt-5">Tạo tài liệu đầu tiên</Link>
          </div>
        )}
      </section>

      <section className="mt-8 flex gap-3 rounded-[24px] border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
        <CheckCircle2 className="mt-0.5 shrink-0 text-blue-600" size={20} />
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

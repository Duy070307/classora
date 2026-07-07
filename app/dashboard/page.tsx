"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Box,
  CheckCircle2,
  ClipboardList,
  FileText,
  History,
  ImageIcon,
  MessageSquareText,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DashboardOnboarding } from "@/components/DashboardOnboarding";
import { getHistory } from "@/lib/history";
import type { GeneratedDocument } from "@/lib/types";

const quickTools = [
  { title: "Soạn đề kiểm tra", desc: "Tạo đề, đáp án, ma trận và thang điểm.", href: "/tools/exam-generator", icon: ClipboardList, badge: "Phổ biến", tone: "from-blue-500 to-cyan-500", keywords: "đề kiểm tra thi thptqg" },
  { title: "Phiếu học tập", desc: "Bài tập theo chủ đề, có gợi ý đáp án.", href: "/tools/worksheet-generator", icon: BookOpenCheck, badge: "Word/PDF", tone: "from-emerald-500 to-teal-500", keywords: "phiếu worksheet bài tập" },
  { title: "Giáo án", desc: "Kế hoạch bài dạy có hoạt động và đánh giá.", href: "/tools/lesson-plan-generator", icon: FileText, badge: "Tài liệu", tone: "from-indigo-500 to-violet-500", keywords: "giáo án kế hoạch bài dạy" },
  { title: "Nhận xét học sinh", desc: "Viết nhận xét tự nhiên, dễ chỉnh sửa.", href: "/tools/student-comments", icon: MessageSquareText, badge: "Nhanh", tone: "from-amber-500 to-orange-500", keywords: "nhận xét học sinh cuối kỳ" },
  { title: "Tin nhắn phụ huynh", desc: "Soạn tin nhắn lịch sự, rõ ý.", href: "/tools/parent-message-generator", icon: Send, badge: "Chủ nhiệm", tone: "from-pink-500 to-rose-500", keywords: "phụ huynh tin nhắn zalo" },
  { title: "Ảnh công thức → LaTeX", desc: "Chuyển ảnh công thức hoặc hình học sang mã dùng lại.", href: "/tools/image-to-latex", icon: ImageIcon, badge: "Mới", tone: "from-sky-500 to-blue-600", keywords: "latex hình học tikz công thức" },
  { title: "Tạo mô phỏng 3D", desc: "Tạo cảnh 3D đơn giản để minh họa bài học.", href: "/tools/3d-animation", icon: Box, badge: "Beta", tone: "from-blue-500 to-cyan-500", keywords: "3d mô phỏng trực quan vật lý hóa học" },
] as const;

const taskCards = [
  ["Soạn đề kiểm tra", "Môn, lớp, chủ đề, số câu", "/tools/exam-generator", ClipboardList],
  ["Tạo tài liệu dạy học", "Phiếu học tập, giáo án, hoạt động", "/tools?category=lesson-materials", FileText],
  ["Công tác chủ nhiệm", "Nhận xét, tin nhắn, kế hoạch", "/tools?category=homeroom-parent", MessageSquareText],
  ["Công thức & hình học", "LaTeX, TikZ, preview", "/tools?category=formula-latex", ImageIcon],
  ["Mô phỏng trực quan", "3D, chuyển động, minh họa", "/tools?category=visual-tools", Box],
] as const;

const checklist = [
  ["Tạo tài liệu đầu tiên", "/create"],
  ["Thử một công cụ thường dùng", "/tools"],
  ["Lưu vào lịch sử", "/history"],
  ["Xuất Word/PDF", "/tools/exam-generator"],
  ["Kiểm tra lại nội dung trước khi dùng", "/known-issues"],
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
    <AppShell title="Dashboard">
      <DashboardOnboarding />

      <section className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-blue-700 via-indigo-700 to-sky-600 p-6 text-white shadow-[0_28px_70px_rgba(37,99,235,.25)] sm:p-9">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[44px] border-white/10" />
        <div className="absolute bottom-0 right-10 hidden h-24 w-56 rounded-t-full bg-white/10 blur-xl lg:block" />
        <div className="relative max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1.5 text-xs font-extrabold ring-1 ring-white/20">
            <Sparkles size={14} />
            Không gian tạo tài liệu cho giáo viên
          </span>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Bạn muốn tạo tài liệu gì hôm nay?</h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-blue-50 sm:text-lg">
            Chọn công cụ hoặc tìm nhanh công việc cần làm.
          </p>
          <div className="mt-7 flex flex-col gap-3 lg:flex-row">
            <label className="relative min-h-14 flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm: đề, phiếu, phụ huynh, latex, hình học..."
                className="h-14 w-full rounded-2xl border-0 bg-white pl-12 pr-4 text-sm font-semibold text-slate-800 shadow-xl outline-none ring-1 ring-white/30 placeholder:text-slate-400 focus:ring-4 focus:ring-cyan-200/50"
              />
            </label>
            <Link href="/create" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-blue-700 shadow-xl transition hover:-translate-y-0.5">
              Tạo tài liệu mới
              <ArrowRight size={18} />
            </Link>
            <Link href="/tools" className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-white/14 px-6 text-sm font-black text-white ring-1 ring-white/20 transition hover:-translate-y-0.5 hover:bg-white/20">
              Xem công cụ
            </Link>
          </div>
        </div>
      </section>

      {!history.length ? (
        <section className="mt-6 rounded-[30px] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
          <SectionTitle title="Bắt đầu với Soạn Lab" desc="Một lộ trình ngắn để có tài liệu đầu tiên và dùng an toàn hơn." compact />
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {checklist.map(([label, href], index) => (
              <Link key={label} href={href} className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-amber-100 transition hover:-translate-y-0.5 hover:text-blue-700">
                <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-xs font-black text-amber-700">{index + 1}</span>
                {label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <SectionTitle title="Công cụ thường dùng" desc="Những công cụ được giáo viên dùng nhiều nhất." />
        {filteredTools.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.href} href={tool.href} className="group rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:bg-gradient-to-br hover:from-white hover:to-blue-50 hover:shadow-xl hover:shadow-blue-100/60">
                  <div className="flex items-start justify-between gap-4">
                    <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.tone} text-white shadow-lg`}>
                      <Icon size={22} />
                    </span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">{tool.badge}</span>
                  </div>
                  <h2 className="mt-5 text-lg font-black text-slate-900">{tool.title}</h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{tool.desc}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-black text-blue-700">
                    <span>Mở công cụ</span>
                    <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-blue-200 bg-blue-50/60 p-8 text-center">
            <Search className="mx-auto text-blue-500" size={32} />
            <h3 className="mt-3 font-black text-slate-900">Chưa tìm thấy công cụ phù hợp.</h3>
            <Link href="/tools" className="btn-secondary mt-5">Xem tất cả công cụ</Link>
          </div>
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="Bắt đầu từ công việc" desc="Chọn nhóm việc trước, rồi Soạn Lab mở đúng khu vực cần dùng." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {taskCards.map(([title, desc, href, Icon]) => (
            <Link key={title} href={href} className="rounded-[26px] border border-indigo-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:bg-indigo-50/50 hover:shadow-xl">
              <Icon className="text-indigo-600" size={25} />
              <h3 className="mt-4 font-black text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title="Lịch sử gần đây" desc="Mở lại tài liệu đã lưu để chỉnh sửa hoặc xuất file." compact />
          <Link href="/history" className="btn-secondary">Xem tất cả</Link>
        </div>
        {history.length ? (
          <div className="mt-5 grid gap-3">
            {history.map((item) => (
              <Link key={item.id} href={`/history/${item.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-blue-200 hover:bg-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
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
          <div className="mt-5 rounded-3xl border border-dashed border-blue-200 bg-blue-50/60 p-8 text-center">
            <History className="mx-auto text-blue-500" size={32} />
            <h3 className="mt-3 font-black text-slate-900">Chưa có tài liệu nào</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Tài liệu đã lưu sẽ xuất hiện ở đây để thầy cô mở lại và xuất file.</p>
            <Link href="/create" className="btn-primary mt-5">Tạo tài liệu đầu tiên</Link>
          </div>
        )}
      </section>

      <section className="mt-8 flex gap-3 rounded-[26px] border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
        <CheckCircle2 className="mt-0.5 shrink-0 text-blue-600" size={20} />
        <p>
          <span className="font-black">Lưu ý khi dùng nội dung AI: </span>
          Nội dung là bản nháp hỗ trợ giáo viên. Thầy cô nên rà soát lại chuyên môn, đáp án và định dạng trước khi sử dụng.
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

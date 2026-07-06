"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
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
  { title: "Soạn đề kiểm tra", desc: "Tạo đề, đáp án, ma trận và thang điểm.", href: "/tools/exam-generator", icon: ClipboardList, badge: "Phổ biến", tone: "from-blue-500 to-cyan-500" },
  { title: "Phiếu học tập", desc: "Bài tập theo chủ đề, có gợi ý đáp án.", href: "/tools/worksheet-generator", icon: BookOpenCheck, badge: "Xuất Word", tone: "from-emerald-500 to-teal-500" },
  { title: "Giáo án", desc: "Kế hoạch bài dạy có hoạt động và đánh giá.", href: "/tools/lesson-plan-generator", icon: FileText, badge: "Tài liệu", tone: "from-indigo-500 to-violet-500" },
  { title: "Nhận xét học sinh", desc: "Viết nhận xét tự nhiên, dễ chỉnh sửa.", href: "/tools/student-comments", icon: MessageSquareText, badge: "Nhanh", tone: "from-amber-500 to-orange-500" },
  { title: "Tin nhắn phụ huynh", desc: "Soạn tin nhắn lịch sự, rõ ý.", href: "/tools/parent-message-generator", icon: Send, badge: "Chủ nhiệm", tone: "from-pink-500 to-rose-500" },
  { title: "Ảnh công thức → LaTeX", desc: "Chuyển ảnh công thức hoặc hình học sang mã dùng lại.", href: "/tools/image-to-latex", icon: ImageIcon, badge: "Mới", tone: "from-sky-500 to-blue-600" },
] as const;

const workflow = [
  ["1", "Chọn công cụ", "Bắt đầu từ đề kiểm tra, phiếu học tập, giáo án hoặc nhận xét."],
  ["2", "Nhập thông tin", "Điền môn học, lớp, chủ đề và yêu cầu ngắn gọn."],
  ["3", "Xuất hoặc lưu", "Rà soát bản nháp rồi xuất Word/PDF hoặc lưu lịch sử."],
] as const;

export default function DashboardPage() {
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    queueMicrotask(() => setHistory(getHistory().slice(0, 4)));
  }, []);

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? quickTools.filter((tool) => `${tool.title} ${tool.desc}`.toLowerCase().includes(q)) : quickTools;
  }, [query]);

  return (
    <AppShell title="Dashboard">
      <DashboardOnboarding />

      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-700 via-indigo-700 to-sky-600 p-6 text-white shadow-[0_28px_70px_rgba(37,99,235,.25)] sm:p-9">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[44px] border-white/10" />
        <div className="absolute bottom-0 right-10 hidden h-24 w-56 rounded-t-full bg-white/10 blur-xl lg:block" />
        <div className="relative max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1.5 text-xs font-extrabold ring-1 ring-white/20">
            <Sparkles size={14} />
            Không gian tạo tài liệu cho giáo viên
          </span>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Chào mừng quay lại Soạn Lab</h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-blue-50 sm:text-lg">
            Chọn một công cụ để tạo tài liệu, soạn đề hoặc xử lý công thức nhanh hơn.
          </p>
          <div className="mt-7 flex flex-col gap-3 lg:flex-row">
            <label className="relative min-h-14 flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm công cụ, tài liệu..."
                className="h-14 w-full rounded-2xl border-0 bg-white pl-12 pr-4 text-sm font-semibold text-slate-800 shadow-xl outline-none ring-1 ring-white/30 placeholder:text-slate-400 focus:ring-4 focus:ring-cyan-200/50"
              />
            </label>
            <Link href="/tools" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-blue-700 shadow-xl transition hover:-translate-y-0.5">
              Tạo tài liệu mới
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="Tạo nhanh hôm nay" desc="Những công cụ được giáo viên dùng nhiều nhất." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href} className="group rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60">
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
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm">
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
              <p className="mt-2 text-sm leading-6 text-slate-600">Hãy tạo đề hoặc phiếu học tập đầu tiên, sau đó lưu vào lịch sử để mở lại nhanh.</p>
              <Link href="/tools/exam-generator" className="btn-primary mt-5">Tạo đề đầu tiên</Link>
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
          <SectionTitle title="Quy trình 3 bước" desc="Đơn giản để bắt đầu, vẫn đủ rõ để rà soát." compact />
          <div className="mt-5 space-y-3">
            {workflow.map(([step, title, desc]) => (
              <div key={step} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white">{step}</span>
                <div>
                  <p className="font-black text-slate-900">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
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

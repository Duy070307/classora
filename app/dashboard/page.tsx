"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, ClipboardCheck, FileCheck2, FileText, FlaskConical, Grid2X2, MessageSquareText, PenTool, Sparkles, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ToolCard } from "@/components/ToolCard";
import { getFavoriteTools } from "@/lib/favorites";
import { getHistory } from "@/lib/history";
import { getRecentTools, type RecentTool } from "@/lib/recent-tools";
import { categoryLabels, toolRegistry } from "@/lib/tool-registry";
import type { GeneratedDocument } from "@/lib/types";

const quickTools = [
  ["Tạo đề", "Đề kiểm tra có đáp án và ma trận.", "/tools/exam-generator", PenTool, "Phổ biến"],
  ["Tạo ma trận", "Phân bổ câu hỏi theo mức độ.", "/tools/matrix-generator", Grid2X2, "Phổ biến"],
  ["Phiếu học tập", "Bài tập và đáp án theo chủ đề.", "/tools/worksheet-generator", FileText, ""],
  ["Nhận xét học sinh", "Viết nhận xét theo mục đích.", "/tools/student-comments", MessageSquareText, ""],
  ["Công thức & LaTeX", "Chuyển và xem trước công thức.", "/tools/latex-preview", FlaskConical, "Demo"],
  ["Ngân hàng câu hỏi", "Lưu và tái sử dụng câu hỏi.", "/question-bank", BookOpenCheck, ""]
] as const;

const workflow = [
  ["01", "Nhập câu hỏi", "/tools/import-questions", Upload],
  ["02", "Tạo đề", "/tools/exam-generator", PenTool],
  ["03", "Tạo đáp án", "/tools/answer-key-generator", ClipboardCheck],
  ["04", "Xuất Word", "/history", FileCheck2]
] as const;

export default function DashboardPage() {
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [recent, setRecent] = useState<RecentTool[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      setHistory(getHistory().slice(0, 4));
      setRecent(getRecentTools().slice(0, 5));
      setFavorites(getFavoriteTools());
    });
  }, []);

  return <AppShell title="Dashboard">
    <section className="relative mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-6 py-9 text-white shadow-2xl shadow-blue-200 sm:px-9 lg:px-12 lg:py-12">
      <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-[40px] border-white/10" /><div className="absolute bottom-[-80px] right-28 h-56 w-56 rotate-12 rounded-[2rem] bg-white/10" />
      <div className="relative max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur"><Sparkles size={14} />MVP/demo · AI mô phỏng</span><h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">Gặp Soạn Lab</h1><p className="mt-3 text-xl font-semibold text-blue-100">Trợ lý soạn tài liệu cho giáo viên Việt Nam.</p><p className="mt-3 max-w-xl leading-7 text-blue-100">Tạo đề, phiếu học tập, nhận xét học sinh và xuất Word trong vài phút.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/tools/exam-generator" className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-2 text-sm font-bold text-blue-700 shadow-lg">Thử tạo đề<ArrowRight size={16} className="ml-2" /></Link><Link href="/tools" className="inline-flex min-h-11 items-center rounded-xl border border-white/30 bg-white/10 px-5 py-2 text-sm font-bold text-white backdrop-blur">Xem tất cả công cụ</Link></div></div>
    </section>

    <SectionTitle title="Tạo nhanh" description="Những workflow giáo viên thường dùng nhất." />
    <section className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{quickTools.map(([title, description, href, Icon, badge]) => <Link href={href} key={href} className="group card flex min-h-40 flex-col p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"><div className="flex items-start justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-brand"><Icon size={22} /></span>{badge ? <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">{badge}</span> : null}</div><h2 className="mt-5 font-bold text-ink">{title}</h2><p className="mt-1 text-sm leading-6 text-muted">{description}</p></Link>)}</section>

    <section className="mb-10 grid gap-6 xl:grid-cols-2">
      <div><SectionTitle title="Tiếp tục gần đây" description="Công cụ và tài liệu vừa sử dụng." /><div className="card divide-y divide-slate-100 overflow-hidden">{recent.length ? recent.map((tool) => <Link key={tool.href} href={tool.href} className="flex items-center justify-between gap-3 p-4 hover:bg-blue-50/60"><div><p className="font-semibold text-ink">{tool.title}</p><p className="mt-1 text-xs text-muted">Đã mở {tool.useCount} lần</p></div><ArrowRight size={16} className="text-brand" /></Link>) : <Empty text="Chưa có công cụ dùng gần đây." href="/tools" label="Khám phá công cụ" />}</div></div>
      <div><SectionTitle title="Tài liệu gần đây" description="Mở lại kết quả đã lưu." /><div className="card divide-y divide-slate-100 overflow-hidden">{history.length ? history.map((item) => <Link key={item.id} href={`/history/${item.id}`} className="flex items-center gap-3 p-4 hover:bg-blue-50/60"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-brand"><FileText size={18} /></span><div className="min-w-0"><p className="truncate font-semibold text-ink">{item.title}</p><p className="mt-1 text-xs text-muted">{new Date(item.createdAt).toLocaleString("vi-VN")}</p></div></Link>) : <Empty text="Chưa có tài liệu nào được lưu." href="/tools/exam-generator" label="Tạo tài liệu đầu tiên" />}</div></div>
    </section>

    <SectionTitle title="Quy trình gợi ý" description="Một luồng đơn giản từ dữ liệu đầu vào đến file Word." />
    <section className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{workflow.map(([number, title, href, Icon]) => <Link key={number} href={href} className="card p-5 hover:border-brand hover:shadow-lg"><span className="text-xs font-extrabold text-brand">{number}</span><Icon className="mt-5 text-ink" size={23} /><p className="mt-3 font-bold text-ink">{title}</p></Link>)}</section>

    {favorites.length ? <><SectionTitle title="Công cụ yêu thích" description="Các công cụ bạn đã đánh dấu." /><section className="mb-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{toolRegistry.filter((tool) => favorites.includes(tool.href)).slice(0, 6).map((tool) => <ToolCard key={tool.href} {...tool} categoryLabel={categoryLabels[tool.category]} />)}</section></> : null}

    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">Soạn Lab hiện là bản MVP/demo dùng AI mô phỏng. Giáo viên cần kiểm tra lại nội dung trước khi sử dụng.</section>
  </AppShell>;
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return <div className="mb-4"><h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2><p className="mt-1 text-sm text-muted">{description}</p></div>;
}

function Empty({ text, href, label }: { text: string; href: string; label: string }) {
  return <div className="p-6 text-center"><p className="text-sm text-muted">{text}</p><Link href={href} className="mt-3 inline-flex text-sm font-bold text-brand">{label}</Link></div>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Search, Sparkles } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader } from "@/components/PageHeader";
import { ToolCategorySection } from "@/components/ToolCategorySection";
import { ToolCard } from "@/components/ToolCard";
import { UsageBadge } from "@/components/UsageBadge";
import { getHistory } from "@/lib/history";
import { getRecentTools, type RecentTool } from "@/lib/recent-tools";
import { categoryLabels, categoryOrder, toolRegistry } from "@/lib/tool-registry";
import type { GeneratedDocument } from "@/lib/types";

const highlightedHrefs = [
  "/question-bank",
  "/tools/import-questions",
  "/tools/exam-generator",
  "/tools/exam-shuffler",
  "/tools/matrix-generator",
  "/tools/lesson-plan-generator",
  "/tools/student-comments"
];

export default function DashboardPage() {
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [recentTools, setRecentTools] = useState<RecentTool[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");

  useEffect(() => {
    queueMicrotask(() => {
      setHistory(getHistory().slice(0, 5));
      setRecentTools(getRecentTools());
    });
  }, []);

  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return toolRegistry.filter((tool) => {
      const matchCategory = category === "Tất cả" || categoryLabels[tool.category] === category;
      const matchQuery = !normalizedQuery || tool.title.toLowerCase().includes(normalizedQuery) || tool.description.toLowerCase().includes(normalizedQuery);
      return matchCategory && matchQuery;
    });
  }, [category, query]);

  const highlightedTools = toolRegistry.filter((tool) => highlightedHrefs.includes(tool.href));

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <PageHeader title="Chào mừng đến với Classora" description="Tìm công cụ, tạo tài liệu dạy học nhanh, lưu lịch sử và xuất Word." />
          <UsageBadge />
        </div>
        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="card p-5 md:col-span-2">
            <p className="text-sm font-bold uppercase tracking-wide text-brand">MVP cho giáo viên</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">Soạn đề, tạo tài liệu, xuất Word trong vài phút.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Dữ liệu hiện được lưu trên trình duyệt của bạn. Chưa có đăng nhập, thanh toán hay AI thật trong bản MVP này.</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted">
              <Clock3 size={16} />
              Lịch sử gần đây
            </div>
            <p className="mt-3 text-3xl font-bold text-ink">{history.length}</p>
            <Link href="/history" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
              Xem lịch sử
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        <section className="mb-8 card p-5">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-brand" />
            <h2 className="text-lg font-bold text-ink">Công cụ nổi bật</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {highlightedTools.map((tool) => (
              <ToolCard key={tool.href} title={tool.title} description={tool.description} href={tool.href} />
            ))}
          </div>
        </section>

        <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="card p-5">
            <h2 className="text-lg font-bold text-ink">Tìm công cụ</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
              <label className="relative block">
                <Search className="absolute left-3 top-3 text-slate-400" size={17} />
                <input className="form-field pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên công cụ..." />
              </label>
              <select className="form-field" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option>Tất cả</option>
                {categoryOrder.map((item) => (
                  <option key={item}>{categoryLabels[item]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="card p-5">
            <h2 className="text-lg font-bold text-ink">Dùng gần đây</h2>
            <div className="mt-3 space-y-2">
              {recentTools.length ? recentTools.slice(0, 5).map((tool) => (
                <Link key={tool.href} href={tool.href} className="block rounded-md border border-line px-3 py-2 text-sm font-medium text-muted hover:border-brand hover:text-brand">
                  {tool.title}
                </Link>
              )) : <p className="text-sm leading-6 text-muted">Chưa có công cụ dùng gần đây. Hãy tạo thử một tài liệu đầu tiên.</p>}
            </div>
          </div>
        </section>

        <div className="space-y-8">
          {categoryOrder.map((item) => {
            const tools = filteredTools.filter((tool) => tool.category === item);
            if (!tools.length) return null;
            return <ToolCategorySection key={item} title={categoryLabels[item]} tools={tools} />;
          })}
          {!filteredTools.length ? <div className="empty-state">Không tìm thấy công cụ phù hợp.</div> : null}
        </div>
      </main>
    </div>
  );
}

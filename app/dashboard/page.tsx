"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Clock3, Database, FileClock, MessageCircle, Search, Settings, Sparkles, Wrench } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { ToolCategorySection } from "@/components/ToolCategorySection";
import { ToolCard } from "@/components/ToolCard";
import { UsageBadge } from "@/components/UsageBadge";
import { BugReportLink } from "@/components/BugReportLink";
import { getAllFormDrafts, type FormDraft } from "@/lib/form-drafts";
import { getHistory } from "@/lib/history";
import { getRecentTools, type RecentTool } from "@/lib/recent-tools";
import { getFavoriteTools } from "@/lib/favorites";
import { categoryLabels, categoryOrder, toolRegistry } from "@/lib/tool-registry";
import type { GeneratedDocument } from "@/lib/types";
import { draftToolNames } from "@/lib/draft-tool-names";
import { BrandLogo } from "@/components/BrandLogo";

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
  const [favoriteHrefs, setFavoriteHrefs] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<FormDraft[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");

  useEffect(() => {
    queueMicrotask(() => {
      setHistory(getHistory().slice(0, 5));
      setRecentTools(getRecentTools());
      setFavoriteHrefs(getFavoriteTools());
      setDrafts(getAllFormDrafts().slice(0, 3));
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
  const quickLinks = [
    ["Tất cả công cụ", "/tools", Wrench],
    ["Ngân hàng câu hỏi", "/question-bank", BookOpenCheck],
    ["Bản nháp", "/drafts", FileClock],
    ["Mẫu cá nhân", "/templates", FileClock],
    ["Cài đặt tài liệu", "/settings", Settings],
    ["Quản lý dữ liệu", "/data", Database],
    ["Góp ý", "/feedback", MessageCircle]
  ] as const;

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div><BrandLogo /><h1 className="mt-4 text-3xl font-bold tracking-tight text-ink">Chào mừng đến với Soạn Lab</h1><p className="mt-2 max-w-2xl text-muted">Tìm công cụ, tạo tài liệu dạy học nhanh, lưu lịch sử và xuất Word.</p></div>
          <UsageBadge />
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="card overflow-hidden bg-gradient-to-br from-white via-blue-50/50 to-indigo-50 p-6 md:col-span-2">
            <p className="text-sm font-bold uppercase tracking-wide text-brand">MVP cho giáo viên</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">Soạn đề, tạo tài liệu, xuất Word trong vài phút.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Dữ liệu hiện được lưu trên trình duyệt của bạn. Chưa có đăng nhập, thanh toán hay AI thật trong bản MVP này.</p>
            <Link href="/getting-started" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
              Xem hướng dẫn bắt đầu <ArrowRight size={15} />
            </Link>
          </div>
          <div className="card bg-gradient-to-br from-white to-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted">
              <Clock3 size={16} />
              Lịch sử gần đây
            </div>
            <p className="mt-3 text-3xl font-bold text-ink">{history.length}</p>
            <Link href="/history" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
              Xem lịch sử <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        <section className="mb-8 card p-5">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-brand" />
            <h2 className="text-lg font-bold text-ink">Công cụ nổi bật</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {highlightedTools.slice(0, 6).map((tool) => (
              <ToolCard key={tool.href} title={tool.title} description={tool.description} href={tool.href} badge={tool.badge} categoryLabel="Phổ biến" />
            ))}
          </div>
        </section>

        <section className="mb-8 card p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-ink">Công cụ yêu thích</h2><Link href="/tools" className="text-sm font-semibold text-brand">Quản lý</Link></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {toolRegistry.filter((tool) => favoriteHrefs.includes(tool.href)).slice(0, 6).map((tool) => <ToolCard key={tool.href} title={tool.title} description={tool.description} href={tool.href} badge={tool.badge} categoryLabel={categoryLabels[tool.category]} />)}
            {!favoriteHrefs.length ? <p className="text-sm leading-6 text-muted md:col-span-3">Chưa có công cụ yêu thích. Nhấn biểu tượng ngôi sao trên thẻ công cụ để thêm.</p> : null}
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
              {recentTools.length ? (
                recentTools.slice(0, 5).map((tool) => (
                  <Link key={tool.href} href={tool.href} className="block rounded-md border border-line px-3 py-2 text-sm font-medium text-muted hover:border-brand hover:text-brand">
                    {tool.title}
                  </Link>
                ))
              ) : (
                <div className="text-sm leading-6 text-muted">
                  <p>Chưa có công cụ dùng gần đây.</p>
                  <Link href="/getting-started" className="mt-2 inline-flex font-semibold text-brand">Chọn công cụ đầu tiên</Link>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mb-8 card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileClock size={18} className="text-brand" />
              <h2 className="text-lg font-bold text-ink">Bản nháp gần đây</h2>
            </div>
            <Link href="/drafts" className="text-sm font-semibold text-brand">Xem tất cả</Link>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {drafts.length ? (
              drafts.map((draft) => (
                <div key={draft.toolKey} className="rounded-md border border-line p-3">
                  <p className="font-semibold text-ink">{draftToolNames[draft.toolKey] || draft.toolKey}</p>
                  <p className="mt-1 text-xs text-muted">{new Date(draft.updatedAt).toLocaleString("vi-VN")}</p>
                  <Link href={draft.toolKey} className="mt-3 inline-flex text-sm font-semibold text-brand">
                    Mở tiếp <ArrowRight size={15} className="ml-1" />
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted md:col-span-3">Chưa có bản nháp nào. Khi bạn nhập form trong công cụ, Soạn Lab sẽ tự lưu tạm trên trình duyệt.</p>
            )}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-ink">Lối tắt workspace</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            {quickLinks.map(([title, href, Icon]) => (
              <Link key={href} href={href} className="card flex items-center gap-3 p-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand">
                <Icon size={18} />
                {title}
              </Link>
            ))}
          </div>
        </section>

        <Link href="/demo-checklist" className="mb-8 inline-flex text-sm font-semibold text-brand">
          Mở checklist trước khi demo <ArrowRight size={15} className="ml-1" />
        </Link>
        <span className="mb-8 ml-4 inline-flex flex-wrap gap-4 text-sm">
          <Link href="/demo-data" className="font-semibold text-brand">Dữ liệu demo</Link>
          <Link href="/diagnostics" className="font-semibold text-brand">Diagnostics</Link>
          <Link href="/private-beta" className="font-semibold text-brand">Private Beta</Link>
          <Link href="/tester-guide" className="font-semibold text-brand">Hướng dẫn tester</Link>
          <BugReportLink source="dashboard" />
        </span>

        <div className="space-y-8">
          {categoryOrder.map((item) => {
            const tools = filteredTools.filter((tool) => tool.category === item);
            if (!tools.length) return null;
            return <ToolCategorySection key={item} title={categoryLabels[item]} tools={tools} />;
          })}
          {!filteredTools.length ? (
            <div className="empty-state">
              <p className="font-semibold text-ink">Không tìm thấy công cụ phù hợp.</p>
              <button className="btn-secondary mt-3" onClick={() => { setQuery(""); setCategory("Tất cả"); }}>Xóa bộ lọc</button>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { ToolCategorySection } from "@/components/ToolCategorySection";
import { ToolCard } from "@/components/ToolCard";
import { categoryLabels, categoryOrder, toolRegistry } from "@/lib/tool-registry";

export default function ToolsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");

  const filteredTools = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return toolRegistry.filter((tool) => {
      const matchCategory = category === "Tất cả" || categoryLabels[tool.category] === category;
      const matchQuery = !normalized || tool.title.toLowerCase().includes(normalized) || tool.description.toLowerCase().includes(normalized);
      return matchCategory && matchQuery;
    });
  }, [category, query]);

  const popularTools = toolRegistry.filter((tool) => tool.popular);

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title="Tất cả công cụ Classora" description="Tìm nhanh các workflow mock dành cho soạn đề, soạn bài, chủ nhiệm, LaTeX và cá nhân hóa." />

        <section className="mb-8 card p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="text-brand" size={18} />
            <h2 className="text-lg font-bold text-ink">Công cụ phổ biến</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {popularTools.map((tool) => (
              <ToolCard key={tool.href} title={tool.title} description={tool.description} href={tool.href} />
            ))}
          </div>
        </section>

        <section className="mb-8 card p-5">
          <h2 className="text-lg font-bold text-ink">Tìm kiếm</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_240px]">
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

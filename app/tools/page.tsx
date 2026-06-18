"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { ToolCard } from "@/components/ToolCard";
import { getFavoriteTools } from "@/lib/favorites";
import { getRecentTools } from "@/lib/recent-tools";
import { categoryLabels, categoryOrder, toolRegistry } from "@/lib/tool-registry";

type Mode = "Tất cả" | "Phổ biến" | "Yêu thích" | "Gần đây";

export default function ToolsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [mode, setMode] = useState<Mode>("Tất cả");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => { setFavorites(getFavoriteTools()); setRecent(getRecentTools().map((item) => item.href)); };
    const value = new URLSearchParams(window.location.search).get("category");
    queueMicrotask(() => {
      if (value && value in categoryLabels) setCategory(categoryLabels[value as keyof typeof categoryLabels]);
      refresh();
    });
    window.addEventListener("classora-favorites-change", refresh);
    window.addEventListener("classora-recent-tools-change", refresh);
    return () => { window.removeEventListener("classora-favorites-change", refresh); window.removeEventListener("classora-recent-tools-change", refresh); };
  }, []);

  const filteredTools = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return toolRegistry.filter((tool) => {
      const matchCategory = category === "Tất cả" || categoryLabels[tool.category] === category;
      const matchQuery = !normalized || `${tool.title} ${tool.description}`.toLowerCase().includes(normalized);
      const matchMode = mode === "Tất cả" || (mode === "Phổ biến" && tool.popular) || (mode === "Yêu thích" && favorites.includes(tool.href)) || (mode === "Gần đây" && recent.includes(tool.href));
      return matchCategory && matchQuery && matchMode;
    }).sort((a, b) => mode === "Gần đây" ? recent.indexOf(a.href) - recent.indexOf(b.href) : 0);
  }, [category, favorites, mode, query, recent]);

  function clearFilters() { setQuery(""); setCategory("Tất cả"); setMode("Tất cả"); }

  return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-5 md:p-8">
    <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200 sm:p-8"><p className="text-xs font-bold uppercase tracking-wider text-blue-200">Thư viện workflow</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Tất cả công cụ Soạn Lab</h1><p className="mt-3 max-w-2xl text-blue-100">Tìm kiếm, lọc và đánh dấu yêu thích để mở workflow nhanh hơn.</p></section>
    <section className="card mb-6 p-5 sm:p-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
        <label className="relative block"><Search className="absolute left-3 top-3 text-slate-400" size={17} /><input className="form-field pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên hoặc mô tả công cụ..." /></label>
        <select className="form-field" value={category} onChange={(event) => setCategory(event.target.value)}><option>Tất cả</option>{categoryOrder.map((item) => <option key={item}>{categoryLabels[item]}</option>)}</select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">{(["Tất cả", "Phổ biến", "Yêu thích", "Gần đây"] as Mode[]).map((item) => <button key={item} type="button" className={mode === item ? "btn-primary" : "btn-secondary"} onClick={() => setMode(item)}>{item}</button>)}<button type="button" className="btn-secondary" onClick={clearFilters}>Xóa bộ lọc</button></div>
      <p className="mt-3 text-sm font-medium text-muted">Hiển thị {filteredTools.length} công cụ</p>
    </section>
    {filteredTools.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredTools.map((tool) => <ToolCard key={tool.href} title={tool.title} description={tool.description} href={tool.href} badge={tool.badge || (tool.popular ? "Phổ biến" : undefined)} categoryLabel={categoryLabels[tool.category]} />)}</div> : <div className="empty-state"><p className="font-semibold text-ink">Không tìm thấy công cụ phù hợp.</p><button className="btn-secondary mt-4" onClick={clearFilters}>Xóa bộ lọc</button></div>}
  </main></div>;
}

"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ToolCard } from "@/components/ToolCard";
import { getFavoriteTools } from "@/lib/favorites";
import { getRecentTools } from "@/lib/recent-tools";
import { categoryLabels, categoryOrder, toolRegistry } from "@/lib/tool-registry";

type Mode = "Tất cả" | "Phổ biến" | "Yêu thích" | "Gần đây";

export default function ToolsPage() {
  return <Suspense fallback={null}><ToolsContent /></Suspense>;
}

function ToolsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [mode, setMode] = useState<Mode>("Tất cả");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => { setFavorites(getFavoriteTools()); setRecent(getRecentTools().map((item) => item.href)); };
    queueMicrotask(() => {
      setCategory(categoryParam && categoryParam in categoryLabels ? categoryLabels[categoryParam as keyof typeof categoryLabels] : "Tất cả");
      refresh();
    });
    window.addEventListener("classora-favorites-change", refresh);
    window.addEventListener("classora-recent-tools-change", refresh);
    return () => { window.removeEventListener("classora-favorites-change", refresh); window.removeEventListener("classora-recent-tools-change", refresh); };
  }, [categoryParam]);

  const filteredTools = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return toolRegistry.filter((tool) => {
      const matchCategory = category === "Tất cả" || categoryLabels[tool.category] === category;
      const matchQuery = !normalized || `${tool.title} ${tool.description}`.toLowerCase().includes(normalized);
      const matchMode = mode === "Tất cả" || (mode === "Phổ biến" && tool.popular) || (mode === "Yêu thích" && favorites.includes(tool.href)) || (mode === "Gần đây" && recent.includes(tool.href));
      return matchCategory && matchQuery && matchMode;
    }).sort((a, b) => mode === "Gần đây" ? recent.indexOf(a.href) - recent.indexOf(b.href) : 0);
  }, [category, favorites, mode, query, recent]);

  function changeCategory(value: string) {
    setCategory(value);
    const slug = categoryOrder.find((item) => categoryLabels[item] === value);
    router.replace(slug ? `/tools?category=${slug}` : "/tools", { scroll: false });
  }

  function clearFilters() {
    setQuery("");
    setCategory("Tất cả");
    setMode("Tất cả");
    router.replace("/tools", { scroll: false });
  }

  return <AppShell title="Công cụ Soạn Lab">
    <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200 sm:p-8"><p className="text-xs font-bold uppercase tracking-wider text-blue-200">Thư viện workflow</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Tất cả công cụ Soạn Lab</h1><p className="mt-3 max-w-2xl text-blue-100">Tìm kiếm, lọc và đánh dấu yêu thích để mở workflow nhanh hơn.</p></section>
    <section className="card mb-6 p-5 sm:p-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
        <label className="relative block"><Search className="absolute left-3 top-3 text-slate-400" size={17} /><input className="form-field pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên hoặc mô tả công cụ..." /></label>
        <select className="form-field" value={category} onChange={(event) => changeCategory(event.target.value)}><option>Tất cả</option>{categoryOrder.map((item) => <option key={item}>{categoryLabels[item]}</option>)}</select>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{["Tất cả", ...categoryOrder.map((item) => categoryLabels[item])].map((item) => <button key={item} type="button" className={category === item ? "btn-primary shrink-0" : "btn-secondary shrink-0"} onClick={() => changeCategory(item)}>{item}</button>)}</div>
      <div className="mt-3 flex flex-wrap gap-2">{(["Tất cả", "Phổ biến", "Yêu thích", "Gần đây"] as Mode[]).map((item) => <button key={item} type="button" className={mode === item ? "rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white" : "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-muted hover:border-brand hover:text-brand"} onClick={() => setMode(item)}>{item}</button>)}<button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-muted hover:text-brand" onClick={clearFilters}>Xóa bộ lọc</button></div>
      <p className="mt-3 text-sm font-medium text-muted">Hiển thị {filteredTools.length} công cụ</p>
    </section>
    {filteredTools.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredTools.map((tool) => <ToolCard key={tool.href} title={tool.title} description={tool.description} href={tool.href} badge={tool.badge || (tool.popular ? "Phổ biến" : undefined)} categoryLabel={categoryLabels[tool.category]} />)}</div> : <div className="empty-state"><p className="font-semibold text-ink">Không tìm thấy công cụ phù hợp.</p><button className="btn-secondary mt-4" onClick={clearFilters}>Xóa bộ lọc</button></div>}
  </AppShell>;
}

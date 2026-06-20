"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Database, FileDown, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ToolCard } from "@/components/ToolCard";
import { SoanLabEmptyState } from "@/components/ui/SoanLabEmptyState";
import { SoanLabIllustration } from "@/components/ui/SoanLabIllustration";
import { getFavoriteTools } from "@/lib/favorites";
import { getRecentTools } from "@/lib/recent-tools";
import {
  categoryLabels,
  categoryOrder,
  toolRegistry,
} from "@/lib/tool-registry";
type Mode = "Tất cả" | "Phổ biến" | "Yêu thích" | "Gần đây";
export default function ToolsPage() {
  return (
    <Suspense fallback={null}>
      <ToolsContent />
    </Suspense>
  );
}
function ToolsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const categoryParam = params.get("category");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [mode, setMode] = useState<Mode>("Tất cả");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    const refresh = () => {
      setFavorites(getFavoriteTools());
      setRecent(getRecentTools().map((x) => x.href));
    };
    queueMicrotask(() => {
      setCategory(
        categoryParam && categoryParam in categoryLabels
          ? categoryLabels[categoryParam as keyof typeof categoryLabels]
          : "Tất cả",
      );
      refresh();
    });
    window.addEventListener("classora-favorites-change", refresh);
    window.addEventListener("classora-recent-tools-change", refresh);
    return () => {
      window.removeEventListener("classora-favorites-change", refresh);
      window.removeEventListener("classora-recent-tools-change", refresh);
    };
  }, [categoryParam]);
  const tools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return toolRegistry
      .filter(
        (t) =>
          (category === "Tất cả" || categoryLabels[t.category] === category) &&
          (!q || `${t.title} ${t.description}`.toLowerCase().includes(q)) &&
          (mode === "Tất cả" ||
            (mode === "Phổ biến" && t.popular) ||
            (mode === "Yêu thích" && favorites.includes(t.href)) ||
            (mode === "Gần đây" && recent.includes(t.href))),
      )
      .sort((a, b) =>
        mode === "Gần đây"
          ? recent.indexOf(a.href) - recent.indexOf(b.href)
          : 0,
      );
  }, [category, favorites, mode, query, recent]);
  function change(value: string) {
    setCategory(value);
    const slug = categoryOrder.find((x) => categoryLabels[x] === value);
    router.replace(slug ? `/tools?category=${slug}` : "/tools", {
      scroll: false,
    });
  }
  function clear() {
    setQuery("");
    setCategory("Tất cả");
    setMode("Tất cả");
    router.replace("/tools", { scroll: false });
  }
  return (
    <AppShell title="Công cụ">
      <section className="hero-gradient relative mb-6 overflow-hidden rounded-[28px] p-5 text-white shadow-[0_18px_44px_rgba(37,99,235,.18)] sm:p-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[36px] border-white/10" />
        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-blue-200">
            Thư viện workflow
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Các công cụ của <span className="text-cyan-300">Soạn Lab</span>
          </h1>
          <p className="mt-3 text-blue-100">
            Một nơi để soạn đề, tạo tài liệu, viết nhận xét và xuất Word.
          </p>
          <label className="relative mt-6 block max-w-2xl">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              className="h-14 w-full rounded-2xl border-0 bg-white pl-12 pr-4 text-sm font-medium text-slate-800 shadow-xl outline-none ring-1 ring-white/30 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-300/40"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm công cụ theo tên hoặc mô tả..."
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold ring-1 ring-white/20">20+ công cụ</span>
            <span className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold ring-1 ring-white/20"><Database size={13} className="mr-1 inline" />Lưu local</span>
            <span className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold ring-1 ring-white/20"><FileDown size={13} className="mr-1 inline" />Xuất Word</span>
          </div>
        </div>
        <SoanLabIllustration variant="workspace" className="hidden bg-white/95 lg:block" />
        </div>
      </section>
      <section className="premium-card mb-7 p-3 sm:p-4">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {["Tất cả", ...categoryOrder.map((x) => categoryLabels[x])].map(
            (x) => (
              <button
                key={x}
                type="button"
                onClick={() => change(x)}
                className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold transition ${category === x ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
              >
                {x}
              </button>
            ),
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3">
          {(["Tất cả", "Phổ biến", "Yêu thích", "Gần đây"] as Mode[]).map(
            (x) => (
              <button
                key={x}
                onClick={() => setMode(x)}
                className={`rounded-xl px-3 py-2 text-xs font-bold ${mode === x ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
              >
                {x}
              </button>
            ),
          )}
          <button
            onClick={clear}
            className="rounded-xl px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
          >
            Xóa bộ lọc
          </button>
          <span className="ml-auto text-sm font-semibold text-slate-400">
            {tools.length} công cụ
          </span>
        </div>
      </section>
      {tools.length ? (
        <div className="rounded-[28px] bg-gradient-to-b from-blue-50/60 to-transparent p-1 sm:p-3">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {tools.map((t) => (
              <ToolCard
                key={t.href}
                {...t}
                badge={t.badge || (t.popular ? "Phổ biến" : undefined)}
                categoryLabel={categoryLabels[t.category]}
              />
            ))}
          </div>
        </div>
      ) : (
        <SoanLabEmptyState
          title="Không tìm thấy công cụ phù hợp"
          description="Thử từ khóa khác hoặc xóa các bộ lọc hiện tại để xem lại toàn bộ thư viện."
          action={<button className="btn-secondary" onClick={clear}>
            Xóa bộ lọc
          </button>}
        />
      )}
    </AppShell>
  );
}

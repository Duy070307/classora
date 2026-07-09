"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { FileDown, History, Search, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ToolCard } from "@/components/ToolCard";
import { SoanLabEmptyState } from "@/components/ui/SoanLabEmptyState";
import { getFavoriteTools } from "@/lib/favorites";
import { getRecentTools } from "@/lib/recent-tools";
import { categoryLabels, categoryOrder, getToolSearchText, toolRegistry } from "@/lib/tool-registry";

type Mode = "Tất cả" | "Phổ biến" | "Yêu thích" | "Gần đây";

const displayCategories = ["Tất cả", "Soạn đề", "Tài liệu", "Nhận xét", "Phụ huynh", "Toán/LaTeX", "Trực quan", "Quản lý dữ liệu"];

function categoryMatches(toolCategory: string, label: string) {
  if (label === "Tất cả") return true;
  if (label === "Soạn đề") return toolCategory === "exam-assessment";
  if (label === "Tài liệu") return toolCategory === "lesson-materials";
  if (label === "Nhận xét" || label === "Phụ huynh") return toolCategory === "homeroom-parent";
  if (label === "Toán/LaTeX") return toolCategory === "formula-latex";
  if (label === "Trực quan") return toolCategory === "visual-tools";
  if (label === "Quản lý dữ liệu") return toolCategory === "personalization";
  return true;
}

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
      const registryCategory = categoryParam && categoryParam in categoryLabels
        ? categoryLabels[categoryParam as keyof typeof categoryLabels]
        : "Tất cả";
      setCategory(registryCategory === "Soạn đề & kiểm tra" ? "Soạn đề" : registryCategory);
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
      .filter((tool) =>
        categoryMatches(tool.category, category) &&
        (!q || getToolSearchText(tool).includes(q)) &&
        (mode === "Tất cả" ||
          (mode === "Phổ biến" && tool.popular) ||
          (mode === "Yêu thích" && favorites.includes(tool.href)) ||
          (mode === "Gần đây" && recent.includes(tool.href))),
      )
      .sort((a, b) => mode === "Gần đây" ? recent.indexOf(a.href) - recent.indexOf(b.href) : 0);
  }, [category, favorites, mode, query, recent]);

  function change(value: string) {
    setCategory(value);
    const slug = categoryOrder.find((x) => categoryLabels[x] === value);
    router.replace(slug ? `/tools?category=${slug}` : "/tools", { scroll: false });
  }

  function clear() {
    setQuery("");
    setCategory("Tất cả");
    setMode("Tất cả");
    router.replace("/tools", { scroll: false });
  }

  return (
    <AppShell title="Công cụ">
      <section className="relative mb-6 overflow-hidden rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="relative max-w-4xl">
          <p className="text-xs font-extrabold uppercase tracking-[.14em] text-blue-700">Thư viện công cụ giáo viên</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Tìm công cụ phù hợp cho tiết dạy hôm nay</h1>
          <p className="mt-4 max-w-2xl text-slate-600">Soạn đề, tạo tài liệu, viết nhận xét, xử lý LaTeX và lưu lại lịch sử trong một không gian gọn gàng.</p>
          <label className="relative mt-7 block max-w-3xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
            <input
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm: đề, kiểm tra, phụ huynh, latex, hình học, nhận xét..."
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{toolRegistry.length}+ công cụ</span>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700"><Sparkles size={13} className="mr-1 inline" />Tạo bản nháp</span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"><History size={13} className="mr-1 inline" />Lưu lịch sử</span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"><FileDown size={13} className="mr-1 inline" />Xuất Word/PDF</span>
          </div>
        </div>
      </section>

      <section className="sticky top-[74px] z-10 mb-7 rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-xl sm:p-4">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {displayCategories.map((item) => (
            <button key={item} type="button" onClick={() => change(item)} className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-black transition ${category === item ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3">
          {(["Tất cả", "Phổ biến", "Yêu thích", "Gần đây"] as Mode[]).map((item) => (
            <button key={item} onClick={() => setMode(item)} className={`rounded-xl px-3 py-2 text-xs font-black ${mode === item ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
              {item}
            </button>
          ))}
          <button onClick={clear} className="rounded-xl px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-50">Xóa bộ lọc</button>
          <span className="ml-auto text-sm font-semibold text-slate-400">{tools.length} công cụ</span>
        </div>
      </section>

      <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-indigo-100 bg-indigo-50/70 p-4">
        <div>
          <p className="font-black text-slate-900">Chưa biết nên bắt đầu từ đâu?</p>
          <p className="mt-1 text-sm text-slate-600">Mở trung tâm tạo mới hoặc chọn trực tiếp công cụ phù hợp với công việc hôm nay.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/create" className="btn-primary">Tạo mới</Link>
          <Link href="/tools" className="btn-secondary">Xem công cụ</Link>
        </div>
      </div>

      {tools.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard
              key={tool.href}
              {...tool}
              badge={tool.badge || (tool.popular ? "Phổ biến" : undefined)}
              categoryLabel={categoryLabels[tool.category]}
            />
          ))}
        </div>
      ) : (
        <SoanLabEmptyState
          title="Chưa tìm thấy công cụ phù hợp."
          description="Thử từ khóa khác hoặc xóa bộ lọc hiện tại để xem lại toàn bộ thư viện."
          action={<button className="btn-secondary" onClick={clear}>Xem tất cả công cụ</button>}
        />
      )}
    </AppShell>
  );
}

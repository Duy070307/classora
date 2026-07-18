"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ToolCard } from "@/components/ToolCard";
import { SoanLabEmptyState } from "@/components/ui/SoanLabEmptyState";
import { getFavoriteTools } from "@/lib/favorites";
import { getRecentTools } from "@/lib/recent-tools";
import {
  categoryLabels,
  categoryOrder,
  getToolSearchText,
  toolRegistry,
} from "@/lib/tool-registry";

type Mode = "Tất cả" | "Phổ biến" | "Yêu thích" | "Gần đây";

const displayCategories = [
  "Tất cả",
  "Soạn đề",
  "Tài liệu",
  "Nhận xét",
  "Phụ huynh",
  "Toán/LaTeX",
  "Trực quan",
  "Quản lý dữ liệu",
];

function categoryMatches(toolCategory: string, label: string) {
  if (label === "Tất cả") return true;
  if (label === "Soạn đề") return toolCategory === "exam-assessment";
  if (label === "Tài liệu") return toolCategory === "lesson-materials";
  if (label === "Nhận xét" || label === "Phụ huynh")
    return toolCategory === "homeroom-parent";
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
      const registryCategory =
        categoryParam && categoryParam in categoryLabels
          ? categoryLabels[categoryParam as keyof typeof categoryLabels]
          : "Tất cả";
      setCategory(
        registryCategory === "Soạn đề & kiểm tra"
          ? "Soạn đề"
          : registryCategory,
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
        (tool) =>
          categoryMatches(tool.category, category) &&
          (!q || getToolSearchText(tool).includes(q)) &&
          (mode === "Tất cả" ||
            (mode === "Phổ biến" && tool.popular) ||
            (mode === "Yêu thích" && favorites.includes(tool.href)) ||
            (mode === "Gần đây" && recent.includes(tool.href))),
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
      <section className="relative mb-5 border-b border-slate-200 bg-white px-4 py-5 sm:px-5">
        <div className="relative max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-blue-700">
            Thư viện công cụ giáo viên
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Tìm công cụ phù hợp cho tiết dạy hôm nay
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Soạn đề, tạo tài liệu, viết nhận xét, xử lý LaTeX và lưu lại lịch sử
            trong một không gian gọn gàng.
          </p>
          <label className="relative mt-4 block max-w-3xl">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              className="form-field h-12 pl-12"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm: đề, kiểm tra, giáo án, LaTeX, hình học..."
            />
          </label>
        </div>
      </section>

      <section className="sticky top-[68px] z-10 mb-5 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-xl">
        <label className="block sm:hidden">
          <span className="label">Danh mục công cụ</span>
          <select className="form-field" value={category} onChange={(event) => change(event.target.value)}>
            {displayCategories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <div className="hidden flex-wrap gap-2 sm:flex">
          {displayCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => change(item)}
              className={`min-h-11 shrink-0 rounded-lg px-4 text-sm font-semibold transition ${category === item ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3">
          {(["Tất cả", "Phổ biến", "Yêu thích", "Gần đây"] as Mode[]).map(
            (item) => (
              <button
                key={item}
                onClick={() => setMode(item)}
                className={`min-h-11 rounded-lg px-3 py-2 text-xs font-semibold ${mode === item ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {item}
              </button>
            ),
          )}
          <button
            onClick={clear}
            className="min-h-11 rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
          >
            Xóa bộ lọc
          </button>
          <span className="ml-auto text-sm font-semibold text-slate-400">
            {tools.length} công cụ
          </span>
        </div>
      </section>

      {tools.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
          action={
            <button className="btn-secondary" onClick={clear}>
              Xem tất cả công cụ
            </button>
          }
        />
      )}
    </AppShell>
  );
}

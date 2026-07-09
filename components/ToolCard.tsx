"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SoanLabBadge } from "@/components/ui/SoanLabBadge";
import { SoanLabIcon, iconNameFromHref } from "@/components/ui/SoanLabIcon";
import { isFavoriteTool, toggleFavoriteTool } from "@/lib/favorites";
import { saveRecentTool } from "@/lib/recent-tools";

export function ToolCard({
  title,
  description,
  href,
  badge,
  categoryLabel,
  tags,
  example,
}: {
  title: string;
  description: string;
  href: string;
  badge?: string;
  categoryLabel?: string;
  tags?: string[];
  example?: string;
}) {
  const [favorite, setFavorite] = useState(false);
  const displayExample = useMemo(() => example || "Ví dụ: tạo bản nháp, rà soát và xuất tài liệu", [example]);
  const displayTags = tags?.length ? tags.slice(0, 3) : ["Bản nháp", "Rà soát", "Xuất file"];

  useEffect(() => {
    const refresh = () => setFavorite(isFavoriteTool(href));
    queueMicrotask(refresh);
    window.addEventListener("classora-favorites-change", refresh);
    return () => window.removeEventListener("classora-favorites-change", refresh);
  }, [href]);

  return (
    <article className="group relative flex min-h-[260px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-within:ring-4 focus-within:ring-blue-100">
      <button
        type="button"
        className={`absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition ${favorite ? "bg-amber-50 text-amber-500 ring-1 ring-amber-100" : "bg-white text-slate-400 ring-1 ring-slate-100 hover:bg-blue-50 hover:text-blue-600"}`}
        aria-label={favorite ? `Bỏ ${title} khỏi yêu thích` : `Thêm ${title} vào yêu thích`}
        onClick={() => {
          toggleFavoriteTool(href);
          setFavorite(isFavoriteTool(href));
        }}
      >
        <Star size={18} fill={favorite ? "currentColor" : "none"} />
      </button>

      <SoanLabIcon name={iconNameFromHref(href)} className="mb-4" />
      <div className="flex min-h-6 flex-wrap items-center gap-2 pr-10">
        {categoryLabel ? <span className="text-[11px] font-extrabold uppercase tracking-wide text-blue-600">{categoryLabel}</span> : null}
        {badge ? <SoanLabBadge tone={badge === "Mới" ? "new" : badge === "Hữu ích" ? "useful" : "popular"}>{badge}</SoanLabBadge> : null}
      </div>
      <h3 className="mt-3 text-lg font-black leading-6 text-slate-900">{title}</h3>
      <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-600">
        {displayExample}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {displayTags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-600 ring-1 ring-slate-100">
            {tag === "Bản nháp" ? <CheckCircle2 size={13} className="text-emerald-600" /> : null}
            {tag}
          </span>
        ))}
      </div>
      <Link
        href={href}
        onClick={() => saveRecentTool({ href, title })}
        className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-black text-blue-700 outline-none focus-visible:rounded-xl focus-visible:ring-4 focus-visible:ring-blue-100"
      >
        <span>Mở công cụ</span>
        <ArrowRight size={17} className="transition group-hover:translate-x-1" />
      </Link>
    </article>
  );
}

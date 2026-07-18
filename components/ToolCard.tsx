"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { useEffect, useState } from "react";
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
  useEffect(() => {
    const refresh = () => setFavorite(isFavoriteTool(href));
    queueMicrotask(refresh);
    window.addEventListener("classora-favorites-change", refresh);
    return () => window.removeEventListener("classora-favorites-change", refresh);
  }, [href]);

  return (
    <article className="group relative flex min-h-[210px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm outline-none transition duration-200 hover:border-emerald-200 hover:shadow-md focus-within:ring-4 focus-within:ring-emerald-100">
      <button
        type="button"
        className={`absolute right-3 top-3 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-xl shadow-sm transition ${favorite ? "bg-amber-50 text-amber-600 ring-1 ring-amber-100" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700"}`}
        aria-label={favorite ? `Bỏ ${title} khỏi yêu thích` : `Thêm ${title} vào yêu thích`}
        onClick={() => {
          toggleFavoriteTool(href);
          setFavorite(isFavoriteTool(href));
        }}
      >
        <Star size={18} fill={favorite ? "currentColor" : "none"} />
      </button>

      <SoanLabIcon name={iconNameFromHref(href)} className="mb-3" />
      <div className="flex min-h-6 flex-wrap items-center gap-2 pr-10">
        {categoryLabel ? <span className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-700">{categoryLabel}</span> : null}
        {badge ? <SoanLabBadge tone={badge === "Mới" ? "new" : badge === "Hữu ích" ? "useful" : "popular"}>{badge}</SoanLabBadge> : null}
      </div>
      <h3 className="mt-2 text-base font-black leading-6 text-slate-900 sm:text-lg">{title}</h3>
      <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-slate-600">{description}</p>
      <Link
        href={href}
        onClick={() => saveRecentTool({ href, title })}
        className="mt-auto flex min-h-11 items-center justify-between border-t border-slate-100 pt-3 text-sm font-black text-emerald-800 outline-none focus-visible:rounded-xl focus-visible:ring-4 focus-visible:ring-emerald-100"
      >
        <span>Mở công cụ</span>
        <ArrowRight size={17} className="transition group-hover:translate-x-1" />
      </Link>
    </article>
  );
}

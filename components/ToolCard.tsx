"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { isFavoriteTool, toggleFavoriteTool } from "@/lib/favorites";
import { saveRecentTool } from "@/lib/recent-tools";
import { SoanLabBadge } from "@/components/ui/SoanLabBadge";
import { SoanLabIcon, iconNameFromHref } from "@/components/ui/SoanLabIcon";

export function ToolCard({ title, description, href, badge, categoryLabel }: { title: string; description: string; href: string; badge?: string; categoryLabel?: string }) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const refresh = () => setFavorite(isFavoriteTool(href));
    queueMicrotask(refresh);
    window.addEventListener("classora-favorites-change", refresh);
    return () => window.removeEventListener("classora-favorites-change", refresh);
  }, [href]);

  return <article className="premium-card premium-card-hover group relative flex min-h-[238px] flex-col overflow-hidden p-5">
    <div className="absolute -right-12 -top-14 h-32 w-32 rounded-full bg-blue-100/70 blur-2xl transition group-hover:bg-cyan-100" />
    <button
      type="button"
      className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition ${favorite ? "bg-amber-50 text-amber-500 ring-1 ring-amber-100" : "bg-white text-slate-400 ring-1 ring-slate-100 hover:bg-blue-50 hover:text-blue-600"}`}
      aria-label={favorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      onClick={() => { toggleFavoriteTool(href); setFavorite(isFavoriteTool(href)); }}
    >
      <Star size={18} fill={favorite ? "currentColor" : "none"} />
    </button>

    <SoanLabIcon name={iconNameFromHref(href)} className="mb-3" />
    <div className="flex min-h-6 flex-wrap items-center gap-2 pr-10">
      {categoryLabel ? <span className="text-[11px] font-extrabold uppercase tracking-wide text-blue-600">{categoryLabel}</span> : null}
      {badge ? <SoanLabBadge tone={badge === "Mới" ? "new" : badge === "Hữu ích" ? "useful" : "popular"}>{badge}</SoanLabBadge> : null}
    </div>
    <h3 className="mt-3 text-lg font-extrabold leading-6 text-slate-900">{title}</h3>
    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{description}</p>
    <Link href={href} onClick={() => saveRecentTool({ href, title })} className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-blue-700">
      <span>Mở công cụ</span>
      <ArrowRight size={17} className="transition group-hover:translate-x-1" />
    </Link>
  </article>;
}

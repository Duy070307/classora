"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { isFavoriteTool, toggleFavoriteTool } from "@/lib/favorites";
import { saveRecentTool } from "@/lib/recent-tools";

export function ToolCard({ title, description, href, badge, categoryLabel }: { title: string; description: string; href: string; badge?: string; categoryLabel?: string }) {
  const [favorite, setFavorite] = useState(false);
  useEffect(() => {
    const refresh = () => setFavorite(isFavoriteTool(href));
    queueMicrotask(refresh);
    window.addEventListener("classora-favorites-change", refresh);
    return () => window.removeEventListener("classora-favorites-change", refresh);
  }, [href]);

  return <article className="card app-card-hover group relative flex min-h-56 flex-col overflow-hidden p-5">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-violet-500 opacity-0 transition group-hover:opacity-100" />
    <button type="button" className={`absolute right-3 top-3 rounded-md p-2 ${favorite ? "bg-amber-50 text-amber-500" : "text-slate-400 hover:bg-slate-100"}`} aria-label={favorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"} title={favorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"} onClick={() => { toggleFavoriteTool(href); setFavorite(isFavoriteTool(href)); }}><Star size={18} fill={favorite ? "currentColor" : "none"} /></button>
    <div className="flex h-full flex-col pr-10">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-indigo-700 shadow-sm ring-1 ring-indigo-100"><Sparkles size={19} /></span>
      <div className="flex flex-wrap gap-2">{categoryLabel ? <span className="text-xs font-bold uppercase text-brand">{categoryLabel}</span> : null}{badge ? <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{badge}</span> : null}</div>
      <h3 className="mt-1 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      <Link href={href} onClick={() => saveRecentTool({ href, title })} className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-bold text-indigo-700 transition group-hover:gap-2">Mở công cụ <ArrowRight size={14} /></Link>
    </div>
  </article>;
}

"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
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

  return <article className="card group relative p-5 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg">
    <button type="button" className={`absolute right-3 top-3 rounded-md p-2 ${favorite ? "bg-amber-50 text-amber-500" : "text-slate-400 hover:bg-slate-100"}`} aria-label={favorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"} title={favorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"} onClick={() => { toggleFavoriteTool(href); setFavorite(isFavoriteTool(href)); }}><Star size={18} fill={favorite ? "currentColor" : "none"} /></button>
    <div className="pr-10">
      <div className="flex flex-wrap gap-2">{categoryLabel ? <span className="text-xs font-bold uppercase text-brand">{categoryLabel}</span> : null}{badge ? <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{badge}</span> : null}</div>
      <h3 className="mt-1 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      <Link href={href} onClick={() => saveRecentTool({ href, title })} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">Mở công cụ <ArrowRight size={14} /></Link>
    </div>
  </article>;
}

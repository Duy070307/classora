"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, Calculator, ClipboardList, FileText, MessageSquareText, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { isFavoriteTool, toggleFavoriteTool } from "@/lib/favorites";
import { saveRecentTool } from "@/lib/recent-tools";

function ToolIcon({ href }: { href: string }) {
  const Icon = href.includes("latex")
    ? Calculator
    : href.includes("comment") || href.includes("parent")
      ? MessageSquareText
      : href.includes("worksheet") || href.includes("lesson")
        ? BookOpenCheck
        : href.includes("exam") || href.includes("matrix") || href.includes("rubric")
          ? ClipboardList
          : href.includes("question")
            ? FileText
            : Sparkles;
  return <Icon size={22} strokeWidth={1.9} />;
}

export function ToolCard({ title, description, href, badge, categoryLabel }: { title: string; description: string; href: string; badge?: string; categoryLabel?: string }) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const refresh = () => setFavorite(isFavoriteTool(href));
    queueMicrotask(refresh);
    window.addEventListener("classora-favorites-change", refresh);
    return () => window.removeEventListener("classora-favorites-change", refresh);
  }, [href]);

  return <article className="premium-card premium-card-hover group relative flex min-h-[238px] flex-col p-5 sm:p-6">
    <button
      type="button"
      className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl transition ${favorite ? "bg-amber-50 text-amber-500 ring-1 ring-amber-100" : "bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600"}`}
      aria-label={favorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      onClick={() => { toggleFavoriteTool(href); setFavorite(isFavoriteTool(href)); }}
    >
      <Star size={18} fill={favorite ? "currentColor" : "none"} />
    </button>

    <span className="icon-tile mb-4"><ToolIcon href={href} /></span>
    <div className="flex min-h-7 flex-wrap items-center gap-2 pr-10">
      {categoryLabel ? <span className="soft-badge max-w-full truncate">{categoryLabel}</span> : null}
      {badge ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{badge}</span> : null}
    </div>
    <h3 className="mt-3.5 text-lg font-extrabold leading-6 text-slate-900">{title}</h3>
    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{description}</p>
    <Link href={href} onClick={() => saveRecentTool({ href, title })} className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-blue-700">
      <span>Mở công cụ</span>
      <ArrowRight size={17} className="transition group-hover:translate-x-1" />
    </Link>
  </article>;
}

"use client";

import Link from "next/link";
import { Star } from "lucide-react";
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
    <article className="group relative min-h-[132px] min-w-0 border-b border-slate-200 bg-white transition hover:bg-slate-50 focus-within:bg-blue-50/40 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 md:rounded-lg md:border">
      <button
        type="button"
        className={`absolute right-2 top-2 z-20 flex min-h-11 min-w-11 items-center justify-center rounded-lg transition focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-blue-500 ${favorite ? "bg-amber-50 text-amber-600 opacity-100" : "bg-white/90 text-slate-500 opacity-0 hover:bg-blue-50 hover:text-blue-700 group-hover:opacity-100 group-focus-within:opacity-100"}`}
        aria-label={favorite ? `Bỏ ${title} khỏi yêu thích` : `Thêm ${title} vào yêu thích`}
        onClick={() => {
          toggleFavoriteTool(href);
          setFavorite(isFavoriteTool(href));
        }}
      >
        <Star size={18} fill={favorite ? "currentColor" : "none"} />
      </button>

      <Link
        href={href}
        onClick={() => saveRecentTool({ href, title })}
        className="flex min-h-[132px] gap-3 p-4 pr-14 outline-none"
      >
        <SoanLabIcon name={iconNameFromHref(href)} size="sm" plain className="mt-0.5" />
        <span className="min-w-0">
          <span className="flex min-h-6 flex-wrap items-center gap-2">
            <span className="text-base font-semibold leading-6 text-slate-950">{title}</span>
            {badge ? <SoanLabBadge tone={badge === "Mới" ? "new" : "popular"}>{badge}</SoanLabBadge> : null}
          </span>
          <span className="mt-1.5 block line-clamp-3 text-sm leading-6 text-slate-600">{description}</span>
        </span>
      </Link>
    </article>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isFavoriteTool, toggleFavoriteTool } from "@/lib/favorites";
import { saveRecentTool } from "@/lib/recent-tools";
import { SoanLabBadge } from "@/components/ui/SoanLabBadge";
import { SoanLabIcon, iconNameFromHref } from "@/components/ui/SoanLabIcon";

const examples: Record<string, string> = {
  "/tools/exam-generator": "Ví dụ: Toán 12 THPTQG, kiểm tra 45 phút",
  "/tools/worksheet-generator": "Ví dụ: phiếu học tập Toán 8, hoạt động nhóm",
  "/tools/lesson-plan-generator": "Ví dụ: giáo án Ngữ văn 9, bài dạy 45 phút",
  "/tools/student-comments": "Ví dụ: nhận xét cuối kỳ, nhận xét tiến bộ",
  "/tools/parent-message-generator": "Ví dụ: nhắc học bài, báo tiến bộ, mời họp",
  "/tools/image-to-latex": "Ví dụ: ảnh công thức, hình học → TikZ",
  "/tools/rubric-generator": "Ví dụ: rubric bài viết, thuyết trình, dự án",
  "/question-bank": "Ví dụ: lưu và tái sử dụng câu hỏi theo chủ đề",
};

export function ToolCard({ title, description, href, badge, categoryLabel }: { title: string; description: string; href: string; badge?: string; categoryLabel?: string }) {
  const [favorite, setFavorite] = useState(false);
  const example = useMemo(() => examples[href] || "Ví dụ: tạo bản nháp, rà soát và xuất tài liệu", [href]);

  useEffect(() => {
    const refresh = () => setFavorite(isFavoriteTool(href));
    queueMicrotask(refresh);
    window.addEventListener("classora-favorites-change", refresh);
    return () => window.removeEventListener("classora-favorites-change", refresh);
  }, [href]);

  return (
    <article className="group relative flex min-h-[270px] flex-col overflow-hidden rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60">
      <div className="absolute -right-12 -top-14 h-32 w-32 rounded-full bg-blue-100/70 blur-2xl transition group-hover:bg-cyan-100" />
      <button
        type="button"
        className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition ${favorite ? "bg-amber-50 text-amber-500 ring-1 ring-amber-100" : "bg-white text-slate-400 ring-1 ring-slate-100 hover:bg-blue-50 hover:text-blue-600"}`}
        aria-label={favorite ? `Bỏ ${title} khỏi yêu thích` : `Thêm ${title} vào yêu thích`}
        onClick={() => { toggleFavoriteTool(href); setFavorite(isFavoriteTool(href)); }}
      >
        <Star size={18} fill={favorite ? "currentColor" : "none"} />
      </button>

      <SoanLabIcon name={iconNameFromHref(href)} className="mb-4" />
      <div className="flex min-h-6 flex-wrap items-center gap-2 pr-10">
        {categoryLabel ? <span className="text-[11px] font-extrabold uppercase tracking-wide text-blue-600">{categoryLabel}</span> : null}
        {badge ? <SoanLabBadge tone={badge === "Mới" ? "new" : badge === "Hữu ích" ? "useful" : "popular"}>{badge}</SoanLabBadge> : null}
      </div>
      <h3 className="mt-3 text-lg font-black leading-6 text-slate-900">{title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-4 rounded-2xl bg-blue-50/60 p-3 text-xs font-semibold leading-5 text-slate-600">
        {example}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700"><CheckCircle2 size={13} />Cần rà soát</span>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-extrabold text-indigo-700">Xuất Word/PDF</span>
      </div>
      <Link href={href} onClick={() => saveRecentTool({ href, title })} className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-black text-blue-700">
        <span>Mở công cụ</span>
        <ArrowRight size={17} className="transition group-hover:translate-x-1" />
      </Link>
    </article>
  );
}

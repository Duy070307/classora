import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ToolCard({ title, description, href, badge, categoryLabel }: { title: string; description: string; href: string; badge?: string; categoryLabel?: string }) {
  return (
    <Link href={href} className="card group block p-5 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">{categoryLabel ? <span className="text-xs font-bold uppercase text-brand">{categoryLabel}</span> : null}{badge ? <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{badge}</span> : null}</div>
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">Mở công cụ <ArrowRight size={14} /></span>
        </div>
        <span className="rounded-md bg-blue-50 p-2 text-brand transition group-hover:bg-brand group-hover:text-white">
          <ArrowRight size={18} />
        </span>
      </div>
    </Link>
  );
}

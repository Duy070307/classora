import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { SoanLabBadge } from "@/components/ui/SoanLabBadge";
import { SoanLabIcon, iconNameFromText, type SoanLabIconName } from "@/components/ui/SoanLabIcon";
import { accentForToolHeader, toolAccentClasses, type ToolAccentTone } from "@/lib/ui-accent";

export function ToolPageHeader({ title, description, category = "Công cụ giáo viên", iconName, exportable = true, accent, actions }: { title: string; description: string; category?: string; iconName?: SoanLabIconName; exportable?: boolean; accent?: ToolAccentTone; actions?: ReactNode }) {
  const resolvedIcon = iconName || iconNameFromText(title);
  const tone = accent || accentForToolHeader(title, category);
  const palette = toolAccentClasses[tone];
  return (
    <header data-tool-accent={tone} className="mb-5 border-b border-slate-200 bg-white px-1 pb-4 pt-1">
      <div className="relative">
        <Link href="/tools" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-50">
          <ArrowLeft size={14} />Quay lại thư viện công cụ
        </Link>
        {title === "Giáo án" ? <Link href="/tools/review-pack" className="ml-1 inline-flex min-h-11 items-center rounded-lg px-2.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-50">Tạo đề cương ôn tập</Link> : null}
        <div className={`mt-3 flex flex-col gap-3 border-l-2 pl-3 sm:flex-row sm:items-center ${palette.border}`}>
          <SoanLabIcon name={resolvedIcon} size="lg" tone={tone} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${palette.label}`}>{category}</span>
              {exportable ? <SoanLabBadge tone="export">Xuất Word/PDF</SoanLabBadge> : null}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-[1.75rem]">{title}</h1>
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted sm:text-base">{description}</p>
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2 sm:ml-auto sm:justify-end">{actions}</div> : null}
        </div>
      </div>
    </header>
  );
}

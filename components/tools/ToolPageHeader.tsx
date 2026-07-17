import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { SoanLabBadge } from "@/components/ui/SoanLabBadge";
import { SoanLabIcon, iconNameFromText, type SoanLabIconName } from "@/components/ui/SoanLabIcon";

const steps = ["Nhập thông tin", "Tạo bản nháp", "Xuất Word/PDF hoặc lưu lịch sử"];

export function ToolPageHeader({ title, description, category = "Công cụ giáo viên", iconName, exportable = true }: { title: string; description: string; category?: string; iconName?: SoanLabIconName; exportable?: boolean }) {
  const resolvedIcon = iconName || iconNameFromText(title);
  return (
    <header className="relative mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-blue-600" />
      <div className="relative">
        <Link href="/tools" className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1.5 text-xs font-bold text-brand transition hover:bg-blue-100">
          <ArrowLeft size={14} />Quay lại thư viện công cụ
        </Link>
        {title === "Giáo án" ? <Link href="/tools/review-pack" className="ml-2 inline-flex items-center rounded-full border border-blue-100 px-3 py-1.5 text-xs font-bold text-brand transition hover:bg-blue-50">Tạo đề cương ôn tập</Link> : null}
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
          <SoanLabIcon name={resolvedIcon} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="soft-badge">{category}</span>
              {exportable ? <SoanLabBadge tone="export">Xuất Word/PDF</SoanLabBadge> : null}
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-ink sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted sm:text-base">{description}</p>
            <div className="mt-3 flex gap-2 rounded-2xl bg-blue-50/70 p-3 text-sm leading-6 text-blue-900">
              <ShieldCheck className="mt-0.5 shrink-0 text-blue-600" size={18} />
              <p>Nội dung là bản nháp hỗ trợ giáo viên. Vui lòng rà soát trước khi sử dụng.</p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid min-w-0 gap-2 sm:grid-cols-3">
          {steps.map((step, index) => (
            <span key={step} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] text-white">{index + 1}</span>
              {step}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

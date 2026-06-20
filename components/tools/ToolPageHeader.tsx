import Link from "next/link";
import { ArrowLeft, Download, Sparkles } from "lucide-react";

const steps = ["Nhập thông tin", "Tạo bản nháp", "Xuất Word hoặc lưu lịch sử"];

export function ToolPageHeader({ title, description, category = "Công cụ giáo viên", icon: Icon = Sparkles, exportable = true }: { title: string; description: string; category?: string; icon?: typeof Sparkles; exportable?: boolean }) {
  return (
    <header className="relative mb-6 overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-5 shadow-[0_22px_60px_rgba(30,64,175,0.10)] sm:p-7">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-600 to-indigo-600" />
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/80 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-32 w-32 rounded-tl-[4rem] bg-gradient-to-br from-cyan-50 to-indigo-100/70" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/tools" className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1.5 text-xs font-bold text-brand transition hover:bg-blue-100">
            <ArrowLeft size={14} />Quay lại thư viện công cụ
          </Link>
        </div>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-blue-200">
            <Icon size={29} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="soft-badge">{category}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700"><Sparkles size={12} />AI mô phỏng</span>
              {exportable ? <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700"><Download size={12} />Xuất Word</span> : null}
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl lg:text-4xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted sm:text-base">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex min-w-0 flex-wrap gap-2">
          {steps.map((step, index) => (
            <span key={step} className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-gradient-to-r from-white to-blue-50 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] text-white">{index + 1}</span>
              {step}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

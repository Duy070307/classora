import { CheckCircle2, Download, FileText, Sparkles } from "lucide-react";

export function SoanLabIllustration({ variant = "workspace", className = "" }: { variant?: "workspace" | "document" | "empty" | "export"; className?: string }) {
  const rows = variant === "empty" ? 3 : 4;
  return (
    <div className={`relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-cyan-50 p-4 shadow-[0_18px_48px_rgba(30,64,175,0.10)] ${className}`}>
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-200/40 blur-2xl" />
      <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-indigo-200/35 blur-2xl" />
      <div className="relative flex h-full gap-3">
        {variant === "workspace" ? (
          <aside className="hidden w-14 rounded-2xl bg-blue-700/95 p-2 sm:block">
            <div className="h-6 rounded-xl bg-white/90" />
            <div className="mt-5 space-y-2">{[0, 1, 2, 3].map((item) => <div key={item} className="h-7 rounded-xl bg-white/15" />)}</div>
          </aside>
        ) : null}
        <div className="min-w-0 flex-1 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-blue-100/80">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><FileText size={18} /></span>
            <span className="rounded-full bg-cyan-50 px-2 py-1 text-[10px] font-black text-cyan-700">{variant === "export" ? "DOCX" : "Soạn Lab"}</span>
          </div>
          <div className="mt-4 h-3 w-2/3 rounded-full bg-slate-200" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: rows }).map((_, index) => <div key={index} className={`h-2 rounded-full ${index === rows - 1 ? "w-3/4 bg-blue-100" : "bg-slate-100"}`} />)}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <span className="rounded-2xl bg-blue-50 p-2 text-[10px] font-black text-blue-700"><CheckCircle2 size={12} className="mr-1 inline" />Kiểm tra</span>
            <span className="rounded-2xl bg-cyan-50 p-2 text-[10px] font-black text-cyan-700"><Download size={12} className="mr-1 inline" />Xuất Word</span>
          </div>
        </div>
      </div>
      <span className="absolute right-4 top-5 rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-indigo-700 shadow-md"><Sparkles size={12} className="mr-1 inline" />Tạo bản nháp</span>
    </div>
  );
}

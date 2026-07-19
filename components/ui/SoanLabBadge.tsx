import { CheckCircle2, Download, Sparkles, Star, Wand2 } from "lucide-react";

const styles = {
  demo: "border-blue-100 bg-blue-50 text-blue-800",
  ai: "border-blue-100 bg-blue-50 text-blue-800",
  export: "border-blue-100 bg-blue-50 text-blue-800",
  local: "border-slate-200 bg-slate-50 text-slate-700",
  mvp: "border-slate-200 bg-slate-50 text-slate-700",
  popular: "border-amber-100 bg-amber-50 text-amber-700",
  beta: "border-cyan-200 bg-cyan-50 text-cyan-800",
  new: "border-blue-100 bg-blue-50 text-blue-800",
  useful: "border-blue-100 bg-blue-50 text-blue-800",
  review: "border-orange-100 bg-orange-50 text-orange-700",
} as const;

const icons = {
  demo: Wand2,
  ai: Sparkles,
  export: Download,
  local: CheckCircle2,
  mvp: CheckCircle2,
  popular: Star,
  beta: Sparkles,
  new: Sparkles,
  useful: CheckCircle2,
  review: CheckCircle2,
} as const;

const labelMap = {
  demo: "Mẫu nhanh",
  ai: "Tạo tự động",
  export: "Xuất Word/PDF",
  local: "Lưu lịch sử",
  mvp: "Bản nháp",
  popular: "Phổ biến",
  beta: "Beta",
  new: "Mới",
  useful: "Hữu ích",
  review: "Cần rà soát",
} as const;

export type SoanLabBadgeTone = keyof typeof styles;

export function SoanLabBadge({ tone = "demo", children }: { tone?: SoanLabBadgeTone; children?: React.ReactNode }) {
  const Icon = icons[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>
      <Icon size={12} />
      {children || labelMap[tone]}
    </span>
  );
}

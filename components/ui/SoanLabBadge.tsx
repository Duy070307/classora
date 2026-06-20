import { CheckCircle2, Download, HardDrive, Sparkles, Star, Wand2 } from "lucide-react";

const styles = {
  demo: "border-blue-100 bg-blue-50 text-blue-700",
  ai: "border-violet-100 bg-violet-50 text-violet-700",
  export: "border-cyan-100 bg-cyan-50 text-cyan-700",
  local: "border-emerald-100 bg-emerald-50 text-emerald-700",
  mvp: "border-indigo-100 bg-indigo-50 text-indigo-700",
  popular: "border-amber-100 bg-amber-50 text-amber-700",
  new: "border-sky-100 bg-sky-50 text-sky-700",
  useful: "border-teal-100 bg-teal-50 text-teal-700",
  review: "border-orange-100 bg-orange-50 text-orange-700"
} as const;

const icons = {
  demo: Wand2,
  ai: Sparkles,
  export: Download,
  local: HardDrive,
  mvp: CheckCircle2,
  popular: Star,
  new: Sparkles,
  useful: CheckCircle2,
  review: CheckCircle2
} as const;

const labelMap = {
  demo: "Demo",
  ai: "AI mô phỏng",
  export: "Xuất Word",
  local: "Local",
  mvp: "MVP",
  popular: "Phổ biến",
  new: "Mới",
  useful: "Hữu ích",
  review: "Cần kiểm tra"
} as const;

export type SoanLabBadgeTone = keyof typeof styles;

export function SoanLabBadge({ tone = "demo", children }: { tone?: SoanLabBadgeTone; children?: React.ReactNode }) {
  const Icon = icons[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold shadow-sm ${styles[tone]}`}>
      <Icon size={12} />
      {children || labelMap[tone]}
    </span>
  );
}

import type { ToolCategory } from "@/lib/tool-registry";

export type ToolAccentTone = "blue" | "cyan" | "violet" | "amber" | "rose" | "slate";

export const toolAccentClasses: Record<ToolAccentTone, {
  border: string;
  hover: string;
  icon: string;
  label: string;
  text: string;
  dot: string;
}> = {
  blue: {
    border: "border-l-blue-500",
    hover: "hover:bg-blue-50/40",
    icon: "border-blue-200 bg-blue-50 text-blue-700",
    label: "border-blue-200 bg-blue-50 text-blue-800",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  cyan: {
    border: "border-l-cyan-600",
    hover: "hover:bg-cyan-50/50",
    icon: "border-cyan-200 bg-cyan-50 text-cyan-700",
    label: "border-cyan-200 bg-cyan-50 text-cyan-800",
    text: "text-cyan-700",
    dot: "bg-cyan-600",
  },
  violet: {
    border: "border-l-violet-600",
    hover: "hover:bg-violet-50/50",
    icon: "border-violet-200 bg-violet-50 text-violet-700",
    label: "border-violet-200 bg-violet-50 text-violet-800",
    text: "text-violet-700",
    dot: "bg-violet-600",
  },
  amber: {
    border: "border-l-amber-600",
    hover: "hover:bg-amber-50/60",
    icon: "border-amber-200 bg-amber-50 text-amber-700",
    label: "border-amber-200 bg-amber-50 text-amber-800",
    text: "text-amber-700",
    dot: "bg-amber-600",
  },
  rose: {
    border: "border-l-rose-600",
    hover: "hover:bg-rose-50/50",
    icon: "border-rose-200 bg-rose-50 text-rose-700",
    label: "border-rose-200 bg-rose-50 text-rose-800",
    text: "text-rose-700",
    dot: "bg-rose-600",
  },
  slate: {
    border: "border-l-slate-400",
    hover: "hover:bg-slate-50",
    icon: "border-slate-200 bg-slate-50 text-slate-700",
    label: "border-slate-200 bg-slate-50 text-slate-700",
    text: "text-slate-600",
    dot: "bg-slate-400",
  },
};

export function accentForToolCategory(category?: ToolCategory, href = ""): ToolAccentTone {
  if (href.includes("grading") || href.includes("rubric")) return "rose";
  if (category === "exam-assessment") return "amber";
  if (category === "lesson-materials") return "violet";
  if (category === "formula-latex" || category === "visual-tools") return "cyan";
  if (category === "personalization") return "slate";
  return "blue";
}

export function accentForToolHeader(title: string, category = ""): ToolAccentTone {
  const value = `${title} ${category}`.toLocaleLowerCase("vi");
  if (/tikz|latex|công thức|hình học|trực quan|3d|mô phỏng/.test(value)) return "cyan";
  if (/giáo án|phiếu học tập|slide|bài giảng|đề cương|tài liệu dạy học/.test(value)) return "violet";
  if (/rubric|chấm bài|đánh giá học tập/.test(value)) return "rose";
  if (/đề|kiểm tra|ma trận|đặc tả|đáp án|thang điểm/.test(value)) return "amber";
  return "blue";
}

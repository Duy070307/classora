import { BookOpenCheck, Box, CheckCircle2, Database, FileCheck2, FileText, Grid2X2, KeyRound, MessageSquareText, PenLine, Sigma, Shuffle, UploadCloud, UsersRound } from "lucide-react";

export type SoanLabIconName =
  | "exam" | "matrix" | "answer" | "shuffle" | "worksheet" | "lesson"
  | "comment" | "bulk-comment" | "question-bank" | "template" | "latex" | "visual" | "import" | "default";

export function iconNameFromHref(href: string): SoanLabIconName {
  if (href.includes("matrix")) return "matrix";
  if (href.includes("answer-key")) return "answer";
  if (href.includes("shuffler")) return "shuffle";
  if (href.includes("worksheet")) return "worksheet";
  if (href.includes("lesson")) return "lesson";
  if (href.includes("comment") || href.includes("parent")) return "comment";
  if (href.includes("question-bank") || href === "/question-bank") return "question-bank";
  if (href.includes("template") || href === "/templates") return "template";
  if (href.includes("3d-animation")) return "visual";
  if (href.includes("latex")) return "latex";
  if (href.includes("import")) return "import";
  if (href.includes("exam") || href.includes("rubric")) return "exam";
  return "default";
}

export function iconNameFromText(text: string): SoanLabIconName {
  const value = text.toLowerCase();
  if (value.includes("ma trận")) return "matrix";
  if (value.includes("đáp án") || value.includes("thang điểm")) return "answer";
  if (value.includes("trộn")) return "shuffle";
  if (value.includes("phiếu")) return "worksheet";
  if (value.includes("giáo án")) return "lesson";
  if (value.includes("hàng loạt")) return "bulk-comment";
  if (value.includes("nhận xét") || value.includes("phụ huynh")) return "comment";
  if (value.includes("ngân hàng")) return "question-bank";
  if (value.includes("mẫu")) return "template";
  if (value.includes("3d") || value.includes("mô phỏng")) return "visual";
  if (value.includes("latex")) return "latex";
  if (value.includes("nhập") || value.includes("import")) return "import";
  if (value.includes("đề") || value.includes("rubric")) return "exam";
  return "default";
}

const map = {
  exam: FileCheck2,
  matrix: Grid2X2,
  answer: KeyRound,
  shuffle: Shuffle,
  worksheet: PenLine,
  lesson: BookOpenCheck,
  comment: MessageSquareText,
  "bulk-comment": UsersRound,
  "question-bank": Database,
  template: FileText,
  latex: Sigma,
  visual: Box,
  import: UploadCloud,
  default: CheckCircle2
} as const;

export function SoanLabIcon({ name = "default", className = "", size = "md" }: { name?: SoanLabIconName; className?: string; size?: "sm" | "md" | "lg" }) {
  const Icon = map[name];
  const sizes = size === "lg" ? "h-14 w-14 rounded-2xl" : size === "sm" ? "h-10 w-10 rounded-xl" : "h-12 w-12 rounded-xl";
  const iconSize = size === "lg" ? 30 : size === "sm" ? 18 : 22;
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-800/10 ${sizes} ${className}`}>
      <Icon size={iconSize} strokeWidth={2} className="relative" />
    </span>
  );
}

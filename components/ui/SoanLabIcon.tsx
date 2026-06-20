import { BookOpenCheck, CheckCircle2, Database, FileCheck2, FileText, Grid2X2, KeyRound, MessageSquareText, PenLine, Sigma, Shuffle, UploadCloud, UsersRound } from "lucide-react";

export type SoanLabIconName =
  | "exam" | "matrix" | "answer" | "shuffle" | "worksheet" | "lesson"
  | "comment" | "bulk-comment" | "question-bank" | "template" | "latex" | "import" | "default";

export function iconNameFromHref(href: string): SoanLabIconName {
  if (href.includes("matrix")) return "matrix";
  if (href.includes("answer-key")) return "answer";
  if (href.includes("shuffler")) return "shuffle";
  if (href.includes("worksheet")) return "worksheet";
  if (href.includes("lesson")) return "lesson";
  if (href.includes("bulk-student-comments")) return "bulk-comment";
  if (href.includes("comment") || href.includes("parent")) return "comment";
  if (href.includes("question-bank") || href === "/question-bank") return "question-bank";
  if (href.includes("template") || href === "/templates") return "template";
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
  import: UploadCloud,
  default: CheckCircle2
} as const;

export function SoanLabIcon({ name = "default", className = "", size = "md" }: { name?: SoanLabIconName; className?: string; size?: "sm" | "md" | "lg" }) {
  const Icon = map[name];
  const sizes = size === "lg" ? "h-16 w-16 rounded-[1.35rem]" : size === "sm" ? "h-10 w-10 rounded-2xl" : "h-12 w-12 rounded-2xl";
  const iconSize = size === "lg" ? 30 : size === "sm" ? 18 : 22;
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-200/70 ${sizes} ${className}`}>
      <span className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-white/20" />
      <span className="absolute bottom-1 left-1 h-2 w-5 rounded-full bg-cyan-200/60" />
      <Icon size={iconSize} strokeWidth={2.1} className="relative" />
    </span>
  );
}

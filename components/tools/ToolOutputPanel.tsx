import { AlertTriangle, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function ToolOutputPanel({ loading = false, loadingTitle = "Đang tạo bản nháp...", loadingDescription = "Soạn Lab đang chuẩn bị nội dung cho bạn.", hasOutput, children, emptyTitle, emptyDescription, showWarning = true }: { loading?: boolean; loadingTitle?: string; loadingDescription?: string; hasOutput: boolean; children?: React.ReactNode; emptyTitle?: string; emptyDescription?: string; showWarning?: boolean }) {
  if (loading) return <div className="card flex min-h-80 items-center justify-center p-8 text-center"><div><Loader2 className="mx-auto animate-spin text-brand" size={36} /><p className="mt-5 font-bold text-ink">{loadingTitle}</p><p className="mt-2 text-sm leading-6 text-muted">{loadingDescription}</p></div></div>;
  if (!hasOutput) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return <div className="space-y-4">{children}{showWarning ? <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={18} /><p>Nội dung hiện được tạo bằng AI mô phỏng trong bản demo. Giáo viên cần kiểm tra lại trước khi sử dụng.</p></div> : null}</div>;
}

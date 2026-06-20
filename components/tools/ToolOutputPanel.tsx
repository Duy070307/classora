import { AlertTriangle, Loader2 } from "lucide-react";
import { SoanLabBadge } from "@/components/ui/SoanLabBadge";
import { SoanLabIllustration } from "@/components/ui/SoanLabIllustration";

export function ToolOutputPanel({ loading = false, loadingTitle = "Đang tạo bản nháp...", loadingDescription = "Soạn Lab đang chuẩn bị nội dung cho bạn.", hasOutput, children, emptyTitle, emptyDescription, showWarning = true }: { loading?: boolean; loadingTitle?: string; loadingDescription?: string; hasOutput: boolean; children?: React.ReactNode; emptyTitle?: string; emptyDescription?: string; showWarning?: boolean }) {
  if (loading) return <div className="card flex min-h-96 items-center justify-center overflow-hidden p-8 text-center"><div><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-brand"><Loader2 className="animate-spin" size={36} /></span><p className="mt-5 font-bold text-ink">{loadingTitle}</p><p className="mt-2 text-sm leading-6 text-muted">{loadingDescription}</p></div></div>;
  if (!hasOutput) return (
    <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/70 p-6 text-center shadow-[0_18px_48px_rgba(30,64,175,0.08)] sm:p-8">
      <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-cyan-100/70 blur-3xl" />
      <div className="relative mx-auto max-w-md">
        <SoanLabIllustration variant="document" className="max-w-xs" />
        <h2 className="mt-5 text-xl font-extrabold text-ink">{emptyTitle || "Kết quả sẽ hiển thị ở đây"}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{emptyDescription || "Sau khi tạo bản nháp, bạn có thể sao chép, lưu lịch sử hoặc xuất Word."}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2"><SoanLabBadge tone="export">Word</SoanLabBadge><SoanLabBadge tone="local">Lưu lịch sử</SoanLabBadge><SoanLabBadge tone="review">Cần kiểm tra</SoanLabBadge></div>
      </div>
    </section>
  );
  return <div className="space-y-4">{children}{showWarning ? <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900"><AlertTriangle className="mt-0.5 shrink-0 text-blue-600" size={18} /><p>Nội dung hiện được tạo bằng AI mô phỏng trong bản demo. Giáo viên cần kiểm tra lại trước khi sử dụng.</p></div> : null}</div>;
}

import { AlertTriangle, Loader2 } from "lucide-react";
import { SoanLabBadge } from "@/components/ui/SoanLabBadge";
import { SoanLabIllustration } from "@/components/ui/SoanLabIllustration";

export function ToolOutputPanel({ loading = false, loadingTitle = "Đang tạo bản nháp...", loadingDescription = "Soạn Lab đang chuẩn bị nội dung cho bạn.", hasOutput, children, emptyTitle, emptyDescription, showWarning = true }: { loading?: boolean; loadingTitle?: string; loadingDescription?: string; hasOutput: boolean; children?: React.ReactNode; emptyTitle?: string; emptyDescription?: string; showWarning?: boolean }) {
  if (loading) return <div className="card flex min-h-80 items-center justify-center overflow-hidden p-8 text-center"><div><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-brand"><Loader2 className="animate-spin" size={36} /></span><p className="mt-5 font-bold text-ink">{loadingTitle}</p><p className="mt-2 text-sm leading-6 text-muted">{loadingDescription}</p></div></div>;
  if (!hasOutput) return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/70 p-5 text-center shadow-[0_14px_38px_rgba(30,64,175,0.07)] sm:p-7">
      <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-cyan-100/70 blur-3xl" />
      <div className="relative mx-auto max-w-md">
        <SoanLabIllustration variant="document" className="max-w-[240px]" />
        <h2 className="mt-4 text-xl font-extrabold text-ink">{emptyTitle || "Kết quả sẽ hiển thị ở đây"}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{emptyDescription || "Sau khi tạo bản nháp, bạn có thể sao chép, lưu lịch sử hoặc xuất Word."}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2"><SoanLabBadge tone="export">Word</SoanLabBadge><SoanLabBadge tone="local">Lưu lịch sử</SoanLabBadge></div>
      </div>
    </section>
  );
  return <div className="space-y-4">{children}{showWarning ? <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900"><AlertTriangle className="mt-0.5 shrink-0 text-blue-600" size={18} /><p>Nội dung là bản nháp hỗ trợ soạn tài liệu. Giáo viên cần kiểm tra và chỉnh sửa trước khi sử dụng.</p></div> : null}</div>;
}

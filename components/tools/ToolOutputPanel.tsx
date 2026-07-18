import { AlertTriangle, Loader2 } from "lucide-react";
import { SoanLabBadge } from "@/components/ui/SoanLabBadge";
import { SoanLabIllustration } from "@/components/ui/SoanLabIllustration";

export function ToolOutputPanel({
  loading = false,
  loadingTitle = "Đang tạo bản nháp…",
  loadingDescription = "Soạn Lab đang chuẩn bị nội dung cho bạn.",
  hasOutput,
  children,
  emptyTitle,
  emptyDescription,
  showWarning = true,
}: {
  loading?: boolean;
  loadingTitle?: string;
  loadingDescription?: string;
  hasOutput: boolean;
  children?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  showWarning?: boolean;
}) {
  if (loading) {
    return (
      <div className="ui-panel p-7 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Loader2 className="animate-spin" size={36} />
        </span>
        <p className="mt-5 font-bold text-ink">{loadingTitle}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{loadingDescription}</p>
      </div>
    );
  }

  if (!hasOutput) {
    return (
      <section className="ui-panel relative overflow-hidden p-5 text-center sm:p-6">
        <div className="relative mx-auto max-w-md">
          <SoanLabIllustration variant="document" className="max-w-[200px]" />
          <h2 className="mt-4 text-xl font-black text-ink">{emptyTitle || "Kết quả sẽ xuất hiện tại đây"}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{emptyDescription || "Sau khi tạo bản nháp, thầy cô có thể sao chép, lưu lịch sử hoặc xuất Word/PDF."}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <SoanLabBadge tone="export">Word/PDF</SoanLabBadge>
            <SoanLabBadge tone="useful">Lưu lịch sử</SoanLabBadge>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {children}
      {showWarning ? (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={18} />
          <p>Nội dung là bản nháp hỗ trợ soạn tài liệu. Giáo viên cần kiểm tra và chỉnh sửa trước khi sử dụng.</p>
        </div>
      ) : null}
    </div>
  );
}

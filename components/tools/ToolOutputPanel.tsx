import { AlertTriangle, Loader2 } from "lucide-react";

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
      <div className="flex min-h-24 items-center gap-3 border-y border-slate-200 px-3 py-5" role="status">
        <Loader2 className="shrink-0 animate-spin text-blue-700" size={22} />
        <div>
          <p className="font-semibold text-ink">{loadingTitle}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{loadingDescription}</p>
        </div>
      </div>
    );
  }

  if (!hasOutput) {
    return (
      <section className="relative min-h-[420px] border border-slate-200 bg-white p-5 sm:p-8">
        <div className="mx-auto flex min-h-[350px] max-w-md flex-col items-center justify-center text-center">
          <span className="mb-5 h-1 w-12 bg-blue-600" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-ink">{emptyTitle || "Kết quả sẽ xuất hiện tại đây"}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{emptyDescription || "Sau khi tạo bản nháp, thầy cô có thể sao chép, lưu lịch sử hoặc xuất Word/PDF."}</p>
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

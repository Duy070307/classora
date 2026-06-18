import { FileText } from "lucide-react";

export function EmptyState({
  title = "Kết quả sẽ hiển thị ở đây",
  description = "Sau khi tạo bản nháp, bạn có thể sao chép, lưu lịch sử hoặc xuất Word.",
  icon: Icon = FileText
}: {
  title?: string;
  description?: string;
  icon?: typeof FileText;
}) {
  return <div className="flex min-h-72 items-center justify-center rounded-3xl border border-dashed border-blue-200 bg-gradient-to-br from-white via-white to-blue-50/70 p-8 text-center shadow-sm"><div className="max-w-sm"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-brand ring-8 ring-blue-50/50"><Icon size={25} /></span><h3 className="mt-6 text-lg font-bold text-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{description}</p></div></div>;
}

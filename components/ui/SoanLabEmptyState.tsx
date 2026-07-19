import { Inbox } from "lucide-react";

export function SoanLabEmptyState({
  title = "Chưa có dữ liệu",
  description = "Khi bạn bắt đầu sử dụng Soạn Lab, nội dung sẽ xuất hiện tại đây.",
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 text-center sm:p-8">
      <span className="mx-auto flex size-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
        <Inbox className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}

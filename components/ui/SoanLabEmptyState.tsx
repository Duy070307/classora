import { SoanLabIllustration } from "@/components/ui/SoanLabIllustration";

export function SoanLabEmptyState({ title = "Chưa có dữ liệu", description = "Khi bạn bắt đầu sử dụng Soạn Lab, nội dung sẽ xuất hiện tại đây.", action }: { title?: string; description?: string; action?: React.ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/70 p-5 text-center shadow-[0_14px_38px_rgba(30,64,175,.07)] sm:p-8">
      <SoanLabIllustration variant="empty" className="max-w-[240px]" />
      <h3 className="mt-5 text-xl font-extrabold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}

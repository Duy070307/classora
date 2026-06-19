import { LoadingDots } from "@/components/ui/LoadingDots";

export function PageLoading({ label = "Đang chuẩn bị không gian làm việc..." }: { label?: string }) {
  return <div className="flex min-h-[50vh] items-center justify-center p-6"><div className="app-surface px-8 py-7 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><LoadingDots /></div><p className="mt-4 text-sm font-bold text-ink">{label}</p></div></div>;
}

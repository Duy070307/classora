export function SkeletonCard() {
  return <div className="card animate-pulse p-5" aria-hidden="true">
    <div className="h-4 w-2/3 rounded bg-slate-200" />
    <div className="mt-4 h-3 w-full rounded bg-slate-100" />
    <div className="mt-2 h-3 w-4/5 rounded bg-slate-100" />
    <div className="mt-6 h-10 w-28 rounded bg-slate-200" />
  </div>;
}

export function PageLoading({ label = "Đang tải nội dung..." }: { label?: string }) {
  return <main className="min-h-screen p-4 sm:p-6 md:p-8" aria-busy="true" aria-live="polite">
    <div className="mx-auto max-w-6xl">
      <span className="sr-only">{label}</span>
      <div className="h-8 w-64 max-w-full animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => <SkeletonCard key={index} />)}
      </div>
    </div>
  </main>;
}

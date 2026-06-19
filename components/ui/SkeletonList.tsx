export function SkeletonList({ count = 3 }: { count?: number }) {
  return <div className="card divide-y divide-slate-100 overflow-hidden" aria-hidden="true">{Array.from({ length: count }).map((_, index) => <div key={index} className="flex animate-pulse items-center gap-3 p-4"><div className="h-10 w-10 rounded-xl bg-slate-200" /><div className="flex-1"><div className="h-3 w-2/5 rounded bg-slate-200" /><div className="mt-2 h-3 w-3/5 rounded bg-slate-100" /></div></div>)}</div>;
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-7 rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-blue-50/60 p-5 shadow-sm sm:p-7">
      <span className="soft-badge">Soạn Lab</span>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h1>
      {description ? <p className="mt-3 max-w-3xl leading-7 text-muted">{description}</p> : null}
    </div>
  );
}

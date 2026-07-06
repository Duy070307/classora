export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="relative mb-7 overflow-hidden rounded-[30px] border border-blue-100 bg-gradient-to-br from-white via-white to-indigo-50/70 p-5 shadow-sm sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-indigo-100/70 blur-3xl" />
      <div className="relative">
        <span className="soft-badge">Soạn Lab</span>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.025em] text-ink sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-3xl leading-7 text-muted">{description}</p> : null}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow = "Soạn Lab",
}: {
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <header className="relative mb-5 border-b border-slate-200 bg-white px-4 py-5 sm:px-5">
      <div>
        <span className="soft-badge">{eyebrow}</span>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.02em] text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted sm:text-base">{description}</p> : null}
      </div>
    </header>
  );
}

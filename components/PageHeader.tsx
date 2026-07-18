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
    <header className="relative mb-4 border-b border-slate-200 bg-white px-1 pb-4 pt-1">
      <div>
        {eyebrow !== "Soạn Lab" ? <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{eyebrow}</p> : null}
        <h1 className={`${eyebrow !== "Soạn Lab" ? "mt-1" : ""} text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl`}>{title}</h1>
        {description ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted sm:text-base">{description}</p> : null}
      </div>
    </header>
  );
}

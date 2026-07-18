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
    <header className="ui-panel relative mb-5 overflow-hidden border-l-4 border-l-emerald-700 p-4 sm:p-5">
      <div>
        <span className="soft-badge">{eyebrow}</span>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.02em] text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted sm:text-base">{description}</p> : null}
      </div>
    </header>
  );
}

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
    <div className="ui-panel relative mb-5 overflow-hidden border-l-4 border-l-emerald-700 p-5 sm:p-6">
      <div>
        <span className="soft-badge">{eyebrow}</span>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.025em] text-ink sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl leading-7 text-muted">{description}</p> : null}
      </div>
    </div>
  );
}

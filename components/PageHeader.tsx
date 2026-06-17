export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-normal text-ink">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-muted">{description}</p> : null}
    </div>
  );
}

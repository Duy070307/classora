import { ToolCard } from "@/components/ToolCard";

export type ToolLink = {
  title: string;
  description: string;
  href: string;
  badge?: string;
};

export function ToolCategorySection({ title, tools }: { title: string; tools: ToolLink[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.href} title={tool.title} description={tool.description} href={tool.href} badge={tool.badge} />
        ))}
      </div>
    </section>
  );
}

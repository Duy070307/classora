import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ToolCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} className="card group block p-5 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        </div>
        <span className="rounded-md bg-blue-50 p-2 text-brand transition group-hover:bg-brand group-hover:text-white">
          <ArrowRight size={18} />
        </span>
      </div>
    </Link>
  );
}

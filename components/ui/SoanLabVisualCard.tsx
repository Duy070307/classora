import { SoanLabIcon, type SoanLabIconName } from "@/components/ui/SoanLabIcon";

export function SoanLabVisualCard({ title, description, icon = "default", children }: { title: string; description?: string; icon?: SoanLabIconName; children?: React.ReactNode }) {
  return (
    <article className="relative overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white p-5 shadow-[0_14px_38px_rgba(30,64,175,0.08)]">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100/70 blur-2xl" />
      <div className="relative">
        <SoanLabIcon name={icon} />
        <h3 className="mt-4 font-extrabold text-ink">{title}</h3>
        {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
        {children}
      </div>
    </article>
  );
}

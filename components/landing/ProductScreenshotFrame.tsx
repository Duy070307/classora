import type { ReactNode } from "react";

type ProductScreenshotVariant = "browser" | "workspace" | "comparison" | "compact";

const variantClasses: Record<ProductScreenshotVariant, string> = {
  browser: "rounded-xl border-slate-300 shadow-[0_24px_64px_rgba(15,23,42,.13)]",
  workspace: "rounded-xl border-slate-200 shadow-[0_16px_42px_rgba(15,23,42,.1)]",
  comparison: "rounded-xl border-slate-300 shadow-[0_18px_48px_rgba(15,23,42,.12)]",
  compact: "rounded-lg border-slate-200 shadow-[0_12px_30px_rgba(15,23,42,.1)]",
};

export function ProductScreenshotFrame({
  title,
  caption,
  children,
  variant = "workspace",
  className = "",
}: {
  title: string;
  caption: string;
  children: ReactNode;
  variant?: ProductScreenshotVariant;
  className?: string;
}) {
  const browserFrame = variant === "browser";

  return (
    <figure className={`min-w-0 ${className}`} data-product-screenshot={variant}>
      <div className={`overflow-hidden border bg-white ${variantClasses[variant]}`}>
        {browserFrame ? (
          <div className="flex h-10 items-center gap-2 border-b border-slate-200 bg-slate-50 px-4" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-slate-300" />
            <span className="size-2.5 rounded-full bg-slate-300" />
            <span className="size-2.5 rounded-full bg-blue-400" />
            <span className="ml-2 truncate text-[11px] font-medium text-slate-500">SOẠN LAB · {title}</span>
          </div>
        ) : null}
        <div className="min-w-0">{children}</div>
      </div>
      <figcaption className="mt-3 text-sm leading-6 text-slate-500">{caption}</figcaption>
    </figure>
  );
}

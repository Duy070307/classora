import { Check } from "lucide-react";

export function PricingCard({ name, price, features, recommended = false }: { name: string; price: string; features: string[]; recommended?: boolean }) {
  return (
    <div className={`card relative flex h-full flex-col p-6 transition hover:-translate-y-1 hover:shadow-xl ${recommended ? "border-blue-300 ring-4 ring-blue-50" : ""}`}>
      {recommended ? <span className="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">Dự kiến phổ biến</span> : null}
      <h3 className="text-lg font-bold text-ink">{name}</h3>
      <p className="mt-3 text-2xl font-extrabold leading-tight text-brand">{price}</p>
      <ul className="mt-6 space-y-3 text-sm text-muted">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2.5">
            <Check className="mt-0.5 shrink-0 text-emerald-500" size={16} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <span className="mt-auto pt-7 text-xs font-semibold text-slate-400">Chưa kích hoạt thanh toán</span>
    </div>
  );
}

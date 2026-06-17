export function PricingCard({ name, price, features }: { name: string; price: string; features: string[] }) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold text-ink">{name}</h3>
      <p className="mt-2 text-2xl font-bold text-brand">{price}</p>
      <ul className="mt-4 space-y-2 text-sm text-muted">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

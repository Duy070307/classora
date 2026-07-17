"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type ActionMenuItem = {
  label: string;
  onSelect: () => void | Promise<void>;
  danger?: boolean;
  disabled?: boolean;
};

export function ActionMenu({
  label,
  items,
  className = "btn-secondary",
}: {
  label: string;
  items: ActionMenuItem[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKeyDown);
    queueMicrotask(() => firstItemRef.current?.focus());
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={className}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={label}
          className="absolute right-0 z-40 mt-2 min-w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={index === 0 ? firstItemRef : undefined}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-slate-50 focus:bg-blue-50 focus:outline-none disabled:opacity-50 ${item.danger ? "mt-1 border-t border-slate-100 text-red-700" : "text-slate-700"}`}
              onClick={() => {
                setOpen(false);
                void item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

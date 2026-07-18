"use client";

import { ChevronDown } from "lucide-react";
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        queueMicrotask(() => triggerRef.current?.focus());
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKeyDown);
    queueMicrotask(() => itemRefs.current.find((item) => item && !item.disabled)?.focus());
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function moveFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const enabledItems = itemRefs.current.filter((item): item is HTMLButtonElement => Boolean(item && !item.disabled));
    if (!enabledItems.length) return;
    const currentIndex = enabledItems.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? enabledItems.length - 1
        : event.key === "ArrowUp"
          ? (currentIndex <= 0 ? enabledItems.length - 1 : currentIndex - 1)
          : (currentIndex + 1) % enabledItems.length;
    enabledItems[nextIndex]?.focus();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
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
          onKeyDown={moveFocus}
          className="absolute right-0 z-40 mt-2 max-h-[min(24rem,calc(100dvh-6rem))] w-[min(16rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={`block min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition hover:bg-slate-50 focus:bg-emerald-50 focus:outline-none disabled:opacity-50 ${item.danger ? "mt-1 border-t border-slate-100 text-red-700" : "text-slate-700"}`}
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

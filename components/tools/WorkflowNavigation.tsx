"use client";

import type { KeyboardEvent } from "react";

export type WorkflowNavigationItem = {
  id: string;
  label: string;
  disabled?: boolean;
};

export function WorkflowStageNavigation({
  items,
  activeId,
  label = "Các bước thực hiện",
  onChange,
}: {
  items: WorkflowNavigationItem[];
  activeId: string;
  label?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <nav aria-label={label} className="border-y border-slate-200 bg-white">
      <ol className="grid min-w-0 grid-cols-1 sm:grid-cols-3">
        {items.map((item, index) => {
          const active = item.id === activeId;
          return (
            <li
              key={item.id}
              aria-current={active ? "step" : undefined}
              className={`min-w-0 border-b-2 text-sm font-semibold sm:border-b-0 sm:border-l-2 ${
                active
                  ? "border-blue-600 bg-blue-50/70 text-blue-800"
                  : "border-transparent text-slate-500"
              }`}
            >
              {onChange ? (
                <button type="button" disabled={item.disabled} onClick={() => onChange(item.id)} className="flex min-h-12 w-full min-w-0 items-center gap-2 px-3 py-2.5 text-left disabled:cursor-not-allowed disabled:opacity-45">
                  <StageLabel active={active} index={index} label={item.label} />
                </button>
              ) : (
                <div className="flex min-h-12 min-w-0 items-center gap-2 px-3 py-2.5">
                  <StageLabel active={active} index={index} label={item.label} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StageLabel({ active, index, label }: { active: boolean; index: number; label: string }) {
  return <>
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{index + 1}</span>
    <span className="truncate">{label.replace(/^\d+\.\s*/, "")}</span>
  </>;
}

export function SourceModeTabs({
  items,
  value,
  onChange,
  label = "Chọn nguồn nội dung",
}: {
  items: WorkflowNavigationItem[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + items.length) % items.length;
    onChange(items[nextIndex].id);
    const container = event.currentTarget.parentElement;
    (container?.querySelectorAll<HTMLButtonElement>("[role=tab]")[nextIndex])?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className="max-w-full overflow-x-auto border-b border-slate-200">
      <div className="flex w-max min-w-full items-end gap-1">
        {items.map((item, index) => {
          const active = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`min-h-11 shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "border-blue-600 bg-blue-50/60 text-blue-800"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { CheckCircle2, Circle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type AssessmentSourceOption = {
  id: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  action: ReactNode;
  disabledReason?: string;
};

export function AssessmentSourcePicker({
  options,
  selectedId,
  columns = 3,
  secondary,
  continueLabel,
  continueHint,
  onContinue,
}: {
  options: AssessmentSourceOption[];
  selectedId?: string;
  columns?: 3 | 4;
  secondary?: ReactNode;
  continueLabel?: string;
  continueHint?: string;
  onContinue?: () => void;
}) {
  const gridClass =
    columns === 4
      ? "md:grid-cols-2 xl:grid-cols-2"
      : "md:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="mt-5 space-y-4" data-assessment-source-picker>
      <div className={`grid grid-cols-1 gap-3 ${gridClass}`}>
        {options.map((option) => {
          const selected = option.id === selectedId;
          const Icon = option.icon;
          return (
            <article
              key={option.id}
              className={`flex min-h-44 min-w-0 flex-col rounded-2xl border p-4 transition ${
                selected
                  ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-100"
                  : option.disabledReason
                    ? "border-slate-200 bg-slate-50 opacity-75"
                    : "border-slate-200 bg-white hover:border-emerald-300"
              }`}
              aria-current={selected ? "true" : undefined}
            >
              <div className="flex min-w-0 items-start gap-3">
                {Icon ? (
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black leading-6 text-slate-950">
                      {option.title}
                    </h3>
                    {selected ? (
                      <CheckCircle2
                        className="shrink-0 text-emerald-700"
                        size={19}
                        aria-label="Đã chọn"
                      />
                    ) : (
                      <Circle
                        className="shrink-0 text-slate-300"
                        size={19}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {option.description}
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-4">{option.action}</div>
              {option.disabledReason ? (
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                  {option.disabledReason}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      {secondary ? <div>{secondary}</div> : null}

      {selectedId && continueLabel && onContinue ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold leading-6 text-emerald-950">
            {continueHint || "Nguồn đã sẵn sàng để tiếp tục."}
          </p>
          <button
            type="button"
            className="btn-primary shrink-0"
            onClick={onContinue}
          >
            {continueLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

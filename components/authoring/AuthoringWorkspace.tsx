"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";

type AuthoringView = "navigator" | "canvas" | "inspector";

export function AuthoringActionBar({
  children,
  status,
}: {
  children: ReactNode;
  status?: ReactNode;
}) {
  return (
    <div className="ui-toolbar mb-4" data-authoring-action-bar>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {children}
      </div>
      {status ? (
        <div
          className="shrink-0 text-sm font-semibold text-slate-600"
          aria-live="polite"
        >
          {status}
        </div>
      ) : null}
    </div>
  );
}

export function AuthoringWorkspace({
  navigator,
  canvas,
  inspector,
  navigatorLabel,
  canvasLabel = "Bản xem trước",
  inspectorLabel,
  selectionLabel,
}: {
  navigator: ReactNode;
  canvas: ReactNode;
  inspector: ReactNode;
  navigatorLabel: string;
  canvasLabel?: string;
  inspectorLabel: string;
  selectionLabel?: string;
}) {
  const [view, setView] = useState<AuthoringView>("canvas");
  const workspaceId = useId();
  const tabs: Array<[AuthoringView, string]> = [
    ["navigator", navigatorLabel],
    ["canvas", canvasLabel],
    ["inspector", inspectorLabel],
  ];

  return (
    <div data-authoring-workspace>
      <div className="ui-toolbar mb-4 2xl:hidden">
        <div
          className="ui-segmented-control grid w-full grid-cols-3"
          role="tablist"
          aria-label="Chọn vùng làm việc"
        >
          {tabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`${workspaceId}-tab-${value}`}
              aria-selected={view === value}
              aria-controls={`${workspaceId}-panel-${value}`}
              className={
                view === value
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-600 hover:bg-white/70"
              }
              onClick={() => setView(value)}
            >
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
        {selectionLabel ? (
          <p className="w-full truncate text-xs font-semibold text-slate-500">
            Đang chọn: {selectionLabel}
          </p>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-4 2xl:grid-cols-[260px_minmax(0,1fr)_360px]">
        <div
          id={`${workspaceId}-panel-navigator`}
          role="tabpanel"
          aria-labelledby={`${workspaceId}-tab-navigator`}
          className={`${view === "navigator" ? "block" : "hidden"} min-w-0 2xl:block`}
        >
          {navigator}
        </div>
        <div
          id={`${workspaceId}-panel-canvas`}
          role="tabpanel"
          aria-labelledby={`${workspaceId}-tab-canvas`}
          className={`${view === "canvas" ? "block" : "hidden"} min-w-0 2xl:block`}
        >
          {canvas}
        </div>
        <div
          id={`${workspaceId}-panel-inspector`}
          role="tabpanel"
          aria-labelledby={`${workspaceId}-tab-inspector`}
          className={`${view === "inspector" ? "block" : "hidden"} min-w-0 2xl:block`}
        >
          {inspector}
        </div>
      </div>
    </div>
  );
}

export function AuthoringDisclosure({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="rounded-2xl border border-slate-200 bg-white"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none px-4 py-3 font-bold text-slate-800 marker:hidden">
        <span className="flex min-h-6 items-center justify-between gap-3">
          <span>{title}</span>
          <span aria-hidden="true" className="text-emerald-700">
            ＋
          </span>
        </span>
        {description ? (
          <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">
            {description}
          </span>
        ) : null}
      </summary>
      <div className="border-t border-slate-100 p-4">{children}</div>
    </details>
  );
}

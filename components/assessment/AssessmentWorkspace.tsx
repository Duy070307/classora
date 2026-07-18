"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  PanelRightOpen,
  X,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

export function useUnsavedAssessmentWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);
}

export type AssessmentStatusTone = "pending" | "review" | "ready" | "blocked";

const statusStyles: Record<
  AssessmentStatusTone,
  { icon: typeof Clock3; className: string }
> = {
  pending: {
    icon: Clock3,
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
  review: {
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  ready: {
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  blocked: {
    icon: XCircle,
    className: "border-red-200 bg-red-50 text-red-800",
  },
};

export function AssessmentStatus({
  tone,
  label,
  detail,
}: {
  tone: AssessmentStatusTone;
  label: string;
  detail?: string;
}) {
  const { icon: Icon, className } = statusStyles[tone];
  return (
    <div
      className={`flex min-w-0 items-start gap-2 rounded-xl border px-3 py-2 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Icon className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-bold leading-5">{label}</p>
        {detail ? (
          <p className="mt-0.5 text-xs font-medium leading-5 opacity-80">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export type AssessmentStage = {
  id: string;
  label: string;
  shortLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
};

export function AssessmentStageNavigation({
  stages,
  activeId,
  onChange,
  label = "Các bước thực hiện",
}: {
  stages: AssessmentStage[];
  activeId: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const selectId = useId();
  return (
    <nav aria-label={label} className="min-w-0">
      <label htmlFor={selectId} className="label md:hidden">
        Bước hiện tại
      </label>
      <select
        id={selectId}
        className="form-field md:hidden"
        value={activeId}
        onChange={(event) => onChange(event.target.value)}
      >
        {stages.map((stage, index) => (
          <option key={stage.id} value={stage.id} disabled={stage.disabled}>
            {index + 1}. {stage.label}
            {stage.disabled && stage.disabledReason
              ? ` — ${stage.disabledReason}`
              : ""}
          </option>
        ))}
      </select>

      <ol className="hidden max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 md:flex">
        {stages.map((stage, index) => {
          const active = stage.id === activeId;
          return (
            <li key={stage.id} className="flex min-w-0 flex-1 items-center">
              <button
                type="button"
                disabled={stage.disabled}
                title={stage.disabled ? stage.disabledReason : undefined}
                aria-current={active ? "step" : undefined}
                aria-describedby={
                  stage.disabled && stage.disabledReason
                    ? `${selectId}-${stage.id}-reason`
                    : undefined
                }
                onClick={() => onChange(stage.id)}
                className={`flex min-h-11 w-full min-w-[8.5rem] items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-45 ${
                  active
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${active ? "bg-white/20" : "bg-slate-100"}`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="truncate">
                  {stage.shortLabel || stage.label}
                </span>
              </button>
              {index < stages.length - 1 ? (
                <ChevronRight
                  className="mx-0.5 shrink-0 text-slate-300"
                  size={14}
                  aria-hidden="true"
                />
              ) : null}
              {stage.disabled && stage.disabledReason ? (
                <span id={`${selectId}-${stage.id}-reason`} className="sr-only">
                  {stage.disabledReason}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function AssessmentActionBar({
  children,
  status,
}: {
  children: ReactNode;
  status?: ReactNode;
}) {
  return (
    <div className="ui-toolbar" data-assessment-action-bar>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {children}
      </div>
      {status ? <div className="min-w-0 sm:max-w-sm">{status}</div> : null}
    </div>
  );
}

export function AssessmentWorkspace({
  canvas,
  review,
  reviewLabel = "Rà soát",
  reviewSummary,
}: {
  canvas: ReactNode;
  review: ReactNode;
  reviewLabel?: string;
  reviewSummary?: string;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reviewOpen) return;
    const reviewTrigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setReviewOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      queueMicrotask(() => reviewTrigger?.focus());
    };
  }, [reviewOpen]);

  return (
    <div className="min-w-0" data-assessment-workspace>
      <div className="mb-3 flex items-center justify-between gap-3 2xl:hidden">
        {reviewSummary ? (
          <p className="min-w-0 truncate text-sm font-semibold text-slate-600">
            {reviewSummary}
          </p>
        ) : (
          <span />
        )}
        <button
          ref={triggerRef}
          type="button"
          className="btn-secondary shrink-0"
          aria-haspopup="dialog"
          aria-expanded={reviewOpen}
          onClick={() => setReviewOpen(true)}
        >
          <PanelRightOpen size={16} aria-hidden="true" />
          {reviewLabel}
        </button>
      </div>

      <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="min-w-0">{canvas}</main>
        {reviewOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] 2xl:hidden"
            aria-label="Đóng bảng rà soát"
            onClick={() => setReviewOpen(false)}
          />
        ) : null}
        <aside
          ref={panelRef}
          role={reviewOpen ? "dialog" : "complementary"}
          aria-modal={reviewOpen ? "true" : undefined}
          aria-labelledby={titleId}
          className={`${reviewOpen ? "fixed inset-y-0 right-0 z-50 flex w-[min(92vw,28rem)]" : "hidden"} min-h-0 min-w-0 flex-col border-l border-slate-200 bg-white shadow-2xl 2xl:sticky 2xl:top-4 2xl:flex 2xl:max-h-[calc(100dvh-2rem)] 2xl:w-auto 2xl:rounded-2xl 2xl:border 2xl:shadow-sm`}
        >
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div className="min-w-0">
              <h2 id={titleId} className="truncate font-black text-slate-950">
                {reviewLabel}
              </h2>
              {reviewSummary ? (
                <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                  {reviewSummary}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 2xl:hidden"
              aria-label="Đóng bảng rà soát"
              onClick={() => setReviewOpen(false)}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            {review}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function AssessmentDisclosure({
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
      className="group rounded-2xl border border-slate-200 bg-white"
      open={defaultOpen}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-bold text-slate-800 marker:hidden">
        <span className="min-w-0">
          <span className="block">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-xs font-medium leading-5 text-slate-500">
              {description}
            </span>
          ) : null}
        </span>
        <ChevronRight
          className="shrink-0 text-emerald-700 transition group-open:rotate-90"
          size={18}
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-slate-100 p-4">{children}</div>
    </details>
  );
}

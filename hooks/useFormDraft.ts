"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { clearFormDraft, loadFormDraft, saveFormDraft } from "@/lib/form-drafts";

export function useFormDraft<T>(toolKey: string, data: T, setData: Dispatch<SetStateAction<T>>) {
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const savedDraft = useRef<T | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const draft = loadFormDraft<T>(toolKey);
    savedDraft.current = draft?.data ?? null;
    if (draft) {
      queueMicrotask(() => {
        setData(draft.data);
        setUpdatedAt(draft.updatedAt);
      });
    }
    hydrated.current = true;
  }, [setData, toolKey]);

  useEffect(() => {
    if (!hydrated.current) return;
    const timer = window.setTimeout(() => {
      saveFormDraft(toolKey, data);
      savedDraft.current = data;
      setUpdatedAt(new Date().toISOString());
    }, 700);
    return () => window.clearTimeout(timer);
  }, [data, toolKey]);

  return {
    updatedAt,
    restoreDraft: () => { if (savedDraft.current) setData(savedDraft.current); },
    clearDraft: () => { clearFormDraft(toolKey); savedDraft.current = null; setUpdatedAt(null); }
  };
}

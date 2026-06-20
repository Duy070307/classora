"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { clearFormDraft, loadFormDraft, saveFormDraft } from "@/lib/form-drafts";

export function useFormDraft<T>(toolKey: string, data: T, setData: Dispatch<SetStateAction<T>>, normalizeDraft?: (draft: T) => T) {
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const savedDraft = useRef<T | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const draft = loadFormDraft<T>(toolKey);
    const normalized = draft ? (normalizeDraft ? normalizeDraft(draft.data) : draft.data) : null;
    savedDraft.current = normalized;
    if (draft) {
      queueMicrotask(() => {
        setData(normalized as T);
        setUpdatedAt(draft.updatedAt);
      });
    }
    hydrated.current = true;
  }, [normalizeDraft, setData, toolKey]);

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

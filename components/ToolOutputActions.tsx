"use client";

import { RotateCcw } from "lucide-react";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import type { GeneratedDocument } from "@/lib/types";

export function ToolOutputActions({
  document,
  onSave,
  onGenerateAgain
}: {
  document: GeneratedDocument;
  onSave: () => void;
  onGenerateAgain?: () => void;
}) {
  const source = document.generationMeta?.fallbackUsed
    ? "Nguồn tạo: Dự phòng theo chủ đề"
    : document.generationMeta?.retryCount
      ? `Nguồn tạo: ${document.generationMeta.provider || "AI"}, đã kiểm tra chủ đề`
      : document.generationMeta?.provider
        ? `Nguồn tạo: ${document.generationMeta.provider}`
        : "";
  return (
    <div className="document-actions sticky top-20 z-10 flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-lg shadow-slate-200/60 backdrop-blur-xl">
      <DocumentExportMenu document={document} onSave={onSave} />
      {onGenerateAgain ? (
        <button type="button" onClick={onGenerateAgain} className="btn-secondary">
          <RotateCcw size={16} />
          Tạo lại
        </button>
      ) : null}
      {source ? <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">{source}</span> : null}
    </div>
  );
}

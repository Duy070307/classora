"use client";

import { RotateCcw } from "lucide-react";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import type { GeneratedDocument } from "@/lib/types";

export function ToolOutputActions({
  document,
  onSave,
  onGenerateAgain,
}: {
  document: GeneratedDocument;
  onSave: () => void;
  onGenerateAgain?: () => void;
}) {
  return (
    <div className="document-actions sticky top-20 z-10 flex flex-wrap gap-2 rounded-2xl border border-blue-100 bg-white/95 p-3 shadow-lg shadow-blue-100/60 backdrop-blur-xl">
      <DocumentExportMenu document={document} onSave={onSave} />
      {onGenerateAgain ? (
        <button type="button" onClick={onGenerateAgain} className="btn-secondary">
          <RotateCcw size={16} />
          Tạo lại
        </button>
      ) : null}
    </div>
  );
}

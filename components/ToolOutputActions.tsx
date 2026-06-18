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
  return (
    <div className="sticky top-2 z-10 flex flex-wrap gap-2 rounded-lg border border-line bg-white/95 p-2 shadow-sm backdrop-blur">
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

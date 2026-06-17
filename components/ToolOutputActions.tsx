"use client";

import { RotateCcw, Save } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { ExportDocxButton } from "@/components/ExportDocxButton";
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
    <div className="flex flex-wrap gap-2">
      <CopyButton text={document.content} />
      <button type="button" onClick={onSave} className="btn-secondary">
        <Save size={16} />
        Save to history
      </button>
      <ExportDocxButton document={document} />
      {onGenerateAgain ? (
        <button type="button" onClick={onGenerateAgain} className="btn-secondary">
          <RotateCcw size={16} />
          Generate again
        </button>
      ) : null}
    </div>
  );
}
